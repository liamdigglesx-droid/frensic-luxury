import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { getAdminClient } from './supabase.js';
import { ApiError } from './http.js';

const pbkdf2 = promisify(crypto.pbkdf2);
const encode = value => Buffer.from(value).toString('base64url');
export const CURRENT_PASSWORD_ITERATIONS = 310000;

export async function hashPassword(password, salt, iterations = CURRENT_PASSWORD_ITERATIONS) {
  return encode(await pbkdf2(password, salt, iterations, 32, 'sha256'));
}

export function safeEqual(a = '', b = '') {
  const first = Buffer.from(String(a));
  const second = Buffer.from(String(b));
  return first.length === second.length && crypto.timingSafeEqual(first, second);
}

export async function currentCredential() {
  const { data, error } = await getAdminClient()
    .from('admin_credentials').select('*').order('updated_at', { ascending: false }).limit(1);
  if (error) throw new ApiError(503, 'Admin authentication is temporarily unavailable.', 'admin_unavailable');
  return data?.[0] || null;
}

export function createAdminToken(keyMaterial) {
  if (!keyMaterial) throw new ApiError(503, 'Admin authentication is not configured.', 'admin_unconfigured');
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  return `${expires}.${crypto.createHmac('sha256', keyMaterial).update(String(expires)).digest('base64url')}`;
}

export async function verifyAdminToken(token) {
  if (typeof token !== 'string' || token.length > 256) return false;
  const [expires, signature, extra] = token.split('.');
  if (!expires || !signature || extra !== undefined) return false;
  const expiresAt = Number(expires);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || expiresAt > Date.now() + 8 * 60 * 60 * 1000 + 60000) return false;
  const credential = await currentCredential();
  const key = credential?.password_hash || process.env.ADMIN_PASSWORD;
  return Boolean(key && safeEqual(signature, crypto.createHmac('sha256', key).update(expires).digest('base64url')));
}
