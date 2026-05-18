import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as Project from '@/entities/Project';
import {
  buildJsonLd,
  resolveOgImage,
  appendGeoToTitle,
  computeRelatedPosts,
} from '@/lib/seo';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ArrowLeft, User, Quote } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const DOMAIN = typeof window !== 'undefined' ? window.location.hostname : 'ballooncraftkc.com';

// ── Head tag injection helpers ────────────────────────────────

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('type', 'application/ld+json');
    el.setAttribute('id', id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export default function ProjectDetail() {
  const { slug } = useParams();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['project-detail', slug],
    queryFn: () => Project.filter({ slug, status: 'published' }),
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects-public'],
    queryFn: () => Project.filter({ status: 'published' }),
    initialData: [],
  });

  const project = projects[0];

  // ── 8.1 — Inject SEO head tags ────────────────────────────
  useEffect(() => {
    if (!project) return;

    const ogImage = resolveOgImage(project);
    const pageTitle = appendGeoToTitle(project.meta_title || project.title, project.geo_city);
    const description = project.meta_description || project.excerpt || '';
    const canonicalUrl = `https://${DOMAIN}/projects/${project.slug}`;

    // Title
    document.title = pageTitle;

    // Canonical
    setLink('canonical', canonicalUrl);

    // OG tags
    setMeta('og:title', pageTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:image', ogImage, 'property');
    setMeta('og:url', canonicalUrl, 'property');
    setMeta('og:type', 'article', 'property');

    // Standard meta
    setMeta('description', description);

    // JSON-LD
    const jsonLd = buildJsonLd(project, {});
    setJsonLd('post-jsonld', jsonLd);

    return () => {
      // Clean up on unmount
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.remove();
      const jsonLdEl = document.getElementById('post-jsonld');
      if (jsonLdEl) jsonLdEl.remove();
    };
  }, [project]);

  const relatedPosts = project ? computeRelatedPosts(project, allProjects) : [];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>
  );

  if (!project) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="font-display text-3xl">Post Not Found</h1>
      <Button asChild variant="outline" className="rounded-full">
        <Link to="/projects"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio</Link>
      </Button>
    </div>
  );

  // Gallery: prefer gallery_images_meta (with labels), fall back to plain gallery_images
  const galleryItems = Array.isArray(project.gallery_images_meta) && project.gallery_images_meta.length > 0
    ? project.gallery_images_meta
    : (project.gallery_images || []).map(url => ({ url, label: null }));

  return (
    <article className="pb-20">
      {/* Hero Image */}
      {project.featured_image && (
        <div className="w-full h-[50vh] relative overflow-hidden">
          <img src={project.featured_image} alt={project.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge variant="secondary" className="rounded-full mb-3 text-xs font-bold">
                {project.category?.replace('_', ' ')}
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl text-white">{project.title}</h1>
            </motion.div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 content-section">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/projects"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolio</Link>
        </Button>

        {!project.featured_image && (
          <h1 className="font-display text-4xl sm:text-5xl mb-4">{project.title}</h1>
        )}

        {/* Service / Event type badges */}
        {((project.service_types?.length > 0) || (project.event_types?.length > 0)) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(project.service_types || []).map(s => (
              <Badge key={s} className="rounded-full text-xs bg-primary/10 text-primary border-primary/20">{s}</Badge>
            ))}
            {(project.event_types || []).map(e => (
              <Badge key={e} variant="outline" className="rounded-full text-xs">{e}</Badge>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
          {project.event_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {format(new Date(project.event_date), 'MMMM d, yyyy')}
            </span>
          )}
          {project.event_location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {project.event_location}
            </span>
          )}
          {project.geo_city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> {project.geo_city}
            </span>
          )}
          {project.author && (
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {project.author}
            </span>
          )}
        </div>

        {/* Content */}
        {project.content && (
          <div className="prose prose-lg max-w-none mb-12" dangerouslySetInnerHTML={{ __html: project.content }} />
        )}

        {/* 8.2 — Client Testimonial */}
        {project.client_quote && (
          <div className="mb-12 bg-muted/40 rounded-2xl p-6 border-l-4 border-primary">
            <Quote className="w-8 h-8 text-primary/30 mb-3" />
            <blockquote className="text-lg italic text-foreground leading-relaxed mb-3">
              "{project.client_quote}"
            </blockquote>
            {project.client_quote_name && (
              <p className="text-sm font-semibold text-muted-foreground">— {project.client_quote_name}</p>
            )}
          </div>
        )}

        {/* 8.3 — Gallery with Before/After badges */}
        {galleryItems.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-2xl mb-6">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <img
                    src={item.url || item}
                    alt={`${project.title} gallery ${i + 1}`}
                    className="rounded-2xl shadow-lg w-full aspect-square object-cover"
                  />
                  {item.label && (
                    <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full text-white ${item.label === 'before' ? 'bg-blue-500' : 'bg-green-500'}`}>
                      {item.label === 'before' ? 'Before' : 'After'}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-8 border-t">
            {project.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="rounded-full text-xs">#{tag}</Badge>
            ))}
          </div>
        )}

        {/* 8.4 — Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t">
            <h2 className="font-display text-2xl mb-6">More Work You Might Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedPosts.map(p => (
                <Link key={p.id} to={`/projects/${p.slug}`} className="group block">
                  <div className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow bg-white border border-border/30">
                    {p.featured_image && (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={p.featured_image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {(p.service_types || []).slice(0, 2).map(s => (
                          <span key={s} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
