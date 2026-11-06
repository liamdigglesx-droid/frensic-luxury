import { supabase } from '@/lib/supabase';
import { guestBookingToken, rememberGuestBooking } from '@/lib/guestBookings';

const entityNames = ['Booking', 'ContactMessage', 'Room', 'Car', 'Review', 'User'];
const publicTables = { Room: 'rooms', Car: 'cars', Review: 'reviews' };
const toDb = data => Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key === 'created_date' ? 'created_at' : key === 'updated_date' ? 'updated_at' : key === 'order' ? 'display_order' : key, value]));
const fromDb = row => row && Object.fromEntries(Object.entries(row).map(([key, value]) => [key === 'created_at' ? 'created_date' : key === 'updated_at' ? 'updated_date' : key === 'display_order' ? 'order' : key, value]));

async function listPublic(name, sort, limit) {
  const descending = sort.startsWith('-');
  const field = Object.keys(toDb({ [sort.replace(/^-/, '')]: true }))[0];
  let query = supabase.from(publicTables[name]).select('*');
  if (name === 'Review') query = query.eq('status', 'approved');
  if (name === 'Room' || name === 'Car') query = query.eq('active', true);
  const { data, error } = await query.order(field, { ascending: !descending }).limit(limit);
  if (error) throw error;
  return data.map(fromDb);
}

async function request(path, payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const bookingId = payload?.bookingId || payload?.id || payload?.booking?.id;
  const bookingToken = guestBookingToken(bookingId);
  const response = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(sessionStorage.getItem('frensic_admin_token') ? { 'X-Admin-Token': sessionStorage.getItem('frensic_admin_token') } : {}),
      ...(bookingToken ? { 'X-Booking-Token': bookingToken } : {}),
    },
    body: JSON.stringify(payload),
  });
  const responseText = await response.text();
  let data;
  try { data = responseText ? JSON.parse(responseText) : {}; } catch { data = { error: 'The server returned an invalid response.' }; }
  if (!response.ok) {
    const error = Object.assign(new Error(data.error || 'Request failed'), { response: { data, status: response.status } });
    throw error;
  }
  return data;
}

const entity = name => ({
  list: (sort = '-created_date', limit = 50) => publicTables[name]
    ? listPublic(name, sort, limit)
    : request('data', { entity: name, action: 'list', sort, limit }),
  filter: (query = {}, sort = '-created_date', limit = 500) => request('data', { entity: name, action: 'filter', query, sort, limit }),
  get: id => request('data', { entity: name, action: 'get', id }),
  create: async data => {
    if (name === 'Booking') {
      const booking = await request('createBooking', data);
      rememberGuestBooking(booking);
      return booking;
    }
    return request('data', { entity: name, action: 'create', data });
  },
  bulkCreate: data => request('data', { entity: name, action: 'bulkCreate', data }),
  update: (id, data) => request('data', { entity: name, action: 'update', id, data }),
  delete: id => request('data', { entity: name, action: 'delete', id }),
  subscribe: () => () => {},
});

const entities = Object.fromEntries(entityNames.map(name => [name, entity(name)]));

const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error('Not authenticated');
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return { id: user.id, email: user.email, full_name: profile?.full_name || user.user_metadata?.full_name || '', role: profile?.role || 'user' };
  },
  async isAuthenticated() { const { data } = await supabase.auth.getSession(); return Boolean(data.session); },
  async loginViaEmailPassword(email, password) { const { data, error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error; return data; },
  loginWithProvider(provider, nextUrl = '/') { return supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}${nextUrl}` } }); },
  async register({ email, password, full_name = '' }) { const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: full_name || '' } } }); if (error) throw error; return data; },
  async verifyOtp({ email, otpCode, type = 'signup' }) { const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type }); if (error) throw error; return { ...data, access_token: data.session?.access_token }; },
  async resendOtp(email) { const { error } = await supabase.auth.resend({ type: 'signup', email }); if (error) throw error; },
  setToken: (_token) => {},
  async resetPasswordRequest(email) { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (error) throw error; },
  async resetPassword({ newPassword }) { const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) throw error; },
  async logout(redirectUrl) { await supabase.auth.signOut(); if (redirectUrl) window.location.href = redirectUrl; },
  redirectToLogin(nextUrl = window.location.href) { window.location.href = `/login?next=${encodeURIComponent(nextUrl)}`; },
  async updateMe(data) { const user = await auth.me(); const { error } = await supabase.from('profiles').update({ full_name: data.full_name }).eq('id', user.id); if (error) throw error; return auth.me(); },
};

export const supabaseCompat = {
  entities,
  analytics: { track: () => {} },
  auth,
  users: { inviteUser: (email, role) => request('manageStaff', { action: 'invite', email, role }) },
  functions: { invoke: async (name, payload) => ({ data: await request(name, payload) }) },
  integrations: { Core: {
    async UploadFile() { throw new Error('Use the secure receipt upload flow.'); },
  } },
};
