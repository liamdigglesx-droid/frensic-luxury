import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';

// Route-level code splitting keeps the initial bundle small.
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Rooms = lazy(() => import('./pages/Rooms'));
const Cars = lazy(() => import('./pages/Cars'));
const Book = lazy(() => import('./pages/Book'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminAccessRoute = lazy(() => import('./components/AdminAccessRoute'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminStaff = lazy(() => import('./pages/admin/AdminStaff'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminChangePassword = lazy(() => import('./pages/admin/AdminChangePassword'));
const StaffLayout = lazy(() => import('./components/staff/StaffLayout'));
const StaffBookings = lazy(() => import('./pages/staff/StaffBookings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
import ProtectedRoute from './components/ProtectedRoute';

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings, authError } = useAuth();
  const isAdminRoute = window.location.pathname.startsWith('/dashboard/admin');

  if (!isAdminRoute && isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#050505' }}>
        <div className="w-8 h-8 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: '#C9A84C', borderRightColor: 'rgba(201,168,76,0.3)' }}></div>
      </div>
    );
  }

  if (!isAdminRoute && authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#050505' }}><div className="w-8 h-8 border-2 border-transparent rounded-full animate-spin" style={{ borderTopColor: '#C9A84C' }} /></div>}>
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
      <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
      <Route element={<AdminAccessRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/admin/bookings" element={<AdminBookings />} />
          <Route path="/dashboard/admin/messages" element={<AdminMessages />} />
          <Route path="/dashboard/admin/notifications" element={<AdminNotifications />} />
          <Route path="/dashboard/admin/staff" element={<AdminStaff />} />
              <Route path="/dashboard/admin/reviews" element={<AdminReviews />} />
          <Route path="/dashboard/admin/change-password" element={<AdminChangePassword />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
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