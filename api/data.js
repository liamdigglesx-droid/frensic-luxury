import { getAdminClient, getActor, getVerifiedUser, hasBookingAccess, publicBooking } from './_lib/supabase.js';
import { ApiError, requireMethod, sendError } from './_lib/http.js';
import { enforceRateLimit } from './_lib/rateLimit.js';
import { createBookingRecord } from './_lib/bookings.js';

const tables = { Booking: 'bookings', ContactMessage: 'contact_messages', Room: 'rooms', Car: 'cars', Review: 'reviews', User: 'profiles' };
const toDb = data => Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key === 'created_date' ? 'created_at' : key === 'updated_date' ? 'updated_at' : key === 'order' ? 'display_order' : key, value]));
const fromDb = row => row && Object.fromEntries(Object.entries(row).map(([key, value]) => [key === 'created_at' ? 'created_date' : key === 'updated_at' ? 'updated_date' : key === 'display_order' ? 'order' : key, value]));
const clean = (data, allowed) => Object.fromEntries(Object.entries(toDb(data)).filter(([key]) => allowed.includes(key)));

const BOOKING_STAFF_FIELDS = ['booking_status','payment_status','payment_method','payment_reference','start_date','end_date','guest_name','guest_email','guest_phone','guests_count','special_requests','assigned_staff_id','assigned_staff_name','assigned_staff_email','unit_price','total_amount','nights_or_days','transfer_status'];
const CONTACT_FIELDS = ['name','email','phone','subject','message'];
const REVIEW_FIELDS = ['guest_name','guest_title','headline','body','rating','avatar_url','service_type'];

async function withReceiptUrls(client, rows) {
  return Promise.all(rows.map(async row => {
    if (!row.payment_receipt_url?.startsWith('payment-receipts/')) return publicBooking(row);
    const path = row.payment_receipt_url.replace('payment-receipts/', '');
    const { data: signed } = await client.storage.from('payment-receipts').createSignedUrl(path, 3600);
    return publicBooking({ ...row, payment_receipt_url: signed?.signedUrl || row.payment_receipt_url });
  }));
}

export default async function handler(req, res) {
  try {
    requireMethod(req);
    const { entity, action, query = {}, sort = '-created_date', limit = 50, skip = 0, id, data } = req.body || {};
    const table = tables[entity];
    if (!table) throw new ApiError(400, 'Unknown entity.');
    const client = getAdminClient();
    const actor = await getActor(req);

    if (entity === 'User') {
      if (!actor.isAdmin) throw new ApiError(403, 'Administrator access required.', 'forbidden');
      const { data: users, error } = await client.auth.admin.listUsers({ perPage: 200 });
      if (error) throw new ApiError(503, 'Staff directory is temporarily unavailable.');
      const { data: profiles } = await client.from('profiles').select('*');
      return res.json(users.users.map(user => {
        const profile = profiles?.find(item => item.id === user.id);
        return { id: user.id, email: user.email, full_name: profile?.full_name || '', role: profile?.role || 'user', created_date: user.created_at };
      }));
    }

    if (action === 'list' || action === 'filter') {
      let filters = toDb(query);
      if (entity === 'Booking') {
        if (!actor.privileged) {
          const user = await getVerifiedUser(req);
          if (!user) throw new ApiError(403, 'Verify your email or sign in to view bookings.', 'forbidden');
          const requested = String(filters.guest_email || user.email).toLowerCase();
          if (requested !== user.email.toLowerCase()) throw new ApiError(403, 'You can only view your own bookings.', 'forbidden');
          filters = { ...filters, guest_email: user.email.toLowerCase() };
        }
      }
      if (entity === 'Review' && !actor.privileged) filters = { ...filters, status: 'approved' };
      if (['Room', 'Car'].includes(entity) && !actor.privileged) filters = { ...filters, active: true };
      let request = client.from(table).select('*');
      for (const [key, value] of Object.entries(filters)) request = request.eq(key, value);
      const descending = String(sort).startsWith('-');
      const sortField = Object.keys(toDb({ [String(sort).replace(/^-/, '')]: true }))[0];
      const pageSize = Math.max(1, Math.min(Number(limit) || 50, 500));
      const offset = Math.max(0, Number(skip) || 0);
      request = request.order(sortField, { ascending: !descending }).range(offset, offset + pageSize - 1);
      const result = await request;
      if (result.error) throw new ApiError(503, 'Records could not be loaded.');
      const rows = entity === 'Booking' && actor.privileged ? await withReceiptUrls(client, result.data) : result.data.map(publicBooking);
      return res.json(rows.map(fromDb));
    }

    if (action === 'get') {
      const result = await client.from(table).select('*').eq('id', id).single();
      if (result.error || !result.data) throw new ApiError(404, 'Record not found.');
      if (entity === 'Booking') {
        if (!hasBookingAccess(req, result.data, actor)) throw new ApiError(403, 'You do not have access to this booking.', 'forbidden');
        return res.json(fromDb(publicBooking(result.data)));
      }
      if (!actor.privileged && !['Room', 'Car', 'Review'].includes(entity)) throw new ApiError(403, 'Staff access required.', 'forbidden');
      if (entity === 'Review' && !actor.privileged && result.data.status !== 'approved') throw new ApiError(404, 'Record not found.');
      return res.json(fromDb(result.data));
    }

    if (action === 'create' || action === 'bulkCreate') {
      if (entity === 'Booking') {
        if (action === 'bulkCreate' && !actor.isAdmin) throw new ApiError(403, 'Administrator access required.', 'forbidden');
        await enforceRateLimit(req, 'booking-create', 20, 3600);
        const records = action === 'bulkCreate' ? data : [data];
        if (!Array.isArray(records) || !records.length || records.length > 100) throw new ApiError(400, 'Invalid booking payload.');
        const created = [];
        for (const record of records) created.push(await createBookingRecord(client, record));
        return res.json(action === 'bulkCreate' ? created.map(fromDb) : fromDb(created[0]));
      }
      if (entity === 'ContactMessage') {
        await enforceRateLimit(req, 'contact-create', 5, 3600);
        const record = clean(data, CONTACT_FIELDS);
        if (!record.name || !record.email || !record.message) throw new ApiError(400, 'Name, email, and message are required.');
        const result = await client.from(table).insert(record).select().single();
        if (result.error) throw new ApiError(503, 'Message could not be sent.');
        return res.json(fromDb(result.data));
      }
      if (entity === 'Review') {
        await enforceRateLimit(req, 'review-create', 3, 3600);
        const record = { ...clean(data, REVIEW_FIELDS), status: 'pending' };
        if (!record.guest_name || !record.body) throw new ApiError(400, 'Name and review are required.');
        const result = await client.from(table).insert(record).select().single();
        if (result.error) throw new ApiError(503, 'Review could not be submitted.');
        return res.json(fromDb(result.data));
      }
      if (!actor.isAdmin) throw new ApiError(403, 'Administrator access required.', 'forbidden');
      const records = (action === 'bulkCreate' ? data : [data]).map(toDb);
      const result = await client.from(table).insert(records).select();
      if (result.error) throw new ApiError(503, 'Records could not be created.');
      return res.json(action === 'bulkCreate' ? result.data.map(fromDb) : fromDb(result.data[0]));
    }

    if (action === 'update') {
      if (!actor.privileged) throw new ApiError(403, 'Staff access required. Guests must use the receipt or payment verification flow.', 'forbidden');
      if (['Room', 'Car'].includes(entity) && !actor.isAdmin) throw new ApiError(403, 'Administrator access required.', 'forbidden');
      let changes = toDb(data);
      if (entity === 'Booking') {
        const { data: existing } = await client.from(table).select('*').eq('id', id).single();
        if (!existing) throw new ApiError(404, 'Booking not found.');
        changes = clean(changes, BOOKING_STAFF_FIELDS);
        if (changes.payment_status === 'paid') {
          if (existing.payment_method === 'paystack' && !actor.isAdmin) throw new ApiError(403, 'Card payments must be verified by Paystack.', 'forbidden');
          changes.payment_verified_at = new Date().toISOString();
          changes.payment_verified_by = actor.staff?.id || 'admin';
          changes.booking_status = changes.booking_status || 'confirmed';
          changes.hold_expires_at = null;
        }
      }
      if (entity === 'Review' && changes.status && !['pending', 'approved', 'rejected'].includes(changes.status)) throw new ApiError(400, 'Invalid review status.');
      const result = await client.from(table).update(changes).eq('id', id).select().single();
      if (result.error) {
        if (['23505', '23P01'].includes(result.error.code)) throw new ApiError(409, 'Those dates conflict with another reservation.', 'dates_unavailable');
        throw new ApiError(503, 'Record could not be updated.');
      }
      return res.json(fromDb(publicBooking(result.data)));
    }

    if (action === 'delete') {
      if (!actor.isAdmin) throw new ApiError(403, 'Administrator access required.', 'forbidden');
      const result = await client.from(table).delete().eq('id', id);
      if (result.error) throw new ApiError(503, 'Record could not be deleted.');
      return res.json({ success: true });
    }
    throw new ApiError(400, 'Unknown action.');
  } catch (error) { return sendError(res, error); }
}
