import { getAdminClient } from './_lib/supabase.js';
import { verifyAdminToken } from './_lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await verifyAdminToken(req.body?.sessionToken || req.headers['x-admin-token'])) return res.status(401).json({ error: 'Unauthorized' });
  const client = getAdminClient();
  const body = req.body || {};
  try {
    if (body.action === 'list') {
      const { data, error } = await client.auth.admin.listUsers({ perPage: 200 }); if (error) throw error;
      const { data: profiles } = await client.from('profiles').select('*');
      return res.json({ users: data.users.map(user => { const profile = profiles?.find(item => item.id === user.id); return { id: user.id, email: user.email, full_name: profile?.full_name || '', role: profile?.role === 'admin' ? 'admin' : 'user' }; }) });
    }
    if (body.action === 'invite') {
      const { data, error } = await client.auth.admin.inviteUserByEmail(body.email); if (error) throw error;
      await client.from('profiles').upsert({ id: data.user.id, role: body.role === 'admin' ? 'admin' : 'staff' });
      return res.json({ success: true });
    }
    if (body.action === 'updateRole') {
      const role = body.role === 'admin' ? 'admin' : 'staff';
      const { data, error } = await client.from('profiles').update({ role }).eq('id', body.userId).select().single(); if (error) throw error;
      return res.json({ user: { ...data, role: data.role === 'admin' ? 'admin' : 'user' } });
    }
    if (body.action === 'resetPassword') {
      const { error } = await client.auth.resetPasswordForEmail(body.email, { redirectTo: `${process.env.APP_URL}/reset-password?token=recovery` }); if (error) throw error;
      return res.json({ success: true });
    }
    if (body.action === 'delete') {
      const { data: profile } = await client.from('profiles').select('role').eq('id', body.userId).single();
      if (profile?.role === 'admin') return res.status(400).json({ error: 'Admin accounts cannot be deleted here.' });
      const { error } = await client.auth.admin.deleteUser(body.userId); if (error) throw error;
      return res.json({ success: true });
    }
    return res.status(400).json({ error: 'Invalid action.' });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}