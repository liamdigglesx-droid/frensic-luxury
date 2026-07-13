import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Fetches active paid bookings for a given item and shows Available / Booked Today badge.
 * "Booked" = there is a paid booking whose date range covers today.
 */
export function useAvailability(itemId, bookingType) {
  const [status, setStatus] = useState(null); // null = loading, 'available', 'booked'

  useEffect(() => {
    if (!itemId) return;
    const today = new Date().toISOString().split('T')[0];
    base44.entities.Booking.filter({
      item_id: itemId,
      booking_type: bookingType,
      payment_status: 'paid',
    }).then(bookings => {
      const isBooked = bookings.some(b => b.start_date <= today && b.end_date > today);
      setStatus(isBooked ? 'booked' : 'available');
    }).catch(() => setStatus('available'));
  }, [itemId, bookingType]);

  return status;
}

export default function AvailabilityBadge({ itemId, bookingType }) {
  const status = useAvailability(itemId, bookingType);

  if (!status) return null;

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-medium"
      style={{
        backgroundColor: status === 'available' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
        border: `1px solid ${status === 'available' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
        color: status === 'available' ? '#4ade80' : '#f87171',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: status === 'available' ? '#4ade80' : '#f87171' }}
      />
      {status === 'available' ? 'Available' : 'Booked'}
    </div>
  );
}