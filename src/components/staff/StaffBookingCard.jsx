import { Building2, Car, CalendarDays, UserRound, Pencil } from 'lucide-react';
import StatusPill from '@/components/staff/StatusPill';

export default function StaffBookingCard({ booking, onEdit }) {
  const TypeIcon = booking.booking_type === 'stay' ? Building2 : Car;
  return (
    <article className="bg-card border border-border p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="h-10 w-10 flex items-center justify-center bg-primary/10 text-primary"><TypeIcon size={18} /></div>
          <div>
            <h2 className="font-heading text-xl text-foreground">{booking.item_name || 'Unspecified booking'}</h2>
            <p className="text-sm text-muted-foreground">{booking.guest_name || 'Guest'} · {booking.guest_email}</p>
          </div>
        </div>
        <button onClick={() => onEdit(booking)} className="h-10 px-4 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-xs tracking-wider uppercase">
          <Pencil size={13} /> Manage
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-border text-sm">
        <div className="flex gap-2 text-muted-foreground"><CalendarDays size={15} className="text-primary mt-0.5" /><span>{booking.start_date}<br />{booking.end_date}</span></div>
        <div className="flex gap-2 text-muted-foreground"><UserRound size={15} className="text-primary mt-0.5" /><span>{booking.assigned_staff_name || 'Unassigned'}<br />{booking.assigned_staff_email || ''}</span></div>
        <div className="sm:text-right"><div className="font-medium text-foreground">₦{Number(booking.total_amount || 0).toLocaleString()}</div><div className="flex sm:justify-end gap-2 mt-2"><StatusPill value={booking.booking_status} /><StatusPill value={booking.payment_status} /></div></div>
      </div>
    </article>
  );
}