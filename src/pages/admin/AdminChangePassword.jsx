import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import AdminPasswordForm from '@/components/admin/AdminPasswordForm';

export default function AdminChangePassword() {
  const [success, setSuccess] = useState(false);
  return <div className="space-y-6 max-w-md">
    <div>
      <h1 className="font-serif text-3xl mb-1 text-foreground">Change Password</h1>
      <p className="text-xs tracking-widest uppercase text-muted-foreground">Verify your current password first</p>
    </div>
    <div className="border border-border bg-card p-6">
      {success ? <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle className="h-9 w-9 text-primary" />
        <p className="text-sm text-foreground">Password updated successfully. Your new password is ready for your next login.</p>
        <button onClick={() => setSuccess(false)} className="h-9 border border-primary/30 px-6 text-xs uppercase tracking-widest text-primary">Change Again</button>
      </div> : <AdminPasswordForm onSuccess={() => setSuccess(true)} />}
    </div>
  </div>;
}