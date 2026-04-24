import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Mail, Settings, Menu, X, Star, Shield, Palette, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Page Editor', href: '/admin/pages', icon: Settings },
  { label: 'Projects', href: '/admin/projects', icon: FileText },
  { label: 'Testimonials', href: '/admin/testimonials', icon: Star },
  { label: 'Messages', href: '/admin/messages', icon: Mail },
  { label: 'Theme', href: '/admin/theme', icon: Palette },
  { label: 'Site Assets', href: '/admin/site', icon: Image },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/admin" className="font-display text-xl text-primary">Admin Panel</Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-3 space-y-1">
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
        <div className="absolute bottom-4 left-4 right-4">
          <Link to="/" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted">
            <Shield className="w-4 h-4" /> View Site
          </Link>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-display text-lg text-primary">Admin Panel</span>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}