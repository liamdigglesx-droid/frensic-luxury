// Accept only same-origin application paths from next/returnTo query parameters.
export function safeReturnTo(fallback = '/') {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('next') || params.get('returnTo');
  if (!raw) return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    for (const p of ['access_token', 'clear_access_token', 'app_id', 'app_base_url', 'functions_version', 'from_url']) url.searchParams.delete(p);
    const path = url.pathname + url.search + url.hash;
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return fallback;
    return path;
  } catch { return fallback; }
}
