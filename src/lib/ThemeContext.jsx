import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SiteContent from '@/entities/SiteContent';
import * as SiteTheme from '@/entities/SiteTheme';
import { getThemeById, THEMES } from './themes';

const CACHE_KEY = 'ballooncraftkc_new_design_theme';
export const THEME_SETTINGS_KEY = 'new_design_theme_settings';
export const DEFAULT_THEME_ID = import.meta.env.VITE_NEW_DESIGN_ACTIVE_THEME || 'rainbow_birthday';
const LEGACY_THEME_ID_MAP = {
  black_tie: 'black_tie_gala',
  circus_fun: 'carnival_big_top',
  corporate_clean: 'corporate_pro',
  neon_party: 'neon_underground',
  unicorn_dream: 'unicorn_dreams',
  raspberry_sorbet_v1: 'pink_lemonade',
  vintage_gold_v1: 'art_deco_gold',
  tech_modern: 'future_tech',
  dinosaur_bash: 'deep_jungle',
  cartoon_pop: 'pop_art',
};

function getCookie(name) {
  if (typeof document === 'undefined') return null;

  const encodedName = encodeURIComponent(name);
  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${encodedName}=`));

  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

function setCookie(name, value) {
  if (typeof document === 'undefined') return;

  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  document.cookie =
    `${encodedName}=${encodedValue}; path=/; max-age=31536000; SameSite=Lax`;
}

function getStoredValue(key) {
  try {
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;
  } catch {}

  return getCookie(key);
}

function setStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}

  try {
    setCookie(key, value);
  } catch {}
}

// Read cached theme id from localStorage
function getCachedThemeId() {
  return getStoredValue(CACHE_KEY) || DEFAULT_THEME_ID;
}

export function normalizeThemeId(id) {
  if (!id) return DEFAULT_THEME_ID;

  if (THEMES.some((theme) => theme.id === id)) {
    return id;
  }

  const mappedId = LEGACY_THEME_ID_MAP[id];
  if (mappedId && THEMES.some((theme) => theme.id === mappedId)) {
    return mappedId;
  }

  return DEFAULT_THEME_ID;
}

// Write theme id to localStorage
function setCachedThemeId(id) {
  setStoredValue(CACHE_KEY, id);

  const theme = getThemeById(id);
  if (theme?.css) {
    setStoredValue(CACHE_KEY + '_css', JSON.stringify(theme.css));
  }
  if (theme?.borderRadius) {
    setStoredValue(CACHE_KEY + '_radius', theme.borderRadius);
  }
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
      const results = await SiteContent.filter({ page_key: THEME_SETTINGS_KEY });
      const raw = results[0]?.content_json;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          return normalizeThemeId(parsed.theme_id);
        } catch {
          // Fall through to the legacy theme store before giving up.
        }
      }

      const legacyThemes = await SiteTheme.filter({ active: true });
      const legacyThemeKey = legacyThemes[0]?.key;
      if (legacyThemeKey) {
        return normalizeThemeId(legacyThemeKey);
      }

      return DEFAULT_THEME_ID;
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
    onMutate: async (themeId) => {
      const previousThemeId =
        queryClient.getQueryData(['active-theme']) || getCachedThemeId();

      queryClient.setQueryData(['active-theme'], themeId);

      return { previousThemeId };
    },
    mutationFn: async (themeId) => {
      const all = await SiteContent.filter({ page_key: THEME_SETTINGS_KEY });
      const payload = JSON.stringify({ theme_id: themeId });
      const existing = all[0];

      if (existing) {
        await SiteContent.update(existing.id, { content_json: payload });
      } else {
        await SiteContent.create({
          page_key: THEME_SETTINGS_KEY,
          content_json: payload,
        });
      }
    },
    onError: (_error, _themeId, context) => {
      const fallbackThemeId = context?.previousThemeId || DEFAULT_THEME_ID;
      queryClient.setQueryData(['active-theme'], fallbackThemeId);
      applyThemeCssVars(getThemeById(fallbackThemeId));
      setCachedThemeId(fallbackThemeId);
    },
    onSuccess: (_data, themeId) => {
      queryClient.setQueryData(['active-theme'], themeId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-theme'] });
    },
  });

  const setTheme = async (id) => {
    // Apply immediately + cache before the mutation completes
    const t = getThemeById(id);
    applyThemeCssVars(t);
    setCachedThemeId(id);

    await setThemeMutation.mutateAsync(id);
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
    theme: getThemeById(DEFAULT_THEME_ID),
    activeThemeId: DEFAULT_THEME_ID,
    setTheme: () => {},
    isChanging: false,
  };
  return ctx;
}
