import React, { useState } from 'react';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import {
  GEO_CITIES,
  PRIMARY_EVENT_PHRASES,
  PRIMARY_SERVICE_PHRASES,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLocalBusinessJsonLd,
  buildSeoKeywordSet,
  buildServiceJsonLd,
} from '@/lib/seo';
import { usePageSeo } from '@/lib/usePageSeo';
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
const SERVICE_CITIES = GEO_CITIES.filter(city => city !== 'Other');
const CONTACT_FAQS = [
  {
    question: 'How do I book balloon decor in Kansas City?',
    answer: 'Send us your event date, venue, city, and the kind of balloon decor you need. We use that information to recommend the right design direction and next steps for your quote.',
  },
  {
    question: 'Do you travel outside Kansas City?',
    answer: 'Yes. We serve Kansas City plus nearby metro communities including Overland Park, Olathe, Lee\'s Summit, Shawnee, Lenexa, Leawood, Prairie Village, and Independence.',
  },
  {
    question: 'What events do you commonly style?',
    answer: 'We regularly create balloon decor for weddings, birthday parties, baby showers, graduations, school events, corporate functions, galas, and grand openings.',
  },
];
const CONTACT_KEYWORDS = buildSeoKeywordSet(PRIMARY_SERVICE_PHRASES, PRIMARY_EVENT_PHRASES, [
  'contact balloon decorator Kansas City',
  'balloon quote Kansas City',
  'balloon installation quote Kansas City',
  'balloon decor inquiry Kansas City',
  'balloon decor Overland Park',
  'balloon decorator Olathe',
]);

export default function Contact() {
  const { content } = useSiteContent('contact');
  const { content: footerContent } = useSiteContent('footer');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #e91e63, #ff9800)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const [form, setForm] = useState({ name: '', email: '', phone: '', event_type: '', event_date: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const successMessage = 'We have received your message and will be in touch shortly.';
  const seoTitle = 'Contact BalloonCraft KC | Kansas City Balloon Decor Quotes';
  const seoDescription = 'Request a BalloonCraft KC quote for balloon arches, garlands, walls, backdrops, and event installs in Kansas City, Overland Park, Olathe, Lee\'s Summit, Lenexa, Leawood, Shawnee, and nearby metro communities.';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Email request failed');
      }

      setSubmitted(true);
      toast.success(successMessage);
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    path: '/contact',
    image: content.image || '/logo.png',
    keywords: CONTACT_KEYWORDS,
    schema: [
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact' },
      ]),
      buildLocalBusinessJsonLd({
        title: 'BalloonCraft KC',
        description: seoDescription,
        path: '/contact',
        image: content.image || '/logo.png',
        contactContent: content,
        footerContent,
      }),
      buildServiceJsonLd({
        serviceName: 'Balloon decor quotes, delivery, setup, and installation',
        description: seoDescription,
        path: '/contact',
        image: content.image || '/logo.png',
        footerContent,
      }),
      buildFaqJsonLd(CONTACT_FAQS),
    ],
  });

  const infoItems = [
    { icon: Mail, label: 'Email', value: content.email },
    { icon: Phone, label: 'Phone', value: content.phone },
    { icon: MapPin, label: 'Address', value: content.address },
    { icon: Clock, label: 'Hours', value: content.hours },
  ];
  const telHref = content.phone ? `tel:${content.phone.replace(/[^\d+]/g, '')}` : null;
  const mailHref = content.email ? `mailto:${content.email}` : null;

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
                <h2 className="font-display text-2xl mb-2">Message Received</h2>
                <p className="text-muted-foreground">{successMessage}</p>
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
              <img src={content.image} alt="BalloonCraft KC event consultation and balloon decor planning" className="rounded-3xl shadow-xl mb-10 w-full" decoding="async" />
            )}
            <div className="rounded-[2rem] border border-border/40 bg-muted/25 p-6 mb-8">
              <h2 className="font-display text-2xl mb-3">Request balloon decor in the Kansas City metro</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Reach out for custom balloon arches, balloon garlands, balloon walls, and backdrop installs for weddings, birthdays, baby showers, graduations, corporate events, and grand openings.
              </p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CITIES.map(city => (
                  <span key={city} className="rounded-full border border-border/40 bg-white px-3 py-1 text-xs font-medium text-foreground">
                    {city}
                  </span>
                ))}
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
                    {item.label === 'Email' && mailHref ? (
                      <a href={mailHref} className="text-muted-foreground hover:text-primary transition-colors">{item.value}</a>
                    ) : item.label === 'Phone' && telHref ? (
                      <a href={telHref} className="text-muted-foreground hover:text-primary transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-muted-foreground">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
              <div className="rounded-[2rem] border border-border/40 bg-white p-6 shadow-sm">
                <h2 className="font-display text-2xl mb-4">What to include in your inquiry</h2>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Your event date and city</p>
                  <p>The venue or type of setup space</p>
                  <p>The balloon decor you have in mind: arch, garland, wall, backdrop, or custom installation</p>
                  <p>Any theme, school colors, or brand colors we should match</p>
                </div>
              </div>
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
              <div className="space-y-4 pt-2">
                {CONTACT_FAQS.map(faq => (
                  <div key={faq.question} className="rounded-2xl border border-border/40 bg-white p-5 shadow-sm">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
