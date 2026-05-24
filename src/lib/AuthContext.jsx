import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { getAdminHomePath, hasAdminPermission, normalizeAdminProfile } from '@/lib/adminPermissions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

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

    const syncSession = async (session) => {
      const nextUser = session?.user ?? null;
      if (!active) return;
      setUser(nextUser);
      setIsAuthenticated(!!nextUser);
      setIsLoadingAuth(true);
      await loadAdminProfile(nextUser);
    };

    // Hydrate from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });

    // Keep state in sync across tabs and after token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
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
