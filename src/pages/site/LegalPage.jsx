import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { getHeroTextStyles } from '@/lib/accessibility';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { usePageSeo } from '@/lib/usePageSeo';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };

export default function LegalPage({ pageKey }) {
  const location = useLocation();
  const urlKey = location.pathname.replace('/', '').split('/')[0];
  const key = pageKey || urlKey || 'privacy';
  const { content } = useSiteContent(key);
  const { theme } = useTheme();
  const heroBg = theme?.nav?.bg || '#1a1a2e';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);
  const seoTitle = `${content.title || 'Legal Information'} | BalloonCraft KC`;
  const seoDescription = `Read the BalloonCraft KC ${content.title || 'legal information'} page for website policies, terms, and business information.`;

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    path: `/${key}`,
    schema: [
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: content.title || 'Legal', path: `/${key}` },
      ]),
    ],
  });

  return (
    <>
      <section className="relative py-20 overflow-hidden" style={{ background: heroBg }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }} className="rounded-[2rem] px-6 py-8 sm:px-10 inline-block max-w-3xl" style={panelStyle}>
            <h1 className="font-display text-4xl sm:text-5xl mb-3 drop-shadow" style={{ color: textColor }}>{content.title}</h1>
            {content.last_updated && (
              <p className="text-sm" style={{ color: mutedTextColor }}>Last updated: {content.last_updated}</p>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white content-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {content.content && (
            <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground" dangerouslySetInnerHTML={{ __html: content.content }} />
          )}
        </div>
      </section>
    </>
  );
}
