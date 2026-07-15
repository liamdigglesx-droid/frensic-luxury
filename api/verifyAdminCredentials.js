import crypto from 'node:crypto';
import { getAdminClient } from './_lib/supabase.js';
import { createAdminToken, currentCredential, hashPassword, safeEqual } from './_lib/admin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const credential = await currentCredential();
    const validPassword = password => credential ? safeEqual(hashPassword(password, credential.salt), credential.password_hash) : safeEqual(password, process.env.ADMIN_PASSWORD);
    if (body.action === 'changePassword') {
      if (!validPassword(body.currentPassword) || body.newPassword?.length < 8) return res.status(400).json({ error: 'Current password is incorrect or the new password is too short.' });
      const salt = crypto.randomUUID();
      const password_hash = hashPassword(body.newPassword, salt);
      const client = getAdminClient();
      const result = credential ? await client.from('admin_credentials').update({ password_hash, salt }).eq('id', credential.id) : await client.from('admin_credentials').insert({ password_hash, salt });
      if (result.error) throw result.error;
      return res.json({ authorized: true, sessionToken: createAdminToken(password_hash) });
    }
    if (!safeEqual(body.username, process.env.ADMIN_USERNAME) || !validPassword(body.password)) return res.status(401).json({ authorized: false });
    return res.json({ authorized: true, sessionToken: createAdminToken(credential?.password_hash || process.env.ADMIN_PASSWORD) });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}