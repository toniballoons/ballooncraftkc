import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Plus, Sparkles, TimerReset, Trash2 } from 'lucide-react';

import {
  armFlashSale,
  buildFlashSaleMessage,
  disableFlashSale,
  getFlashSaleCountdownLabel,
  isFlashSaleActive,
  normalizeFlashSale,
} from '@/lib/flashSale';

const OFFER_TYPE_OPTIONS = [
  { value: 'percent', label: 'Percent off' },
  { value: 'dollars', label: 'Dollar amount off' },
  { value: 'freebie', label: 'Free add-on or bonus' },
  { value: 'custom', label: 'Custom offer wording' },
];

const MENTION_CHANNEL_OPTIONS = [
  { value: 'phone_or_email', label: 'Phone or email' },
  { value: 'phone', label: 'Phone only' },
  { value: 'email', label: 'Email only' },
];

export default function NavbarEditor({ content, setContent }) {
  const update = (key, val) => setContent(prev => ({ ...prev, [key]: val }));
  const links = content.links || [];
  const flashSale = normalizeFlashSale(content.flash_sale);
  const flashSaleActive = isFlashSaleActive(flashSale);
  const countdownLabel = getFlashSaleCountdownLabel(flashSale);
  const flashSaleMessage = buildFlashSaleMessage(flashSale);

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
  const updateFlashSale = (key, value) => {
    update('flash_sale', { ...flashSale, [key]: value });
  };
  const startFlashSale = () => {
    update('flash_sale', armFlashSale(flashSale, flashSale.duration_minutes));
  };
  const stopFlashSale = () => {
    update('flash_sale', disableFlashSale(flashSale));
  };
  const offerValueLabel = flashSale.offer_type === 'percent'
    ? 'Percent off'
    : 'Dollar amount off';
  const offerValuePlaceholder = flashSale.offer_type === 'percent' ? '15' : '100';

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
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="space-y-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="w-4 h-4" />
            Flash sale banner
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Run a short sale above the site navigation for new inquiries. Staff can edit the message here, start the timer, and save the CMS when it looks right.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="flash-sale-live" className="text-sm font-semibold">
                  Flash sale live
                </Label>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${flashSaleActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {flashSaleActive ? 'Live now' : 'Off'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Turning this on starts the countdown immediately. Turning it off removes the banner.
              </p>
            </div>
            <Switch
              id="flash-sale-live"
              checked={flashSaleActive}
              onCheckedChange={(checked) => {
                if (checked) {
                  startFlashSale();
                } else {
                  stopFlashSale();
                }
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Banner label</Label>
              <Input
                value={flashSale.label || ''}
                onChange={(e) => updateFlashSale('label', e.target.value)}
                placeholder="FLASH SALE"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Countdown length in minutes</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={flashSale.duration_minutes || 60}
                onChange={(e) => updateFlashSale('duration_minutes', e.target.value)}
                placeholder="60"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Offer style</Label>
              <Select
                value={flashSale.offer_type}
                onValueChange={(value) => updateFlashSale('offer_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an offer style" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {flashSale.offer_type === 'percent' || flashSale.offer_type === 'dollars' ? (
              <div className="space-y-1.5">
                <Label>{offerValueLabel}</Label>
                <Input
                  value={flashSale.offer_value || ''}
                  onChange={(e) => updateFlashSale('offer_value', e.target.value)}
                  placeholder={offerValuePlaceholder}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Promo code</Label>
              <Input
                value={flashSale.promo_code || ''}
                onChange={(e) => updateFlashSale('promo_code', e.target.value)}
                placeholder="SUMMER20"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Where should they mention it?</Label>
              <Select
                value={flashSale.mention_channel}
                onValueChange={(value) => updateFlashSale('mention_channel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose where they should mention it" />
                </SelectTrigger>
                <SelectContent>
                  {MENTION_CHANNEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(flashSale.offer_type === 'freebie' || flashSale.offer_type === 'custom') ? (
            <div className="space-y-1.5">
              <Label>Offer wording</Label>
              <Textarea
                value={flashSale.fixed_text || ''}
                onChange={(e) => updateFlashSale('fixed_text', e.target.value)}
                placeholder="Free upgrade to a deluxe grab-and-go garland for new bookings over $500."
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Extra note or fine print</Label>
            <Textarea
              value={flashSale.extra_note || ''}
              onChange={(e) => updateFlashSale('extra_note', e.target.value)}
              placeholder="Valid for new bookings only. Not stackable with other offers."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={startFlashSale}>
              <TimerReset className="w-4 h-4 mr-1" />
              {flashSaleActive ? 'Restart timer' : 'Start flash sale now'}
            </Button>
            <Button type="button" variant="outline" onClick={stopFlashSale}>
              Turn off banner
            </Button>
          </div>

          <div className="rounded-2xl border bg-background/80 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-primary" />
              Banner preview
            </div>
            <div className="rounded-2xl border border-black/10 bg-[linear-gradient(135deg,#ffefe1_0%,#ffd19a_38%,#ff9f68_100%)] px-4 py-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-2 md:items-center">
                  <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white">
                    {flashSale.label || 'FLASH SALE'}
                  </span>
                  <p className="text-sm font-semibold text-slate-950/90">
                    {flashSaleMessage}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-900">
                  {flashSaleActive ? countdownLabel : `${flashSale.duration_minutes || 60} min timer ready`}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Save the CMS after you start or edit the sale so the live site updates with the latest banner.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
