import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const initialPassword = Deno.env.get('ADMIN_PASSWORD');
    const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 1);
    const keyMaterial = credentials[0]?.password_hash || initialPassword;
    if (!keyMaterial || typeof body.sessionToken !== 'string') return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const encoder = new TextEncoder();
    const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    const [expiresText, providedSignature] = body.sessionToken.split('.');
    const expires = Number(expiresText);
    const key = await crypto.subtle.importKey('raw', encoder.encode(keyMaterial), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(expiresText || ''));
    const expectedSignature = toBase64(new Uint8Array(signature));
    if (!expires || expires < Date.now() || providedSignature !== expectedSignature) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (body.action === 'list') {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 200);
      return Response.json({ users: users.map(({ id, full_name, email, role }) => ({ id, full_name, email, role })) });
    }
    if (body.action === 'updateRole' && ['user', 'admin'].includes(body.role)) {
      const user = await base44.asServiceRole.entities.User.update(body.userId, { role: body.role });
      return Response.json({ user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
    }
    if (body.action === 'resetPassword') {
      await base44.auth.resetPasswordRequest(body.email);
      return Response.json({ success: true });
    }
    if (body.action === 'delete') {
      const user = await base44.asServiceRole.entities.User.get(body.userId);
      if (user.role === 'admin') return Response.json({ error: 'Admin accounts cannot be deleted here.' }, { status: 400 });
      await base44.asServiceRole.entities.User.delete(body.userId);
      return Response.json({ success: true });
    }
    return Response.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});