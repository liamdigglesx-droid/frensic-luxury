import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin authentication required' }, { status: 403 });
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
    const projects = await projectsResponse.json();
    const project = projects.find((item) => item.id === 'jhgaoemlwjradmufigyh');
    if (!project) return Response.json({ error: 'Supabase project not found' }, { status: 404 });
    const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${project.id}/api-keys`, { headers: { Authorization: `Bearer ${accessToken}` } });
    const keys = await keysResponse.json();
    const serviceKey = keys.find((item) => item.name === 'service_role')?.api_key;
    if (!serviceKey) return Response.json({ error: 'Supabase service key unavailable' }, { status: 500 });

    const mappings = [
      ['Booking', 'bookings'], ['ContactMessage', 'contact_messages'], ['Room', 'rooms'], ['Car', 'cars'], ['Review', 'reviews'],
    ];
    const rename = (key) => key === 'created_date' ? 'created_at' : key === 'updated_date' ? 'updated_at' : key === 'order' ? 'display_order' : key;
    const allowed = {
      bookings: ['booking_type','item_id','item_name','start_date','end_date','guest_name','guest_email','guest_phone','guests_count','chauffeur','special_requests','nights_or_days','unit_price','total_amount','booking_status','payment_status','payment_reference','payment_method','transfer_status','payment_receipt_url','receipt_submitted_at','assigned_staff_name','assigned_staff_email','created_at','updated_at'],
      contact_messages: ['name','email','phone','subject','message','created_at'],
      rooms: ['name','tagline','description','price_per_night','bedrooms','size_sqm','max_guests','amenities','image_url','gallery','featured','display_order','created_at','updated_at'],
      cars: ['name','style','description','price_per_day','horsepower','top_speed','seats','transmission','features','image_url','gallery','chauffeur_available','display_order','created_at','updated_at'],
      reviews: ['guest_name','guest_title','headline','body','rating','avatar_url','service_type','display_order','created_at','updated_at'],
    };
    const counts = {};
    for (const [entityName, table] of mappings) {
      const records = await base44.asServiceRole.entities[entityName].list('-created_date', 500);
      const rows = records.map((record) => {
        const row = Object.fromEntries(allowed[table].map((key) => [key, null]));
        row.legacy_id = record.id;
        for (const [key, value] of Object.entries(record)) {
          const nextKey = rename(key);
          if (allowed[table].includes(nextKey) && value !== undefined) row[nextKey] = value;
        }
        if (table === 'bookings') {
          row.chauffeur ??= false;
          row.booking_status ??= 'pending';
          row.payment_status ??= 'pending';
        }
        if (table === 'rooms') {
          row.amenities ??= []; row.gallery ??= []; row.featured ??= false; row.display_order ??= 0;
        }
        if (table === 'cars') {
          row.features ??= []; row.gallery ??= []; row.chauffeur_available ??= true; row.display_order ??= 0;
        }
        if (table === 'reviews') {
          row.rating ??= 5; row.display_order ??= 0;
        }
        return row;
      });
      if (table === 'bookings') {
        for (const row of rows) {
          if (!row.payment_receipt_url?.startsWith('http')) continue;
          const receipt = await fetch(row.payment_receipt_url);
          if (!receipt.ok) continue;
          const extension = receipt.headers.get('content-type')?.includes('pdf') ? 'pdf' : 'jpg';
          const path = `migrated-${row.legacy_id}.${extension}`;
          const upload = await fetch(`https://${project.id}.supabase.co/storage/v1/object/payment-receipts/${path}`, { method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': receipt.headers.get('content-type') || 'application/octet-stream', 'x-upsert': 'true' }, body: await receipt.arrayBuffer() });
          if (upload.ok) row.payment_receipt_url = `payment-receipts/${path}`;
        }
      }
      if (rows.length) {
        const response = await fetch(`https://${project.id}.supabase.co/rest/v1/${table}?on_conflict=legacy_id`, { method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(rows) });
        if (!response.ok) throw new Error(`${table}: ${await response.text()}`);
      }
      counts[table] = rows.length;
    }
    const credentials = await base44.asServiceRole.entities.AdminCredential.list('-updated_date', 1);
    if (credentials[0]) {
      const response = await fetch(`https://${project.id}.supabase.co/rest/v1/admin_credentials`, { method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password_hash: credentials[0].password_hash, salt: credentials[0].salt }) });
      if (!response.ok) throw new Error(`admin_credentials: ${await response.text()}`);
    }
    return Response.json({ success: true, counts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});