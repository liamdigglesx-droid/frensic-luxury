import { getAdminClient, getStaff } from './_lib/supabase.js';
import { verifyAdminToken } from './_lib/admin.js';

const tables = { Booking: 'bookings', ContactMessage: 'contact_messages', Room: 'rooms', Car: 'cars', Review: 'reviews', User: 'profiles' };
const toDb = data => Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key === 'created_date' ? 'created_at' : key === 'updated_date' ? 'updated_at' : key === 'order' ? 'display_order' : key, value]));
const fromDb = row => row && Object.fromEntries(Object.entries(row).map(([key, value]) => [key === 'created_at' ? 'created_date' : key === 'updated_at' ? 'updated_date' : key === 'display_order' ? 'order' : key, value]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { entity, action, query = {}, sort = '-created_date', limit = 50, id, data } = req.body || {};
  const table = tables[entity];
  if (!table) return res.status(400).json({ error: 'Unknown entity' });
  const client = getAdminClient();
  const staff = await getStaff(req);
  const adminToken = req.headers['x-admin-token'];
  const privileged = Boolean(staff || await verifyAdminToken(adminToken));
  try {
    if (entity === 'User') {
      if (!privileged) return res.status(403).json({ error: 'Forbidden' });
      const { data: users, error } = await client.auth.admin.listUsers({ perPage: limit });
      if (error) throw error;
      const { data: profiles } = await client.from('profiles').select('*');
      return res.json(users.users.map(user => { const profile = profiles?.find(p => p.id === user.id); return { id: user.id, email: user.email, full_name: profile?.full_name || '', role: profile?.role === 'admin' ? 'admin' : 'user', created_date: user.created_at }; }));
    }
    if (action === 'list' || action === 'filter') {
      let request = client.from(table).select('*');
      for (const [key, value] of Object.entries(toDb(query))) request = request.eq(key, value);
      const descending = sort.startsWith('-');
      const sortField = toDb({ [sort.replace(/^-/, '')]: true });
      request = request.order(Object.keys(sortField)[0], { ascending: !descending }).limit(Math.min(limit, 500));
      const result = await request;
      if (result.error) throw result.error;
      if (entity === 'Booking' && !privileged && !query.guest_email) return res.json(result.data.map(row => fromDb({ id: row.id, item_id: row.item_id, booking_type: row.booking_type, start_date: row.start_date, end_date: row.end_date, payment_status: row.payment_status })));
      if (entity === 'Booking' && privileged) {
        const rows = await Promise.all(result.data.map(async row => {
          if (!row.payment_receipt_url?.startsWith('payment-receipts/')) return row;
          const path = row.payment_receipt_url.replace('payment-receipts/', '');
          const { data: signed } = await client.storage.from('payment-receipts').createSignedUrl(path, 3600);
          return { ...row, payment_receipt_url: signed?.signedUrl || row.payment_receipt_url };
        }));
        return res.json(rows.map(fromDb));
      }
      return res.json(result.data.map(fromDb));
    }
    if (action === 'get') {
      if (!privileged) return res.status(403).json({ error: 'Forbidden' });
      const result = await client.from(table).select('*').eq('id', id).single();
      if (result.error) throw result.error;
      return res.json(fromDb(result.data));
    }
    if (action === 'create' || action === 'bulkCreate') {
      const records = (action === 'bulkCreate' ? data : [data]).map(toDb);
      if (!privileged && !['Booking', 'ContactMessage', 'Review'].includes(entity)) return res.status(403).json({ error: 'Forbidden' });
      if (!privileged && entity === 'Booking' && records.some(record => record.payment_status !== 'pending')) return res.status(403).json({ error: 'New bookings must be pending' });
      const result = await client.from(table).insert(records).select();
      if (result.error) throw result.error;
      return res.json(action === 'bulkCreate' ? result.data.map(fromDb) : fromDb(result.data[0]));
    }
    if (action === 'update') {
      const changes = toDb(data);
      const allowedPublic = entity === 'Booking' && Object.keys(changes).every(key => ['payment_status','payment_reference','payment_receipt_url','receipt_submitted_at','transfer_status'].includes(key));
      if (!privileged && !allowedPublic) return res.status(403).json({ error: 'Forbidden' });
      const result = await client.from(table).update(changes).eq('id', id).select().single();
      if (result.error) throw result.error;
      if (entity === 'Booking' && changes.payment_status === 'paid' && process.env.APP_URL) {
        fetch(`${process.env.APP_URL}/api/sendPaidBookingSlack`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking: result.data }) }).catch(() => {});
      }
      return res.json(fromDb(result.data));
    }
    if (action === 'delete') {
      if (!privileged) return res.status(403).json({ error: 'Forbidden' });
      const result = await client.from(table).delete().eq('id', id);
      if (result.error) throw result.error;
      return res.json({ success: true });
    }
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}