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

const { default: dataHandler } = await import('../api/data.js');
const { default: createBooking } = await import('../api/createBooking.js');
const { default: verifyPayment } = await import('../api/verifyPayment.js');
const { default: webhook } = await import('../api/paystackWebhook.js');
const { default: calendarHandler } = await import('../api/addBookingToCalendar.js');
const { default: availabilityHandler } = await import('../api/checkAvailability.js');
const { default: prepareReceipt } = await import('../api/prepareReceiptUpload.js');
const { default: submitReceipt } = await import('../api/submitReceipt.js');

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
