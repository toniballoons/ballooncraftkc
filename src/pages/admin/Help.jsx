import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, MessageSquare, Star,
  Settings, Palette, Image, Search, Zap, AlertTriangle, HelpCircle,
} from 'lucide-react';

import HelpDashboard from '@/components/admin/help/HelpDashboard';
import HelpPortfolio from '@/components/admin/help/HelpPortfolio';
import HelpMessages from '@/components/admin/help/HelpMessages';
import HelpTestimonials from '@/components/admin/help/HelpTestimonials';
import HelpPageEditor from '@/components/admin/help/HelpPageEditor';
import HelpTheme from '@/components/admin/help/HelpTheme';
import HelpSiteAssets from '@/components/admin/help/HelpSiteAssets';
import HelpSEO from '@/components/admin/help/HelpSEO';
import HelpQuickTips from '@/components/admin/help/HelpQuickTips';
import HelpTroubleshooting from '@/components/admin/help/HelpTroubleshooting';

const SECTIONS = [
  { id: 'dashboard',      label: 'Dashboard',         icon: LayoutDashboard, color: 'bg-blue-100 text-blue-600',    component: HelpDashboard },
  { id: 'portfolio',      label: 'Portfolio / Blog',  icon: FileText,        color: 'bg-green-100 text-green-600',  component: HelpPortfolio },
  { id: 'messages',       label: 'Messages',          icon: MessageSquare,   color: 'bg-purple-100 text-purple-600',component: HelpMessages },
  { id: 'testimonials',   label: 'Testimonials',      icon: Star,            color: 'bg-yellow-100 text-yellow-600',component: HelpTestimonials },
  { id: 'page-editor',    label: 'Page Editor',       icon: Settings,        color: 'bg-indigo-100 text-indigo-600',component: HelpPageEditor },
  { id: 'theme',          label: 'Theme Settings',    icon: Palette,         color: 'bg-pink-100 text-pink-600',    component: HelpTheme },
  { id: 'site-assets',    label: 'Site Assets',       icon: Image,           color: 'bg-teal-100 text-teal-600',    component: HelpSiteAssets },
  { id: 'seo',            label: 'SEO Guide',         icon: Search,          color: 'bg-orange-100 text-orange-600',component: HelpSEO },
  { id: 'quick-tips',     label: 'Quick Tips',        icon: Zap,             color: 'bg-yellow-100 text-yellow-600',component: HelpQuickTips },
  { id: 'troubleshooting',label: 'Troubleshooting',   icon: AlertTriangle,   color: 'bg-red-100 text-red-600',      component: HelpTroubleshooting },
];

export default function Help() {
  const [activeId, setActiveId] = useState('dashboard');
  const active = SECTIONS.find(s => s.id === activeId);
  const ActiveComponent = active?.component;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl">Help Center</h1>
          <p className="text-sm text-muted-foreground">Everything you need to know about running your website</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="space-y-1 lg:sticky lg:top-6">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                  activeId === s.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeId === s.id ? 'bg-white/20' : s.color}`}>
                  <s.icon className="w-3.5 h-3.5" />
                </div>
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 bg-white rounded-2xl border p-6 shadow-sm">
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  );
}
