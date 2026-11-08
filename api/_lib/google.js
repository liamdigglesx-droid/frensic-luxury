import { ApiError } from './http.js';

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

export async function getGoogleAccessToken() {
  if (!isGoogleConfigured()) throw new ApiError(503, 'Google notifications are not configured.', 'google_unconfigured');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: process.env.GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) throw new ApiError(502, 'Google authorization failed.', 'google_auth_failed');
  return data.access_token;
}
