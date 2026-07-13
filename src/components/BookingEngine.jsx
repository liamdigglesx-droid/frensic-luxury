import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users, Car, Building2, ChevronRight } from 'lucide-react';

export default function BookingEngine() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('stay');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = () => {
    const params = new URLSearchParams({
      type: mode,
      start: checkIn,
      end: checkOut,
      guests: guests,
    });
    navigate(`/book?${params.toString()}`);
  };

  const inputStyle = {
    color: '#F9F9F9',
    colorScheme: 'dark',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    width: '100%',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  };

  return (
    <div
      className="w-full max-w-4xl"
      style={{
        backgroundColor: 'rgba(5,5,5,0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Toggle Tabs */}
      <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {[
          { key: 'stay', label: 'Stay', icon: Building2 },
          { key: 'drive', label: 'Drive', icon: Car },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className="flex-1 flex items-center justify-center gap-2 py-4 text-xs tracking-[0.2em] uppercase font-medium transition-all duration-300"
            style={{
              color: mode === key ? '#F9F9F9' : '#888888',
              borderBottom: mode === key ? '2px solid #C9A84C' : '2px solid transparent',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">

        {/* Check-In */}
        <div
          className="p-5 flex flex-col gap-1"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={12} style={{ color: '#C9A84C' }} />
            <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#888888' }}>
              {mode === 'stay' ? 'Check In' : 'Pick Up'}
            </span>
          </div>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={e => {
              setCheckIn(e.target.value);
              if (checkOut && e.target.value >= checkOut) setCheckOut('');
            }}
            style={inputStyle}
          />
        </div>

        {/* Check-Out */}
        <div
          className="p-5 flex flex-col gap-1"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={12} style={{ color: '#C9A84C' }} />
            <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#888888' }}>
              {mode === 'stay' ? 'Check Out' : 'Return'}
            </span>
          </div>
          <input
            type="date"
            min={checkIn ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })() : today}
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Guests */}
        <div
          className="p-5 flex flex-col gap-1"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users size={12} style={{ color: '#C9A84C' }} />
            <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#888888' }}>
              {mode === 'stay' ? 'Guests' : 'Passengers'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-6 h-6 flex items-center justify-center text-base leading-none"
              style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              −
            </button>
            <span className="text-sm font-medium" style={{ color: '#F9F9F9' }}>{guests}</span>
            <button
              onClick={() => setGuests(Math.min(10, guests + 1))}
              className="w-6 h-6 flex items-center justify-center text-base leading-none"
              style={{ color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
            >
              +
            </button>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleSearch}
          className="flex items-center justify-center gap-2 p-5 text-xs tracking-[0.15em] uppercase font-semibold transition-all duration-200 group"
          style={{ backgroundColor: '#C9A84C', color: '#050505' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a8873a'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
        >
          Check Availability
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}