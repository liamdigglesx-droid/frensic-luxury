import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';

// Page imports
import Home from './pages/Home';
import About from './pages/About';
import Rooms from './pages/Rooms';
import Cars from './pages/Cars';
import Book from './pages/Book';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import MyBookings from './pages/MyBookings';
import AdminLayout from './components/AdminLayout';
import AdminAccessRoute from './components/AdminAccessRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminMessages from './pages/admin/AdminMessages';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminStaff from './pages/admin/AdminStaff';
import AdminChangePassword from './pages/admin/AdminChangePassword';
import ProtectedRoute from './components/ProtectedRoute';
import StaffLayout from './components/staff/StaffLayout';
import StaffBookings from './pages/staff/StaffBookings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings, authError } = useAuth();
  const isAdminRoute = window.location.pathname.startsWith('/dashboard/admin');

  if (!isAdminRoute && isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
        <div className="w-8 h-8 border-2 border-slate-800 rounded-full animate-spin" style={{ borderTopColor: '#C9A84C' }}></div>
      </div>
    );
  }

  if (!isAdminRoute && authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/book" element={<Book />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/my-bookings" element={<MyBookings />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?next=/staff" replace />} />}>
        <Route element={<StaffLayout />}>
          <Route path="/staff" element={<StaffBookings />} />
        </Route>
      </Route>
      <Route element={<AdminAccessRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/admin/bookings" element={<AdminBookings />} />
          <Route path="/dashboard/admin/messages" element={<AdminMessages />} />
          <Route path="/dashboard/admin/notifications" element={<AdminNotifications />} />
          <Route path="/dashboard/admin/staff" element={<AdminStaff />} />
          <Route path="/dashboard/admin/change-password" element={<AdminChangePassword />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;