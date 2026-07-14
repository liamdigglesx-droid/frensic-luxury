import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Car, Calendar, Clock, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StatusBadge({ status }) {
  const styles = {
    paid: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#22c55e', label: 'Confirmed' },
    pending: { bg: 'rgba(201,168,76,0.1)', border: 'rgba(201,168,76,0.3)', color: '#C9A84C', label: 'Pending' },
    failed: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', label: 'Failed' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      className="text-[10px] tracking-[0.15em] uppercase px-3 py-1"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function BookingCard({ booking }) {
  const [expanded, setExpanded] = useState(false);
  const isStay = booking.booking_type === 'stay';
  const today = new Date();
  const endDate = new Date(booking.end_date);
  const isPast = endDate < today;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden"
      style={{ backgroundColor: '#0a0a0a', border: `1px solid ${isPast ? 'rgba(255,255,255,0.06)' : 'rgba(201,168,76,0.2)'}` }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: isStay ? 'rgba(201,168,76,0.1)' : 'rgba(168,135,58,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              {isStay ? <Building2 size={16} style={{ color: '#C9A84C' }} /> : <Car size={16} style={{ color: '#C9A84C' }} />}
            </div>
            <div>
              <div className="font-serif text-lg" style={{ color: '#F9F9F9' }}>{booking.item_name}</div>
              <div className="text-xs tracking-[0.15em] uppercase mt-0.5" style={{ color: '#aaaaaa' }}>
                {isStay ? 'Apartment Stay' : 'Car Rental'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.payment_status} />
            {isPast ? (
              <span className="text-[10px] tracking-[0.15em] uppercase px-3 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#666' }}>Past</span>
            ) : (
              <span className="text-[10px] tracking-[0.15em] uppercase px-3 py-1" style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', color: '#22c55e' }}>Upcoming</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            { label: isStay ? 'Check-In' : 'Pick-Up', value: booking.start_date },
            { label: isStay ? 'Check-Out' : 'Return', value: booking.end_date },
            { label: 'Duration', value: `${booking.nights_or_days || 1} ${isStay ? 'nights' : 'days'}` },
            { label: 'Total Paid', value: `₦${Number(booking.total_amount).toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] tracking-[0.15em] uppercase mb-1" style={{ color: '#666' }}>{label}</div>
              <div className="text-sm font-medium" style={{ color: '#F9F9F9' }}>{value}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-4 text-xs transition-colors"
          style={{ color: '#aaaaaa' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#888888'; }}
        >
          {expanded ? <><ChevronUp size={12} /> Hide details</> : <><ChevronDown size={12} /> Show details</>}
        </button>
      </div>

      {expanded && (
        <div className="px-6 pb-6 pt-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {[
              { label: 'Guest Name', value: booking.guest_name },
              { label: 'Email', value: booking.guest_email },
              { label: 'Phone', value: booking.guest_phone },
              { label: 'Guests', value: booking.guests_count },
              booking.chauffeur && { label: 'Chauffeur', value: 'Yes' },
              booking.payment_reference && { label: 'Payment Ref', value: booking.payment_reference },
              booking.special_requests && { label: 'Special Requests', value: booking.special_requests },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-xs tracking-widest uppercase" style={{ color: '#666' }}>{label}</span>
                <span className="text-xs text-right max-w-[60%]" style={{ color: '#F9F9F9' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    const stored = localStorage.getItem('frensic_guest_email');
    if (stored) {
      setEmail(stored);
      loadBookings(stored);
    } else {
      setLoading(false);
    }
  }, []);

  const loadBookings = async (guestEmail) => {
    setLoading(true);
    const results = await base44.entities.Booking.filter({ guest_email: guestEmail });
    setBookings(results);
    setLoading(false);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!emailInput) return;
    localStorage.setItem('frensic_guest_email', emailInput);
    setEmail(emailInput);
    loadBookings(emailInput);
  };

  const today = new Date();
  const upcoming = bookings.filter(b => b.payment_status === 'paid' && new Date(b.end_date) >= today);
  const past = bookings.filter(b => b.payment_status === 'paid' && new Date(b.end_date) < today);
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh' }}>
      {/* Hero */}
      <section
        className="relative h-64 flex items-end pb-12"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.3), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full">
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#C9A84C' }}>Home / My Bookings</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>My Bookings</h1>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto">

          {!email ? (
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}>
                <Calendar size={24} style={{ color: '#C9A84C' }} />
              </div>
              <h2 className="font-serif text-2xl mb-3" style={{ color: '#F9F9F9' }}>View Your Bookings</h2>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: '#aaaaaa' }}>
                Enter the email address you used when booking to see all your reservations.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full h-12 px-4 text-sm bg-transparent outline-none"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#C9A84C'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                <button
                  type="submit"
                  className="w-full h-12 text-xs tracking-[0.2em] uppercase font-medium transition-all"
                  style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#a8873a'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C9A84C'; }}
                >
                  Find My Bookings
                </button>
              </form>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={32} className="animate-spin" style={{ color: '#C9A84C' }} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                  <p className="text-xs tracking-[0.15em] uppercase mb-1" style={{ color: '#aaaaaa' }}>Showing bookings for</p>
                  <p className="font-serif text-lg" style={{ color: '#F9F9F9' }}>{email}</p>
                </div>
                <button
                  onClick={() => { localStorage.removeItem('frensic_guest_email'); setEmail(''); setBookings([]); setEmailInput(''); }}
                  className="text-xs tracking-[0.15em] uppercase transition-colors"
                  style={{ color: '#aaaaaa' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#888888'; }}
                >
                  Change Email
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total Bookings', value: bookings.filter(b => b.payment_status === 'paid').length },
                  { label: 'Upcoming', value: upcoming.length },
                  { label: 'Past Stays', value: past.length },
                ].map(({ label, value }) => (
                  <div key={label} className="p-5 text-center" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="font-serif text-3xl mb-1" style={{ color: '#C9A84C' }}>{value}</div>
                    <div className="text-[10px] tracking-[0.15em] uppercase" style={{ color: '#aaaaaa' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="flex mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
                  { key: 'past', label: `Past (${past.length})` },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="px-6 py-3 text-xs tracking-[0.15em] uppercase transition-all"
                    style={{
                      color: tab === key ? '#F9F9F9' : '#888888',
                      borderBottom: tab === key ? '2px solid #C9A84C' : '2px solid transparent',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {displayed.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {tab === 'upcoming' ? <Clock size={20} style={{ color: '#aaaaaa' }} /> : <CheckCircle size={20} style={{ color: '#aaaaaa' }} />}
                  </div>
                  <p className="text-sm" style={{ color: '#aaaaaa' }}>
                    {tab === 'upcoming' ? 'No upcoming bookings.' : 'No past bookings yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayed.map((b, i) => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}