import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ImageUploadField from './ImageUploadField';

export default function HeroEditor({ content, setContent }) {
  const update = (key, val) => setContent(prev => ({ ...prev, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Headline</Label>
        <Input value={content.headline || ''} onChange={e => update('headline', e.target.value)} placeholder="Creating Magic with Balloons" />
      </div>
      <div className="space-y-1.5">
        <Label>Subheadline</Label>
        <Textarea value={content.subheadline || ''} onChange={e => update('subheadline', e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Primary Button Text</Label>
          <Input value={content.cta_text || ''} onChange={e => update('cta_text', e.target.value)} placeholder="See Our Work" />
        </div>
        <div className="space-y-1.5">
          <Label>Primary Button Link</Label>
          <Input value={content.cta_link || ''} onChange={e => update('cta_link', e.target.value)} placeholder="/projects" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Secondary Button Text</Label>
          <Input value={content.cta2_text || ''} onChange={e => update('cta2_text', e.target.value)} placeholder="Get a Quote" />
        </div>
        <div className="space-y-1.5">
          <Label>Secondary Button Link</Label>
          <Input value={content.cta2_link || ''} onChange={e => update('cta2_link', e.target.value)} placeholder="/contact" />
        </div>
      </div>
      <ImageUploadField
        label="Hero Image"
        value={content.image}
        onChange={v => update('image', v)}
        aspectRatio="aspect-video"
      />
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="show_balloons"
          checked={!!content.show_floating_balloons}
          onChange={e => update('show_floating_balloons', e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="show_balloons">Show floating balloons decoration</Label>
      </div>
    </div>
  );
}