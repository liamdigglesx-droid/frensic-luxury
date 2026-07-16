import { supabase } from '@/lib/supabase';

const entityNames = ['Booking', 'ContactMessage', 'Room', 'Car', 'Review', 'User'];

async function request(path, payload) {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(sessionStorage.getItem('frensic_admin_token') ? { 'X-Admin-Token': sessionStorage.getItem('frensic_admin_token') } : {}),
    },
    body: JSON.stringify(payload),
  });
  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { error: 'The server returned an invalid response.' };
  }
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.response = { data, status: response.status };
    throw error;
  }
  return data;
}

const entity = name => ({
  list: (sort = '-created_date', limit = 50) => request('data', { entity: name, action: 'list', sort, limit }),
  filter: (query = {}, sort = '-created_date', limit = 500) => request('data', { entity: name, action: 'filter', query, sort, limit }),
  get: id => request('data', { entity: name, action: 'get', id }),
  create: data => request('data', { entity: name, action: 'create', data }),
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
  async register({ email, password }) { const { data, error } = await supabase.auth.signUp({ email, password }); if (error) throw error; return data; },
  async verifyOtp({ email, otpCode }) { const { data, error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' }); if (error) throw error; return { ...data, access_token: data.session?.access_token }; },
  async resendOtp(email) { const { error } = await supabase.auth.resend({ type: 'signup', email }); if (error) throw error; },
  setToken: () => {},
  async resetPasswordRequest(email) { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password?token=recovery` }); if (error) throw error; },
  async resetPassword({ newPassword }) { const { error } = await supabase.auth.updateUser({ password: newPassword }); if (error) throw error; },
  async logout(redirectUrl) { await supabase.auth.signOut(); if (redirectUrl) window.location.href = redirectUrl; },
  redirectToLogin(nextUrl = window.location.href) { window.location.href = `/login?next=${encodeURIComponent(nextUrl)}`; },
  async updateMe(data) { const user = await auth.me(); await supabase.from('profiles').update(data).eq('id', user.id); return auth.me(); },
};

export const supabaseCompat = {
  entities,
  analytics: { track: () => {} },
  auth,
  users: { inviteUser: (email, role) => request('manageStaff', { action: 'invite', email, role }) },
  functions: { invoke: async (name, payload) => ({ data: await request(name, payload) }) },
  integrations: { Core: {
    async UploadFile({ file }) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { error } = await supabase.storage.from('payment-receipts').upload(path, file, { contentType: file.type });
      if (error) throw error;
      return { file_url: `payment-receipts/${path}` };
    },
  } },
};