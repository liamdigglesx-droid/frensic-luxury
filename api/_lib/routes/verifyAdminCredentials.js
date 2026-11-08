import crypto from 'node:crypto';
import { getAdminClient } from '../supabase.js';
import { createAdminToken, currentCredential, hashPassword, safeEqual, CURRENT_PASSWORD_ITERATIONS } from '../admin.js';
import { ApiError, requireMethod, sendError } from '../http.js';
import { enforceRateLimit } from '../rateLimit.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    const body = req.body || {};
    const credential = await currentCredential();
    const expectedUsername = process.env.ADMIN_USERNAME;
    const initialPassword = process.env.ADMIN_PASSWORD;
    if (!expectedUsername || (!credential && !initialPassword)) throw new ApiError(503, 'Admin credentials are not configured.', 'admin_unconfigured');
    const validPassword = async password => {
      if (typeof password !== 'string') return false;
      if (!credential) return safeEqual(password, initialPassword);
      const hash = await hashPassword(password, credential.salt, credential.iterations || 120000);
      return safeEqual(hash, credential.password_hash);
    };
    if (body.action === 'changePassword') {
      await enforceRateLimit(req, 'admin-change-password', 5, 900);
      if (!await validPassword(body.currentPassword) || typeof body.newPassword !== 'string' || body.newPassword.length < 12) {
        throw new ApiError(400, 'Current password is incorrect or the new password is too short (minimum 12 characters).');
      }
      const salt = crypto.randomUUID();
      const password_hash = await hashPassword(body.newPassword, salt, CURRENT_PASSWORD_ITERATIONS);
      const client = getAdminClient();
      const values = { password_hash, salt, iterations: CURRENT_PASSWORD_ITERATIONS };
      const result = credential ? await client.from('admin_credentials').update(values).eq('id', credential.id) : await client.from('admin_credentials').insert(values);
      if (result.error) throw new ApiError(503, 'Password could not be updated.');
      return res.json({ authorized: true, sessionToken: createAdminToken(password_hash) });
    }
    await enforceRateLimit(req, 'admin-login', 10, 900);
    if (!safeEqual(body.username, expectedUsername) || !await validPassword(body.password)) throw new ApiError(401, 'Invalid username or password.', 'invalid_credentials');
    return res.json({ authorized: true, sessionToken: createAdminToken(credential?.password_hash || initialPassword) });
  } catch (error) { return sendError(res, error); }
}
