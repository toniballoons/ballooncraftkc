import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

export default function NavbarEditor({ content, setContent }) {
  const update = (key, val) => setContent(prev => ({ ...prev, [key]: val }));
  const links = content.links || [];

  const updateLink = (i, key, val) => {
    const updated = links.map((l, idx) => idx === i ? { ...l, [key]: val } : l);
    update('links', updated);
  };
  const addLink = () => update('links', [...links, { label: '', href: '/' }]);
  const removeLink = (i) => update('links', links.filter((_, idx) => idx !== i));
  const moveUp = (i) => {
    if (i === 0) return;
    const updated = [...links];
    [updated[i-1], updated[i]] = [updated[i], updated[i-1]];
    update('links', updated);
  };
  const moveDown = (i) => {
    if (i === links.length - 1) return;
    const updated = [...links];
    [updated[i], updated[i+1]] = [updated[i+1], updated[i]];
    update('links', updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Logo / Brand Name</Label>
        <Input value={content.logo_text || ''} onChange={e => update('logo_text', e.target.value)} placeholder="BalloonCraft" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Navigation Links</Label>
          <Button size="sm" variant="outline" onClick={addLink} className="text-xs h-7">
            <Plus className="w-3 h-3 mr-1" /> Add Link
          </Button>
        </div>
        <div className="space-y-2">
          {links.map((link, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <button type="button" onClick={() => moveUp(i)} disabled={i===0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none" aria-label={`Move ${link.label || 'navigation link'} up`}>▲</button>
                  <button type="button" onClick={() => moveDown(i)} disabled={i===links.length-1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none" aria-label={`Move ${link.label || 'navigation link'} down`}>▼</button>
                </div>
                <Input value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} placeholder="Label" className="flex-1 h-8 text-sm" />
                <Input value={link.href} onChange={e => updateLink(i, 'href', e.target.value)} placeholder="/page" className="flex-1 h-8 text-sm" />
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeLink(i)} aria-label={`Remove ${link.label || 'navigation link'}`}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
