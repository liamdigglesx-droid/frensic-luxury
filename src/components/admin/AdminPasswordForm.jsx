import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { MIN_ADMIN_PASSWORD_LENGTH } from '@/lib/authValidation';

export default function AdminPasswordForm({ onSuccess }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setError('New passwords do not match.');
    if (form.newPassword.length < MIN_ADMIN_PASSWORD_LENGTH) return setError(`New password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`);
    setLoading(true); setError('');
    try {
      const response = await base44.functions.invoke('verifyAdminCredentials', { action: 'changePassword', currentPassword: form.currentPassword, newPassword: form.newPassword });
      sessionStorage.setItem('frensic_admin_token', response.data.sessionToken);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Password could not be updated.');
    } finally { setLoading(false); }
  };
  return <form onSubmit={submit} className="space-y-4">
    {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirmPassword', 'Confirm New Password']].map(([field, label]) => <div key={field}>
      <label htmlFor={`admin-${field}`} className="block text-xs tracking-[0.15em] uppercase mb-2 text-muted-foreground">{label}</label>
      <div className="relative"><Lock className="absolute left-3 top-3.5 h-3 w-3 text-muted-foreground" />
        <input id={`admin-${field}`} type="password" required autoComplete={field === 'currentPassword' ? 'current-password' : 'new-password'} minLength={field === 'currentPassword' ? undefined : MIN_ADMIN_PASSWORD_LENGTH} maxLength={256} aria-describedby={field === 'newPassword' ? 'admin-password-requirement' : undefined} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full h-11 pl-9 pr-4 text-sm bg-transparent border border-input text-foreground" />
      </div>
      {field === 'newPassword' && <p id="admin-password-requirement" className="mt-2 text-xs text-muted-foreground">Use at least {MIN_ADMIN_PASSWORD_LENGTH} characters.</p>}
    </div>)}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <button disabled={loading} className="w-full h-11 bg-primary text-xs tracking-[0.2em] uppercase font-medium text-primary-foreground disabled:opacity-60">
      {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Update Password'}
    </button>
  </form>;
}