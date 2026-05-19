import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import {
  GEO_CITIES,
  PRIMARY_EVENT_PHRASES,
  PRIMARY_SERVICE_PHRASES,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildSeoKeywordSet,
} from '@/lib/seo';
import { usePageSeo } from '@/lib/usePageSeo';
import { getHeroTextStyles } from '@/lib/accessibility';
import { motion } from 'framer-motion';
import { Heart, Award, Lightbulb, Clock, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const iconMap = [Lightbulb, Award, Heart, Clock];
const SERVICE_CITIES = GEO_CITIES.filter(city => city !== 'Other');
const ABOUT_KEYWORDS = buildSeoKeywordSet(PRIMARY_SERVICE_PHRASES, PRIMARY_EVENT_PHRASES, [
  'Kansas City balloon company',
  'balloon decorator Kansas City',
  'event balloon artist Kansas City',
  'custom balloon installations Kansas City',
]);

export default function About() {
  const { content } = useSiteContent('about');
  const { content: contactContent } = useSiteContent('contact');
  const { content: footerContent } = useSiteContent('footer');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #a29bfe, #fd79a8)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const seoTitle = 'About BalloonCraft KC | Kansas City Balloon Decor Team';
  const seoDescription = 'Learn about BalloonCraft KC, a Kansas City balloon decor studio creating custom arches, garlands, walls, and event installations for private celebrations and business events.';

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    path: '/about',
    image: content.image || '/logo.png',
    keywords: ABOUT_KEYWORDS,
    schema: [
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ]),
      buildLocalBusinessJsonLd({
        title: 'BalloonCraft KC',
        description: seoDescription,
        path: '/about',
        image: content.image || '/logo.png',
        contactContent,
        footerContent,
      }),
    ],
  });

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
              <img src={content.image} alt="BalloonCraft KC custom event balloon decor team" className="rounded-3xl shadow-2xl w-full" decoding="async" />
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-muted/25 content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.6 }} className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 items-start">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary mb-5">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                Built for Kansas City celebrations
              </span>
              <h2 className="font-display text-4xl mb-5">A local balloon decor team focused on thoughtful installs and easy event support</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                We partner with families, planners, schools, venues, and brands that want custom balloon decor without guesswork. Our work spans intimate at-home celebrations, elegant wedding styling, school and graduation installs, and large-format corporate balloon displays for launches, galas, and grand openings.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  'Organic balloon arches and garlands customized to your venue and color palette',
                  'Balloon walls, branded backdrops, and focal-point installs for photos and guest flow',
                  'Delivery, setup, and installation support across the KC metro',
                  'A collaborative design process for birthdays, showers, weddings, and business events',
                ].map(item => (
                  <div key={item} className="rounded-2xl border border-border/50 bg-white p-4 text-sm text-muted-foreground shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border/50 bg-white p-8 shadow-sm">
              <h3 className="font-display text-2xl mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
                Service area
              </h3>
              <p className="text-muted-foreground mb-4">We regularly design balloon installations for venues and homes throughout the Kansas City metro, including:</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {SERVICE_CITIES.map(city => (
                  <span key={city} className="rounded-full border border-border/50 bg-muted/20 px-3 py-1 text-sm">
                    {city}
                  </span>
                ))}
              </div>
              <h3 className="font-display text-2xl mb-4">Common events we style</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Wedding receptions and bridal showers</p>
                <p>Birthday parties, baby showers, and graduations</p>
                <p>Corporate events, galas, ribbon cuttings, and grand openings</p>
                <p>School events, community celebrations, and holiday parties</p>
              </div>
              <div className="mt-8">
                <Button asChild className="rounded-full font-bold">
                  <Link to="/contact">Plan Your Event <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
              </div>
            </div>
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
