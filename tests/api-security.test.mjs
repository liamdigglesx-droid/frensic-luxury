import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { registerHooks } from 'node:module';
import { createFakeClient, mockResponse } from './helpers/fakeSupabase.mjs';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-key';
process.env.PAYSTACK_SECRET_KEY = 'fake-paystack-secret';
process.env.APP_URL = 'https://example.test';
process.env.GOOGLE_CLIENT_ID = 'fake-google-client';
process.env.GOOGLE_CLIENT_SECRET = 'fake-google-secret';
process.env.GOOGLE_REFRESH_TOKEN = 'fake-google-refresh';
process.env.SLACK_BOT_TOKEN = 'fake-slack';
process.env.SLACK_CHANNEL_ID = 'fake-channel';

const store = {
  rooms: [{ id: crypto.randomUUID(), slug: 'royal-haven', name: 'Royal Haven', price_per_night: 250000, max_guests: 6, active: true }],
  cars: [{ id: crypto.randomUUID(), slug: 'luxurious-style', name: 'Luxurious Style', price_per_day: 80000, seats: 4, chauffeur_available: true, active: true }],
  bookings: [], reviews: [], profiles: [
    { id: 'staff-user', role: 'staff', full_name: 'Staff' },
    { id: 'guest-user', role: 'user', full_name: 'Guest' },
  ],
  admin_credentials: [],
  usersByToken: {
    'staff-token': { id: 'staff-user', email: 'staff@example.com', email_confirmed_at: '2026-01-01' },
    'guest-token': { id: 'guest-user', email: 'guest@example.com', email_confirmed_at: '2026-01-01' },
  },
};
globalThis.__fakeClient = createFakeClient(store);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@supabase/supabase-js') return { url: 'fake:supabase-js', shortCircuit: true };
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'fake:supabase-js') return { format: 'module', source: 'export const createClient = () => globalThis.__fakeClient;', shortCircuit: true };
    return nextLoad(url, context);
  },
});

const external = { gmail: [], calendar: [], slack: [] };
let paystackTransaction = null;
globalThis.fetch = async (url, options = {}) => {
  const target = String(url);
  if (target.includes('oauth2.googleapis.com/token')) return { ok: true, json: async () => ({ access_token: 'fake-google-token' }) };
  if (target.includes('api.paystack.co/transaction/verify/')) return { ok: true, json: async () => ({ status: true, data: paystackTransaction }) };
  if (target.includes('gmail.googleapis.com')) { external.gmail.push(JSON.parse(options.body)); return { ok: true, json: async () => ({}) }; }
  if (target.includes('googleapis.com/calendar')) { external.calendar.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ id: `event-${external.calendar.length}` }) }; }
  if (target.includes('slack.com/api/chat.postMessage')) { external.slack.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ ok: true }) }; }
  throw new Error(`Unexpected external request: ${target}`);
};

const { default: dataHandler } = await import('../api/_lib/routes/data.js');
const { default: createBooking } = await import('../api/_lib/routes/createBooking.js');
const { default: verifyPayment } = await import('../api/_lib/routes/verifyPayment.js');
const { default: webhook } = await import('../api/_lib/routes/paystackWebhook.js');
const { default: calendarHandler } = await import('../api/_lib/routes/addBookingToCalendar.js');
const { default: availabilityHandler } = await import('../api/_lib/routes/checkAvailability.js');
const { default: prepareReceipt } = await import('../api/_lib/routes/prepareReceiptUpload.js');
const { default: submitReceipt } = await import('../api/_lib/routes/submitReceipt.js');
const { default: adminHandler } = await import('../api/_lib/routes/verifyAdminCredentials.js');
const { verifyAdminToken, CURRENT_PASSWORD_ITERATIONS } = await import('../api/_lib/admin.js');
const { sendBookingEmail, addBookingCalendarEvent, sendPaidSlack } = await import('../api/_lib/notifications.js');

const validBooking = {
  booking_type: 'stay', item_id: 'royal-haven', start_date: '2026-12-01', end_date: '2026-12-03',
  guest_name: 'Synthetic Guest', guest_email: 'guest@example.com', guest_phone: '08000000000', guests_count: 2,
  payment_method: 'paystack', total_amount: 0, unit_price: 0,
};
const req = (body, headers = {}) => ({ method: 'POST', headers, body, socket: { remoteAddress: '127.0.0.1' } });

test('anonymous callers cannot read private bookings by email or mark them paid', async () => {
  let res = mockResponse();
  await dataHandler(req({ entity: 'Booking', action: 'filter', query: { guest_email: 'guest@example.com' } }), res);
  assert.equal(res.statusCode, 403);
  res = mockResponse();
  await dataHandler(req({ entity: 'Booking', action: 'update', id: 'any-id', data: { payment_status: 'paid' } }), res);
  assert.equal(res.statusCode, 403);
});

test('booking creation recalculates price server-side and issues a capability token', async () => {
  const res = mockResponse();
  await createBooking(req(validBooking), res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.total_amount, 500000);
  assert.equal(res.body.unit_price, 250000);
  assert.ok(res.body.guest_access_token);
  assert.equal(res.body.guest_access_hash, undefined);
  assert.ok(res.body.payment_reference.startsWith('FRENSIC_'));
});

test('car rentals can be created as call-to-book without Paystack', async () => {
  const res = mockResponse();
  await createBooking(req({
    ...validBooking,
    booking_type: 'drive', item_id: 'luxurious-style', payment_method: 'call_to_book',
    start_date: '2027-04-10', end_date: '2027-04-12', guests_count: 2,
  }), res);
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.equal(res.body.payment_method, 'call_to_book');
  assert.equal(res.body.payment_reference, null);
  assert.equal(res.body.hold_expires_at, null);
  assert.equal(res.body.total_amount, 160000);
  assert.ok(res.body.guest_access_token);
  const stay = mockResponse();
  await createBooking(req({ ...validBooking, payment_method: 'call_to_book', start_date: '2027-05-10', end_date: '2027-05-12' }), stay);
  assert.equal(stay.statusCode, 400);
});

test('verified guests can read only their own bookings', async () => {
  let res = mockResponse();
  await dataHandler(req({ entity: 'Booking', action: 'filter', query: { guest_email: 'guest@example.com' } }, { authorization: 'Bearer guest-token' }), res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.length >= 1);
  res = mockResponse();
  await dataHandler(req({ entity: 'Booking', action: 'filter', query: { guest_email: 'someone-else@example.com' } }, { authorization: 'Bearer guest-token' }), res);
  assert.equal(res.statusCode, 403);
});

test('overlapping active reservations are rejected', async () => {
  const res = mockResponse();
  await createBooking(req({ ...validBooking, guest_email: 'other@example.com' }), res);
  assert.equal(res.statusCode, 409);
  const availability = mockResponse();
  await availabilityHandler(req({ booking_type: 'stay', item_id: 'royal-haven', start_date: '2026-12-02', end_date: '2026-12-04' }), availability);
  assert.equal(availability.body.available, false);
});

test('payment verification requires booking access, exact amount, and is idempotent', async () => {
  const created = mockResponse();
  await createBooking(req({ ...validBooking, start_date: '2027-01-10', end_date: '2027-01-12', guest_name: '<img src=x onerror=alert(1)>' }), created);
  const booking = created.body;
  let res = mockResponse();
  await verifyPayment(req({ bookingId: booking.id }), res);
  assert.equal(res.statusCode, 403);
  paystackTransaction = { status: 'success', reference: booking.payment_reference, amount: 1, currency: 'NGN', customer: { email: booking.guest_email } };
  res = mockResponse();
  await verifyPayment(req({ bookingId: booking.id }, { 'x-booking-token': booking.guest_access_token }), res);
  assert.equal(res.statusCode, 400);
  paystackTransaction.amount = 50000000;
  res = mockResponse();
  await verifyPayment(req({ bookingId: booking.id }, { 'x-booking-token': booking.guest_access_token }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.booking.payment_status, 'paid');
  const calendarCount = external.calendar.length;
  const gmailCount = external.gmail.length;
  res = mockResponse();
  await verifyPayment(req({ bookingId: booking.id }, { 'x-booking-token': booking.guest_access_token }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(external.calendar.length, calendarCount);
  assert.equal(external.gmail.length, gmailCount);
  const raw = external.gmail.map(message => Buffer.from(message.raw, 'base64url').toString()).join('\n');
  assert.ok(raw.includes('&lt;img'));
  assert.ok(!raw.includes('<img src=x'));
  assert.ok(raw.includes('602d336b8_Untitleddesign1.png'));
});

test('Paystack webhook requires a valid signature and confirms payment', async () => {
  const created = mockResponse();
  await createBooking(req({ ...validBooking, start_date: '2027-02-10', end_date: '2027-02-12' }), created);
  const booking = created.body;
  const raw = Buffer.from(JSON.stringify({ event: 'charge.success', data: { reference: booking.payment_reference } }));
  const invalid = mockResponse();
  await webhook({ method: 'POST', headers: { 'x-paystack-signature': 'bad' }, [Symbol.asyncIterator]: () => Readable.from([raw])[Symbol.asyncIterator]() }, invalid);
  assert.equal(invalid.statusCode, 401);
  paystackTransaction = { status: 'success', reference: booking.payment_reference, amount: 50000000, currency: 'NGN', customer: { email: booking.guest_email } };
  const signature = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(raw).digest('hex');
  const valid = mockResponse();
  await webhook({ method: 'POST', headers: { 'x-paystack-signature': signature }, [Symbol.asyncIterator]: () => Readable.from([raw])[Symbol.asyncIterator]() }, valid);
  assert.equal(valid.statusCode, 200, JSON.stringify(valid.body));
  assert.equal(store.bookings.find(row => row.id === booking.id).payment_status, 'paid');
});

test('calendar notifications require staff and do not duplicate events', async () => {
  const booking = store.bookings.find(row => row.payment_status === 'paid');
  let res = mockResponse();
  await calendarHandler(req({ booking: { id: booking.id } }), res);
  assert.equal(res.statusCode, 403);
  const before = external.calendar.length;
  res = mockResponse();
  await calendarHandler(req({ booking: { id: booking.id } }, { authorization: 'Bearer staff-token' }), res);
  assert.equal(res.statusCode, 200);
  res = mockResponse();
  await calendarHandler(req({ booking: { id: booking.id } }, { authorization: 'Bearer staff-token' }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(external.calendar.length, before);
});

test('public reviews are moderated before publication', async () => {
  const created = mockResponse();
  await dataHandler(req({ entity: 'Review', action: 'create', data: { guest_name: 'Guest', body: 'Nice', rating: 5, status: 'approved' } }), created);
  assert.equal(created.statusCode, 200);
  assert.equal(created.body.status, 'pending');
  const listed = mockResponse();
  await dataHandler(req({ entity: 'Review', action: 'list' }), listed);
  assert.deepEqual(listed.body, []);
});


test('staff cannot change catalog pricing', async () => {
  const res = mockResponse();
  await dataHandler(req({ entity: 'Room', action: 'update', id: store.rooms[0].id, data: { price_per_night: 1 } }, { authorization: 'Bearer staff-token' }), res);
  assert.equal(res.statusCode, 403);
});


test('bank-transfer receipts require booking access, a prepared path, and a completed upload', async () => {
  const created = mockResponse();
  await createBooking(req({ ...validBooking, payment_method: 'bank_transfer', start_date: '2027-03-10', end_date: '2027-03-12' }), created);
  assert.equal(created.statusCode, 201);
  const booking = created.body;
  let res = mockResponse();
  await prepareReceipt(req({ bookingId: booking.id, fileName: 'receipt.pdf', contentType: 'application/pdf', size: 100 }), res);
  assert.equal(res.statusCode, 403);
  res = mockResponse();
  await prepareReceipt(req({ bookingId: booking.id, fileName: 'receipt.pdf', contentType: 'application/pdf', size: 100 }, { 'x-booking-token': booking.guest_access_token }), res);
  assert.equal(res.statusCode, 200);
  const prepared = res.body;
  res = mockResponse();
  await submitReceipt(req({ bookingId: booking.id, path: 'receipts/other/file.pdf' }, { 'x-booking-token': booking.guest_access_token }), res);
  assert.equal(res.statusCode, 400);
  res = mockResponse();
  await submitReceipt(req({ bookingId: booking.id, path: prepared.path }, { 'x-booking-token': booking.guest_access_token }), res);
  assert.equal(res.statusCode, 400);
  store.files = [{ folder: prepared.path.split('/').slice(0, -1).join('/'), name: prepared.path.split('/').at(-1), metadata: { size: 100 } }];
  res = mockResponse();
  await submitReceipt(req({ bookingId: booking.id, path: prepared.path }, { 'x-booking-token': booking.guest_access_token }), res);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.booking.transfer_status, 'receipt_submitted');
});

test('single-function router preserves URLs, rejects unknown routes, and parses bounded JSON', async () => {
  const { default: handler, config } = await import('../api/index.js');
  assert.equal(config.api.bodyParser, false);
  const rawReq = (action, body, method = 'POST') => {
    const raw = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body));
    return { method, query: { __frensic_route: action }, headers: {}, socket: { remoteAddress: '127.0.0.1' }, [Symbol.asyncIterator]: () => Readable.from([raw])[Symbol.asyncIterator]() };
  };
  let res = mockResponse();
  await handler(rawReq('data', { entity: 'Booking', action: 'update', id: 'any-id', data: { payment_status: 'paid' } }), res);
  assert.equal(res.statusCode, 403);
  res = mockResponse();
  await handler(rawReq('missing', {}), res);
  assert.equal(res.statusCode, 404);
  res = mockResponse();
  await handler(rawReq('data', {}, 'GET'), res);
  assert.equal(res.statusCode, 405);
  res = mockResponse();
  await handler(rawReq('data', '{bad json'), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, 'invalid_json');
  res = mockResponse();
  await handler(rawReq('data', []), res);
  assert.equal(res.statusCode, 400);
  res = mockResponse();
  await handler(rawReq('data', 'x'.repeat(1024 * 1024 + 1)), res);
  assert.equal(res.statusCode, 413);
  res = mockResponse();
  await handler({ ...rawReq('paystackWebhook', { event: 'charge.success' }), headers: { 'x-paystack-signature': 'bad' } }, res);
  assert.equal(res.statusCode, 401);
});

test('admin bootstrap enforces the password policy and replaces plaintext with a salted hash', async () => {
  const previous = { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD };
  process.env.ADMIN_USERNAME = 'test-admin';
  process.env.ADMIN_PASSWORD = 'fake-bootstrap-password';
  store.admin_credentials = [];
  try {
    let res = mockResponse();
    await adminHandler(req({ username: 'test-admin', password: 'wrong-password' }), res);
    assert.equal(res.statusCode, 401);
    res = mockResponse();
    await adminHandler(req({ username: 'test-admin', password: process.env.ADMIN_PASSWORD }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(await verifyAdminToken(res.body.sessionToken), true);
    res = mockResponse();
    await adminHandler(req({ action: 'changePassword', currentPassword: process.env.ADMIN_PASSWORD, newPassword: 'too-short' }), res);
    assert.equal(res.statusCode, 400);
    assert.equal(store.admin_credentials.length, 0);
    res = mockResponse();
    await adminHandler(req({ action: 'changePassword', currentPassword: process.env.ADMIN_PASSWORD, newPassword: 'fake-replacement-password' }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(store.admin_credentials.length, 1);
    const credential = store.admin_credentials[0];
    assert.equal(credential.iterations, CURRENT_PASSWORD_ITERATIONS);
    assert.ok(credential.salt);
    assert.ok(credential.password_hash);
    assert.notEqual(credential.password_hash, 'fake-replacement-password');
    assert.equal(await verifyAdminToken(res.body.sessionToken), true);
    res = mockResponse();
    await adminHandler(req({ username: 'test-admin', password: process.env.ADMIN_PASSWORD }), res);
    assert.equal(res.statusCode, 401);
    res = mockResponse();
    await adminHandler(req({ username: 'test-admin', password: 'fake-replacement-password' }), res);
    assert.equal(res.statusCode, 200);
  } finally {
    store.admin_credentials = [];
    for (const [key, value] of Object.entries({ ADMIN_USERNAME: previous.username, ADMIN_PASSWORD: previous.password })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('unconfigured integrations fail explicitly without requests and optional Slack is skipped', async () => {
  const names = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'SLACK_BOT_TOKEN', 'SLACK_CHANNEL_ID'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  names.forEach(name => delete process.env[name]);
  const booking = { ...store.bookings.find(row => row.payment_status === 'paid'), confirmation_sent_at: null, calendar_event_id: null, slack_notified_at: null };
  const client = globalThis.__fakeClient;
  const requests = external.gmail.length + external.calendar.length + external.slack.length;
  try {
    await assert.rejects(() => sendBookingEmail(client, booking), error => error.status === 503 && error.code === 'google_unconfigured');
    await assert.rejects(() => addBookingCalendarEvent(client, booking), error => error.status === 503 && error.code === 'google_unconfigured');
    assert.deepEqual(await sendPaidSlack(client, booking), { skipped: true, reason: 'unconfigured' });
    await assert.rejects(() => sendPaidSlack(client, booking, { test: true }), error => error.status === 503 && error.code === 'slack_unconfigured');
    assert.equal(external.gmail.length + external.calendar.length + external.slack.length, requests);
    assert.equal(booking.slack_notified_at, null);
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
    }
  }
});
