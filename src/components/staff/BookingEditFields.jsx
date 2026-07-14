const inputClass = 'w-full h-10 px-3 bg-background border border-border text-sm text-foreground outline-none focus:border-primary';
const labelClass = 'block text-[10px] tracking-widest uppercase text-muted-foreground mb-1';

export default function BookingEditFields({ form, setForm, staff }) {
  const set = (field, value) => setForm(current => ({ ...current, [field]: value }));
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label><span className={labelClass}>Booking status</span><select className={inputClass} value={form.booking_status || 'pending'} onChange={e => set('booking_status', e.target.value)}>{['pending','confirmed','checked_in','completed','cancelled'].map(v => <option key={v} value={v}>{v.replaceAll('_', ' ')}</option>)}</select></label>
      <label><span className={labelClass}>Payment status</span><select className={inputClass} value={form.payment_status || 'pending'} onChange={e => set('payment_status', e.target.value)}>{['pending','paid','failed'].map(v => <option key={v} value={v}>{v}</option>)}</select></label>
      <label><span className={labelClass}>Start date</span><input required type="date" className={inputClass} value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} /></label>
      <label><span className={labelClass}>End date</span><input required type="date" className={inputClass} value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} /></label>
      <label><span className={labelClass}>Guest name</span><input className={inputClass} value={form.guest_name || ''} onChange={e => set('guest_name', e.target.value)} /></label>
      <label><span className={labelClass}>Guest email</span><input required type="email" className={inputClass} value={form.guest_email || ''} onChange={e => set('guest_email', e.target.value)} /></label>
      <label><span className={labelClass}>Guest phone</span><input className={inputClass} value={form.guest_phone || ''} onChange={e => set('guest_phone', e.target.value)} /></label>
      <label><span className={labelClass}>Guests</span><input min="1" type="number" className={inputClass} value={form.guests_count || 1} onChange={e => set('guests_count', Number(e.target.value))} /></label>
      <label><span className={labelClass}>Payment method</span><select className={inputClass} value={form.payment_method || 'paystack'} onChange={e => set('payment_method', e.target.value)}><option value="paystack">Paystack</option><option value="bank_transfer">Bank transfer</option></select></label>
      <label><span className={labelClass}>Payment reference</span><input className={inputClass} value={form.payment_reference || ''} onChange={e => set('payment_reference', e.target.value)} /></label>
      <label className="sm:col-span-2"><span className={labelClass}>Assigned staff</span><select className={inputClass} value={form.assigned_staff_id || ''} onChange={e => set('assigned_staff_id', e.target.value)}><option value="">Unassigned</option>{staff.map(person => <option key={person.id} value={person.id}>{person.full_name || person.email}</option>)}</select></label>
      <label className="sm:col-span-2"><span className={labelClass}>Special requests</span><textarea className="w-full min-h-20 p-3 bg-background border border-border text-sm text-foreground outline-none focus:border-primary" value={form.special_requests || ''} onChange={e => set('special_requests', e.target.value)} /></label>
    </div>
  );
}