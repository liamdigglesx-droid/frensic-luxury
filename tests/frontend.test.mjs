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

async function bundle(entry, plugins = []) {
  const result = await build({
    entryPoints: [path.join(root, entry)], bundle: true, write: false, format: 'iife', platform: 'browser',
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
