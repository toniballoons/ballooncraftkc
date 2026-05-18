import React, { useRef, useState } from 'react';
import { uploadFile } from '@/lib/uploadFile';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Image } from 'lucide-react';
import { toast } from 'sonner';

const emptyMember = { name: '', role: '', bio: '', photo: '' };

export default function TeamEditor({ team = [], onChange }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState(emptyMember);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);

  const openNew = () => { setForm(emptyMember); setEditIndex(null); setEditOpen(true); };
  const openEdit = (i) => { setForm({ ...emptyMember, ...team[i] }); setEditIndex(i); setEditOpen(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    const updated = [...team];
    if (editIndex !== null) updated[editIndex] = form;
    else updated.push(form);
    onChange(updated);
    setEditOpen(false);
    toast.success('Team member saved!');
  };

  const handleDelete = (i) => {
    const updated = team.filter((_, idx) => idx !== i);
    onChange(updated);
  };

  const moveUp = (i) => {
    if (i === 0) return;
    const updated = [...team];
    [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
    onChange(updated);
  };
  const moveDown = (i) => {
    if (i === team.length - 1) return;
    const updated = [...team];
    [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
    onChange(updated);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      setForm(prev => ({ ...prev, photo: file_url }));
      toast.success('Photo uploaded!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };
  const openPhotoPicker = () => photoInputRef.current?.click();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold">Team Members</Label>
        <Button size="sm" variant="outline" onClick={openNew} className="text-xs">
          <Plus className="w-3 h-3 mr-1" /> Add Member
        </Button>
      </div>

      {team.length === 0 ? (
        <div className="text-sm text-muted-foreground border border-dashed rounded-xl p-6 text-center">
          No team members yet. Add your first team member!
        </div>
      ) : (
        <div className="space-y-2">
          {team.map((member, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveUp(i)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none" aria-label={`Move ${member.name || 'team member'} up`}>▲</button>
                  <button type="button" onClick={() => moveDown(i)} disabled={i === team.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none" aria-label={`Move ${member.name || 'team member'} down`}>▼</button>
                </div>
                {member.photo ? (
                  <img src={member.photo} alt={member.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-display text-lg">
                    {member.name?.[0] || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(i)} aria-label={`Edit ${member.name || 'team member'}`}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(i)} aria-label={`Delete ${member.name || 'team member'}`}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sarah Johnson" />
            </div>
            <div className="space-y-1.5">
              <Label>Role / Title</Label>
              <Input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Lead Balloon Artist" />
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Short bio about this team member..." />
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <div className="flex items-center gap-3">
                {form.photo && <img src={form.photo} alt="" className="w-14 h-14 rounded-full object-cover" />}
                <label
                  className="cursor-pointer bg-muted hover:bg-muted/80 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openPhotoPicker();
                    }
                  }}
                >
                  <Image className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Photo'}
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhoto} disabled={uploading} ref={photoInputRef} />
                </label>
              </div>
              <Input
                placeholder="Or paste a photo URL..."
                value={form.photo}
                onChange={e => setForm({ ...form, photo: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Member</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
