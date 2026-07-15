import { useState } from 'react';
import { Loader2, LockKeyhole } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AdminLoginForm({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await base44.functions.invoke('verifyAdminCredentials', { username, password });
      if (!response.data?.authorized) throw new Error('Invalid username or password.');
      sessionStorage.setItem('frensic_admin_access', 'granted');
      onSuccess();
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="min-h-screen flex items-center justify-center bg-background px-6">
    <form onSubmit={submit} className="w-full max-w-sm border border-border bg-card p-8">
      <LockKeyhole className="mb-5 h-9 w-9 text-primary" />
      <h1 className="font-heading text-3xl text-foreground">Admin Access</h1>
      <p className="mb-6 mt-2 text-sm text-muted-foreground">Enter your administrator credentials.</p>
      <input aria-label="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="mb-4 h-12 w-full border border-input bg-background px-4 text-foreground" required />
      <input aria-label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="h-12 w-full border border-input bg-background px-4 text-foreground" required />
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <button disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center bg-primary font-medium text-primary-foreground disabled:opacity-60">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
      </button>
    </form>
  </div>;
}