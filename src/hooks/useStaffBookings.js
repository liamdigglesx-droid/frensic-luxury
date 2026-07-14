import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function useStaffBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const records = await base44.entities.Booking.list('-created_date', 500);
    let team = user ? [user] : [];
    if (user?.role === 'admin') team = await base44.entities.User.list();
    setBookings(records);
    setStaff(team);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const updateBooking = async (id, changes) => {
    const updated = await base44.entities.Booking.update(id, changes);
    setBookings(current => current.map(item => item.id === id ? updated : item));
    return updated;
  };

  return { bookings, staff, loading, updateBooking };
}