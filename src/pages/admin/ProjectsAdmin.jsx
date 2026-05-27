import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Project from '@/entities/Project';
import {
  autoFillSeoFields,
  resolveUniqueSlug,
  generateSlug,
  duplicatePost,
  SERVICE_TYPES,
  EVENT_TYPES,
  GEO_CITIES,
} from '@/lib/seo';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import MarkdownEditor from '@/components/admin/MarkdownEditor';
import DraggableGallery from '@/components/admin/DraggableGallery';
import ImageUploadField from '@/components/admin/ImageUploadField';
import FocusKeywordPanel from '@/components/admin/FocusKeywordPanel';
import SeoPreviewPanel from '@/components/admin/SeoPreviewPanel';
import CharCounter from '@/components/admin/CharCounter';

const CATEGORIES = ['wedding', 'birthday', 'corporate', 'baby_shower', 'graduation', 'holiday', 'custom', 'other'];
const STATUSES = ['draft', 'published', 'archived'];

const emptyProject = {
  title: '', slug: '', excerpt: '', content: '', featured_image: '', gallery_images: [],
  category: 'other', tags: [], meta_title: '', meta_description: '', meta_keywords: '',
  og_image: '', status: 'draft', featured: false, event_date: '', event_location: '',
  client_name: '', publish_date: '', author: '',
  focus_keyword: '', service_types: [], event_types: [], geo_city: '',
  client_quote: '', client_quote_name: '', gallery_images_meta: [],
};

export default function ProjectsAdmin() {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyProject);
  const [editingId, setEditingId] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
  const [slugError, setSlugError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('published');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => Project.list('-created_at'),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let data = { ...form };

      // 5.10 — auto-fill SEO fields
      const { filled, didFill } = autoFillSeoFields(data);
      data = filled;

      // 5.10 — resolve unique slug if empty
      if (!data.slug) {
        data.slug = resolveUniqueSlug(
          generateSlug(data.title),
          projects.map(p => p.slug),
          editingId,
        );
      }

      if (editingId) {
        await Project.update(editingId, data);
      } else {
        await Project.create(data);
      }

      return { didFill };
    },
    onSuccess: ({ didFill }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      setEditOpen(false);
      toast.success(editingId ? 'Post updated!' : 'Post created!');
      if (didFill) toast.info('SEO fields auto-filled from your content.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Project.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      toast.success('Post deleted');
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (newStatus) => {
      await Promise.all(selectedIds.map(id => Project.update(id, { status: newStatus })));
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      toast.success(`${selectedIds.length} posts updated to ${newStatus}`);
      setSelectedIds([]);
    },
  });

  const openNew = () => {
    setForm(emptyProject);
    setEditingId(null);
    setTagsInput('');
    setSlugError('');
    setEditOpen(true);
  };

  const openEdit = (p) => {
    setForm({ ...emptyProject, ...p });
    setEditingId(p.id);
    setTagsInput((p.tags || []).join(', '));
    setSlugError('');
    setEditOpen(true);
  };

  const handleSlugBlur = () => {
    if (!form.slug) { setSlugError(''); return; }
    const conflict = projects.find(p => p.slug === form.slug && p.id !== editingId);
    setSlugError(conflict ? 'This slug is already used by another post.' : '');
  };

  const toggleMulti = (field, value) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const handleDuplicate = async (p) => {
    try {
      const duplicated = duplicatePost(p);
      const created = await Project.create(duplicated);
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      toast.success('Post duplicated — make your changes and save.');
      openEdit(created);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const allSelected = projects.length > 0 && selectedIds.length === projects.length;
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : projects.map(p => p.id));
  };
  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl">Portfolio / Blog</h1>
        <Button onClick={openNew} className="rounded-lg"><Plus className="w-4 h-4 mr-2" /> New Post</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Each post showcases an event AND helps Google find your business. Post after every event with photos and a description for best SEO results.
      </p>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-xl border">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Publish</SelectItem>
              <SelectItem value="draft">Set to Draft</SelectItem>
              <SelectItem value="archived">Archive</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => bulkMutation.mutate(bulkStatus)} disabled={bulkMutation.isPending}>
            Apply
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : projects.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No posts yet. Create your first post!</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {/* Select All header */}
          <div className="flex items-center gap-3 px-1">
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all posts" />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>

          {projects.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <Checkbox
                  checked={selectedIds.includes(p.id)}
                  onCheckedChange={() => toggleSelectOne(p.id)}
                  aria-label={`Select post ${p.title}`}
                />
                {p.featured_image && (
                  <img src={p.featured_image} alt={p.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{p.title}</h3>
                    <Badge variant={p.status === 'published' ? 'default' : 'secondary'} className="text-xs">{p.status}</Badge>
                    {p.featured && <Badge className="bg-yellow-400 text-yellow-900 text-xs">Featured</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{p.excerpt}</p>
                  <div className="flex gap-1 mt-1">
                    {(p.tags || []).slice(0, 3).map((t, i) => <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">#{t}</span>)}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="icon" title="Duplicate" aria-label={`Duplicate ${p.title}`} onClick={() => handleDuplicate(p)}><Copy className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" aria-label={`Edit ${p.title}`} onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" aria-label={`Delete ${p.title}`} onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <DialogTitle>{editingId ? 'Edit Post' : 'New Post'}</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (form.slug) {
                      window.open('/projects/' + form.slug, '_blank');
                    } else {
                      toast.info('Save the post first to generate a preview URL.');
                    }
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" aria-hidden="true" /> Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Post'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (auto-generated if empty)</Label>
                <Input
                  value={form.slug}
                  onChange={e => { setForm({ ...form, slug: e.target.value }); setSlugError(''); }}
                  onBlur={handleSlugBlur}
                  placeholder="auto-generated-from-title"
                />
                {slugError && <p className="text-xs text-red-500">{slugError}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Excerpt</Label>
              <Textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} />
            </div>

            {/* 5.2 — MarkdownEditor */}
            <MarkdownEditor
              label="Content"
              value={form.content}
              onChange={v => setForm({ ...form, content: v })}
            />

            {/* Featured Image */}
            <ImageUploadField
              label="Featured Image"
              value={form.featured_image}
              onChange={(featured_image) => setForm((prev) => ({ ...prev, featured_image }))}
              editorPreset="landscape"
              aspectRatio="aspect-video"
              cameraFacing="environment"
              buttonLabel="Choose featured image"
              helperText="Upload from a phone or desktop, crop it for the post card, and keep BalloonCraft KC project previews clean across the site."
            />

            {/* 5.3 — DraggableGallery */}
            <div className="space-y-3">
              <Label>Gallery Images</Label>
              <DraggableGallery
                images={form.gallery_images_meta}
                onChange={newMeta => setForm(prev => ({
                  ...prev,
                  gallery_images_meta: newMeta,
                  gallery_images: newMeta.map(i => i.url),
                }))}
              />
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Event Date</Label>
                <Input type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Event Location</Label>
                <Input value={form.event_location} onChange={e => setForm({ ...form, event_location: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Client Name</Label>
                <Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Author</Label>
                <Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Publish Date</Label>
                <Input type="date" value={form.publish_date} onChange={e => setForm({ ...form, publish_date: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input
                value={tagsInput}
                onChange={e => {
                  setTagsInput(e.target.value);
                  setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) });
                }}
                placeholder="balloon arch, wedding, pink, gold"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.featured} onCheckedChange={v => setForm({ ...form, featured: v })} />
              <Label>Featured Post (show on homepage)</Label>
            </div>

            {/* 5.4 — Service Types, Event Types, Geo City */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Service Types</Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_TYPES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleMulti('service_types', s)}
                      aria-pressed={(form.service_types || []).includes(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        (form.service_types || []).includes(s)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Event Types</Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => toggleMulti('event_types', e)}
                      aria-pressed={(form.event_types || []).includes(e)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        (form.event_types || []).includes(e)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:border-primary'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Geo City</Label>
                <Select value={form.geo_city || ''} onValueChange={v => setForm({ ...form, geo_city: v })}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Select city…" /></SelectTrigger>
                  <SelectContent>
                    {GEO_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 5.5 — Client Testimonial */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Client Testimonial</Label>
              <div className="space-y-1.5">
                <Label>Quote</Label>
                <Textarea
                  value={form.client_quote}
                  onChange={e => setForm({ ...form, client_quote: e.target.value })}
                  rows={3}
                  placeholder="What did the client say about the event?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Client Name</Label>
                <Input
                  value={form.client_quote_name}
                  onChange={e => setForm({ ...form, client_quote_name: e.target.value })}
                  placeholder="e.g. Sarah M."
                />
              </div>
            </div>

            {/* 5.6 — Focus Keyword */}
            <div className="space-y-2">
              <Label>Focus Keyword</Label>
              <Input
                value={form.focus_keyword}
                onChange={e => setForm({ ...form, focus_keyword: e.target.value })}
                placeholder="e.g. balloon arch Kansas City"
              />
              <FocusKeywordPanel keyword={form.focus_keyword} post={form} />
            </div>

            {/* 5.7 — SEO Settings */}
            <Card>
              <CardHeader><CardTitle className="text-sm">SEO Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* 5.7 — SEO preview at top */}
                <SeoPreviewPanel
                  metaTitle={form.meta_title}
                  metaDescription={form.meta_description}
                  slug={form.slug}
                />

                <div className="space-y-1.5">
                  <Label>Meta Title</Label>
                  <Input
                    value={form.meta_title}
                    onChange={e => setForm({ ...form, meta_title: e.target.value })}
                    placeholder="Auto-filled from title"
                  />
                  <CharCounter value={form.meta_title} max={60} optimalMin={50} />
                </div>
                <div className="space-y-1.5">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={form.meta_description}
                    onChange={e => setForm({ ...form, meta_description: e.target.value })}
                    rows={2}
                  />
                  <CharCounter value={form.meta_description} max={160} optimalMin={120} />
                </div>
                <div className="space-y-1.5">
                  <Label>Meta Keywords</Label>
                  <Input
                    value={form.meta_keywords}
                    onChange={e => setForm({ ...form, meta_keywords: e.target.value })}
                    placeholder="balloon decorations, event styling"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>OG Image URL</Label>
                  <Input
                    value={form.og_image}
                    onChange={e => setForm({ ...form, og_image: e.target.value })}
                    placeholder="Auto-filled from featured image"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save Post'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
