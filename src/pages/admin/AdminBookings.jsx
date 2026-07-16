import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Building2, Car, Search, Filter, Download, CheckCircle2, Loader2 } from 'lucide-react';
import BookingsExcelExport from '@/components/admin/BookingsExcelExport';

const GOLD = '#C9A84C';
const CARD_BG = { backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' };

function StatusBadge({ status }) {
  const styles = {
    paid: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80' },
    pending: { bg: 'rgba(234,179,8,0.1)', color: '#facc15' },
    failed: { bg: 'rgba(239,68,68,0.1)', color: '#f87171' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className="text-[10px] px-2 py-0.5 tracking-widest uppercase" style={{ backgroundColor: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

function BookingStatusBadge({ status }) {
  const styles = {
    confirmed: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80' },
    checked_in: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa' },
    completed: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
    cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#f87171' },
    pending: { bg: 'rgba(234,179,8,0.1)', color: '#facc15' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className="text-[10px] px-2 py-0.5 tracking-widest uppercase" style={{ backgroundColor: s.bg, color: s.color }}>
      {(status || 'pending').replaceAll('_', ' ')}
    </span>
  );
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expanded, setExpanded] = useState(() => new URLSearchParams(window.location.search).get('bookingId'));
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    base44.entities.Booking.list('-created_date', 500).then(setBookings).catch(() => setBookings([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && expanded) {
      requestAnimationFrame(() => document.getElementById(`booking-${expanded}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  }, [loading, expanded]);

  const handleConfirmBooking = async (bookingId) => {
    setConfirmingId(bookingId);
    try {
      await base44.entities.Booking.update(bookingId, {
        payment_status: 'paid',
        booking_status: 'confirmed',
      });
      setBookings(prev =>
        prev.map(b =>
          b.id === bookingId ? { ...b, payment_status: 'paid', booking_status: 'confirmed' } : b
        )
      );
    } catch (err) {
      console.error('Failed to confirm booking:', err);
      alert('Could not confirm the booking. Please try again.');
    } finally {
      setConfirmingId(null);
    }
  };

  const filtered = bookings.filter(b => {
    const matchSearch = !search ||
      (b.guest_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.guest_email || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.item_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.start_date || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.end_date || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || b.booking_type === filterType;
    const matchStatus = filterStatus === 'all' || b.payment_status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const totalFiltered = filtered.reduce((s, b) => s + (b.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl mb-1" style={{ color: '#F9F9F9' }}>Bookings</h1>
        <p className="text-xs tracking-widest uppercase" style={{ color: '#888' }}>All reservations</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#666' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, room, car, or date..."
            className="w-full h-10 pl-9 pr-4 text-sm bg-transparent outline-none"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="h-10 px-4 text-sm outline-none"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9', backgroundColor: '#0a0a0a' }}
        >
          <option value="all">All Types</option>
          <option value="stay">Stays</option>
          <option value="drive">Car Rentals</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-10 px-4 text-sm outline-none"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9', backgroundColor: '#0a0a0a' }}
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <div className="text-xs tracking-wide" style={{ color: '#888' }}>
          {filtered.length} results · <span style={{ color: GOLD }}>₦{totalFiltered.toLocaleString()}</span>
        </div>
        <BookingsExcelExport bookings={filtered} />
      </div>

      {/* Table */}
      <div style={CARD_BG}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: GOLD }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm" style={{ color: '#666' }}>No bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Type', 'Guest', 'Item', 'Dates', 'Amount', 'Payment', 'Booking', 'Ref', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] tracking-[0.2em] uppercase" style={{ color: '#666' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const isConfirmed = b.payment_status === 'paid' && b.booking_status === 'confirmed';
                  const isCancelled = b.booking_status === 'cancelled';
                  const isConfirming = confirmingId === b.id;

                  return (
                    <>
                      <tr
                        key={b.id}
                        id={`booking-${b.id}`}
                        className="cursor-pointer transition-all"
                        onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {b.booking_type === 'stay'
                              ? <Building2 size={13} style={{ color: GOLD }} />
                              : <Car size={13} style={{ color: GOLD }} />}
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: '#888' }}>{b.booking_type}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div style={{ color: '#F9F9F9' }}>{b.guest_name || '—'}</div>
                          <div className="text-xs" style={{ color: '#666' }}>{b.guest_email}</div>
                        </td>
                        <td className="px-5 py-3" style={{ color: '#aaa' }}>{b.item_name || '—'}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#888' }}>{b.start_date} → {b.end_date}</td>
                        <td className="px-5 py-3 font-medium" style={{ color: '#F9F9F9' }}>₦{(b.total_amount || 0).toLocaleString()}</td>
                        <td className="px-5 py-3"><StatusBadge status={b.payment_status} /></td>
                        <td className="px-5 py-3"><BookingStatusBadge status={b.booking_status} /></td>
                        <td className="px-5 py-3 text-xs font-mono" style={{ color: '#555' }}>{b.payment_reference ? b.payment_reference.slice(-10) : '—'}</td>
                        <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase" style={{ color: '#4ade80' }}>
                              <CheckCircle2 size={13} /> Confirmed
                            </span>
                          ) : isCancelled ? (
                            <span className="text-[10px] tracking-widest uppercase" style={{ color: '#666' }}>—</span>
                          ) : (
                            <button
                              onClick={() => handleConfirmBooking(b.id)}
                              disabled={isConfirming}
                              className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 font-semibold transition-all disabled:opacity-60"
                              style={{ backgroundColor: GOLD, color: '#050505' }}
                              onMouseEnter={e => { if (!isConfirming) e.currentTarget.style.backgroundColor = '#a8873a'; }}
                              onMouseLeave={e => { if (!isConfirming) e.currentTarget.style.backgroundColor = GOLD; }}
                            >
                              {isConfirming ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" /> Confirming…
                                </>
                              ) : (
                                'Confirm Booking'
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded === b.id && (
                        <tr key={`${b.id}-exp`}>
                          <td colSpan={9} className="px-5 py-4" style={{ backgroundColor: '#0d0d0d' }}>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              {[
                                ['Phone', b.guest_phone],
                                ['Guests', b.guests_count],
                                ['Duration', `${b.nights_or_days} ${b.booking_type === 'stay' ? 'nights' : 'days'}`],
                                ['Chauffeur', b.chauffeur ? 'Yes' : 'No'],
                                ['Unit Price', `₦${(b.unit_price || 0).toLocaleString()}`],
                                ['Full Ref', b.payment_reference || '—'],
                                ['Payment Method', b.payment_method === 'bank_transfer' ? 'Bank Transfer' : b.payment_method === 'paystack' ? 'Paystack' : '—'],
                                ['Transfer Status', b.transfer_status ? b.transfer_status.replaceAll('_', ' ') : '—'],
                                ['Special Requests', b.special_requests || 'None'],
                                ['Booked On', b.created_date ? new Date(b.created_date).toLocaleDateString() : '—'],
                              ].map(([label, val]) => (
                                <div key={label}>
                                  <div className="tracking-widest uppercase mb-1" style={{ color: '#555' }}>{label}</div>
                                  <div style={{ color: '#aaa' }}>{val}</div>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                              {b.payment_receipt_url && (
                                <a href={b.payment_receipt_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: GOLD }}>
                                  <Download size={13} /> View Payment Receipt
                                </a>
                              )}
                              {!isConfirmed && !isCancelled && (
                                <button
                                  onClick={() => handleConfirmBooking(b.id)}
                                  disabled={isConfirming}
                                  className="inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase px-3 py-1.5 font-semibold transition-all disabled:opacity-60"
                                  style={{ backgroundColor: GOLD, color: '#050505' }}
                                >
                                  {isConfirming ? 'Confirming…' : 'Confirm Booking'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
