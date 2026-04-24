import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/youraccount' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@youraccount' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/youraccount' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/youraccount' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourco' },
];

export default function ContactFormEditor({ content, setContent }) {
  const update = (key, val) => setContent(prev => ({ ...prev, [key]: val }));
  const updateSocial = (key, val) => {
    setContent(prev => ({
      ...prev,
      social_links: { ...(prev.social_links || {}), [key]: val }
    }));
  };

  const social = content.social_links || {};

  return (
    <div className="space-y-6">
      {/* Basic contact info */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Page Title</Label>
          <Input value={content.title || ''} onChange={e => update('title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Subtitle</Label>
          <Textarea value={content.subtitle || ''} onChange={e => update('subtitle', e.target.value)} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={content.email || ''} onChange={e => update('email', e.target.value)} placeholder="hello@yourbusiness.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={content.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="(555) 123-4567" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input value={content.address || ''} onChange={e => update('address', e.target.value)} placeholder="123 Main St, City, State" />
        </div>
        <div className="space-y-1.5">
          <Label>Business Hours</Label>
          <Input value={content.hours || ''} onChange={e => update('hours', e.target.value)} placeholder="Mon-Fri: 9am-6pm" />
        </div>
        <div className="space-y-1.5">
          <Label>Form Success Message</Label>
          <Textarea value={content.form_success_message || ''} onChange={e => update('form_success_message', e.target.value)} rows={2} />
        </div>
        <ImageUploadField
          label="Contact Section Image"
          value={content.image}
          onChange={v => update('image', v)}
          aspectRatio="aspect-video"
        />
      </div>

      {/* Social Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Social Media Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <Link className="w-3.5 h-3.5 text-muted-foreground" /> {label}
              </Label>
              <Input
                value={social[key] || ''}
                onChange={e => updateSocial(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}