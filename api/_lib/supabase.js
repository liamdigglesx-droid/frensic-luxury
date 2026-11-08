import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { ApiError } from './http.js';
import { verifyAdminToken } from './admin.js';

let adminClient;
export function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serviceKey) throw new ApiError(503, 'Booking services are not configured.', 'service_unconfigured');
  adminClient ||= createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return adminClient;
}

export function bearerToken(req) {
  const value = req.headers?.authorization;
  return typeof value === 'string' && value.startsWith('Bearer ') ? value.slice(7).trim() : null;
}

export async function getVerifiedUser(req) {
  const token = bearerToken(req);
  if (!token) return null;
  const { data: { user }, error } = await getAdminClient().auth.getUser(token);
  if (error || !user?.email) return null;
  if (!user.email_confirmed_at && !user.confirmed_at) return null;
  return user;
}

export async function getStaff(req) {
  const user = await getVerifiedUser(req);
  if (!user) return null;
  const { data: profile, error } = await getAdminClient().from('profiles').select('*').eq('id', user.id).single();
  if (error || !profile || !['admin', 'staff'].includes(profile.role)) return null;
  return { ...profile, email: user.email };
}

export async function getActor(req) {
  const staff = await getStaff(req);
  const admin = staff ? false : await verifyAdminToken(req.headers?.['x-admin-token']);
  return { staff, admin, privileged: Boolean(staff || admin), isAdmin: Boolean(admin || staff?.role === 'admin') };
}

export function hashGuestToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function hasBookingAccess(req, booking, actor) {
  if (actor?.privileged) return true;
  const token = req.headers?.['x-booking-token'];
  return Boolean(token && booking?.guest_access_hash && hashGuestToken(token) === booking.guest_access_hash);
}

export function publicBooking(row) {
  if (!row) return row;
  const { guest_access_hash: _guest_access_hash, ...safe } = row;
  return safe;
}
