import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const expectedUsername = Deno.env.get('ADMIN_USERNAME');
    const initialPassword = Deno.env.get('ADMIN_PASSWORD');
    if (!expectedUsername || !initialPassword) return Response.json({ error: 'Admin credentials are not configured.' }, { status: 503 });

    const body = await req.json();
    const encoder = new TextEncoder();
    const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    const safelyMatches = (first, second) => {
      const a = encoder.encode(first || '');
      const b = encoder.encode(second || '');
      let difference = a.length ^ b.length;
      for (let index = 0; index < Math.max(a.length, b.length); index += 1) difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
      return difference === 0;
    };
    const hashPassword = async (password, salt) => {
      const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
      return toBase64(new Uint8Array(bits));
    };
    const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 1);
    const credential = credentials[0] || null;
    const verifyPassword = async (password) => credential
      ? safelyMatches(await hashPassword(password, credential.salt), credential.password_hash)
      : safelyMatches(password, initialPassword);
    const createToken = async (keyMaterial) => {
      const expires = Date.now() + 8 * 60 * 60 * 1000;
      const key = await crypto.subtle.importKey('raw', encoder.encode(keyMaterial), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(expires)));
      return `${expires}.${toBase64(new Uint8Array(signature))}`;
    };

    if (body.action === 'changePassword') {
      if (!await verifyPassword(body.currentPassword) || typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
        return Response.json({ error: 'Current password is incorrect or the new password is too short.' }, { status: 400 });
      }
      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword(body.newPassword, salt);
      if (credential) await base44.asServiceRole.entities.AdminCredential.update(credential.id, { password_hash: passwordHash, salt });
      else await base44.asServiceRole.entities.AdminCredential.create({ password_hash: passwordHash, salt });
      return Response.json({ authorized: true, sessionToken: await createToken(passwordHash) });
    }

    if (body.username !== expectedUsername || !await verifyPassword(body.password)) {
      return Response.json({ authorized: false }, { status: 401 });
    }
    const keyMaterial = credential?.password_hash || initialPassword;
    return Response.json({ authorized: true, sessionToken: await createToken(keyMaterial) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});