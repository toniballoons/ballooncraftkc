import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import TeamEditor from './TeamEditor';

export default function AboutEditor({ content, setContent }) {
  const update = (key, val) => setContent(prev => ({ ...prev, [key]: val }));
  const values = content.values || [];

  const updateValue = (i, key, val) => {
    const updated = values.map((v, idx) => idx === i ? { ...v, [key]: val } : v);
    update('values', updated);
  };
  const addValue = () => update('values', [...values, { title: '', description: '' }]);
  const removeValue = (i) => update('values', values.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Page Title</Label>
        <Input value={content.title || ''} onChange={e => update('title', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Subtitle</Label>
        <Input value={content.subtitle || ''} onChange={e => update('subtitle', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Intro Text</Label>
        <Textarea value={content.intro || ''} onChange={e => update('intro', e.target.value)} rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label>Story Title</Label>
        <Input value={content.story_title || ''} onChange={e => update('story_title', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Story</Label>
        <Textarea value={content.story || ''} onChange={e => update('story', e.target.value)} rows={4} />
      </div>
      <div className="space-y-1.5">
        <Label>Mission Title</Label>
        <Input value={content.mission_title || ''} onChange={e => update('mission_title', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Mission Statement</Label>
        <Textarea value={content.mission || ''} onChange={e => update('mission', e.target.value)} rows={2} />
      </div>
      <ImageUploadField
        label="About Page Image"
        value={content.image}
        onChange={v => update('image', v)}
        aspectRatio="aspect-video"
      />

      {/* Values */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Our Values</Label>
          <Button size="sm" variant="outline" onClick={addValue} className="text-xs h-7">
            <Plus className="w-3 h-3 mr-1" /> Add Value
          </Button>
        </div>
        <div className="space-y-2">
          {values.map((v, i) => (
            <Card key={i}>
              <CardContent className="p-3 space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} placeholder="Value title" className="h-8 text-sm" />
                    <Textarea value={v.description} onChange={e => updateValue(i, 'description', e.target.value)} placeholder="Description..." rows={2} className="text-sm" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 mt-1 flex-shrink-0" onClick={() => removeValue(i)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="space-y-1.5">
        <Label>Team Section Title</Label>
        <Input value={content.team_title || ''} onChange={e => update('team_title', e.target.value)} />
      </div>
      <TeamEditor team={content.team || []} onChange={(team) => update('team', team)} />
    </div>
  );
}