import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AdminPasswordForm({ onSuccess }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setError('New passwords do not match.');
    if (form.newPassword.length < 8) return setError('New password must be at least 8 characters.');
    setLoading(true); setError('');
    try {
      const response = await base44.functions.invoke('verifyAdminCredentials', { action: 'changePassword', currentPassword: form.currentPassword, newPassword: form.newPassword });
      sessionStorage.setItem('frensic_admin_token', response.data.sessionToken);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || 'Current password is incorrect.');
    } finally { setLoading(false); }
  };
  return <form onSubmit={submit} className="space-y-4">
    {[['currentPassword', 'Current Password'], ['newPassword', 'New Password'], ['confirmPassword', 'Confirm New Password']].map(([field, label]) => <div key={field}>
      <label className="block text-xs tracking-[0.15em] uppercase mb-2 text-muted-foreground">{label}</label>
      <div className="relative"><Lock className="absolute left-3 top-3.5 h-3 w-3 text-muted-foreground" />
        <input type="password" required value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full h-11 pl-9 pr-4 text-sm bg-transparent border border-input text-foreground" />
      </div>
    </div>)}
    {error && <p className="text-xs text-destructive">{error}</p>}
    <button disabled={loading} className="w-full h-11 bg-primary text-xs tracking-[0.2em] uppercase font-medium text-primary-foreground disabled:opacity-60">
      {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Update Password'}
    </button>
  </form>;
}