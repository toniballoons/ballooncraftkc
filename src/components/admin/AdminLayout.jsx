import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Mail, Settings, Menu, X,
  Star, Palette, Image, HelpCircle, LogOut, PanelsTopLeft, ScrollText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { ensureAccessibleColor } from '@/lib/accessibility';
import { ADMIN_CMS_HOME, getAdminPanelHref, isAdminCmsPath } from '@/lib/adminNavigation';

const CMS_PANEL_ITEMS = [
  { label: 'Site Content',     href: getAdminPanelHref('content'),      icon: Settings, panel: 'content' },
  { label: 'Pages & Nav',      href: getAdminPanelHref('manage-pages'), icon: PanelsTopLeft, panel: 'manage-pages' },
  { label: 'Portfolio / Blog', href: getAdminPanelHref('projects'),     icon: FileText, panel: 'projects' },
  { label: 'Client Admin',     href: getAdminPanelHref('clients'),      icon: ScrollText, panel: 'clients' },
  { label: 'Testimonials',     href: getAdminPanelHref('testimonials'), icon: Star, panel: 'testimonials' },
  { label: 'Messages',         href: getAdminPanelHref('messages'),     icon: Mail, panel: 'messages' },
  { label: 'Theme',            href: getAdminPanelHref('theme'),        icon: Palette, panel: 'theme' },
  { label: 'Site Assets',      href: getAdminPanelHref('site'),         icon: Image, panel: 'site' },
  { label: 'Help',             href: getAdminPanelHref('help'),         icon: HelpCircle, panel: 'help' },
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

  const navBg = theme?.nav?.bg || 'rgba(255,255,255,0.97)';
  const navTextColor = theme?.nav?.textColor || '#1a1a1a';
  const safeNavTextColor = ensureAccessibleColor(navTextColor, navBg);
  const routeSearch = new URLSearchParams(location.search);
  const onCmsRoute = isAdminCmsPath(location.pathname);
  const currentPanel = onCmsRoute
    ? routeSearch.get('panel') || (routeSearch.get('page') ? 'content' : 'overview')
    : null;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <a
        href="#admin-main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg"
      >
        Skip to admin content
      </a>

      {/* ── Site-wide top navbar (same as public site) ── */}
      <header
        className="w-full z-50 shadow-sm flex-shrink-0"
        style={{
          background: navBg,
          borderBottom: `1px solid ${safeNavTextColor}18`,
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
            <nav className="hidden md:flex items-center gap-1" aria-label="Admin header">
              {SITE_LINKS.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  aria-current={location.pathname === link.href ? 'page' : undefined}
                  style={{ color: safeNavTextColor }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Divider + admin controls */}
              <div className="flex items-center gap-1 ml-2 pl-2 border-l" style={{ borderColor: `${safeNavTextColor}30` }}>
                <Link
                  to={ADMIN_CMS_HOME}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border"
                  aria-current={currentPanel === 'overview' ? 'page' : undefined}
                  style={{ background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                  Site Management
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80 border"
                  style={{ background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            </nav>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg"
              style={{ color: safeNavTextColor }}
              onClick={() => setSidebarOpen(o => !o)}
              aria-expanded={sidebarOpen}
              aria-controls="admin-sidebar"
              aria-label={sidebarOpen ? 'Close admin navigation' : 'Open admin navigation'}
            >
              {sidebarOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Admin body: sidebar + content ── */}
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside
          id="admin-sidebar"
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform lg:translate-x-0 lg:static lg:top-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ top: '80px' }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-display text-xl text-primary">Site Management / CMS</span>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close admin navigation">
              <X className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto">
            <Link
              to={ADMIN_CMS_HOME}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5 text-foreground transition-colors hover:bg-primary/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold">Site Management / CMS</p>
                <p className="text-xs text-muted-foreground">All admin tools live here</p>
              </div>
            </Link>

            <nav className="space-y-1" aria-label="CMS tools">
              <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
                CMS Tools
              </p>
              {CMS_PANEL_ITEMS.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={currentPanel === item.panel ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    currentPanel === item.panel
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close admin navigation overlay"
          />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile header bar */}
          <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Open admin navigation">
              <Menu className="w-5 h-5" aria-hidden="true" />
            </Button>
            <span className="font-display text-lg text-primary">Site Management / CMS</span>
          </div>
          <main
            id="admin-main-content"
            data-route-main="true"
            tabIndex={-1}
            className="p-4 sm:p-6 lg:p-8 flex-1 focus:outline-none"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
