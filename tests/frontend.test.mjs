import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = {
  'import.meta.env': JSON.stringify({
    VITE_SUPABASE_URL: 'https://example.invalid', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-anon-key', VITE_SUPABASE_ANON_KEY: 'public-anon-key',
    VITE_PAYSTACK_PUBLIC_KEY: 'pk_test_fake', VITE_BASE44_APP_ID: '', VITE_BASE44_FUNCTIONS_VERSION: '', VITE_BASE44_APP_BASE_URL: '',
    MODE: 'test', DEV: false, PROD: true,
  }),
};

async function bundle(entry, plugins = [], source) {
  const result = await build({
    entryPoints: source ? undefined : [path.join(root, entry)],
    stdin: source ? { contents: source, resolveDir: root, loader: 'jsx' } : undefined,
    bundle: true, write: false, format: 'iife', platform: 'browser',
    jsx: 'automatic', alias: { '@': path.join(root, 'src') }, define: env,
    loader: { '.css': 'empty', '.png': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' }, plugins,
  });
  return result.outputFiles[0].text;
}

function dom() {
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error));
  const window = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'https://example.test/', pretendToBeVisual: true, runScripts: 'outside-only', virtualConsole,
  }).window;
  window.fetch = async () => { throw new Error('offline test'); };
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = () => {};
  return { window, errors };
}
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('application boots without the former stray-token crash and routes with React Router 7', async () => {
  const { window, errors } = dom();
  window.eval(await bundle('src/main.jsx'));
  await wait(250);
  assert.ok(window.document.querySelector('#root').children.length > 0);
  assert.ok(!errors.some(error => /ReferenceError|v is not defined/.test(String(error))));
  window.history.pushState({}, '', '/rooms');
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  await wait(250);
  assert.match(window.document.body.textContent, /Royal Haven|Luxe Manor/);
  window.history.pushState({}, '', '/book');
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  await wait(250);
  assert.match(window.document.body.textContent, /Apartment|Car|Book/i);
  window.close();
});

test('return URLs cannot redirect off-origin and guest tokens stay session-scoped', async () => {
  const { window } = dom();
  globalThis.window = window;
  globalThis.sessionStorage = window.sessionStorage;
  const { safeReturnTo } = await import('../src/lib/authReturnTo.js');
  const { rememberGuestBooking, guestBookingToken } = await import('../src/lib/guestBookings.js');
  window.history.pushState({}, '', '/login?next=%2F%2Fevil.example%2Fphish');
  assert.equal(safeReturnTo('/staff'), '/staff');
  window.history.pushState({}, '', '/login?next=%2Fstaff%3Ftab%3Dbookings');
  assert.equal(safeReturnTo('/'), '/staff?tab=bookings');
  rememberGuestBooking({ id: 'booking-1', guest_access_token: 'secret-token' });
  assert.equal(guestBookingToken('booking-1'), 'secret-token');
  assert.equal(guestBookingToken('missing'), null);
  window.close();
});

test('Paystack checkout uses the official SDK and kobo amounts', async () => {
  const plugin = {
    name: 'mock-paystack', setup(build) {
      build.onResolve({ filter: /^@paystack\/inline-js$/ }, () => ({ path: 'paystack', namespace: 'mock' }));
      build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `export default class PaystackPop { newTransaction(options) { globalThis.__paystackOptions = options; options.onSuccess({ reference: options.reference }); } }`, loader: 'js' }));
    },
  };
  const result = await build({
    stdin: { contents: `import { initPaystack } from './src/lib/paystack.js'; globalThis.initPaystack = initPaystack;`, resolveDir: root, loader: 'js' },
    bundle: true, write: false, format: 'iife', platform: 'browser', define: env, plugins: [plugin],
  });
  const { window } = dom();
  window.eval(result.outputFiles[0].text);
  const resultPromise = new Promise((resolve, reject) => window.initPaystack({ email: 'guest@example.com', amount: 500000, ref: 'FRENSIC_TEST', onSuccess: resolve, onClose: () => reject(new Error('cancelled')) }));
  assert.equal((await resultPromise).reference, 'FRENSIC_TEST');
  assert.equal(window.__paystackOptions.amount, 50000000);
  assert.equal(window.__paystackOptions.reference, 'FRENSIC_TEST');
  window.close();
});

function authFormMocks() {
  const modules = {
    '@/api/base44Client': `export const base44 = {
      functions: { async invoke(...args) { globalThis.__adminCalls.push(args); return { data: { sessionToken: 'fake-session' } }; } },
      entities: { Booking: { async filter() { return []; } } },
    };`,
    '@/lib/AuthContext': `export const useAuth = () => ({ user: null, logout() {} });`,
    '@supabase/supabase-js': `export const createClient = () => ({
      auth: {
        async signInWithOtp(options) { globalThis.__otpCalls.push(['send', options]); return { error: null }; },
        async verifyOtp(options) { globalThis.__otpCalls.push(['verify', options]); return { error: null }; },
      },
    });`,
  };
  return {
    name: 'auth-form-mocks', setup(build) {
      build.onResolve({ filter: /^(@\/api\/base44Client|@\/lib\/AuthContext|@supabase\/supabase-js)$/ }, args => ({ path: args.path, namespace: 'auth-mock' }));
      build.onLoad({ filter: /.*/, namespace: 'auth-mock' }, args => ({ contents: modules[args.path], loader: 'js' }));
    },
  };
}

function setInput(window, input, value) {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

async function mountForm(window, component, exportName) {
  const source = `import React from 'react'; import { createRoot } from 'react-dom/client'; import Component from './${component}';
    const root = createRoot(document.getElementById('root')); root.render(React.createElement(Component, { onSuccess() { globalThis.__formSuccess = true; } })); globalThis.__unmount = () => root.unmount();`;
  window.__adminCalls = [];
  window.__otpCalls = [];
  window.eval(await bundle(null, [authFormMocks()], source));
  await wait(100);
  assert.ok(window.document.querySelector('form'), `${exportName} renders`);
}

test('admin password form matches the API minimum before submitting a replacement', async () => {
  const { window, errors } = dom();
  await mountForm(window, 'src/components/admin/AdminPasswordForm.jsx', 'AdminPasswordForm');
  const document = window.document;
  const submit = () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  setInput(window, document.querySelector('#admin-currentPassword'), 'fake-current-password');
  setInput(window, document.querySelector('#admin-newPassword'), '12345678901');
  setInput(window, document.querySelector('#admin-confirmPassword'), '12345678901');
  submit(); await wait(50);
  assert.equal(window.__adminCalls.length, 0);
  assert.match(document.querySelector('[role="alert"]').textContent, /at least 12/);
  setInput(window, document.querySelector('#admin-newPassword'), '123456789012');
  setInput(window, document.querySelector('#admin-confirmPassword'), '123456789012');
  submit(); await wait(50);
  assert.equal(window.__adminCalls.length, 1);
  assert.equal(window.__adminCalls[0][1].newPassword, '123456789012');
  assert.equal(window.__formSuccess, true);
  assert.deepEqual(errors, []);
  window.__unmount(); window.close();
});

test('booking lookup accepts the project eight-digit OTP and preserves leading zeros', async () => {
  const { normalizeEmailOtp, isEmailOtp } = await import('../src/lib/authValidation.js');
  assert.equal(normalizeEmailOtp('0123 4567'), '01234567');
  assert.equal(isEmailOtp('123456'), true);
  assert.equal(isEmailOtp('0123456789'), true);
  assert.equal(isEmailOtp('12345'), false);
  const { window, errors } = dom();
  await mountForm(window, 'src/pages/MyBookings.jsx', 'MyBookings');
  const document = window.document;
  const submit = () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  setInput(window, document.querySelector('input[type="email"]'), 'Guest@Example.com');
  submit(); await wait(50);
  const input = document.querySelector('[aria-label="Email verification code"]');
  setInput(window, input, '12345'); await wait(20);
  assert.equal(document.querySelector('form button[type="submit"], form button:not([type="button"])').disabled, true);
  setInput(window, input, '0123 4567'); await wait(20);
  assert.equal(input.value, '01234567');
  submit(); await wait(50);
  assert.deepEqual(window.__otpCalls.map(call => call[0]), ['send', 'verify']);
  assert.equal(window.__otpCalls[0][1].email, 'guest@example.com');
  assert.equal(window.__otpCalls[1][1].email, 'guest@example.com');
  assert.equal(window.__otpCalls[1][1].token, '01234567');
  assert.deepEqual(errors, []);
  window.__unmount(); window.close();
});

test('car rental call dialog shows the booking number, thank-you message, and returns home', async () => {
  const { window, errors } = dom();
  let returned = 0;
  window.__returnHome = () => { returned += 1; };
  const source = `import React from 'react'; import { createRoot } from 'react-dom/client'; import Component from './src/components/CarRentalCallDialog.jsx';
    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(Component, { open: true, onOpenChange() {}, onReturnHome() { globalThis.__returnHome(); }, returnHomeDelay: 20 }));
    globalThis.__unmount = () => root.unmount();`;
  window.eval(await bundle(null, [], source));
  await wait(100);
  const document = window.document;
  assert.match(document.body.textContent, /Call this number to proceed with your booking/);
  assert.ok(document.querySelector('a[href="tel:+2348037068065"]'));
  const confirm = [...document.querySelectorAll('button')].find(button => /I have made the call/i.test(button.textContent));
  assert.ok(confirm);
  confirm.click();
  await wait(80);
  assert.match(document.body.textContent, /Thank you for choosing Frensic Luxury Apartments/);
  assert.equal(returned, 1);
  assert.deepEqual(errors, []);
  window.__unmount(); window.close();
});
