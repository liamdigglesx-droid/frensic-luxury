import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { channelName } = await req.json();
    const target = String(channelName || '').replace(/^#/, '').toLowerCase();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    let cursor = '';

    do {
      const params = new URLSearchParams({ limit: '200', exclude_archived: 'true', types: 'public_channel' });
      if (cursor) params.set('cursor', cursor);
      const response = await fetch(`https://slack.com/api/conversations.list?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Unable to list Slack channels');
      const channel = (data.channels || []).find((item) => item.name?.toLowerCase() === target);
      if (channel) return Response.json({ id: channel.id, name: channel.name });
      cursor = data.response_metadata?.next_cursor || '';
    } while (cursor);

    return Response.json({ error: `Channel #${target} was not found` }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});