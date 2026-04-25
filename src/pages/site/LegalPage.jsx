import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };

export default function LegalPage({ pageKey }) {
  const location = useLocation();
  const urlKey = location.pathname.replace('/', '').split('/')[0];
  const key = pageKey || urlKey || 'privacy';
  const { content } = useSiteContent(key);
  const { theme } = useTheme();
  const heroBg = theme?.nav?.bg || '#1a1a2e';

  return (
    <>
      <section className="relative py-20 overflow-hidden" style={{ background: heroBg }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl sm:text-5xl mb-3 text-white drop-shadow">{content.title}</h1>
            {content.last_updated && (
              <p className="text-muted-foreground text-sm">Last updated: {content.last_updated}</p>
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