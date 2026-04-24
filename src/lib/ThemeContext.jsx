import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SiteTheme from '@/entities/SiteTheme';
import { getThemeById } from './themes';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const queryClient = useQueryClient();

  const { data: activeThemeId } = useQuery({
    queryKey: ['active-theme'],
    queryFn: async () => {
      const results = await SiteTheme.filter({ active: true });
      return results[0]?.key || 'rainbow_birthday';
    },
    initialData: 'rainbow_birthday',
  });

  const theme = getThemeById(activeThemeId);

  const setThemeMutation = useMutation({
    mutationFn: async (themeId) => {
      // Deactivate all existing theme records
      const all = await SiteTheme.list();
      for (const t of all) {
        await SiteTheme.update(t.id, { active: false });
      }
      // Activate or create the selected theme record
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

  return (
    <ThemeContext.Provider value={{
      theme,
      activeThemeId,
      setTheme: (id) => setThemeMutation.mutate(id),
      isChanging: setThemeMutation.isPending,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: getThemeById('rainbow_birthday'), activeThemeId: 'rainbow_birthday', setTheme: () => {}, isChanging: false };
  return ctx;
}
