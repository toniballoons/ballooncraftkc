import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import * as UserProfile from '@/entities/UserProfile';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    let active = true;

    // Hydrate from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsAuthenticated(!!nextUser);
      setIsLoadingAuth(false);
    });

    // Keep state in sync across tabs and after token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setIsAuthenticated(!!nextUser);
      if (!nextUser) {
        setProfile(null);
        setIsLoadingProfile(false);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      try {
        const nextProfile = await UserProfile.getForUser(user.id);
        if (!active) return;
        setProfile(nextProfile || null);
      } catch (error) {
        if (!active) return;
        console.error('Failed to load user profile', error);
        setProfile(null);
      } finally {
        if (active) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setIsLoadingProfile(false);
  };

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      setIsLoadingProfile(false);
      return;
    }

    setIsLoadingProfile(true);
    try {
      const nextProfile = await UserProfile.getForUser(user.id);
      setProfile(nextProfile || null);
    } catch (error) {
      console.error('Failed to refresh user profile', error);
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, role: profile?.role || null, isAdmin, isAuthenticated, isLoadingAuth, isLoadingProfile, logout, refreshProfile }}>
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
