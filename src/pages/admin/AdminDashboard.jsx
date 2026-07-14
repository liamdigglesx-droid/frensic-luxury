import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  CalendarCheck, MessageSquare, TrendingUp, DollarSign,
  Car, Building2, Clock, ChevronRight
} from 'lucide-react';

const GOLD = '#C9A84C';
const CARD_BG = { backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' };

function StatCard({ icon: Icon, label, value, sub, color = GOLD }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="p-6 flex items-start gap-4"
      style={CARD_BG}
    >
      <div className="w-11 h-11 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.25)`, color }}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#888' }}>{label}</div>
        <div className="font-serif text-3xl" style={{ color: '#F9F9F9' }}>{value}</div>
        {sub && <div className="text-xs mt-1" style={{ color: '#666' }}>{sub}</div>}
      </div>
    </motion.div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Booking.list('-created_date', 500),
      base44.entities.ContactMessage.list('-created_date', 100),
    ]).then(([b, m]) => {
      setBookings(b);
      setMessages(m);
      setLoading(false);
    });
  }, []);

  const paid = bookings.filter(b => b.payment_status === 'paid');
  const pending = bookings.filter(b => b.payment_status === 'pending');
  const totalRevenue = paid.reduce((s, b) => s + (b.total_amount || 0), 0);
  const stays = paid.filter(b => b.booking_type === 'stay');
  const drives = paid.filter(b => b.booking_type === 'drive');

  // Monthly revenue chart data
  const monthlyData = MONTHS.map((month, i) => {
    const monthBookings = paid.filter(b => {
      const d = new Date(b.created_date);
      return d.getMonth() === i && d.getFullYear() === new Date().getFullYear();
    });
    return {
      month,
      revenue: monthBookings.reduce((s, b) => s + (b.total_amount || 0), 0),
      bookings: monthBookings.length,
    };
  });

  // Projection: avg last 3 months × remaining months
  const currentMonth = new Date().getMonth();
  const pastMonths = monthlyData.slice(Math.max(0, currentMonth - 2), currentMonth + 1);
  const avgRevenue = pastMonths.length ? pastMonths.reduce((s, m) => s + m.revenue, 0) / pastMonths.length : 0;
  const projectionData = monthlyData.map((m, i) => ({
    ...m,
    projected: i > currentMonth ? Math.round(avgRevenue * (1 + (i - currentMonth) * 0.05)) : null,
  }));

  // Pie
  const pieData = [
    { name: 'Stays', value: stays.length },
    { name: 'Car Rentals', value: drives.length },
  ];

  const recent = bookings.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: GOLD }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl mb-1" style={{ color: '#F9F9F9' }}>Dashboard</h1>
        <p className="text-xs tracking-widest uppercase" style={{ color: '#888' }}>Overview & Analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₦${(totalRevenue / 1000).toFixed(0)}k`} sub={`${paid.length} paid bookings`} />
        <StatCard icon={CalendarCheck} label="Total Bookings" value={bookings.length} sub={`${pending.length} pending`} />
        <StatCard icon={Building2} label="Apartment Stays" value={stays.length} sub="confirmed stays" />
        <StatCard icon={Car} label="Car Rentals" value={drives.length} sub="confirmed rentals" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue + Projection */}
        <div className="lg:col-span-2 p-6" style={CARD_BG}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#888' }}>Revenue & Projection</div>
              <div className="font-serif text-xl" style={{ color: '#F9F9F9' }}>{new Date().getFullYear()}</div>
            </div>
            <TrendingUp size={18} style={{ color: GOLD }} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, color: '#F9F9F9', fontSize: 12 }}
                formatter={v => [`₦${v.toLocaleString()}`, '']}
              />
              <Line type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="projected" stroke="rgba(201,168,76,0.35)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projected" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="p-6" style={CARD_BG}>
          <div className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#888' }}>Booking Split</div>
          <div className="font-serif text-xl mb-4" style={{ color: '#F9F9F9' }}>By Type</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                <Cell fill={GOLD} />
                <Cell fill="rgba(201,168,76,0.35)" />
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, color: '#F9F9F9', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Bookings Bar */}
      <div className="p-6" style={CARD_BG}>
        <div className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#888' }}>Monthly Bookings</div>
        <div className="font-serif text-xl mb-6" style={{ color: '#F9F9F9' }}>Volume by Month</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, color: '#F9F9F9', fontSize: 12 }} />
            <Bar dataKey="bookings" fill={GOLD} radius={[2, 2, 0, 0]} name="Bookings" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Bookings */}
      <div className="p-6" style={CARD_BG}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#888' }}>Latest Activity</div>
            <div className="font-serif text-xl" style={{ color: '#F9F9F9' }}>Recent Bookings</div>
          </div>
          <Link to="/admin/bookings" className="flex items-center gap-1 text-xs tracking-widest uppercase transition-all" style={{ color: GOLD }}>
            View All <ChevronRight size={12} />
          </Link>
        </div>
        <div className="space-y-0">
          {recent.length === 0 && <p className="text-sm" style={{ color: '#666' }}>No bookings yet.</p>}
          {recent.map((b, i) => (
            <div key={b.id} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.08)', color: GOLD }}>
                  {b.booking_type === 'stay' ? <Building2 size={14} /> : <Car size={14} />}
                </div>
                <div>
                  <div className="text-sm" style={{ color: '#F9F9F9' }}>{b.guest_name || b.guest_email}</div>
                  <div className="text-xs" style={{ color: '#666' }}>{b.item_name} · {b.start_date} → {b.end_date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium" style={{ color: '#F9F9F9' }}>₦{(b.total_amount || 0).toLocaleString()}</div>
                <span className="text-[10px] px-2 py-0.5 tracking-widest uppercase" style={{
                  backgroundColor: b.payment_status === 'paid' ? 'rgba(34,197,94,0.1)' : b.payment_status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                  color: b.payment_status === 'paid' ? '#4ade80' : b.payment_status === 'pending' ? '#facc15' : '#f87171',
                }}>
                  {b.payment_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Preview */}
      <div className="p-6" style={CARD_BG}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#888' }}>Inbox</div>
            <div className="font-serif text-xl" style={{ color: '#F9F9F9' }}>Recent Messages</div>
          </div>
          <Link to="/admin/messages" className="flex items-center gap-1 text-xs tracking-widest uppercase" style={{ color: GOLD }}>
            View All <ChevronRight size={12} />
          </Link>
        </div>
        {messages.slice(0, 3).map(m => (
          <div key={m.id} className="py-3 flex items-start gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-serif text-sm" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: GOLD }}>
              {(m.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-sm" style={{ color: '#F9F9F9' }}>{m.name} <span style={{ color: '#555' }}>·</span> <span style={{ color: '#666', fontSize: 11 }}>{m.email}</span></div>
              <div className="text-xs mt-0.5 line-clamp-1" style={{ color: '#888' }}>{m.subject || m.message}</div>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm" style={{ color: '#666' }}>No messages yet.</p>}
      </div>
    </div>
  );
}