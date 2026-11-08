import test from 'node:test';
import assert from 'node:assert/strict';
import { runStagingSmoke } from '../scripts/staging-smoke.mjs';

const html = '<!doctype html><html><body><div id="root"></div></body></html>';
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function fixture({ webhookStatus = 401, protectedPage = false } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    const parsed = new URL(url);
    calls.push({ url, options });
    if (protectedPage) return new Response('<h1>Protected Deployment</h1><p>Log in to Vercel</p>', { status: 200 });
    if (!parsed.pathname.startsWith('/api/')) return new Response(html, { status: 200 });
    const action = parsed.pathname.slice('/api/'.length);
    if (action === 'stagingSmokeUnknownRoute') return json(404, { code: 'not_found' });
    if (options.body === '{invalid-json') return json(400, { code: 'invalid_json' });
    if (action === 'paystackWebhook') return json(webhookStatus, { code: webhookStatus === 401 ? 'invalid_signature' : 'webhook_unconfigured' });
    if (action === 'verifyAdminCredentials') return json(200, { authorized: true, sessionToken: 'fake-admin-session-token' });
    if (action === 'bookingStats') return json(403, { code: 'forbidden' });
    if (action === 'checkAvailability') return json(200, { available: true });
    const body = JSON.parse(options.body);
    if (body.entity === 'Booking') return json(403, { code: 'forbidden' });
    if (body.entity === 'Review') return json(200, [{ id: 'review-1', status: 'approved' }]);
    if (body.entity === 'Room') return json(200, [{ id: 'room-1', slug: 'royal-haven', active: true }]);
    if (body.entity === 'Car') return json(200, [{ id: 'car-1', slug: 'luxurious-style', active: true }]);
    return json(400, { code: 'unknown_test_request' });
  };
  return { calls, fetchImpl };
}

test('staging smoke passes against a complete fixture without exposing credentials or mutating bookings', async () => {
  const { calls, fetchImpl } = fixture();
  const report = await runStagingSmoke({
    url: 'https://preview.example.test', bypassToken: 'fake-bypass-secret',
    adminUsername: 'fake-admin', adminPassword: 'fake-admin-password', fetchImpl,
  });
  assert.equal(report.blocked, false);
  assert.equal(report.summary.failed, 0);
  assert.equal(report.summary.skipped, 0);
  assert.equal(report.summary.passed, 18);
  assert.ok(calls.every(call => !call.url.includes('fake-bypass-secret')));
  assert.ok(calls.every(call => call.options.headers['x-vercel-protection-bypass'] === 'fake-bypass-secret'));
  assert.ok(calls.every(call => call.options.redirect === 'manual'));
  const serialized = JSON.stringify(report);
  for (const secret of ['fake-bypass-secret', 'fake-admin-password', 'fake-admin-session-token']) assert.equal(serialized.includes(secret), false);
  const bodies = calls.map(call => call.options.body).filter(Boolean).join('\n');
  assert.equal(bodies.includes('"action":"create"'), false);
  assert.equal(bodies.includes('changePassword'), false);
});

test('staging smoke stops at SSO protection and reports missing webhook configuration as a failure', async () => {
  const protectedFixture = fixture({ protectedPage: true });
  const blocked = await runStagingSmoke({ url: 'https://preview.example.test', fetchImpl: protectedFixture.fetchImpl });
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.summary.skipped, 1);
  assert.equal(protectedFixture.calls.length, 1);
  const missing = fixture({ webhookStatus: 503 });
  const report = await runStagingSmoke({ url: 'https://preview.example.test', fetchImpl: missing.fetchImpl });
  assert.equal(report.blocked, false);
  assert.equal(report.summary.failed, 1);
  assert.equal(report.summary.skipped, 1);
  assert.match(report.results.find(result => result.status === 'failed').detail, /not configured/);
});

test('staging smoke rejects insecure URLs and never puts bypass credentials in query strings', async () => {
  for (const url of ['http://preview.example.test', 'https://user:password@preview.example.test', 'https://preview.example.test?x-vercel-protection-bypass=secret']) {
    await assert.rejects(() => runStagingSmoke({ url, fetchImpl: fixture().fetchImpl }), /HTTPS/);
  }
});
