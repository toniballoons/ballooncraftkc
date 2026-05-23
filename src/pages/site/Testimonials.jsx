import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Testimonial from '@/entities/Testimonial';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { formatCanonicalUrl } from '@/lib/seo';
import { getHeroTextStyles } from '@/lib/accessibility';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };

export default function Testimonials() {
  const { content } = useSiteContent('testimonials');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #fd79a8, #a29bfe)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'www.ballooncraftkc.com';

  useEffect(() => {
    const canonical = formatCanonicalUrl(domain, '/testimonials');
    const pageTitle = 'Kansas City Balloon Decor Reviews | BalloonCraft KC';
    const description = content.subtitle || 'Read BalloonCraft KC client reviews for weddings, birthdays, showers, school events, and corporate installs across the Kansas City metro.';
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
    setMeta('name', 'description', description);
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', description);
    return () => { const el = document.querySelector('link[rel="canonical"]'); if (el) el.remove(); };
  }, [content, domain]);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['testimonials-public'],
    queryFn: () => Testimonial.filter({ status: 'approved' }),
    initialData: [],
  });

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

      <section className="py-20 bg-white content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.75rem] border border-border/60 bg-muted/30 p-6 mb-8">
            <p className="text-muted-foreground leading-relaxed">
              These reviews reflect the kinds of installs BalloonCraft KC creates across Kansas City, Overland Park, Olathe, Lee&apos;s Summit, and the surrounding metro, from birthdays and baby showers to school celebrations, grand openings, and polished corporate events.
            </p>
          </div>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">Loading testimonials...</div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">No testimonials yet. Check back soon!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                  className="relative bg-gradient-to-br from-muted/30 to-white rounded-3xl p-8 shadow-lg border border-border/30 hover:shadow-xl transition-shadow"
                >
                  <Quote className="w-8 h-8 text-primary/20 absolute top-6 right-6" aria-hidden="true" />
                  <div className="flex gap-1 mb-4" aria-label={`${t.rating || 5} out of 5 stars`}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`w-4 h-4 ${j < (t.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-muted-foreground leading-relaxed mb-6 italic">"{t.quote}"</blockquote>
                  <div className="flex items-center gap-3">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt={t.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-primary text-lg">{t.name?.[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{t.name}</p>
                      {t.role && <p className="text-xs text-muted-foreground">{t.role}</p>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
