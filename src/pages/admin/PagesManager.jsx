import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SiteContent from '@/entities/SiteContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, Pencil, Trash2, Eye, EyeOff, Copy, ExternalLink, 
  GripVertical, Globe, Layout, ChevronRight, Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BUILTIN_SECTIONS = [
  { key: 'hero', label: '🏠 Hero', url: '/', editable: true },
  { key: 'about', label: '👥 About', url: '/about', editable: true },
  { key: 'contact', label: '📬 Contact', url: '/contact', editable: true },
  { key: 'testimonials', label: '⭐ Testimonials', url: '/testimonials', editable: true },
  { key: 'projects', label: '🖼️ Projects', url: '/projects', editable: true },
  { key: 'navbar', label: '🔗 Navbar', url: null, editable: true },
  { key: 'footer', label: '🦶 Footer', url: null, editable: true },
  { key: 'privacy', label: '🔒 Privacy Policy', url: '/privacy', editable: true },
  { key: 'terms', label: '📄 Terms of Service', url: '/terms', editable: true },
  { key: 'legal', label: '⚖️ Legal Disclaimer', url: '/legal', editable: true },
];

function PageRow({ page, isBuiltin, onEdit, onDelete, onToggleVisible, onDuplicate }) {
  const url = page.slug || (BUILTIN_SECTIONS.find(s => s.key === page.page_key)?.url);
  const isVisible = page.visible !== false;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all group">
      <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{page.title || page.label || page.page_key}</span>
          {isBuiltin && <Badge variant="outline" className="text-[10px]">Built-in</Badge>}
          {page.page_type === 'page' && <Badge variant="secondary" className="text-[10px]">Custom Page</Badge>}
          {!isVisible && <Badge variant="destructive" className="text-[10px]">Hidden</Badge>}
          {page.show_in_nav && <Badge className="text-[10px] bg-blue-500">In Nav</Badge>}
        </div>
        {url && <p className="text-xs text-muted-foreground mt-0.5">{url}</p>}
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" title="Open page">
            <Button variant="ghost" size="icon" className="h-7 w-7"><ExternalLink className="w-3.5 h-3.5" /></Button>
          </a>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(page)} title="Duplicate">
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleVisible(page)} title={isVisible ? 'Hide' : 'Show'}>
          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(page)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        {!isBuiltin && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(page)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        )}
      </div>
      <Link to={`/admin/pages?page=${page.page_key}`}>
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}

function PageDialog({ open, onOpenChange, page, onSave }) {
  const isNew = !page?.id;
  const isBuiltin = page && !page.id && BUILTIN_SECTIONS.find(s => s.key === page.page_key);
  
  const [form, setForm] = useState({
    title: page?.title || page?.label || '',
    slug: page?.slug || '',
    visible: page?.visible !== false,
    show_in_nav: page?.show_in_nav || false,
    page_type: page?.page_type || 'page',
  });

  React.useEffect(() => {
    setForm({
      title: page?.title || page?.label || '',
      slug: page?.slug || '',
      visible: page?.visible !== false,
      show_in_nav: page?.show_in_nav || false,
      page_type: page?.page_type || 'page',
    });
  }, [page]);

  const handleSlugChange = (val) => {
    const slug = '/' + val.replace(/^\/+/, '').replace(/[^a-z0-9-]/g, '-').toLowerCase();
    setForm(f => ({ ...f, slug }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? 'New Custom Page' : `Edit: ${page?.title || page?.page_key}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Page Title</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. FAQ" />
          </div>
          {(isNew || page?.page_type === 'page') && (
            <div className="space-y-1.5">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">yoursite.com</span>
                <Input
                  value={form.slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  placeholder="/faq"
                  className="flex-1"
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="text-sm font-semibold">Visible on site</p>
              <p className="text-xs text-muted-foreground">Show this page to visitors</p>
            </div>
            <Switch checked={form.visible} onCheckedChange={v => setForm(f => ({ ...f, visible: v }))} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div>
              <p className="text-sm font-semibold">Show in navigation</p>
              <p className="text-xs text-muted-foreground">Add to the main nav menu</p>
            </div>
            <Switch checked={form.show_in_nav} onCheckedChange={v => setForm(f => ({ ...f, show_in_nav: v }))} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => onSave(form)}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PagesManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);

  const { data: allContent = [] } = useQuery({
    queryKey: ['admin-site-content'],
    queryFn: () => SiteContent.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      if (id) {
        await SiteContent.update(id, data);
      } else {
        await SiteContent.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-content'] });
      queryClient.invalidateQueries({ queryKey: ['site-content-all'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => SiteContent.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-site-content'] }),
  });

  // Merge built-in sections with db records
  const builtinRows = BUILTIN_SECTIONS.map(section => {
    const dbRecord = allContent.find(c => c.page_key === section.key);
    return { ...section, ...dbRecord, label: section.label, isBuiltin: true };
  });

  const customPages = allContent.filter(c => c.page_type === 'page');

  const handleEdit = (page) => {
    setEditingPage(page);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingPage({ page_type: 'page', visible: true, show_in_nav: false });
    setDialogOpen(true);
  };

  const handleSave = async (form) => {
    const isBuiltin = editingPage?.isBuiltin;
    const existing = allContent.find(c => c.page_key === editingPage?.page_key);

    if (isBuiltin && existing) {
      await saveMutation.mutateAsync({ id: existing.id, data: { title: form.title, visible: form.visible, show_in_nav: form.show_in_nav } });
    } else if (isBuiltin && !existing) {
      await saveMutation.mutateAsync({ id: null, data: { page_key: editingPage.page_key, title: form.title, visible: form.visible, show_in_nav: form.show_in_nav, page_type: 'section' } });
    } else if (editingPage?.id) {
      await saveMutation.mutateAsync({ id: editingPage.id, data: { title: form.title, slug: form.slug, visible: form.visible, show_in_nav: form.show_in_nav } });
    } else {
      // New custom page
      const key = form.slug.replace(/\//g, '').replace(/-/g, '_') || `page_${Date.now()}`;
      await saveMutation.mutateAsync({ id: null, data: { page_key: key, title: form.title, slug: form.slug, visible: form.visible, show_in_nav: form.show_in_nav, page_type: 'page', content_json: JSON.stringify({ title: form.title, content: '' }) } });
    }
    toast.success('Saved!');
    setDialogOpen(false);
  };

  const handleToggleVisible = async (page) => {
    const isVisible = page.visible !== false;
    const existing = allContent.find(c => c.page_key === page.page_key);
    if (existing) {
      await saveMutation.mutateAsync({ id: existing.id, data: { visible: !isVisible } });
    } else {
      await saveMutation.mutateAsync({ id: null, data: { page_key: page.page_key, visible: !isVisible, page_type: 'section' } });
    }
    toast.success(isVisible ? 'Page hidden' : 'Page visible');
  };

  const handleDuplicate = async (page) => {
    const newKey = `${page.page_key}_copy_${Date.now()}`;
    const newSlug = `${page.slug || '/' + page.page_key}-copy`;
    await saveMutation.mutateAsync({ id: null, data: { page_key: newKey, title: `${page.title || page.label} (Copy)`, slug: newSlug, visible: false, show_in_nav: false, page_type: 'page', content_json: page.content_json || JSON.stringify({}) } });
    toast.success('Page duplicated — edit it to publish');
  };

  const handleDelete = async (page) => {
    if (!window.confirm(`Delete "${page.title || page.page_key}"? This cannot be undone.`)) return;
    await deleteMutation.mutateAsync(page.id);
    toast.success('Page deleted');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Pages & Sections</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all pages, visibility, and navigation for your site</p>
        </div>
        <Button onClick={handleNew} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New Page
        </Button>
      </div>

      {/* Quick links */}
      <div className="flex gap-3 flex-wrap">
        <Link to="/admin/pages">
          <Button variant="outline" size="sm" className="rounded-full">
            <Layout className="w-3.5 h-3.5 mr-1.5" /> Page Content Editor
          </Button>
        </Link>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="rounded-full">
            <Globe className="w-3.5 h-3.5 mr-1.5" /> View Live Site
          </Button>
        </a>
      </div>

      {/* Built-in sections */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Navigation className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Built-in Pages & Sections</h2>
        </div>
        <div className="space-y-2">
          {builtinRows.map(page => (
            <PageRow
              key={page.page_key}
              page={page}
              isBuiltin
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleVisible={handleToggleVisible}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      </div>

      {/* Custom pages */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layout className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Custom Pages</h2>
        </div>
        {customPages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Layout className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-muted-foreground">No custom pages yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Create new pages like FAQ, Gallery, Services, etc.</p>
            <Button size="sm" onClick={handleNew} variant="outline" className="rounded-full">
              <Plus className="w-3.5 h-3.5 mr-1" /> Create First Page
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {customPages.map(page => (
              <PageRow
                key={page.id}
                page={page}
                isBuiltin={false}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleVisible={handleToggleVisible}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      <PageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        page={editingPage}
        onSave={handleSave}
      />
    </div>
  );
}
