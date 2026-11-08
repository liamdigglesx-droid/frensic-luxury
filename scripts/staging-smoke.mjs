import { pathToFileURL } from 'node:url';

// Read-only checks plus rate-limit counters and one optional admin login. This
// deliberately never creates bookings, charges cards, sends email, or changes a
// password. Keep credentials in an ignored env file, not command-line arguments.
const ROUTES = ['/', '/rooms', '/cars', '/book', '/login', '/my-bookings', '/dashboard/admin'];
const PROTECTED_PAGE = /protected deployment|log in to vercel|authentication required/i;

function stagingOrigin(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Set STAGING_URL to a valid HTTPS preview URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('STAGING_URL must be an HTTPS origin without credentials, query parameters, or fragments.');
  }
  return url.origin;
}

export async function runStagingSmoke({ url, bypassToken = '', adminUsername = '', adminPassword = '', fetchImpl = globalThis.fetch }) {
  const origin = stagingOrigin(url);
  if (typeof fetchImpl !== 'function') throw new Error('This check requires Node.js 22 or newer.');
  const results = [];
  const headers = { Accept: 'application/json', ...(bypassToken ? { 'x-vercel-protection-bypass': bypassToken } : {}) };

  async function request(path, { method = 'GET', body, extraHeaders = {} } = {}) {
    const response = await fetchImpl(`${origin}${path}`, {
      method, redirect: 'manual', signal: AbortSignal.timeout(15000),
      headers: { ...headers, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...extraHeaders },
      ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* HTML is expected for SPA routes. */ }
    return { status: response.status, text, json, location: response.headers.get('location') || '' };
  }

  async function check(name, run) {
    try {
      const detail = await run();
      results.push({ name, status: 'passed', ...(detail ? { detail } : {}) });
    } catch (error) {
      results.push({ name, status: 'failed', detail: error instanceof Error && error.name === 'CheckFailed' ? error.message : 'Request failed or timed out.' });
    }
  }
  function expect(condition, message) {
    if (!condition) { const error = new Error(message); error.name = 'CheckFailed'; throw error; }
  }
  const api = (action, body, extraHeaders) => request(`/api/${action}`, { method: 'POST', body, extraHeaders });

  let entry;
  try { entry = await request('/'); } catch { entry = null; }
  if (!entry || entry.status >= 300 || PROTECTED_PAGE.test(entry.text)) {
    return {
      blocked: true,
      results: [{ name: 'preview-access', status: 'blocked', detail: 'Preview is protected or unreachable. Set a valid automation-bypass token locally and retry.' }],
      summary: { passed: 0, failed: 0, skipped: 1 },
    };
  }

  for (const route of ROUTES) {
    await check(`SPA ${route}`, async () => {
      const response = route === '/' ? entry : await request(route);
      expect(response.status === 200 && /id=["']root["']/.test(response.text) && !PROTECTED_PAGE.test(response.text), `Expected the application HTML; received HTTP ${response.status}.`);
    });
  }
  let firstRoom;
  for (const entity of ['Room', 'Car']) {
    await check(`public ${entity} catalog`, async () => {
      const response = await api('data', { entity, action: 'list', limit: 10 });
      expect(response.status === 200 && Array.isArray(response.json) && response.json.length > 0, `Expected active catalog rows; received HTTP ${response.status}.`);
      expect(response.json.every(row => row.active === true), 'Inactive catalog rows were exposed.');
      if (entity === 'Room') firstRoom = response.json[0];
    });
  }
  await check('anonymous booking reads denied', async () => {
    const response = await api('data', { entity: 'Booking', action: 'filter', query: { guest_email: 'smoke@example.invalid' } });
    expect(response.status === 403, `Expected HTTP 403; received ${response.status}.`);
  });
  await check('anonymous booking updates denied', async () => {
    const response = await api('data', { entity: 'Booking', action: 'update', id: 'smoke-invalid-id', data: { payment_status: 'paid' } });
    expect(response.status === 403, `Expected HTTP 403; received ${response.status}.`);
  });
  await check('anonymous dashboard statistics denied', async () => {
    const response = await api('bookingStats', {});
    expect(response.status === 403, `Expected HTTP 403; received ${response.status}.`);
  });
  await check('public reviews are moderated', async () => {
    const response = await api('data', { entity: 'Review', action: 'list', limit: 500 });
    expect(response.status === 200 && Array.isArray(response.json), `Expected review rows; received HTTP ${response.status}.`);
    expect(response.json.every(row => row.status === 'approved'), 'A non-approved review was exposed.');
  });
  await check('unknown API route returns JSON 404', async () => {
    const response = await api('stagingSmokeUnknownRoute', {});
    expect(response.status === 404 && response.json?.code === 'not_found', `Expected JSON 404; received ${response.status}.`);
  });
  await check('invalid JSON returns 400', async () => {
    const response = await api('data', '{invalid-json');
    expect(response.status === 400 && response.json?.code === 'invalid_json', `Expected JSON 400; received ${response.status}.`);
  });
  await check('availability endpoint', async () => {
    expect(firstRoom, 'No active room was available for this check.');
    const start = new Date(Date.now() + 300 * 86400000).toISOString().slice(0, 10);
    const end = new Date(Date.now() + 302 * 86400000).toISOString().slice(0, 10);
    const response = await api('checkAvailability', { booking_type: 'stay', item_id: firstRoom.slug || firstRoom.id, start_date: start, end_date: end, guests_count: 1 });
    expect(response.status === 200 && typeof response.json?.available === 'boolean', `Expected an availability result; received HTTP ${response.status}.`);
  });
  await check('Paystack webhook configured and invalid signature rejected', async () => {
    const response = await api('paystackWebhook', { event: 'charge.success' }, { 'x-paystack-signature': 'invalid' });
    expect(response.status !== 503, 'Paystack webhook secret is not configured on this deployment.');
    expect(response.status === 401 && response.json?.code === 'invalid_signature', `Expected HTTP 401; received ${response.status}.`);
  });
  if (adminUsername && adminPassword) {
    await check('admin login (no password change)', async () => {
      const response = await api('verifyAdminCredentials', { username: adminUsername, password: adminPassword });
      expect(response.status === 200 && response.json?.authorized === true && typeof response.json?.sessionToken === 'string', `Admin login failed with HTTP ${response.status}${response.json?.code ? ` (${response.json.code})` : ''}.`);
    });
  } else {
    results.push({ name: 'admin login (no password change)', status: 'skipped', detail: 'Set ADMIN_USERNAME and ADMIN_PASSWORD locally to include this check.' });
  }
  const summary = { passed: 0, failed: 0, skipped: 0 };
  results.forEach(result => { summary[result.status] += 1; });
  return { blocked: false, results, summary };
}

export async function main(env = process.env) {
  try {
    const report = await runStagingSmoke({
      url: env.STAGING_URL, bypassToken: env.VERCEL_AUTOMATION_BYPASS_SECRET,
      adminUsername: env.ADMIN_USERNAME, adminPassword: env.ADMIN_PASSWORD,
    });
    console.log(JSON.stringify(report, null, 2));
    return report.blocked ? 2 : report.summary.failed ? 1 : 0;
  } catch {
    console.error('Staging smoke configuration is invalid. Use an HTTPS STAGING_URL and Node.js 22+.');
    return 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main();
}
