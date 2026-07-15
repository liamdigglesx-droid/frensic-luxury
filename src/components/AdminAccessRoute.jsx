import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminLoginForm from '@/components/AdminLoginForm';

export default function AdminAccessRoute() {
  const [hasAccess, setHasAccess] = useState(
    () => Boolean(sessionStorage.getItem('frensic_admin_token'))
  );

  if (!hasAccess) {
    return <AdminLoginForm onSuccess={() => setHasAccess(true)} />;
  }

  return <Outlet />;
}