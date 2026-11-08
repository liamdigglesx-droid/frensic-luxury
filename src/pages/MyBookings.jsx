import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { isEmailOtp, normalizeEmailOtp, MAX_EMAIL_OTP_LENGTH } from '@/lib/authValidation';

function BookingCard({ booking }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="font-serif text-xl" style={{ color: '#F9F9F9' }}>{booking.item_name}</div>
          <div className="text-xs tracking-widest uppercase mt-1" style={{ color: '#C9A84C' }}>{booking.booking_type === 'stay' ? 'Apartment Stay' : 'Car Rental'}</div>
        </div>
        <span className="px-3 py-1 text-[10px] tracking-widest uppercase" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>{booking.booking_status || 'confirmed'}</span>
      </div>
      <div className="space-y-3">
        {[
          ['Dates', `${booking.start_date} → ${booking.end_date}`],
          ['Guest', booking.guest_name],
          ['Total', `₦${Number(booking.total_amount || 0).toLocaleString()}`],
          ['Reference', booking.payment_reference || 'Bank transfer'],
        ].filter(([, value]) => value).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-xs tracking-widest uppercase" style={{ color: '#666' }}>{label}</span>
            <span className="text-xs text-right max-w-[60%]" style={{ color: '#F9F9F9' }}>{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function MyBookings() {
  const { user, logout } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const [error, setError] = useState('');
  const verifiedEmail = user?.email || '';

  useEffect(() => {
    if (!verifiedEmail) { setBookings([]); return; }
    let active = true;
    setLoading(true); setError('');
    base44.entities.Booking.filter({ guest_email: verifiedEmail })
      .then(rows => { if (active) setBookings(rows); })
      .catch(err => { if (active) { setBookings([]); setError(err.message || 'Bookings could not be loaded.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [verifiedEmail]);

  const lookupEmail = email.trim().toLowerCase();
  const validCode = isEmailOtp(code);

  const sendCode = async event => {
    event.preventDefault();
    if (!isSupabaseConfigured) return setError('Booking lookup is not configured. Please contact support.');
    setSending(true); setError('');
    try {
      const { error: authError } = await supabase.auth.signInWithOtp({ email: lookupEmail, options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/my-bookings` } });
      if (authError) throw authError;
      setCodeSent(true);
    } catch (err) { setError(err.message || 'Verification code could not be sent.'); }
    finally { setSending(false); }
  };

  const verifyCode = async event => {
    event.preventDefault();
    if (!validCode) return setError('Enter the complete numeric code from your email.');
    setSending(true); setError('');
    try {
      const { error: authError } = await supabase.auth.verifyOtp({ email: lookupEmail, token: code, type: 'email' });
      if (authError) throw authError;
    } catch (err) { setError(err.message || 'Invalid or expired verification code.'); }
    finally { setSending(false); }
  };

  const today = new Date();
  const paid = bookings.filter(b => b.payment_status === 'paid');
  const upcoming = paid.filter(b => new Date(b.end_date) >= today);
  const past = paid.filter(b => new Date(b.end_date) < today);
  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div style={{ backgroundColor: '#050505', minHeight: '100vh' }}>
      <section className="relative h-64 flex items-end pb-12" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,5,5,0.3), rgba(5,5,5,0.85))' }} />
        <div className="relative z-10 px-6 lg:px-16 w-full">
          <div className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: '#C9A84C' }}>Home / My Bookings</div>
          <h1 className="font-serif font-light text-5xl" style={{ color: '#F9F9F9' }}>My Bookings</h1>
        </div>
      </section>
      <section className="py-16 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto">
          {!verifiedEmail ? (
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}><ShieldCheck size={24} style={{ color: '#C9A84C' }} /></div>
              <h2 className="font-serif text-2xl mb-3" style={{ color: '#F9F9F9' }}>Verify Your Email</h2>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: '#aaaaaa' }}>We’ll send a one-time code to the email used for your booking. This keeps your reservation details private.</p>
              {!codeSent ? (
                <form onSubmit={sendCode} className="space-y-4">
                  <input type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-12 px-4 text-sm bg-transparent outline-none" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }} />
                  <button disabled={sending} className="w-full h-12 text-xs tracking-[0.2em] uppercase font-medium disabled:opacity-50" style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}>{sending ? 'Sending…' : 'Send Verification Code'}</button>
                </form>
              ) : (
                <form onSubmit={verifyCode} className="space-y-4">
                  <p className="text-sm flex items-center justify-center gap-2" style={{ color: '#aaaaaa' }}><Mail size={14} /> Code sent to {lookupEmail}</p>
                  <input aria-label="Email verification code" inputMode="numeric" autoComplete="one-time-code" required maxLength={MAX_EMAIL_OTP_LENGTH * 3} pattern="[0-9]{6,10}" placeholder="Enter email code" value={code} onChange={e => setCode(normalizeEmailOtp(e.target.value))} className="w-full h-12 px-4 text-center tracking-[0.2em] text-sm bg-transparent outline-none" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }} />
                  <p className="text-xs leading-relaxed" style={{ color: '#aaaaaa' }}>Enter the complete code from your email, including any leading zeros.</p>
                  <button disabled={sending || !validCode} className="w-full h-12 text-xs tracking-[0.2em] uppercase font-medium disabled:opacity-50" style={{ backgroundColor: '#C9A84C', color: '#F9F9F9' }}>{sending ? 'Verifying…' : 'View My Bookings'}</button>
                  <button type="button" onClick={() => { setCodeSent(false); setCode(''); }} className="text-xs uppercase tracking-widest" style={{ color: '#aaaaaa' }}>Use a different email</button>
                </form>
              )}
              {error && <p role="alert" className="text-sm mt-5 text-destructive">{error}</p>}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin" style={{ color: '#C9A84C' }} /></div>
          ) : (
            <>
              {error && <p role="alert" className="text-sm mb-6 text-destructive">{error}</p>}
              <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div><p className="text-xs tracking-[0.15em] uppercase mb-1" style={{ color: '#aaaaaa' }}>Verified bookings for</p><p className="font-serif text-lg" style={{ color: '#F9F9F9' }}>{verifiedEmail}</p></div>
                <button onClick={() => logout(false)} className="text-xs tracking-[0.2em] uppercase" style={{ color: '#aaaaaa' }}>Change Email</button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[{ label: 'Total Bookings', value: paid.length }, { label: 'Upcoming', value: upcoming.length }, { label: 'Past', value: past.length }].map(({ label, value }) => (
                  <div key={label} className="p-5 text-center" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}><div className="font-serif text-3xl mb-2" style={{ color: '#C9A84C' }}>{value}</div><div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#aaaaaa' }}>{label}</div></div>
                ))}
              </div>
              <div className="flex mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {[{ key: 'upcoming', label: `Upcoming (${upcoming.length})` }, { key: 'past', label: `Past (${past.length})` }].map(({ key, label }) => (
                  <button key={key} onClick={() => setTab(key)} className="px-6 py-3 text-xs tracking-[0.15em] uppercase" style={{ color: tab === key ? '#F9F9F9' : '#888888', borderBottom: tab === key ? '2px solid #C9A84C' : '2px solid transparent' }}>{label}</button>
                ))}
              </div>
              {displayed.length === 0 ? (
                <div className="text-center py-20"><div className="w-12 h-12 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}>{tab === 'upcoming' ? <Clock size={20} style={{ color: '#C9A84C' }} /> : <CheckCircle size={20} style={{ color: '#C9A84C' }} />}</div><p className="text-sm" style={{ color: '#aaaaaa' }}>{tab === 'upcoming' ? 'No upcoming bookings.' : 'No past bookings yet.'}</p></div>
              ) : <div className="space-y-4">{displayed.map(booking => <BookingCard key={booking.id} booking={booking} />)}</div>}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
