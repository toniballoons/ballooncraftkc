import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SiteContent from '@/entities/SiteContent';

import { DEFAULT_CONTENT } from '@/lib/siteDefaults';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, Code, RotateCcw, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import HeroEditor from '@/components/admin/HeroEditor';
import AboutEditor from '@/components/admin/AboutEditor';
import ContactFormEditor from '@/components/admin/ContactFormEditor';
import NavbarEditor from '@/components/admin/NavbarEditor';
import FooterEditor from '@/components/admin/FooterEditor';
import GenericPageEditor from '@/components/admin/GenericPageEditor';

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
  hero: '/', about: '/about', contact: '/contact',
  testimonials: '/testimonials', projects: '/projects',
  privacy: '/privacy', terms: '/terms', legal: '/legal',
  navbar: '/', footer: '/',
};

function JsonEditor({ value, onChange }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState(null);
  useEffect(() => { setText(JSON.stringify(value, null, 2)); }, [value]);
  const handleChange = (newText) => {
    setText(newText);
    try { const parsed = JSON.parse(newText); setError(null); onChange(parsed); }
    catch { setError('Invalid JSON'); }
  };
  return (
    <div>
      <textarea value={text} onChange={e => handleChange(e.target.value)}
        className="w-full h-96 font-mono text-sm p-4 bg-gray-900 text-green-400 rounded-xl border-none resize-y" spellCheck={false} />
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

export default function PageEditor() {
  const queryClient = useQueryClient();
  const [activePageKey, setActivePageKey] = useState('hero');
  const [showCode, setShowCode] = useState(false);
  const [content, setContent] = useState(DEFAULT_CONTENT[activePageKey] || {});
  const [dbRecordId, setDbRecordId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Wrap setContent to track unsaved changes
  const handleContentChange = (newContent) => {
    setContent(newContent);
    setIsDirty(true);
  };

  const { data: allContent = [] } = useQuery({
    queryKey: ['admin-site-content'],
    queryFn: () => SiteContent.list(),
  });

  useEffect(() => {
    const existing = allContent.find(c => c.page_key === activePageKey);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Page Editor</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCode(s => !s)}>
            <Code className="w-4 h-4 mr-1" /> {showCode ? 'Visual' : 'JSON'}
          </Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
            className={isDirty ? 'animate-pulse bg-orange-500 hover:bg-orange-600' : ''}
          >
            <Save className="w-4 h-4 mr-1" /> {saveMutation.isPending ? 'Saving...' : isDirty ? 'Save Changes ●' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {isDirty && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between text-sm">
          <span className="text-orange-700 font-semibold">⚠️ You have unsaved changes — click Save to apply them to your website.</span>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Save className="w-3.5 h-3.5 mr-1" /> {saveMutation.isPending ? 'Saving...' : 'Save Now'}
          </Button>
        </div>
      )}

      {/* Page tabs */}
      <div className="mb-6 overflow-x-auto">
        <Tabs value={activePageKey} onValueChange={setActivePageKey}>
          <TabsList className="flex w-max gap-1 h-auto p-1">
            {PAGE_KEYS.map(key => (
              <TabsTrigger key={key} value={key} className="text-xs whitespace-nowrap">
                {PAGE_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor column */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">{PAGE_LABELS[activePageKey]}</CardTitle>
            <a
              href={PREVIEW_URLS[activePageKey] || '/'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Page
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

        {/* Live preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Eye className="w-4 h-4" /> Live Preview</CardTitle>
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