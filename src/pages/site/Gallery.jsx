import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Sparkles } from 'lucide-react';

import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { formatCanonicalUrl } from '@/lib/seo';
import { getHeroTextStyles } from '@/lib/accessibility';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const DOMAIN = typeof window !== 'undefined' ? window.location.hostname : 'www.ballooncraftkc.com';

export default function Gallery() {
  const { content } = useSiteContent('gallery');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #00b894, #74b9ff)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const items = Array.isArray(content.items) ? content.items.filter((item) => item?.url) : [];

  useEffect(() => {
    const canonical = formatCanonicalUrl(DOMAIN, '/gallery');
    const pageTitle = 'Kansas City Balloon Decor Gallery | BalloonCraft KC';
    const description = 'Explore BalloonCraft KC balloon decor inspiration for weddings, birthdays, showers, school events, grand openings, and branded installs across Kansas City and the surrounding metro.';
    const firstImage = items[0]?.url;

    let linkEl = document.querySelector('link[rel="canonical"]');
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.rel = 'canonical';
      document.head.appendChild(linkEl);
    }
    linkEl.href = canonical;

    document.title = pageTitle;

    const setMeta = (attr, prop, value) => {
      let element = document.querySelector(`meta[${attr}="${prop}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, prop);
        document.head.appendChild(element);
      }
      element.content = value;
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:type', 'website');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', description);
    if (firstImage) {
      setMeta('property', 'og:image', firstImage);
      setMeta('name', 'twitter:image', firstImage);
    }

    return () => {
      const element = document.querySelector('link[rel="canonical"]');
      if (element) element.remove();
    };
  }, [items]);

  return (
    <>
      <section className="relative overflow-hidden py-24" style={{ background: heroBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="rounded-[2rem] px-6 py-8 sm:px-10 inline-block max-w-4xl"
            style={panelStyle}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm mb-6">
              <Camera className="w-4 h-4" />
              BalloonCraft KC inspiration gallery
            </div>
            <h1 className="font-display text-5xl sm:text-6xl mb-4 drop-shadow-lg" style={{ color: textColor }}>
              {content.title}
            </h1>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: mutedTextColor }}>
              {content.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-white content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.75rem] border border-border/60 bg-muted/30 p-6 mb-10">
            <p className="text-muted-foreground leading-relaxed text-lg">
              {content.intro}
            </p>
          </div>

          {items.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-border bg-muted/20 px-6 py-16 text-center text-muted-foreground">
              Add gallery images in the CMS to start showing BalloonCraft KC decor inspiration here.
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => (
                <motion.article
                  key={`${item.url}-${index}`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ duration: 0.55, delay: (index % 3) * 0.08 }}
                  className="overflow-hidden rounded-[2rem] border border-border/50 bg-white shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted/30">
                    <img
                      src={item.url}
                      alt={item.title || `BalloonCraft KC gallery inspiration ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      Gallery look {index + 1}
                    </div>
                    <h2 className="text-2xl font-bold leading-tight">
                      {item.title || `Balloon decor look ${index + 1}`}
                    </h2>
                    {item.description ? (
                      <p className="text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-muted/30 content-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-border/60 bg-white px-8 py-12 text-center shadow-sm">
            <h2 className="font-display text-4xl mb-4">Ready to turn one of these looks into your event?</h2>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto mb-8">
              Use this gallery as a starting point, then let Toni tailor the color palette, scale, install style, and photo-moment details to match your venue and guest experience.
            </p>
            <Link to="/contact" className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow hover:bg-primary/90 transition-colors">
              Start your design request
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
