Deno.serve(async (req) => {
  try {
    const expectedUsername = Deno.env.get('ADMIN_USERNAME');
    const expectedPassword = Deno.env.get('ADMIN_PASSWORD');
    if (!expectedUsername || !expectedPassword) {
      return Response.json({ error: 'Admin credentials are not configured.' }, { status: 503 });
    }

    const { username, password } = await req.json();
    if (typeof username !== 'string' || typeof password !== 'string') {
      return Response.json({ authorized: false }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const safelyMatches = (provided, expected) => {
      const first = encoder.encode(provided);
      const second = encoder.encode(expected);
      let difference = first.length ^ second.length;
      const length = Math.max(first.length, second.length);
      for (let index = 0; index < length; index += 1) {
        difference |= (first[index] ?? 0) ^ (second[index] ?? 0);
      }
      return difference === 0;
    };

    const authorized = safelyMatches(username, expectedUsername) && safelyMatches(password, expectedPassword);
    return Response.json({ authorized }, { status: authorized ? 200 : 401 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});