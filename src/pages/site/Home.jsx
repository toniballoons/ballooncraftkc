import React from 'react';
import { Link } from 'react-router-dom';
import { useAllSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import * as Project from '@/entities/Project';
import * as Testimonial from '@/entities/Testimonial';
import {
  GEO_CITIES,
  PRIMARY_EVENT_PHRASES,
  PRIMARY_SERVICE_PHRASES,
  SERVICE_TYPES,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
  buildSeoKeywordSet,
  buildServiceJsonLd,
  buildWebsiteJsonLd,
} from '@/lib/seo';
import { usePageSeo } from '@/lib/usePageSeo';

import { Button } from '@/components/ui/button';
import { Star, ArrowRight, Sparkles, PartyPopper, Palette, Calendar, Briefcase, Camera, Truck, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const ICON_MAP = [PartyPopper, Palette, Calendar, Briefcase, Camera, Truck];
const SERVICE_CITIES = GEO_CITIES.filter(city => city !== 'Other');
const HOME_FAQS = [
  {
    question: 'What kinds of balloon decor do you offer in Kansas City?',
    answer: 'We design balloon arches, garlands, columns, walls, photo backdrops, sculptures, marquee-letter installs, and custom balloon displays for private and corporate events across the Kansas City metro.',
  },
  {
    question: 'Which areas around Kansas City do you serve?',
    answer: 'We regularly serve Kansas City, Overland Park, Olathe, Lee\'s Summit, Shawnee, Lenexa, Leawood, Prairie Village, Independence, and nearby KC metro venues.',
  },
  {
    question: 'Do you handle delivery and on-site installation?',
    answer: 'Yes. We can coordinate delivery, setup, and installation so your balloon decor is event-ready for weddings, birthdays, grand openings, galas, showers, and corporate activations.',
  },
  {
    question: 'Can you match my event theme or brand colors?',
    answer: 'Absolutely. We build custom color palettes and balloon styling plans for venue aesthetics, school colors, seasonal themes, and branded business events.',
  },
];
const HOME_KEYWORDS = buildSeoKeywordSet(
  PRIMARY_SERVICE_PHRASES,
  PRIMARY_EVENT_PHRASES,
  SERVICE_TYPES,
  [
    'custom balloon decor Kansas City',
    'balloon decor Overland Park',
    'balloon decorations Overland Park',
    'balloon garland Olathe',
    'balloon installations Leawood',
    'balloon arch Lee\'s Summit',
    'grand opening balloons Kansas City',
    'corporate balloon installations Kansas City',
  ]
);

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
            alt="Custom balloon arch and garland installation for a Kansas City event"
            className="rounded-3xl shadow-2xl w-full object-cover relative z-10"
            fetchPriority="high"
            decoding="async"
          />
        </motion.div>
      </div>
    </section>
  );
}

function ServicesSection({ content }) {
  const services = content.services?.length ? content.services : [
    { title: 'Balloon Arches & Garlands', description: 'Organic balloon arches and garlands tailored to birthdays, weddings, showers, and graduation parties across Kansas City.' },
    { title: 'Balloon Walls & Backdrops', description: 'Photo-ready balloon walls, backdrops, and branded installs that create a standout focal point for guests and event photography.' },
    { title: 'Wedding & Shower Styling', description: 'Elegant balloon decor for wedding receptions, bridal showers, engagement parties, and baby showers with cohesive color palettes.' },
    { title: 'Corporate Events & Grand Openings', description: 'Professional balloon decor for conferences, galas, retail launches, ribbon cuttings, employee events, and brand activations.' },
    { title: 'Custom Themes & Color Matching', description: 'Personalized balloon styling that matches school colors, seasonal themes, venue aesthetics, and business branding.' },
    { title: 'Delivery, Setup & Installation', description: 'Stress-free Kansas City metro delivery and on-site installation so your decor is polished, secure, and event-ready on time.' },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-16">
          <h2 className="font-display text-4xl mb-4">{content.services_title || 'Kansas City Balloon Decor Services'}</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">{content.services_subtitle || 'From organic balloon garlands to large-scale event installs, we create custom balloon decor for Kansas City celebrations, corporate events, and service-area venues throughout the metro.'}</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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

function LocalSeoSection() {
  return (
    <section className="py-20 bg-white content-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-5">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Serving the Kansas City Metro
            </span>
            <h2 className="font-display text-4xl mb-5">Balloon decor for weddings, birthdays, baby showers, graduations, and corporate events</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              BalloonCraft KC helps planners, venues, businesses, and families create memorable events with custom balloon arches, balloon garlands, balloon walls, backdrops, sculptures, and on-site installations. Whether you need a polished grand opening display, a wedding reception focal point, or a playful birthday balloon setup, we tailor every design to the space, audience, and theme.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Photo-worthy installs for milestone celebrations and venue moments',
                'Delivery and setup across Kansas City, Overland Park, Olathe, Lee\'s Summit, and nearby communities',
                'Custom color palettes for school events, brand launches, and seasonal parties',
                'Professional support for grand openings, galas, employee events, and activations',
              ].map(item => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/50 bg-muted/25 p-8">
            <h3 className="font-display text-2xl mb-4">Popular service areas</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {SERVICE_CITIES.map(city => (
                <span key={city} className="rounded-full bg-white px-3 py-1 text-sm text-foreground shadow-sm border border-border/40">
                  {city}
                </span>
              ))}
            </div>
            <h3 className="font-display text-2xl mb-4">Common event requests</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Balloon arches for entrances and dessert tables</p>
              <p>Balloon garlands for homes, schools, storefronts, and event venues</p>
              <p>Balloon walls and backdrops for photo booths, showers, and corporate branding</p>
              <p>Statement installs for weddings, galas, launch parties, and ribbon cuttings</p>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button asChild className="rounded-full font-bold">
                <Link to="/contact">Request a Quote</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full font-bold">
                <Link to="/projects">Browse the Portfolio</Link>
              </Button>
            </div>
          </div>
        </motion.div>
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
          <p className="text-muted-foreground text-lg">{content.featured_projects_subtitle || 'A glimpse of our recent balloon installations'}</p>
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

function FaqSection() {
  return (
    <section className="py-20 bg-muted/25 content-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center mb-14">
          <h2 className="font-display text-4xl mb-4">Kansas City balloon decor FAQ</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Quick answers about balloon installations, service areas, and the kinds of events we help style across the KC metro.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HOME_FAQS.map((faq, index) => (
            <motion.article
              key={faq.question}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-[2rem] border border-border/50 bg-white p-7 shadow-sm"
            >
              <h3 className="font-bold text-lg mb-3">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { content: siteContent } = useAllSiteContent();
  const content = siteContent.hero || {};
  const contactContent = siteContent.contact || {};
  const footerContent = siteContent.footer || {};

  const seoTitle = 'Kansas City Balloon Decor, Arches & Garlands | BalloonCraft KC';
  const seoDescription = 'Custom balloon arches, garlands, walls, and backdrops for weddings, birthdays, baby showers, school events, and corporate launches in Kansas City, Overland Park, Olathe, Lee\'s Summit, Lenexa, Leawood, and across the KC metro.';

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    path: '/',
    image: content.image || '/logo.png',
    keywords: HOME_KEYWORDS,
    schema: [
      buildWebsiteJsonLd({
        title: 'BalloonCraft KC',
        description: seoDescription,
        path: '/',
      }),
      buildOrganizationJsonLd({
        title: 'BalloonCraft KC',
        contactContent,
        footerContent,
      }),
      buildLocalBusinessJsonLd({
        title: 'BalloonCraft KC',
        description: seoDescription,
        path: '/',
        image: content.image || '/logo.png',
        contactContent,
        footerContent,
      }),
      buildServiceJsonLd({
        serviceName: 'Custom balloon decor, balloon arches, garlands, and event backdrops',
        description: seoDescription,
        path: '/',
        image: content.image || '/logo.png',
        footerContent,
      }),
      buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }]),
      buildFaqJsonLd(HOME_FAQS),
    ],
  });

  return (
    <>
      <HeroSection content={content} />
      <ServicesSection content={content} />
      <LocalSeoSection />
      <FeaturedProjectsSection content={content} />
      <TestimonialsPreview content={content} />
      <FaqSection />
      <CTASection />
    </>
  );
}
