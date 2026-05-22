import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import * as UserProfile from '@/entities/UserProfile';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const hydrateProfile = async (nextUser) => {
    if (!nextUser) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await UserProfile.getForUser(nextUser.id);
      setProfile(nextProfile || null);
    } catch (error) {
      console.error('Failed to load user profile', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let active = true;

    // Hydrate from existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsAuthenticated(!!nextUser);
      await hydrateProfile(nextUser);
      if (active) setIsLoadingAuth(false);
    });

    // Keep state in sync across tabs and after token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsAuthenticated(!!nextUser);
      await hydrateProfile(nextUser);
      setIsLoadingAuth(false);
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
    await hydrateProfile(user);
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, role: profile?.role || null, isAdmin, isAuthenticated, isLoadingAuth, logout, refreshProfile }}>
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
