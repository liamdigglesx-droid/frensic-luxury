import crypto from 'node:crypto';
import { getAdminClient } from './supabase.js';
import { ApiError, clientIp } from './http.js';

export async function enforceRateLimit(req, scope, limit, windowSeconds) {
  const key = crypto.createHash('sha256').update(`${scope}:${clientIp(req)}`).digest('hex');
  const { data, error } = await getAdminClient().rpc('consume_rate_limit', {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new ApiError(503, 'Service temporarily unavailable. Please try again shortly.', 'rate_limit_unavailable');
  if (data === false) throw new ApiError(429, 'Too many requests. Please wait before trying again.', 'rate_limited');
}
