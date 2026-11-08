export class ApiError extends Error {
  constructor(status, message, code = 'request_failed') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function requireMethod(req, method = 'POST') {
  if (req.method !== method) throw new ApiError(405, 'Method not allowed', 'method_not_allowed');
}

export function sendError(res, error) {
  const status = error instanceof ApiError ? error.status : 500;
  if (status >= 500) console.error('[api]', error?.message || error);
  return res.status(status).json({
    error: status >= 500 ? 'The request could not be completed. Please try again.' : error.message,
    code: error instanceof ApiError ? error.code : 'internal_error',
  });
}

export function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return (value?.split(',')[0] || req.socket?.remoteAddress || 'unknown').trim();
}

export async function readRawBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new ApiError(413, 'Request body is too large', 'payload_too_large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}
