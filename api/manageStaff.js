import { getAdminClient } from './_lib/supabase.js';
import { verifyAdminToken } from './_lib/admin.js';
import { ApiError, requireMethod, sendError } from './_lib/http.js';
import { enforceRateLimit } from './_lib/rateLimit.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    if (!await verifyAdminToken(req.body?.sessionToken || req.headers['x-admin-token'])) throw new ApiError(401, 'Administrator access required.', 'unauthorized');
    await enforceRateLimit(req, 'manage-staff', 60, 900);
    const client = getAdminClient();
    const body = req.body || {};
    if (body.action === 'list') {
      const users = [];
      for (let page = 1; page <= 50; page++) {
        const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw new ApiError(503, 'Staff directory is temporarily unavailable.');
        users.push(...data.users);
        if (data.users.length < 200) break;
      }
      const { data: profiles } = await client.from('profiles').select('*');
      return res.json({ users: users.map(user => { const profile = profiles?.find(item => item.id === user.id); return { id: user.id, email: user.email, full_name: profile?.full_name || '', role: profile?.role || 'user' }; }) });
    }
    if (body.action === 'invite') {
      const role = body.role === 'admin' ? 'admin' : 'staff';
      const { data, error } = await client.auth.admin.inviteUserByEmail(body.email);
      if (error) throw new ApiError(503, 'Invitation could not be sent.');
      const { error: profileError } = await client.from('profiles').upsert({ id: data.user.id, role });
      if (profileError) throw new ApiError(503, 'Staff role could not be saved.');
      return res.json({ success: true });
    }
    if (body.action === 'updateRole') {
      const role = body.role === 'admin' ? 'admin' : 'staff';
      const { data: target } = await client.from('profiles').select('role').eq('id', body.userId).single();
      if (target?.role === 'admin' && role !== 'admin') {
        const { count } = await client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
        if ((count || 0) <= 1) throw new ApiError(400, 'At least one administrator must remain.');
      }
      const { data, error } = await client.from('profiles').update({ role }).eq('id', body.userId).select().single();
      if (error) throw new ApiError(503, 'Role could not be updated.');
      return res.json({ user: data });
    }
    if (body.action === 'resetPassword') {
      if (!process.env.APP_URL) throw new ApiError(503, 'APP_URL is not configured.');
      const { error } = await client.auth.resetPasswordForEmail(body.email, { redirectTo: `${process.env.APP_URL}/reset-password` });
      if (error) throw new ApiError(503, 'Password reset could not be sent.');
      return res.json({ success: true });
    }
    if (body.action === 'delete') {
      const { data: profile } = await client.from('profiles').select('role').eq('id', body.userId).single();
      if (profile?.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be deleted here.');
      const { error } = await client.auth.admin.deleteUser(body.userId);
      if (error) throw new ApiError(503, 'Staff account could not be deleted.');
      return res.json({ success: true });
    }
    throw new ApiError(400, 'Invalid action.');
  } catch (error) { return sendError(res, error); }
}
