import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import * as Project from '@/entities/Project';
import * as Testimonial from '@/entities/Testimonial';
import { formatCanonicalUrl } from '@/lib/seo';
import { getHeroTextStyles } from '@/lib/accessibility';

import { Button } from '@/components/ui/button';
import { Star, ArrowRight, Sparkles, PartyPopper, Palette, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };

function HeroSection({ content }) {
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #ff6b6b, #feca57, #ff9ff3)';
  const decorations = theme?.decorations || ['🎈','🎉'];
  const buttonStyle = theme?.buttonStyle || 'rounded-full';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden" style={{ background: heroBg }} aria-labelledby="home-hero-title">
      {/* Theme decoration emojis as subtle background */}
      <div className="absolute inset-0 flex flex-wrap gap-16 p-8 opacity-10 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="text-5xl" style={{ transform: `rotate(${(i * 37) % 60 - 30}deg)` }}>
            {decorations[i % decorations.length]}
          </span>
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.8 }} className="rounded-[2rem] p-6 sm:p-8" style={panelStyle}>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6 backdrop-blur-sm" style={{ backgroundColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.18)' : 'rgba(17,24,39,0.08)', color: textColor }}>
            <Sparkles className="w-4 h-4" aria-hidden="true" /> Balloon Artistry
          </span>
          <h1 id="home-hero-title" className="font-display text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6 drop-shadow-lg" style={{ color: textColor }}>
            {content.headline}
          </h1>
          <p className="text-lg max-w-lg mb-8 leading-relaxed" style={{ color: mutedTextColor }}>
            {content.subheadline}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className={`${buttonStyle} text-base px-8 font-bold bg-white text-primary hover:bg-white/90 shadow-lg`}>
              <Link to={content.cta_link || '/projects'}>{content.cta_text} <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" className={`${buttonStyle} text-base px-8 font-bold border-2 border-white text-white bg-transparent hover:bg-white/20`}>
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

function ServicesSection() {
  const services = [
    { icon: PartyPopper, title: 'Event Decorations', desc: 'Stunning balloon arches, columns, and centerpieces for any celebration.' },
    { icon: Palette, title: 'Custom Designs', desc: 'Unique balloon sculptures and installations tailored to your theme.' },
    { icon: Calendar, title: 'Full Service', desc: 'From consultation to setup and teardown — we handle everything.' },
  ];

  return (
    <section className="py-20 bg-white content-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="font-display text-4xl mb-4">What We Do</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Bringing your balloon dreams to life with professional artistry and attention to detail</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((s, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6, delay: i * 0.15 }}
              className="text-center p-8 rounded-3xl bg-muted/30 border border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <s.icon className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-xl mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProjectsSection() {
  const { data: projects = [] } = useQuery({
    queryKey: ['featured-projects'],
    queryFn: () => Project.filter({ status: 'published', featured: true }),
    initialData: [],
  });

  if (projects.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50 content-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="font-display text-4xl mb-4">Featured Projects</h2>
          <p className="text-muted-foreground text-lg">A glimpse of our recent balloon installations</p>
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
            <Link to="/projects">View All Projects <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsPreview() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['home-testimonials'],
    queryFn: () => Testimonial.filter({ status: 'approved', featured: true }),
    initialData: [],
  });

  if (testimonials.length === 0) return null;

  return (
    <section className="py-20 bg-white content-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="font-display text-4xl mb-4">Happy Clients</h2>
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

function CTASection() {
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #e91e63, #ff5722)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  return (
    <section className="py-20 relative overflow-hidden" style={{ background: heroBg }} aria-labelledby="home-cta-title">
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="rounded-[2rem] p-6 sm:p-8" style={panelStyle}>
          <h2 id="home-cta-title" className="font-display text-4xl sm:text-5xl mb-6" style={{ color: textColor }}>Ready to Party?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: mutedTextColor }}>Let's create something extraordinary for your next event. Get in touch and let the magic begin!</p>
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
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'ballooncraft.com';

  useEffect(() => {
    const canonical = formatCanonicalUrl(domain, '/');
    let linkEl = document.querySelector('link[rel="canonical"]');
    if (!linkEl) { linkEl = document.createElement('link'); linkEl.rel = 'canonical'; document.head.appendChild(linkEl); }
    linkEl.href = canonical;
    const setMeta = (prop, val) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.content = val;
    };
    setMeta('og:title', content.headline || 'BalloonCraft — Kansas City Balloon Decorations');
    setMeta('og:description', content.subheadline || 'Professional balloon decorations for weddings, birthdays, corporate events and more in Kansas City.');
    setMeta('og:url', canonical);
    return () => { const el = document.querySelector('link[rel="canonical"]'); if (el) el.remove(); };
  }, [content, domain]);

  return (
    <>
      <HeroSection content={content} />
      <ServicesSection />
      <FeaturedProjectsSection />
      <TestimonialsPreview />
      <CTASection />
    </>
  );
}
