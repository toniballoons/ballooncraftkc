import React, { useState, useEffect } from 'react';
import * as ContactSubmission from '@/entities/ContactSubmission';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { formatCanonicalUrl } from '@/lib/seo';
import { getHeroTextStyles } from '@/lib/accessibility';
import { Button } from '@/components/ui/button';
// BalloonDecor removed — theme handles decoration
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };

export default function Contact() {
  const { content } = useSiteContent('contact');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #e91e63, #ff9800)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const [form, setForm] = useState({ name: '', email: '', phone: '', event_type: '', event_date: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'www.ballooncraftkc.com';

  useEffect(() => {
    const canonical = formatCanonicalUrl(domain, '/contact');
    const pageTitle = 'Contact BalloonCraft KC | Balloon Arches, Garlands & Event Backdrops in Kansas City';
    const description = 'Contact BalloonCraft KC for balloon arches, organic garlands, event backdrops, balloon walls, marquees, school-event decor, and corporate installs across Kansas City, Overland Park, Olathe, Lee’s Summit, and the surrounding metro.';
    let linkEl = document.querySelector('link[rel="canonical"]');
    if (!linkEl) { linkEl = document.createElement('link'); linkEl.rel = 'canonical'; document.head.appendChild(linkEl); }
    linkEl.href = canonical;

    document.title = pageTitle;

    const setMeta = (attr, prop, val) => {
      let el = document.querySelector(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.content = val;
    };
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:type', 'website');
    if (content.image) {
      setMeta('property', 'og:image', content.image);
      setMeta('name', 'twitter:image', content.image);
    }
    setMeta('name', 'description', description);
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', description);
    return () => { const el = document.querySelector('link[rel="canonical"]'); if (el) el.remove(); };
  }, [content, domain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ContactSubmission.create({ ...form, status: 'new' });
      // Fire-and-forget email notification — visitor sees success regardless
      fetch('/api/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).catch(err => console.error('Email notification failed:', err));
      setSubmitted(true);
      toast.success(content.form_success_message || 'Message sent!');
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const infoItems = [
    { icon: Mail, label: 'Email', value: content.email },
    { icon: Phone, label: 'Phone', value: content.phone },
    { icon: MapPin, label: 'Address', value: content.address },
    { icon: Clock, label: 'Hours', value: content.hours },
  ];

  return (
    <>
      <section className="relative py-24 overflow-hidden" style={{ background: heroBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.7 }} className="rounded-[2rem] px-6 py-8 sm:px-10 inline-block max-w-4xl" style={panelStyle}>
            <h1 className="font-display text-5xl sm:text-6xl mb-4 drop-shadow-lg" style={{ color: textColor }}>{content.title}</h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: mutedTextColor }}>{content.subtitle}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white overflow-hidden content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Force dark text on white background regardless of active theme */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start text-gray-900 [&_label]:text-gray-700 [&_input]:text-gray-900 [&_input]:placeholder:text-gray-400 [&_textarea]:text-gray-900 [&_textarea]:placeholder:text-gray-400 [&_h2]:text-gray-900 [&_p]:text-gray-600">
          {/* Form */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}>
            {submitted ? (
              <div className="bg-green-50 rounded-3xl p-12 text-center" role="status" aria-live="polite">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
                <h2 className="font-display text-2xl mb-2">Message Sent!</h2>
                <p className="text-muted-foreground">{content.form_success_message}</p>
                <Button className="mt-6 rounded-full" onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', event_type: '', event_date: '', message: '' }); }}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-display text-2xl mb-2">Send Us a Message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input id="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" className="rounded-xl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event Type</Label>
                    <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                      <SelectTrigger id="event_type" aria-label="Event Type" className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="baby_shower">Baby Shower</SelectItem>
                        <SelectItem value="graduation">Graduation</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date</Label>
                  <Input id="event_date" type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your event and what you're looking for..." className="rounded-xl" />
                </div>
                <Button type="submit" disabled={loading} size="lg" className="rounded-full w-full font-bold">
                  {loading ? 'Sending...' : <><Send className="w-4 h-4 mr-2" aria-hidden="true" /> Send Message</>}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6, delay: 0.2 }}>
            {content.image && (
              <img src={content.image} alt="Contact us" className="rounded-3xl shadow-xl mb-10 w-full" />
            )}
            <div className="rounded-[1.75rem] border border-border/60 bg-muted/30 p-6 mb-8">
              <h2 className="font-display text-2xl mb-3">Serving Kansas City and the surrounding metro</h2>
              <p className="text-muted-foreground leading-relaxed">
                Tell us about your event, venue, colors, and wishlist. We handle balloon arches, organic garlands, walls, backdrops, marquee moments, branded installs, and custom event styling for homes, venues, storefronts, schools, and corporate spaces across Kansas City, Overland Park, Olathe, Lee&apos;s Summit, Lenexa, Leawood, Prairie Village, Shawnee, Blue Springs, Liberty, and nearby communities.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <div className="rounded-[1.75rem] border border-border/60 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-lg mb-3">Popular service requests</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Balloon arches, organic garlands, balloon walls, photo backdrops, marquee letters, school-event decor, grand opening installs, and branded corporate displays.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-border/60 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-lg mb-3">Common event types</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Weddings, birthdays, showers, graduations, proms, homecomings, office parties, retail launches, community events, galas, and fundraisers.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              {infoItems.filter(item => item.value).map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.label}</p>
                    <p className="text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
              {/* Social Links */}
              {content.social_links && Object.entries(content.social_links).some(([,v]) => v && v !== '#') && (
                <div>
                  <p className="font-bold text-sm mb-3">Follow Us</p>
                  <div className="flex gap-3 flex-wrap">
                    {Object.entries(content.social_links).map(([key, url]) => {
                      if (!url || url === '#') return null;
                      return (
                        <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                          aria-label={`${key} (opens in a new tab)`}
                          className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors capitalize flex items-center gap-1.5">
                          {key} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
