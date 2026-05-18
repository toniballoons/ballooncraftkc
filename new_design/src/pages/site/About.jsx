import React, { useEffect } from 'react';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { formatCanonicalUrl } from '@/lib/seo';
import { getHeroTextStyles } from '@/lib/accessibility';
import { motion } from 'framer-motion';
import { Heart, Award, Lightbulb, Clock } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const iconMap = [Lightbulb, Award, Heart, Clock];

export default function About() {
  const { content } = useSiteContent('about');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #a29bfe, #fd79a8)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'ballooncraftkc.com';

  useEffect(() => {
    const canonical = formatCanonicalUrl(domain, '/about');
    let linkEl = document.querySelector('link[rel="canonical"]');
    if (!linkEl) { linkEl = document.createElement('link'); linkEl.rel = 'canonical'; document.head.appendChild(linkEl); }
    linkEl.href = canonical;
    const setMeta = (prop, val) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.content = val;
    };
    setMeta('og:title', content.title || 'About Us — BalloonCraft');
    setMeta('og:description', content.subtitle || 'Learn about our balloon decoration team in Kansas City.');
    setMeta('og:url', canonical);
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
