import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bell, Building2, Car, MessageSquare, CheckCheck } from 'lucide-react';

const GOLD = '#C9A84C';
const CARD_BG = { backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' };

function buildNotifications(bookings, messages) {
  const notifs = [];

  bookings.forEach(b => {
    if (b.transfer_status === 'receipt_submitted') {
      notifs.push({
        id: `booking-receipt-${b.id}`,
        bookingId: b.id,
        type: 'booking_receipt',
        icon: b.booking_type === 'stay' ? Building2 : Car,
        title: 'Payment Receipt Submitted',
        body: `${b.guest_name || b.guest_email} uploaded a bank transfer receipt for ${b.item_name} — ₦${(b.total_amount || 0).toLocaleString()}`,
        time: b.receipt_submitted_at || b.updated_date,
        color: GOLD,
      });
    } else if (b.payment_status === 'paid') {
      notifs.push({
        id: `booking-paid-${b.id}`,
        bookingId: b.id,
        type: 'booking_paid',
        icon: b.booking_type === 'stay' ? Building2 : Car,
        title: `New ${b.booking_type === 'stay' ? 'Stay' : 'Car Rental'} Booking`,
        body: `${b.guest_name || b.guest_email} booked ${b.item_name} for ₦${(b.total_amount || 0).toLocaleString()}`,
        time: b.created_date,
        color: '#4ade80',
      });
    } else if (b.payment_status === 'pending') {
      notifs.push({
        id: `booking-pending-${b.id}`,
        bookingId: b.id,
        type: 'booking_pending',
        icon: b.booking_type === 'stay' ? Building2 : Car,
        title: 'Pending Booking',
        body: `${b.guest_name || b.guest_email} started a booking for ${b.item_name} — payment pending`,
        time: b.created_date,
        color: '#facc15',
      });
    }
  });

  messages.forEach(m => {
    notifs.push({
      id: `msg-${m.id}`,
      type: 'message',
      icon: MessageSquare,
      title: 'New Contact Message',
      body: `${m.name} (${m.email}) sent a message${m.subject ? ': ' + m.subject : ''}`,
      time: m.created_date,
      color: GOLD,
    });
  });

  return notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
}

export default function AdminNotifications() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [read, setRead] = useState(() => {
    try { return JSON.parse(localStorage.getItem('frensic_read_notifs') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list('-created_date', 200),
      base44.entities.ContactMessage.list('-created_date', 100),
    ]).then(([b, m]) => {
      setBookings(b);
      setMessages(m);
      setLoading(false);
    });
  }, []);

  const allNotifs = buildNotifications(bookings, messages);
  const filtered = filter === 'all' ? allNotifs : allNotifs.filter(n => n.type.startsWith(filter));
  const unreadCount = allNotifs.filter(n => !read.includes(n.id)).length;

  const markAllRead = () => {
    const ids = allNotifs.map(n => n.id);
    setRead(ids);
    localStorage.setItem('frensic_read_notifs', JSON.stringify(ids));
  };

  const openNotification = (notification) => {
    const next = [...new Set([...read, notification.id])];
    setRead(next);
    localStorage.setItem('frensic_read_notifs', JSON.stringify(next));
    if (notification.bookingId) navigate(`/dashboard/admin/bookings?bookingId=${notification.bookingId}`);
    else if (notification.type === 'message') navigate('/dashboard/admin/messages');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl mb-1" style={{ color: '#F9F9F9' }}>Notifications</h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: '#888' }}>
            {unreadCount > 0 ? <span style={{ color: GOLD }}>{unreadCount} unread</span> : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 h-9 text-xs tracking-widest uppercase transition-all"
            style={{ border: `1px solid rgba(201,168,76,0.3)`, color: GOLD }}
          >
            <CheckCheck size={13} /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {[['all', 'All'], ['booking', 'Bookings'], ['message', 'Messages']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-5 py-3 text-xs tracking-[0.15em] uppercase transition-all"
            style={{
              color: filter === key ? '#F9F9F9' : '#666',
              borderBottom: filter === key ? `2px solid ${GOLD}` : '2px solid transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={CARD_BG}>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: GOLD }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bell size={28} style={{ color: '#333' }} />
            <p className="text-sm" style={{ color: '#555' }}>No notifications</p>
          </div>
        ) : (
          filtered.map(n => {
            const Icon = n.icon;
            const isRead = read.includes(n.id);
            return (
              <div
                key={n.id}
                className="flex items-start gap-4 px-5 py-4 cursor-pointer transition-all"
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  backgroundColor: isRead ? 'transparent' : 'rgba(201,168,76,0.03)',
                  borderLeft: isRead ? '3px solid transparent' : `3px solid ${n.color}`,
                }}
                onClick={() => openNotification(n)}
              >
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${n.color}15`, color: n.color }}>
                  <Icon size={15} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium" style={{ color: isRead ? '#888' : '#F9F9F9' }}>{n.title}</div>
                    <div className="text-[10px] flex-shrink-0" style={{ color: '#444' }}>
                      {n.time ? new Date(n.time).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                  <div className="text-xs mt-0.5 leading-relaxed" style={{ color: isRead ? '#555' : '#888' }}>{n.body}</div>
                </div>
                {!isRead && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: n.color }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}