import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getAdminHomePath, hasAdminPermission, normalizeAdminProfile } from '@/lib/adminPermissions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const currentUserIdRef = useRef(null);
  const profileRef = useRef(null);
  const hasBootstrappedRef = useRef(false);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    let active = true;

    const loadAdminProfile = async (nextUser) => {
      if (!nextUser) {
        if (!active) return;
        setProfile(null);
        setIsLoadingAuth(false);
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', nextUser.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.warn('admin_users profile lookup failed:', error.message);
      }

      setProfile(normalizeAdminProfile(nextUser, data || null));
      setIsLoadingAuth(false);
    };

    const syncSession = async (session, event = 'session') => {
      const nextUser = session?.user ?? null;
      const nextUserId = nextUser?.id ?? null;
      const sameUser = currentUserIdRef.current === nextUserId;

      if (!active) return;
      setUser(nextUser);
      setIsAuthenticated(!!nextUser);

      if (!nextUser) {
        currentUserIdRef.current = null;
        setProfile(null);
        setIsLoadingAuth(false);
        hasBootstrappedRef.current = true;
        return;
      }

      const shouldSkipBlockingRefresh =
        event === 'TOKEN_REFRESHED' &&
        sameUser &&
        profileRef.current;

      if (shouldSkipBlockingRefresh) {
        return;
      }

      const shouldBlockUi =
        !hasBootstrappedRef.current ||
        !sameUser ||
        !profileRef.current;

      if (shouldBlockUi) {
        setIsLoadingAuth(true);
      }

      await loadAdminProfile(nextUser);
      currentUserIdRef.current = nextUserId;
      hasBootstrappedRef.current = true;
    };

    // Hydrate from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session, 'initial');
    });

    // Keep state in sync across tabs and after token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      syncSession(session, event);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const refreshProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const normalized = normalizeAdminProfile(user, data || null);
    setProfile(normalized);
    return normalized;
  };

  const hasPermission = (permission) => hasAdminPermission(profile, permission);
  const adminHomePath = getAdminHomePath(profile);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoadingAuth,
        logout,
        refreshProfile,
        hasPermission,
        adminHomePath,
        isAdmin: hasPermission('admin'),
        isOwnerAdmin: profile?.is_owner === true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
