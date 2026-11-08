import crypto from 'node:crypto';

export function createFakeClient(store) {
  const matches = (row, filters) => filters.every(([op, key, value]) => {
    if (op === 'eq') return row[key] === value;
    if (op === 'is') return value === null ? row[key] == null : row[key] === value;
    if (op === 'lt') return row[key] < value;
    if (op === 'gt') return row[key] > value;
    if (op === 'neq') return row[key] !== value;
    return true;
  });
  function from(table) {
    store[table] ||= [];
    const state = { filters: [], action: 'select', order: null, range: null };
    const execute = async () => {
      let rows = store[table].filter(row => matches(row, state.filters));
      if (state.action === 'insert') {
        const inserted = state.records.map(record => ({ id: record.id || crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...record }));
        store[table].push(...inserted);
        rows = inserted;
      } else if (state.action === 'update') {
        rows = rows.map(row => Object.assign(row, state.changes, { updated_at: new Date().toISOString() }));
      } else if (state.action === 'delete') {
        const ids = new Set(rows.map(row => row.id));
        store[table] = store[table].filter(row => !ids.has(row.id));
      }
      if (state.order) rows = [...rows].sort((a, b) => String(a[state.order.field] ?? '').localeCompare(String(b[state.order.field] ?? '')) * (state.order.ascending ? 1 : -1));
      if (state.range) rows = rows.slice(state.range[0], state.range[1] + 1);
      return { data: rows, error: null };
    };
    const q = {
      select() { return q; },
      insert(records) { state.action = 'insert'; state.records = Array.isArray(records) ? records : [records]; return q; },
      update(changes) { state.action = 'update'; state.changes = changes; return q; },
      delete() { state.action = 'delete'; return q; },
      eq(key, value) { state.filters.push(['eq', key, value]); return q; },
      is(key, value) { state.filters.push(['is', key, value]); return q; },
      lt(key, value) { state.filters.push(['lt', key, value]); return q; },
      gt(key, value) { state.filters.push(['gt', key, value]); return q; },
      neq(key, value) { state.filters.push(['neq', key, value]); return q; },
      order(field, options = {}) { state.order = { field, ascending: options.ascending !== false }; return q; },
      range(fromIndex, toIndex) { state.range = [fromIndex, toIndex]; return q; },
      limit() { return q; },
      async single() { const { data } = await execute(); return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'not found' } }; },
      async maybeSingle() { const { data } = await execute(); return { data: data[0] || null, error: null }; },
      then(resolve, reject) { return execute().then(resolve, reject); },
    };
    return q;
  }
  return {
    from,
    auth: {
      async getUser(token) {
        const user = store.usersByToken?.[token];
        return { data: { user: user || null }, error: user ? null : new Error('invalid token') };
      },
      admin: { async listUsers() { return { data: { users: [] }, error: null }; } },
    },
    storage: {
      from() {
        return {
          async createSignedUrl(path) { return { data: { signedUrl: `https://example.test/${path}` } }; },
          async createSignedUploadUrl(path) { return { data: { path, token: 'fake-upload-token' } }; },
          async list(folder, { search }) { return { data: (store.files || []).filter(file => file.folder === folder && file.name === search), error: null }; },
        };
      },
    },
    async rpc(name, _args) {
      if (name === 'consume_rate_limit') return { data: true, error: null };
      if (name === 'booking_stats') return { data: { totalRevenue: 0, paidCount: 0, pendingCount: 0, stayCount: 0, driveCount: 0, monthly: [] }, error: null };
      return { data: null, error: null };
    },
  };
}

export function mockResponse() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
