import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Lock, User } from 'lucide-react';

// Default credentials (always work on any domain)
const DEFAULT_CREDS = { username: 'admin', password: 'Frednsidebe@001' };

function getStoredCreds() {
  try {
    const stored = localStorage.getItem('frensic_admin_creds');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use stored creds if both fields are non-empty
      if (parsed.username && parsed.password) return parsed;
    }
  } catch {}
  return DEFAULT_CREDS;
}

export function checkAdminAuth() {
  return localStorage.getItem('frensic_admin_session') === 'authenticated';
}

export function adminLogout() {
  localStorage.removeItem('frensic_admin_session');
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const creds = getStoredCreds();
      if (username === creds.username && password === creds.password) {
        localStorage.setItem('frensic_admin_session', 'authenticated');
        navigate('/dashboard/admin');
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#050505' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Building2 size={24} style={{ color: '#C9A84C' }} />
            <span className="font-serif text-2xl" style={{ color: '#F9F9F9' }}>Frensic Luxury</span>
          </div>
          <div className="text-[10px] tracking-[0.35em] uppercase" style={{ color: '#C9A84C' }}>Admin Panel</div>
        </div>

        <form
          onSubmit={handleLogin}
          className="p-8 space-y-5"
          style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888' }}>Username</label>
            <div className="relative">
              <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }} />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full h-11 pl-9 pr-4 text-sm bg-transparent outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888' }}>Password</label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }} />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full h-11 pl-9 pr-10 text-sm bg-transparent outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#555' }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-xs tracking-[0.2em] uppercase font-medium transition-all"
            style={{ backgroundColor: loading ? '#666' : '#C9A84C', color: '#050505' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}