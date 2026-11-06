import { useEffect, useState } from 'react';
import { ROOMS, CARS } from '@/lib/constants';
import { base44 } from '@/api/base44Client';
import { isSupabaseConfigured } from '@/lib/supabase';

const normalize = (row, type) => ({
  ...row,
  id: row.slug || row.legacy_id || row.id,
  db_id: row.id,
  price_per_night: type === 'stay' ? Number(row.price_per_night) : undefined,
  price_per_day: type === 'drive' ? Number(row.price_per_day) : undefined,
});

export default function useCatalog() {
  const [rooms, setRooms] = useState(ROOMS);
  const [cars, setCars] = useState(CARS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    Promise.all([
      base44.entities.Room.list('display_order', 500),
      base44.entities.Car.list('display_order', 500),
    ]).then(([roomRows, carRows]) => {
      if (!active) return;
      if (roomRows.length) setRooms(roomRows.map(row => normalize(row, 'stay')));
      if (carRows.length) setCars(carRows.map(row => normalize(row, 'drive')));
      setError('');
    }).catch(() => { if (active) setError('Live catalog is unavailable. Please refresh before booking.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { rooms, cars, loading, error };
}
