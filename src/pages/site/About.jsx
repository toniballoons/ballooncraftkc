import React, { useEffect } from 'react';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { LOCAL_EVENT_HIGHLIGHTS, LOCAL_SERVICE_AREAS, LOCAL_SERVICE_HIGHLIGHTS, formatCanonicalUrl } from '@/lib/seo';
import { getHeroTextStyles } from '@/lib/accessibility';
import { motion } from 'framer-motion';
import { Heart, Award, Lightbulb, Clock, Store, PartyPopper, School } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const iconMap = [Lightbulb, Award, Heart, Clock];
const specialtyIcons = [PartyPopper, Store, School];

export default function About() {
  const { content } = useSiteContent('about');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #a29bfe, #fd79a8)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'www.ballooncraftkc.com';

  useEffect(() => {
    const canonical = formatCanonicalUrl(domain, '/about');
    const pageTitle = 'About BalloonCraft KC | Kansas City Balloon Decor for Parties, Weddings & Brand Events';
    const description = 'Learn about BalloonCraft KC, a Kansas City balloon decor studio creating arches, garlands, balloon walls, backdrops, and branded event installs for weddings, birthdays, school events, corporate parties, and grand openings across the metro.';
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

  return (
    <>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden" style={{ background: heroBg }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.7 }} className="text-center max-w-3xl mx-auto rounded-[2rem] px-6 py-8 sm:px-10" style={panelStyle}>
            <h1 className="font-display text-5xl sm:text-6xl mb-4 drop-shadow-lg" style={{ color: textColor }}>{content.title}</h1>
            <p className="text-xl" style={{ color: mutedTextColor }}>{content.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Intro + Image */}
      <section className="py-20 bg-white content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">{content.intro}</p>
            <h2 className="font-display text-3xl mb-4">{content.story_title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-8">{content.story}</p>
            <h2 className="font-display text-3xl mb-4">{content.mission_title}</h2>
            <p className="text-muted-foreground leading-relaxed">{content.mission}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            {content.image && (
              <img src={content.image} alt="Our balloon crafting studio" className="rounded-3xl shadow-2xl w-full" />
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="text-center max-w-4xl mx-auto mb-14">
            <h2 className="font-display text-4xl mb-4">What we create and where it shows up</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              BalloonCraft KC is not limited to one look or one type of event. We build polished installs for elegant venues, playful parties, schools that need scale, and brands that want a memorable launch-day atmosphere.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Celebrations with personality',
                description: 'Weddings, birthdays, baby showers, bridal showers, anniversaries, and milestone events that need color, shape, and a real focal point.',
              },
              {
                title: 'Retail and brand moments',
                description: 'Grand openings, pop-ups, product launches, office parties, and branded installs that help businesses look lively, polished, and camera-ready.',
              },
              {
                title: 'Schools and community spaces',
                description: 'Proms, graduations, school spirit events, fundraisers, banquets, and community celebrations that need impact at larger scale.',
              },
            ].map((item, index) => {
              const Icon = specialtyIcons[index % specialtyIcons.length];
              return (
                <motion.div
                  key={item.title}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="rounded-3xl border border-border/60 bg-white p-8 shadow-sm"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="grid gap-6 lg:grid-cols-2 mt-12">
            <div className="rounded-[1.75rem] border border-border/60 bg-white p-6">
              <h3 className="font-display text-2xl mb-4">Popular BalloonCraft KC services</h3>
              <div className="grid gap-3">
                {LOCAL_SERVICE_HIGHLIGHTS.slice(0, 4).map((service) => (
                  <div key={service.title} className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <p className="font-semibold">{service.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-border/60 bg-white p-6">
              <h3 className="font-display text-2xl mb-4">Events we regularly decorate</h3>
              <div className="flex flex-wrap gap-3">
                {LOCAL_EVENT_HIGHLIGHTS.map((eventType) => (
                  <span key={eventType} className="rounded-full border border-border/70 bg-muted/20 px-4 py-2 text-sm font-semibold">
                    {eventType}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white content-section">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-4xl mb-4">Proudly serving the Kansas City metro</h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
              We create custom balloon decor for homes, storefronts, schools, offices, wedding venues, banquet halls, and event spaces across the metro. From Kansas City installs to Johnson County celebrations, our work is built around your space, your palette, and the kind of moment you want people to remember the second they walk in.
            </p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {LOCAL_SERVICE_AREAS.map((area) => (
              <span key={area} className="rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm font-semibold shadow-sm">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30 content-section relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-4xl text-center mb-16">Our Values</motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {(content.values || []).map((v, i) => {
              const Icon = iconMap[i % iconMap.length];
              return (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center"
                >
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-7 h-7 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      {content.team && content.team.length > 0 && (
        <section className="py-20 bg-white content-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="font-display text-4xl text-center mb-16">{content.team_title}</motion.h2>
            <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
              {content.team.map((member, i) => (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="text-center p-8 rounded-3xl bg-muted/30 border border-border/50 w-full max-w-xs"
                >
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-5 shadow-lg" />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-pink-200 rounded-full mx-auto mb-5 flex items-center justify-center">
                      <span className="font-display text-3xl text-primary">{member.name?.[0]}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-primary text-sm font-semibold mb-3">{member.role}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
