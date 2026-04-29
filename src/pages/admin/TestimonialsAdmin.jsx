import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Testimonial from '@/entities/Testimonial';
import { uploadFile } from '@/lib/uploadFile';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Star, Image, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const empty = { name: '', role: '', quote: '', rating: 5, avatar_url: '', featured: false, status: 'approved' };

export default function TestimonialsAdmin() {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const avatarInputRef = useRef(null);

  const { data: testimonials = [] } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: () => Testimonial.list('created_at'),
    initialData: [],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        role: form.role,
        quote: form.quote,
        rating: form.rating,
        avatar_url: form.avatar_url,
        featured: form.featured,
        status: form.status,
      };
      if (editingId) await Testimonial.update(editingId, payload);
      else await Testimonial.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      setEditOpen(false);
      toast.success('Testimonial saved!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Testimonial.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success('Deleted');
    },
  });

  const openNew = () => { setForm({ ...empty }); setEditingId(null); setEditOpen(true); };
  const openEdit = (t) => {
    setForm({
      name: t.name || '',
      role: t.role || '',
      quote: t.quote || '',
      rating: t.rating ?? 5,
      avatar_url: t.avatar_url || '',
      featured: t.featured ?? false,
      status: t.status || 'approved',
    });
    setEditingId(t.id);
    setEditOpen(true);
  };

  const moveUp = async (i) => {
    if (i === 0) return;
    const a = testimonials[i - 1], b = testimonials[i];
    await Promise.all([
      Testimonial.update(a.id, { ...a }),
      Testimonial.update(b.id, { ...b }),
    ]);
    queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await uploadFile(file);
      setForm(prev => ({ ...prev, avatar_url: file_url }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl">Testimonials</h1>
        <Button onClick={openNew} className="rounded-lg"><Plus className="w-4 h-4 mr-2" /> Add Testimonial</Button>
      </div>

      {testimonials.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No testimonials yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((t, i) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-start gap-4">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 mt-1">
                  <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label={`Move ${t.name || 'testimonial'} up`}><ChevronUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => moveUp(i + 1)} disabled={i === testimonials.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label={`Move ${t.name || 'testimonial'} down`}><ChevronDown className="w-4 h-4" /></button>
                </div>
                {t.avatar_url ? (
                  <img src={t.avatar_url} alt={t.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-primary">{t.name?.[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{t.name}</span>
                    <Badge variant={t.status === 'approved' ? 'default' : 'secondary'} className="text-xs">{t.status}</Badge>
                    {t.featured && <Badge className="bg-yellow-400 text-yellow-900 text-xs">Featured</Badge>}
                  </div>
                  {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                  <div className="flex gap-0.5 my-1">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}</div>
                  <p className="text-sm text-muted-foreground line-clamp-2">"{t.quote}"</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="icon" onClick={() => openEdit(t)} aria-label={`Edit testimonial from ${t.name || 'client'}`}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="outline" size="icon" onClick={() => deleteMutation.mutate(t.id)} aria-label={`Delete testimonial from ${t.name || 'client'}`}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Role / Event Type</Label><Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Wedding Client" /></div>
            <div className="space-y-1.5"><Label>Quote *</Label><Textarea value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} rows={4} /></div>
            <div className="space-y-1.5">
              <Label>Rating (1-5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })} aria-label={`Set rating to ${n} star${n === 1 ? '' : 's'}`} aria-pressed={form.rating === n}>
                    <Star className={`w-6 h-6 cursor-pointer ${n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Avatar</Label>
              <div className="flex items-center gap-3">
                {form.avatar_url && <img src={form.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />}
                <label
                  className="cursor-pointer bg-muted rounded-lg px-3 py-1.5 text-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      avatarInputRef.current?.click();
                    }
                  }}
                >
                  <Image className="w-4 h-4" /> Upload
                  <input type="file" accept="image/*" className="sr-only" onChange={handleAvatar} ref={avatarInputRef} />
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.featured} onCheckedChange={v => setForm({ ...form, featured: v })} />
              <Label>Featured</Label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
