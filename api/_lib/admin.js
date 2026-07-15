import crypto from 'node:crypto';
import { getAdminClient } from './supabase.js';

const encode = value => Buffer.from(value).toString('base64url');
export const hashPassword = (password, salt) => encode(crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256'));
export const safeEqual = (a = '', b = '') => {
  const first = Buffer.from(a); const second = Buffer.from(b);
  return first.length === second.length && crypto.timingSafeEqual(first, second);
};
export async function currentCredential() {
  const { data } = await getAdminClient().from('admin_credentials').select('*').order('updated_at', { ascending: false }).limit(1);
  return data?.[0] || null;
}
export function createAdminToken(keyMaterial) {
  const expires = Date.now() + 8 * 60 * 60 * 1000;
  return `${expires}.${crypto.createHmac('sha256', keyMaterial).update(String(expires)).digest('base64url')}`;
}
export async function verifyAdminToken(token) {
  if (!token) return false;
  const [expires, signature] = token.split('.');
  if (!expires || Number(expires) < Date.now()) return false;
  const credential = await currentCredential();
  const key = credential?.password_hash || process.env.ADMIN_PASSWORD;
  return Boolean(key && safeEqual(signature, crypto.createHmac('sha256', key).update(expires).digest('base64url')));
}