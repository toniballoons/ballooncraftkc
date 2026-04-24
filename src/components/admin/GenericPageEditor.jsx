import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ImageUploadField from './ImageUploadField';

export default function GenericPageEditor({ content, setContent, pageKey }) {
  const update = (key, val) => setContent(prev => ({ ...prev, [key]: val }));

  const renderField = (key, val) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Image fields get upload UI
    if (typeof val === 'string' && (key.includes('image') || key.includes('img') || key.includes('bg_image') || key.includes('og_image'))) {
      return (
        <ImageUploadField key={key} label={label} value={val} onChange={v => update(key, v)} />
      );
    }
    if (typeof val === 'string') {
      const isLong = val.length > 200 || key === 'content';
      const isHtml = val.includes('<') && val.includes('>');
      return (
        <div key={key} className="space-y-1.5">
          <Label>{label}</Label>
          {(isLong || isHtml) ? (
            <Textarea value={val} onChange={e => update(key, e.target.value)} rows={isHtml ? 12 : 4} className={isHtml ? 'font-mono text-xs' : ''} />
          ) : (
            <Input value={val} onChange={e => update(key, e.target.value)} />
          )}
        </div>
      );
    }
    if (typeof val === 'boolean') {
      return (
        <div key={key} className="flex items-center gap-3">
          <input type="checkbox" id={key} checked={val} onChange={e => update(key, e.target.checked)} className="rounded" />
          <Label htmlFor={key}>{label}</Label>
        </div>
      );
    }
    if (typeof val === 'object' && val !== null) {
      return (
        <div key={key} className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{label} (complex — use JSON view)</Label>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {Object.entries(content || {}).map(([key, val]) => renderField(key, val))}
    </div>
  );
}