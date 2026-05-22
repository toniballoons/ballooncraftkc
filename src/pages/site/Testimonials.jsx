import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as Testimonial from '@/entities/Testimonial';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import {
  PRIMARY_EVENT_PHRASES,
  PRIMARY_SERVICE_PHRASES,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildSeoKeywordSet,
} from '@/lib/seo';
import { usePageSeo } from '@/lib/usePageSeo';
import { getHeroTextStyles } from '@/lib/accessibility';
import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const TESTIMONIAL_KEYWORDS = buildSeoKeywordSet(PRIMARY_SERVICE_PHRASES, PRIMARY_EVENT_PHRASES, [
  'balloon decor reviews Kansas City',
  'Kansas City balloon company reviews',
  'balloon decorator testimonials Kansas City',
  'balloon decor reviews Overland Park',
]);

export default function Testimonials() {
  const { content } = useSiteContent('testimonials');
  const { content: contactContent } = useSiteContent('contact');
  const { content: footerContent } = useSiteContent('footer');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #fd79a8, #a29bfe)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const seoTitle = 'Balloon Decor Reviews | Kansas City Events & Installations';
  const seoDescription = 'Read BalloonCraft KC client feedback for balloon arches, garlands, walls, and custom event installs across Kansas City, Overland Park, Olathe, Lee\'s Summit, and nearby metro celebrations.';

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['testimonials-public'],
    queryFn: () => Testimonial.filter({ status: 'approved' }),
    initialData: [],
  });

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    path: '/testimonials',
    keywords: TESTIMONIAL_KEYWORDS,
    schema: [
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Testimonials', path: '/testimonials' },
      ]),
      buildLocalBusinessJsonLd({
        title: 'BalloonCraft KC',
        description: seoDescription,
        path: '/testimonials',
        contactContent,
        footerContent,
      }),
    ],
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
          <div className="max-w-4xl mx-auto text-center mb-12">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Reviews help new clients understand what it&apos;s like to work with a balloon decor team on real Kansas City events. These testimonials reflect the experience of customers who trusted BalloonCraft KC for weddings, birthdays, baby showers, graduations, corporate events, and custom installations throughout the metro.
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

          <div className="flex flex-wrap justify-center gap-3 mt-14">
            <Button asChild className="rounded-full font-bold">
              <Link to="/contact">Get a Quote</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full font-bold">
              <Link to="/projects">See Balloon Portfolio</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
