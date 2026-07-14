import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import useStaffBookings from '@/hooks/useStaffBookings';
import StaffBookingCard from '@/components/staff/StaffBookingCard';
import BookingEditor from '@/components/staff/BookingEditor';

export default function StaffBookings() {
  const { bookings, staff, loading, updateBooking } = useStaffBookings();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const visible = useMemo(() => bookings.filter(item => !search || [item.guest_name, item.guest_email, item.item_name].some(value => (value || '').toLowerCase().includes(search.toLowerCase()))), [bookings, search]);
  const save = async (changes) => { await updateBooking(selected.id, changes); setSelected(null); };
  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-7">
        <div><p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-2">Reservations</p><h1 className="font-heading text-4xl">Booking Management</h1><p className="text-sm text-muted-foreground mt-1">Update guests, schedules, payments, and assignments.</p></div>
        <label className="relative w-full sm:w-72"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookings" className="w-full h-11 pl-9 pr-3 bg-card border border-border text-sm outline-none focus:border-primary" /></label>
      </div>
      {loading ? <div className="py-20 text-center text-sm text-muted-foreground">Loading bookings...</div> : visible.length ? <div className="space-y-4">{visible.map(booking => <StaffBookingCard key={booking.id} booking={booking} onEdit={setSelected} />)}</div> : <div className="py-20 border border-border text-center text-sm text-muted-foreground">No bookings found.</div>}
      {selected && <BookingEditor booking={selected} staff={staff} onClose={() => setSelected(null)} onSave={save} />}
    </>
  );
}