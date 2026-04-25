import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SiteTheme from '@/entities/SiteTheme';
import { getThemeById, THEMES } from './themes';

const CACHE_KEY = 'ballooncraftkc_theme';

// Read cached theme id from localStorage
function getCachedThemeId() {
  try {
    return localStorage.getItem(CACHE_KEY) || 'rainbow_birthday';
  } catch {
    return 'rainbow_birthday';
  }
}

// Write theme id to localStorage
function setCachedThemeId(id) {
  try {
    localStorage.setItem(CACHE_KEY, id);
    // Also cache the CSS vars so the inline script can apply them on next load
    const theme = getThemeById(id);
    if (theme?.css) {
      localStorage.setItem(CACHE_KEY + '_css', JSON.stringify(theme.css));
    }
    if (theme?.borderRadius) {
      localStorage.setItem(CACHE_KEY + '_radius', theme.borderRadius);
    }
  } catch {}
}

// Apply a theme's CSS vars to :root immediately
export function applyThemeCssVars(theme) {
  if (!theme?.css) return;
  const root = document.documentElement;
  Object.entries(theme.css).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  if (theme.borderRadius) root.style.setProperty('--radius', theme.borderRadius);
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const queryClient = useQueryClient();

  const { data: activeThemeId } = useQuery({
    queryKey: ['active-theme'],
    queryFn: async () => {
      const results = await SiteTheme.filter({ active: true });
      return results[0]?.key || 'rainbow_birthday';
    },
    // Use cached value as initialData so there's no flash while Supabase loads
    initialData: getCachedThemeId,
  });

  const theme = getThemeById(activeThemeId);

  // Apply CSS vars whenever the resolved theme changes
  useEffect(() => {
    applyThemeCssVars(theme);
    setCachedThemeId(activeThemeId);
  }, [activeThemeId, theme]);

  const setThemeMutation = useMutation({
    mutationFn: async (themeId) => {
      const all = await SiteTheme.list();
      for (const t of all) {
        await SiteTheme.update(t.id, { active: false });
      }
      const existing = all.find(t => t.key === themeId);
      if (existing) {
        await SiteTheme.update(existing.id, { active: true });
      } else {
        await SiteTheme.create({ key: themeId, active: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-theme'] });
    },
  });

  const setTheme = (id) => {
    // Apply immediately + cache before the mutation completes
    const t = getThemeById(id);
    applyThemeCssVars(t);
    setCachedThemeId(id);
    setThemeMutation.mutate(id);
    // Trigger Vercel redeploy if a deploy hook is configured
    // This bakes the theme into the next build so new visitors never see a flash
    const deployHook = import.meta.env.VITE_VERCEL_DEPLOY_HOOK;
    if (deployHook) {
      fetch(deployHook, { method: 'POST' }).catch(() => {});
    }
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      activeThemeId,
      setTheme,
      isChanging: setThemeMutation.isPending,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return {
    theme: getThemeById('rainbow_birthday'),
    activeThemeId: 'rainbow_birthday',
    setTheme: () => {},
    isChanging: false,
  };
  return ctx;
}
