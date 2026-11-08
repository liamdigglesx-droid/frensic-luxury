import { CalendarDays, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function StaffLayout() {
  const { user, logout } = useAuth();
  if (user && !['admin', 'staff'].includes(user.role)) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"><div className="max-w-md text-center"><h1 className="font-heading text-3xl mb-3">Staff access required</h1><p className="text-sm text-muted-foreground mb-5">Your account does not have permission to manage reservations.</p><button onClick={() => logout()} className="h-11 px-5 bg-primary text-primary-foreground text-xs uppercase tracking-wider">Sign out</button></div></div>;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto h-20 px-5 flex items-center justify-between">
          <Link to="/staff" className="flex items-center gap-3"><CalendarDays className="text-primary" size={22} /><div><div className="font-heading text-xl leading-none">Frensic Staff</div><div className="text-[9px] tracking-[0.25em] uppercase text-primary mt-1">Booking workspace</div></div></Link>
          <div className="flex items-center gap-4"><div className="hidden sm:block text-right"><div className="text-xs">{user?.full_name || 'Staff member'}</div><div className="text-[10px] text-muted-foreground">{user?.email}</div></div><button onClick={() => logout()} className="p-2 text-muted-foreground" aria-label="Log out"><LogOut size={18} /></button></div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-5 py-8"><Outlet /></main>
    </div>
  );
}