import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Mail, Settings, Menu, X,
  Star, Palette, Image, HelpCircle, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';

const NAV_ITEMS = [
  { label: 'Dashboard',      href: '/admin',              icon: LayoutDashboard },
  { label: 'Page Editor',    href: '/admin/pages',        icon: Settings },
  { label: 'Portfolio / Blog', href: '/admin/projects',   icon: FileText },
  { label: 'Testimonials',   href: '/admin/testimonials', icon: Star },
  { label: 'Messages',       href: '/admin/messages',     icon: Mail },
  { label: 'Theme',          href: '/admin/theme',        icon: Palette },
  { label: 'Site Assets',    href: '/admin/site',         icon: Image },
  { label: 'Help',           href: '/admin/help',         icon: HelpCircle },
];

const SITE_LINKS = [
  { label: 'Home',         href: '/' },
  { label: 'About',        href: '/about' },
  { label: 'Projects',     href: '/projects' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'Contact',      href: '/contact' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const { content: navContent } = useSiteContent('navbar');
  const { theme } = useTheme();

  const logoColor = theme?.nav?.logoColor || '#e91e63';

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">

      {/* ── Site-wide top navbar (same as public site) ── */}
      <header
        className="w-full z-50 shadow-sm flex-shrink-0"
        style={{
          background: theme?.nav?.bg || 'rgba(255,255,255,0.97)',
          borderBottom: `1px solid ${theme?.nav?.textColor || '#1a1a1a'}18`,
        }}
      >
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo + bubble */}
            <Link to="/" className="flex flex-col items-center gap-1 flex-shrink-0">
              <img
                src="/logo.png"
                alt={navContent.logo_text || 'BalloonCraft KC'}
                className="h-14 w-auto object-contain"
                style={{ maxWidth: '160px' }}
              />
              <span
                className="text-[10px] font-black tracking-wide px-3 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  background: '#000',
                  color: '#fff',
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 1.5px rgba(255,255,255,0.3)',
                }}
              >
                Custom Balloon Decor
              </span>
            </Link>

            {/* Site nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {SITE_LINKS.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{ color: theme?.nav?.textColor || '#1a1a1a' }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Divider + admin controls */}
              <div className="flex items-center gap-1 ml-2 pl-2 border-l" style={{ borderColor: `${theme?.nav?.textColor || '#1a1a1a'}30` }}>
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
                  style={{ background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Admin
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 border"
                  style={{ background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: theme?.nav?.textColor || '#1a1a1a' }}
              onClick={() => setSidebarOpen(o => !o)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Admin body: sidebar + content ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform lg:translate-x-0 lg:static lg:top-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ top: '80px' }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-display text-xl text-primary">Admin Panel</span>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="p-3 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile header bar */}
          <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-display text-lg text-primary">Admin Panel</span>
          </div>
          <div className="p-4 sm:p-6 lg:p-8 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
