import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, MessageSquare, Bell, Users,
  Menu, X, ChevronRight, Building2, KeyRound, LogOut
} from 'lucide-react';

const navItems = [
  { path: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/dashboard/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { path: '/dashboard/admin/messages', label: 'Messages', icon: MessageSquare },
  { path: '/dashboard/admin/notifications', label: 'Notifications', icon: Bell },
  { path: '/dashboard/admin/staff', label: 'Staff', icon: Users },
  { path: '/dashboard/admin/change-password', label: 'Change Password', icon: KeyRound },
];

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const signOut = () => {
    sessionStorage.removeItem('frensic_admin_token');
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#050505' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#080808', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <Building2 size={20} style={{ color: '#C9A84C' }} />
            <div>
              <div className="font-serif text-base" style={{ color: '#F9F9F9' }}>Frensic</div>
              <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#C9A84C' }}>Admin Panel</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden" style={{ color: '#888' }}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-all group"
              style={{
                backgroundColor: isActive({ path, exact: path === '/dashboard/admin' }) ? 'rgba(201,168,76,0.1)' : 'transparent',
                color: isActive({ path, exact: path === '/dashboard/admin' }) ? '#C9A84C' : '#888888',
                borderLeft: isActive({ path, exact: path === '/dashboard/admin' }) ? '2px solid #C9A84C' : '2px solid transparent',
              }}
            >
              <Icon size={16} />
              <span className="tracking-wide">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button onClick={signOut} className="flex w-full items-center gap-3 px-4 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <LogOut size={16} />
            <span className="tracking-wide">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-16" style={{ backgroundColor: '#080808', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => setSidebarOpen(true)} className="md:hidden" style={{ color: '#888' }}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#888' }}>
            <span>Admin</span>
            <ChevronRight size={12} />
            <span style={{ color: '#F9F9F9' }}>
              {navItems.find(n => isActive(n))?.label || 'Dashboard'}
            </span>
          </div>
          <div className="text-xs tracking-wider" style={{ color: '#C9A84C' }}>frensicluxuryapartment@gmail.com</div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}