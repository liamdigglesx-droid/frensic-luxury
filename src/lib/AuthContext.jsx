import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const applyUser = useCallback(currentUser => {
    setUser(currentUser);
    setIsAuthenticated(Boolean(currentUser));
    setIsLoadingAuth(false);
    setAuthChecked(true);
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await base44.auth.me();
      applyUser(currentUser);
      setAuthError(null);
      return currentUser;
    } catch (error) {
      applyUser(null);
      if (error?.status === 401 || error?.status === 403 || /authenticated|session/i.test(error?.message || '')) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
      return null;
    }
  }, [applyUser]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (!active) return;
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      setAuthChecked(true);
    }, 5000);

    async function bootstrap() {
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (session?.user) await checkUserAuth(); else applyUser(null);
        return;
      }
      try {
        const appClient = createAxiosClient({
          baseURL: `${appParams.appBaseUrl}/api/apps/public`,
          headers: { 'X-App-Id': appParams.appId },
          token: appParams.token,
          interceptResponses: true,
        });
        const settings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        if (!active) return;
        setAppPublicSettings(settings);
        if (appParams.token) await checkUserAuth(); else applyUser(null);
      } catch (error) {
        if (!active) return;
        setAuthError({ type: 'unknown', message: error.message || 'Failed to load app' });
        applyUser(null);
      } finally {
        if (active) setIsLoadingPublicSettings(false);
      }
    }

    bootstrap().finally(() => clearTimeout(timeout));
    const subscription = isSupabaseConfigured
      ? supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          if (session?.user) setTimeout(() => { if (active) checkUserAuth(); }, 0);
          else applyUser(null);
        }).data.subscription
      : null;
    return () => { active = false; clearTimeout(timeout); subscription?.unsubscribe(); };
  }, [applyUser, checkUserAuth]);

  const logout = async (shouldRedirect = true) => {
    applyUser(null);
    sessionStorage.removeItem('frensic_admin_token');
    await base44.auth.logout(shouldRedirect ? window.location.href : undefined);
  };
  const navigateToLogin = () => base44.auth.redirectToLogin(window.location.href);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, appPublicSettings, authChecked, logout, navigateToLogin, checkUserAuth, checkAppState: checkUserAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
