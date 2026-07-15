import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Loader2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AdminAccessRoute() {
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authChecked,
    checkUserAuth,
    checkAppState,
  } = useAuth();
  const [waitingTooLong, setWaitingTooLong] = useState(false);

  const isChecking = isLoadingAuth || isLoadingPublicSettings || !authChecked;

  useEffect(() => {
    if (!authChecked && !isLoadingAuth && !isLoadingPublicSettings) {
      checkUserAuth();
    }
  }, [authChecked, isLoadingAuth, isLoadingPublicSettings, checkUserAuth]);

  useEffect(() => {
    if (!isChecking) {
      setWaitingTooLong(false);
      return undefined;
    }

    const timeout = window.setTimeout(() => setWaitingTooLong(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [isChecking]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <h1 className="font-heading text-2xl text-foreground">Verifying admin access</h1>
          <p className="mt-2 text-sm text-muted-foreground">Please wait while your secure session is checked.</p>
          {waitingTooLong && (
            <button
              type="button"
              onClick={() => {
                setWaitingTooLong(false);
                checkAppState();
              }}
              className="mt-6 inline-flex h-11 items-center gap-2 border border-primary px-5 text-sm font-medium text-primary"
            >
              <RefreshCw size={15} /> Retry access
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <ShieldAlert className="w-10 h-10 mx-auto mb-4 text-primary" />
          <h1 className="font-heading text-3xl text-foreground">Admin access required</h1>
          <p className="mt-3 text-sm text-muted-foreground">This account does not have permission to open the administration area.</p>
          <Link to="/" className="mt-6 inline-flex h-11 items-center border border-primary px-5 text-sm font-medium text-primary">
            Return to website
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}