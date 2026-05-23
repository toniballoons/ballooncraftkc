import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Project from '@/entities/Project';
import * as Testimonial from '@/entities/Testimonial';
import { LOCAL_HOME_FAQS, LOCAL_SERVICE_AREAS, formatCanonicalUrl } from '@/lib/seo';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, ArrowRight, Sparkles, PartyPopper, Palette, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const ICON_MAP = [PartyPopper, Palette, Calendar];
const HOME_TITLE = 'Kansas City Balloon Decor, Garlands & Event Backdrops | BalloonCraft KC';
const HOME_DESCRIPTION = 'BalloonCraft KC creates custom balloon arches, garlands, walls, marquees, and event backdrops for weddings, birthdays, showers, school events, and corporate launches across Kansas City, Overland Park, Olathe, Lee\'s Summit, Lenexa, Leawood, Prairie Village, Shawnee, and nearby Johnson County venues.';
const HOME_KEYWORDS = 'Kansas City balloon decor, balloon garland Kansas City, balloon arch Kansas City, Overland Park balloon decor, Olathe balloon arch, Lee\'s Summit balloon garland, balloon wall Kansas City, corporate balloon decor Kansas City, wedding balloon decor Kansas City';

function HeroSection({ content }) {
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #ff6b6b, #feca57, #ff9ff3)';
  const decorations = theme?.decorations || ['🎈', '🎉'];
  const buttonStyle = theme?.buttonStyle || 'rounded-full';

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden" style={{ background: heroBg }} aria-labelledby="home-hero-title">
      <div className="absolute inset-0 flex flex-wrap gap-16 p-8 opacity-10 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="text-5xl" style={{ transform: `rotate(${(i * 37) % 60 - 30}deg)` }}>
            {decorations[i % decorations.length]}
          </span>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.8 }}>
          <span className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-bold mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" aria-hidden="true" /> {content.badge_text || 'Balloon Artistry'}
          </span>
          <h1 id="home-hero-title" className="font-display text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6 text-white drop-shadow-lg">
            {content.headline}
          </h1>
          <p className="text-lg text-white/80 max-w-lg mb-8 leading-relaxed">
            {content.subheadline}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className={`${buttonStyle} text-base px-8 font-bold bg-white text-primary hover:bg-white/90 shadow-lg`}>
              <Link to={content.cta_link || '/projects'}>{content.cta_text} <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" className={`${buttonStyle} text-base px-8 font-bold border border-slate-950/30 bg-slate-950/45 text-white shadow-[0_18px_30px_rgba(15,23,42,0.22)] backdrop-blur-md hover:bg-slate-950/60`}>
              <Link to={content.cta2_link || '/contact'}>{content.cta2_text}</Link>
            </Button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-white/10 rounded-3xl blur-xl" />
          <img
            src={content.image || 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800'}
            alt="Colorful balloon decorations for events"
            className="rounded-3xl shadow-2xl w-full object-cover relative z-10"
          />
        </motion.div>
      </div>
    </section>
  );
}

function ServicesSection({ content }) {
  const services = content.services?.length ? content.services : [
    { title: 'Event Decorations', description: 'Stunning balloon arches, columns, and centerpieces for any celebration.' },
    { title: 'Custom Designs', description: 'Unique balloon sculptures and installations tailored to your theme.' },
    { title: 'Full Service', description: 'From consultation to setup and teardown — we handle everything.' },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="font-display text-4xl mb-4">{content.services_title || 'What We Do'}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{content.services_subtitle || 'Bringing your balloon dreams to life with professional artistry and attention to detail'}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6, delay: i * 0.15 }} className="text-center p-8 rounded-3xl bg-muted/30 border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                {React.createElement(ICON_MAP[i % ICON_MAP.length], { className: 'w-8 h-8 text-primary', 'aria-hidden': true })}
              </div>
              <h3 className="font-bold text-xl mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProjectsSection({ content }) {
  const { data: projects = [] } = useQuery({
    queryKey: ['featured-projects'],
    queryFn: async () => {
      const results = await Project.filter({ status: 'published', featured: true });
      return results.slice(0, 3);
    },
    initialData: [],
  });

  if (projects.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="font-display text-4xl mb-4">{content.featured_projects_title || 'Featured Projects'}</h2>
          <p className="text-muted-foreground text-lg">{content.featured_projects_subtitle || 'A blend of recent installs, standout celebrations, and BalloonCraft KC updates'}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project, i) => (
            <motion.div key={project.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6, delay: i * 0.15 }}>
              <Link to={`/projects/${project.slug}`} className="group block">
                <div className="rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 bg-card">
                  {project.featured_image && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={project.featured_image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">{project.category?.replace('_', ' ')}</span>
                    <h3 className="font-bold text-lg mt-1 group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{project.excerpt}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg" className="rounded-full font-bold">
            <Link to="/projects">See All Work & Updates <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsPreview({ content }) {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['home-testimonials'],
    queryFn: async () => {
      const results = await Testimonial.filter({ status: 'approved', featured: true });
      return results.slice(0, 3);
    },
    initialData: [],
  });

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="font-display text-4xl mb-4">{content.testimonials_title || 'Happy Clients'}</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div key={t.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6, delay: i * 0.15 }}
              className="bg-muted/50 rounded-3xl p-8 border border-border/50">
              <div className="flex gap-1 mb-4" aria-label={`${t.rating || 5} out of 5 stars`}>
                {Array.from({ length: t.rating || 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />)}
              </div>
              <blockquote className="text-foreground/80 leading-relaxed mb-6 italic">"{t.quote}"</blockquote>
              <div className="flex items-center gap-3">
                {t.avatar_url && <img src={t.avatar_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />}
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceAreaSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center max-w-4xl mx-auto">
          <h2 className="font-display text-4xl mb-4">Serving Kansas City celebrations across the metro</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            BalloonCraft KC designs custom balloon decor for weddings, birthdays, baby showers, graduations, school events, brand activations, grand openings, and corporate installs throughout the Kansas City metro. We regularly serve venues, storefronts, homes, and event spaces across Missouri and Johnson County.
          </p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {LOCAL_SERVICE_AREAS.map((area) => (
            <span key={area} className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm">
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-14">
          <h2 className="font-display text-4xl mb-4">Kansas City balloon decor FAQs</h2>
          <p className="text-muted-foreground text-lg">
            Helpful answers for clients planning custom balloon installs, event backdrops, and statement decor in the KC metro.
          </p>
        </motion.div>
        <div className="grid gap-5">
          {LOCAL_HOME_FAQS.map((faq, index) => (
            <motion.article
              key={faq.question}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="rounded-[1.75rem] border border-border/70 bg-white p-6 shadow-sm"
            >
              <h3 className="font-bold text-lg">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed mt-3">{faq.answer}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const { theme } = useTheme();
  const [form, setForm] = React.useState({ firstName: '', email: '' });
  const [submitted, setSubmitted] = React.useState(false);

  const signupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/newsletter-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          email: form.email,
          source: 'homepage',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign up right now.');
      return data;
    },
    onSuccess: () => {
      setSubmitted(true);
      setForm({ firstName: '', email: '' });
      toast.success('You are subscribed. Check your inbox for confirmation.');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <section className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="rounded-[2rem] border shadow-xl overflow-hidden"
          style={{ background: theme?.hero?.bg || 'linear-gradient(135deg, #ec4899, #f59e0b)' }}
        >
          <div className="bg-slate-950/45 backdrop-blur-sm px-6 py-12 sm:px-10 lg:px-12">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4" />
                BalloonCraft KC updates
              </p>
              <h2 className="font-display text-4xl text-white mt-5">Get launch news, event inspiration, and seasonal ideas</h2>
              <p className="text-white/80 text-lg mt-4">
                Join the BalloonCraft KC email list for tasteful updates only. No laggy unsubscribe forms, no waiting weeks. If you ever want out, it is immediate.
              </p>
            </div>

            <div className="mt-8 rounded-[1.75rem] bg-white p-5 sm:p-6">
              {submitted ? (
                <div className="text-center py-6">
                  <h3 className="font-display text-2xl">You are on the list</h3>
                  <p className="text-muted-foreground mt-3">Your confirmation email is on the way.</p>
                </div>
              ) : (
                <form
                  className="grid gap-4 md:grid-cols-[0.8fr_1fr_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    signupMutation.mutate();
                  }}
                >
                  <Input
                    value={form.firstName}
                    onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                    placeholder="First name"
                    className="h-12 rounded-full"
                  />
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="Email address"
                    className="h-12 rounded-full"
                  />
                  <Button type="submit" className="h-12 rounded-full px-8 font-bold" disabled={signupMutation.isPending || !form.email}>
                    {signupMutation.isPending ? 'Joining...' : 'Join the list'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #e91e63, #ff5722)';
  return (
    <section className="py-20 text-white relative overflow-hidden" style={{ background: heroBg }} aria-labelledby="home-cta-title">
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}>
          <h2 id="home-cta-title" className="font-display text-4xl sm:text-5xl mb-6">Ready to Party?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">Let's create something extraordinary for your next event. Get in touch and let the magic begin!</p>
          <Button asChild size="lg" className="rounded-full text-base px-10 font-bold bg-white text-primary hover:bg-white/90">
            <Link to="/contact">Contact Us Today <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const { content } = useSiteContent('hero');

  React.useEffect(() => {
    const domain = typeof window !== 'undefined' ? window.location.hostname : 'www.ballooncraftkc.com';
    const canonical = formatCanonicalUrl(domain, '/');
    const setMeta = (selector, attr, key, value) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    document.title = HOME_TITLE;

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonical);

    setMeta('meta[name="description"]', 'name', 'description', HOME_DESCRIPTION);
    setMeta('meta[name="keywords"]', 'name', 'keywords', HOME_KEYWORDS);
    setMeta('meta[property="og:title"]', 'property', 'og:title', HOME_TITLE);
    setMeta('meta[property="og:description"]', 'property', 'og:description', HOME_DESCRIPTION);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    if (content?.image) {
      setMeta('meta[property="og:image"]', 'property', 'og:image', content.image);
      setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', content.image);
    }
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', HOME_TITLE);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', HOME_DESCRIPTION);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  }, [content]);

  return (
    <>
      <HeroSection content={content} />
      <ServicesSection content={content} />
      <ServiceAreaSection />
      <FeaturedProjectsSection content={content} />
      <TestimonialsPreview content={content} />
      <FaqSection />
      <NewsletterSection />
      <CTASection />
    </>
  );
}
