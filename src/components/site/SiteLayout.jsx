import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '@/lib/ThemeContext';

export default function SiteLayout() {
  const { theme } = useTheme();

  // Apply theme CSS variables to :root when theme changes
  useEffect(() => {
    if (!theme?.css) return;
    const root = document.documentElement;
    Object.entries(theme.css).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    // Also store borderRadius
    if (theme.borderRadius) root.style.setProperty('--radius', theme.borderRadius);
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 bg-transparent overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}