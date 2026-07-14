import { useState } from 'react';
import { Lock, CheckCircle } from 'lucide-react';

const DEFAULT_CREDS = { username: 'admin', password: 'Frednsidebe@001' };

function getStoredCreds() {
  try {
    const stored = localStorage.getItem('frensic_admin_creds');
    return stored ? JSON.parse(stored) : DEFAULT_CREDS;
  } catch {
    return DEFAULT_CREDS;
  }
}

export default function AdminChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const creds = getStoredCreds();

    if (form.currentPassword !== creds.password) {
      setError('Current password is incorrect.');
      return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (form.newPassword && form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    const updated = {
      username: form.newUsername || creds.username,
      password: form.newPassword || creds.password,
    };
    localStorage.setItem('frensic_admin_creds', JSON.stringify(updated));
    setSuccess(true);
    setForm({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' });
  };

  const GOLD = '#C9A84C';
  const CARD_BG = { backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.07)' };

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="font-serif text-3xl mb-1" style={{ color: '#F9F9F9' }}>Change Credentials</h1>
        <p className="text-xs tracking-widest uppercase" style={{ color: '#888' }}>Update admin username & password</p>
      </div>

      <div className="p-6" style={CARD_BG}>
        {success ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle size={36} style={{ color: GOLD }} />
            <p className="text-sm" style={{ color: '#F9F9F9' }}>Credentials updated successfully.</p>
            <p className="text-xs" style={{ color: '#888' }}>You'll use the new credentials on your next login.</p>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 h-9 text-xs tracking-widest uppercase mt-2"
              style={{ border: `1px solid rgba(201,168,76,0.3)`, color: GOLD }}
            >
              Change Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: 'currentPassword', label: 'Current Password', type: 'password', required: true },
              { field: 'newUsername', label: 'New Username (leave blank to keep)', type: 'text', required: false },
              { field: 'newPassword', label: 'New Password (leave blank to keep)', type: 'password', required: false },
              { field: 'confirmPassword', label: 'Confirm New Password', type: 'password', required: false },
            ].map(({ field, label, type, required }) => (
              <div key={field}>
                <label className="block text-xs tracking-[0.15em] uppercase mb-2" style={{ color: '#888' }}>{label}</label>
                <div className="relative">
                  <Lock size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }} />
                  <input
                    type={type}
                    required={required}
                    value={form[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    className="w-full h-11 pl-9 pr-4 text-sm bg-transparent outline-none"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#F9F9F9' }}
                    onFocus={e => { e.target.style.borderColor = GOLD; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                  />
                </div>
              </div>
            ))}

            {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

            <button
              type="submit"
              className="w-full h-11 text-xs tracking-[0.2em] uppercase font-medium"
              style={{ backgroundColor: GOLD, color: '#050505' }}
            >
              Update Credentials
            </button>
          </form>
        )}
      </div>
    </div>
  );
}