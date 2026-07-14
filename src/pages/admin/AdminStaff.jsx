import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { UserPlus, Mail, Shield, User } from 'lucide-react';

const GOLD = '#C9A84C';
const CARD_BG = { backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' };

export default function AdminStaff() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.User.list().then(u => {
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    setError('');
    setSuccess('');
    try {
      await base44.users.inviteUser(email, role);
      setSuccess(`Invitation sent to ${email}`);
      setEmail('');
      // Refresh users
      base44.entities.User.list().then(setUsers);
    } catch (err) {
      setError(err?.message || 'Failed to send invite.');
    }
    setInviting(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl mb-1" style={{ color: '#F9F9F9' }}>Staff & Access</h1>
        <p className="text-xs tracking-widest uppercase" style={{ color: '#888' }}>Manage team members</p>
      </div>

      {/* Invite Form */}
      <div className="p-6 max-w-lg" style={CARD_BG}>
        <div className="flex items-center gap-3 mb-5">
          <UserPlus size={16} style={{ color: GOLD }} />
          <div className="font-serif text-lg" style={{ color: '#F9F9F9' }}>Invite Staff Member</div>
        </div>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888' }}>Email Address</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#666' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className="w-full h-11 pl-9 pr-4 text-sm bg-transparent outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888' }}>Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full h-11 px-4 text-sm outline-none"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9', backgroundColor: '#0a0a0a' }}
            >
              <option value="user">Staff (View Only)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>
          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
          {success && <p className="text-xs" style={{ color: '#4ade80' }}>{success}</p>}
          <button
            type="submit"
            disabled={inviting}
            className="flex items-center gap-2 px-6 h-10 text-xs tracking-[0.15em] uppercase font-medium transition-all"
            style={{ backgroundColor: inviting ? '#555' : GOLD, color: '#050505' }}
          >
            <UserPlus size={13} />
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div style={CARD_BG}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="font-serif text-lg" style={{ color: '#F9F9F9' }}>Team Members</div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: GOLD }} />
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 flex items-center justify-center font-serif flex-shrink-0" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: GOLD }}>
                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm" style={{ color: '#F9F9F9' }}>{u.full_name || '—'}</div>
                  <div className="text-xs" style={{ color: '#666' }}>{u.email}</div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] tracking-widest uppercase" style={{
                  backgroundColor: u.role === 'admin' ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.05)',
                  color: u.role === 'admin' ? GOLD : '#888',
                }}>
                  {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                  {u.role}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}