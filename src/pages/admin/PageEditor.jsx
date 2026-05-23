import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import * as SiteContent from '@/entities/SiteContent';
import { DEFAULT_CONTENT } from '@/lib/siteDefaults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  Code,
  Eye,
  ExternalLink,
  FileText,
  HelpCircle,
  Image,
  LayoutDashboard,
  Mail,
  Palette,
  PanelsTopLeft,
  RotateCcw,
  Save,
  ScrollText,
  Settings,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import HeroEditor from '@/components/admin/HeroEditor';
import AboutEditor from '@/components/admin/AboutEditor';
import ContactFormEditor from '@/components/admin/ContactFormEditor';
import NavbarEditor from '@/components/admin/NavbarEditor';
import FooterEditor from '@/components/admin/FooterEditor';
import GenericPageEditor from '@/components/admin/GenericPageEditor';
import Dashboard from '@/pages/admin/Dashboard';
import PagesManager from '@/pages/admin/PagesManager';
import ProjectsAdmin from '@/pages/admin/ProjectsAdmin';
import ClientsAdmin from '@/pages/admin/ClientsAdmin';
import TestimonialsAdmin from '@/pages/admin/TestimonialsAdmin';
import MessagesAdmin from '@/pages/admin/MessagesAdmin';
import ThemeSettings from '@/pages/admin/ThemeSettings';
import SiteAssets from '@/pages/admin/SiteAssets';
import Help from '@/pages/admin/Help';
import { ADMIN_CMS_PATH } from '@/lib/adminNavigation';

const PAGE_KEYS = ['hero', 'about', 'contact', 'testimonials', 'projects', 'navbar', 'footer', 'privacy', 'terms', 'legal'];

const PAGE_LABELS = {
  hero: '🏠 Hero',
  about: '👥 About',
  contact: '📬 Contact',
  testimonials: '⭐ Testimonials',
  projects: '🖼️ Projects',
  navbar: '🔗 Navbar',
  footer: '🦶 Footer',
  privacy: '🔒 Privacy',
  terms: '📄 Terms',
  legal: '⚖️ Legal',
};

const PREVIEW_URLS = {
  hero: '/',
  about: '/about',
  contact: '/contact',
  testimonials: '/testimonials',
  projects: '/projects',
  privacy: '/privacy',
  terms: '/terms',
  legal: '/legal',
  navbar: '/',
  footer: '/',
};

const ADMIN_PANELS = [
  {
    key: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    title: 'Admin Overview',
    description: 'See recent activity, quick stats, and the fastest routes into the tools Toni uses the most.',
  },
  {
    key: 'content',
    label: 'Site Content',
    icon: Settings,
    title: 'Site Content Editor',
    description: 'Edit homepage, about, contact, footer, legal pages, and the public-facing content of the site.',
  },
  {
    key: 'manage-pages',
    label: 'Pages & Nav',
    icon: PanelsTopLeft,
    title: 'Pages and Navigation',
    description: 'Control visibility, custom pages, navigation placement, and section publishing.',
  },
  {
    key: 'projects',
    label: 'Portfolio / Blog',
    icon: FileText,
    title: 'Portfolio and Blog',
    description: 'Publish projects, update blog-style portfolio posts, and manage their images and SEO details.',
  },
  {
    key: 'clients',
    label: 'Client Admin',
    icon: ScrollText,
    title: 'Client Administration',
    description: 'Build booking packages, send contracts, collect intake answers, and track client email opens.',
  },
  {
    key: 'testimonials',
    label: 'Testimonials',
    icon: Star,
    title: 'Testimonials',
    description: 'Manage social proof and keep customer testimonials aligned across the public site.',
  },
  {
    key: 'messages',
    label: 'Messages',
    icon: Mail,
    title: 'Messages',
    description: 'Review inquiries, replies, and incoming contact submissions from potential clients.',
  },
  {
    key: 'theme',
    label: 'Theme',
    icon: Palette,
    title: 'Theme Settings',
    description: 'Adjust colors, presentation, and the overall styling direction for the public website.',
  },
  {
    key: 'site',
    label: 'Site Assets',
    icon: Image,
    title: 'Site Assets',
    description: 'Manage uploaded images, logos, and shared files used throughout the site.',
  },
  {
    key: 'help',
    label: 'Help',
    icon: HelpCircle,
    title: 'Help',
    description: 'Find admin guidance, troubleshooting notes, and practical next steps when something feels off.',
  },
];

function JsonEditor({ value, onChange }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState(null);

  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (newText) => {
    setText(newText);
    try {
      const parsed = JSON.parse(newText);
      setError(null);
      onChange(parsed);
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full h-96 font-mono text-sm p-4 bg-gray-900 text-green-400 rounded-xl border-none resize-y"
        spellCheck={false}
      />
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
    </div>
  );
}

function EditorForPage({ pageKey, content, setContent }) {
  if (pageKey === 'hero') return <HeroEditor content={content} setContent={setContent} />;
  if (pageKey === 'about') return <AboutEditor content={content} setContent={setContent} />;
  if (pageKey === 'contact') return <ContactFormEditor content={content} setContent={setContent} />;
  if (pageKey === 'navbar') return <NavbarEditor content={content} setContent={setContent} />;
  if (pageKey === 'footer') return <FooterEditor content={content} setContent={setContent} />;
  return <GenericPageEditor content={content} setContent={setContent} pageKey={pageKey} />;
}

function OverviewCard({ panel, onOpen }) {
  const Icon = panel.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(panel.key)}
      className="w-full text-left rounded-3xl border border-border/60 bg-white p-5 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">{panel.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{panel.description}</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground mt-1" />
      </div>
    </button>
  );
}

function OverviewWorkspace({ onOpenPanel }) {
  const actionPanels = ADMIN_PANELS.filter((panel) => panel.key !== 'overview');

  return (
    <div className="space-y-8">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h2 className="font-display text-3xl">Everything Admin Lives Here</h2>
          <p className="text-muted-foreground mt-3 max-w-4xl leading-7">
            This workspace is now the central place for site content, portfolio posts, client packages, contracts, messages, theme settings, and anything else Toni needs to run BalloonCraft KC.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {actionPanels.map((panel) => (
          <OverviewCard key={panel.key} panel={panel} onOpen={onOpenPanel} />
        ))}
      </div>

      <Dashboard />
    </div>
  );
}

function ContentWorkspace({ initialPageKey, onPageChange }) {
  const queryClient = useQueryClient();
  const safeInitialPageKey = PAGE_KEYS.includes(initialPageKey) ? initialPageKey : 'hero';
  const [activePageKey, setActivePageKey] = useState(safeInitialPageKey);
  const [showCode, setShowCode] = useState(false);
  const [content, setContent] = useState(DEFAULT_CONTENT[safeInitialPageKey] || {});
  const [dbRecordId, setDbRecordId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setIsDirty(true);
  };

  const { data: allContent = [] } = useQuery({
    queryKey: ['admin-site-content'],
    queryFn: () => SiteContent.list(),
  });

  useEffect(() => {
    const normalized = PAGE_KEYS.includes(initialPageKey) ? initialPageKey : 'hero';
    setActivePageKey(normalized);
  }, [initialPageKey]);

  useEffect(() => {
    const existing = allContent.find((item) => item.page_key === activePageKey);
    if (existing?.content_json) {
      setContent(JSON.parse(existing.content_json));
      setDbRecordId(existing.id);
    } else {
      setContent(DEFAULT_CONTENT[activePageKey] || {});
      setDbRecordId(null);
    }
    setShowCode(false);
    setIsDirty(false);
  }, [activePageKey, allContent]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const json = JSON.stringify(content);
      if (dbRecordId) {
        await SiteContent.update(dbRecordId, { content_json: json });
      } else {
        await SiteContent.create({ page_key: activePageKey, content_json: json });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-content'] });
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      queryClient.invalidateQueries({ queryKey: ['site-content-all'] });
      setIsDirty(false);
      toast.success('Saved!');
    },
  });

  const handleReset = () => {
    setContent(DEFAULT_CONTENT[activePageKey] || {});
    setIsDirty(false);
    toast.info('Reset to defaults — save to persist');
  };

  const handleTabChange = (nextPageKey) => {
    setActivePageKey(nextPageKey);
    onPageChange(nextPageKey);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl">Site Content Editor</h2>
          <p className="text-muted-foreground mt-2">
            Edit the public-facing pages and shared site sections without leaving the main admin workspace.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCode((state) => !state)}>
            <Code className="w-4 h-4 mr-1" />
            {showCode ? 'Visual' : 'JSON'}
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className={isDirty ? 'animate-pulse bg-orange-500 hover:bg-orange-600' : ''}
          >
            <Save className="w-4 h-4 mr-1" />
            {saveMutation.isPending ? 'Saving...' : isDirty ? 'Save Changes ●' : 'Save'}
          </Button>
        </div>
      </div>

      {isDirty && (
        <div className="px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between gap-4 text-sm">
          <span className="text-orange-700 font-semibold">
            You have unsaved changes — click Save to apply them to your website.
          </span>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            {saveMutation.isPending ? 'Saving...' : 'Save Now'}
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Tabs value={activePageKey} onValueChange={handleTabChange}>
          <TabsList className="flex w-max gap-1 h-auto p-1">
            {PAGE_KEYS.map((key) => (
              <TabsTrigger key={key} value={key} className="text-xs whitespace-nowrap">
                {PAGE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{PAGE_LABELS[activePageKey]}</CardTitle>
            <a
              href={PREVIEW_URLS[activePageKey] || '/'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Page
            </a>
          </CardHeader>
          <CardContent>
            {showCode ? (
              <JsonEditor value={content} onChange={handleContentChange} />
            ) : (
              <EditorForPage pageKey={activePageKey} content={content} setContent={handleContentChange} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-xl border overflow-hidden h-[600px]">
              <div className="bg-muted px-4 py-2 border-b flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">{PREVIEW_URLS[activePageKey] || '/'}</span>
              </div>
              <iframe src={PREVIEW_URLS[activePageKey] || '/'} className="w-full h-full border-none" title="Preview" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PageEditor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = searchParams.get('page');
  const requestedPanel = searchParams.get('panel');
  const hasPageQuery = Boolean(requestedPage);
  const safePanel = ADMIN_PANELS.some((panel) => panel.key === requestedPanel)
    ? requestedPanel
    : hasPageQuery
      ? 'content'
      : 'overview';

  const setPanel = (panelKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('panel', panelKey);
    if (panelKey === 'content') {
      params.set('page', requestedPage && PAGE_KEYS.includes(requestedPage) ? requestedPage : 'hero');
    } else {
      params.delete('page');
    }
    setSearchParams(params, { replace: true });
  };

  const setContentPage = (pageKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('panel', 'content');
    params.set('page', PAGE_KEYS.includes(pageKey) ? pageKey : 'hero');
    setSearchParams(params, { replace: true });
  };

  const renderPanel = () => {
    switch (safePanel) {
      case 'overview':
        return <OverviewWorkspace onOpenPanel={setPanel} />;
      case 'content':
        return <ContentWorkspace initialPageKey={requestedPage || 'hero'} onPageChange={setContentPage} />;
      case 'manage-pages':
        return <PagesManager />;
      case 'projects':
        return <ProjectsAdmin />;
      case 'clients':
        return <ClientsAdmin />;
      case 'testimonials':
        return <TestimonialsAdmin />;
      case 'messages':
        return <MessagesAdmin />;
      case 'theme':
        return <ThemeSettings />;
      case 'site':
        return <SiteAssets />;
      case 'help':
        return <Help />;
      default:
        return <OverviewWorkspace onOpenPanel={setPanel} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Site Management / CMS</h1>
        <p className="text-muted-foreground mt-2 max-w-4xl">
          This is the single admin home for BalloonCraft KC. Site edits, clients, contracts, invoices, messages, portfolio updates, theme settings, and help all live here now under one CMS workspace.
        </p>
        <p className="text-muted-foreground mt-2 max-w-4xl text-sm">
          Use this address as the admin home going forward: <span className="font-semibold">{ADMIN_CMS_PATH}</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <Tabs value={safePanel} onValueChange={setPanel}>
          <TabsList className="flex w-max gap-1 h-auto p-1">
            {ADMIN_PANELS.map((panel) => {
              const Icon = panel.icon;
              return (
                <TabsTrigger key={panel.key} value={panel.key} className="text-xs whitespace-nowrap gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  {panel.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {renderPanel()}
    </div>
  );
}
