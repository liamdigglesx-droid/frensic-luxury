import { useState } from 'react';
import { X } from 'lucide-react';
import BookingEditFields from '@/components/staff/BookingEditFields';

export default function BookingEditor({ booking, staff, onClose, onSave }) {
  const [form, setForm] = useState(booking);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    const start = new Date(`${form.start_date}T00:00:00`);
    const end = new Date(`${form.end_date}T00:00:00`);
    const duration = Math.round((end - start) / 86400000);
    if (duration < 1) return setError('End date must be after the start date.');
    const assignee = staff.find(person => person.id === form.assigned_staff_id);
    const payload = { ...form, nights_or_days: duration, total_amount: duration * Number(form.unit_price || 0), assigned_staff_name: assignee?.full_name || '', assigned_staff_email: assignee?.email || '' };
    const { id, created_date, updated_date, created_by_id, ...changes } = payload;
    setSaving(true);
    setError('');
    try {
      await onSave(changes);
    } catch (err) {
      setError(err?.message || 'Unable to save this booking.');
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[70] bg-background/90 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <form onSubmit={submit} className="w-full max-w-3xl bg-card border border-border p-5 sm:p-7">
        <div className="flex justify-between items-start mb-6"><div><p className="text-[10px] tracking-[0.25em] uppercase text-primary">Manage reservation</p><h2 className="font-heading text-3xl text-foreground">{booking.item_name}</h2></div><button type="button" onClick={onClose} className="p-2 text-muted-foreground"><X size={20} /></button></div>
        <BookingEditFields form={form} setForm={setForm} staff={staff} />
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={onClose} className="h-11 px-5 border border-border text-xs uppercase tracking-wider text-muted-foreground">Cancel</button><button disabled={saving} className="h-11 px-6 bg-primary text-primary-foreground text-xs uppercase tracking-wider disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button></div>
      </form>
    </div>
  );
}