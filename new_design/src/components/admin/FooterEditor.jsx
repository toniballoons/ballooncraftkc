import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

export default function FooterEditor({ content, setContent }) {
  const update = (key, val) => setContent(prev => ({ ...prev, [key]: val }));
  const links = content.links || [];

  const updateLink = (i, key, val) => {
    const updated = links.map((l, idx) => idx === i ? { ...l, [key]: val } : l);
    update('links', updated);
  };
  const addLink = () => update('links', [...links, { label: '', href: '/' }]);
  const removeLink = (i) => update('links', links.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Company Name</Label>
        <Input value={content.company_name || ''} onChange={e => update('company_name', e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Tagline</Label>
        <Textarea value={content.tagline || ''} onChange={e => update('tagline', e.target.value)} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label>Copyright Text</Label>
        <Input value={content.copyright || ''} onChange={e => update('copyright', e.target.value)} placeholder="© 2026 Your Business. All rights reserved." />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Footer Links</Label>
          <Button size="sm" variant="outline" onClick={addLink} className="text-xs h-7">
            <Plus className="w-3 h-3 mr-1" /> Add Link
          </Button>
        </div>
        <div className="space-y-2">
          {links.map((link, i) => (
            <Card key={i}>
              <CardContent className="p-3 flex items-center gap-2">
                <Input value={link.label} onChange={e => updateLink(i, 'label', e.target.value)} placeholder="Label" className="flex-1 h-8 text-sm" />
                <Input value={link.href} onChange={e => updateLink(i, 'href', e.target.value)} placeholder="/page" className="flex-1 h-8 text-sm" />
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeLink(i)} aria-label={`Remove ${link.label || 'footer link'}`}>
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
