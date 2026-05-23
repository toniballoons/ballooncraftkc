import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as Project from '@/entities/Project';
import { SERVICE_TYPES, EVENT_TYPES, GEO_CITIES, formatCanonicalUrl } from '@/lib/seo';
import { getHeroTextStyles } from '@/lib/accessibility';

import { useSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, ArrowRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
const DOMAIN = typeof window !== 'undefined' ? window.location.hostname : 'www.ballooncraftkc.com';

export default function Projects() {
  const { content } = useSiteContent('projects');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #00b894, #74b9ff)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);

  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // 9.3 — Canonical + OG meta tags
  useEffect(() => {
    const canonical = formatCanonicalUrl(DOMAIN, '/projects');
    const pageTitle = 'Kansas City Balloon Portfolio, Announcements & Updates | BalloonCraft KC';
    const description = content.subtitle || 'Browse BalloonCraft KC portfolio entries, launch announcements, event installs, and business updates from across Kansas City, Overland Park, Olathe, Lee\'s Summit, and the surrounding metro.';
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

    return () => {
      const el = document.querySelector('link[rel="canonical"]');
      if (el) el.remove();
    };
  }, [content]);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-public'],
    queryFn: () => Project.filter({ status: 'published' }),
    initialData: [],
  });

  const filtered = projects.filter(p => {
    const searchMatch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const serviceMatch = !serviceFilter || (p.service_types || []).includes(serviceFilter);
    const eventMatch = !eventFilter || (p.event_types || []).includes(eventFilter);
    const cityMatch = !cityFilter || p.geo_city === cityFilter;
    return searchMatch && serviceMatch && eventMatch && cityMatch;
  });

  const hasFilters = serviceFilter || eventFilter || cityFilter || search;

  const clearFilters = () => {
    setSearch('');
    setServiceFilter('');
    setEventFilter('');
    setCityFilter('');
  };

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

      <section className="py-12 bg-white content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[1.75rem] border border-border/60 bg-muted/30 p-6 mb-8">
            <p className="text-muted-foreground leading-relaxed">
              Explore a mix of real BalloonCraft KC installs, launch notes, event highlights, and business updates from across Kansas City, Overland Park, Olathe, Lee&apos;s Summit, and nearby metro venues. Use the filters to zero in on balloon garlands, arches, walls, backdrops, custom installs, and the kinds of events or announcements that match what you want to see.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-6">
            <label htmlFor="project-search" className="sr-only">Search portfolio</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="project-search"
              placeholder="Search portfolio, announcements, and updates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>

          {/* 9.1 — Service Type filter chips */}
          <fieldset className="mb-4">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Service</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setServiceFilter('')}
                aria-pressed={!serviceFilter}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!serviceFilter ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary text-muted-foreground'}`}
              >
                All
              </button>
              {SERVICE_TYPES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setServiceFilter(serviceFilter === s ? '' : s)}
                  aria-pressed={serviceFilter === s}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${serviceFilter === s ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary text-muted-foreground'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 9.1 — Event Type filter chips */}
          <fieldset className="mb-4">
            <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Event</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEventFilter('')}
                aria-pressed={!eventFilter}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!eventFilter ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary text-muted-foreground'}`}
              >
                All
              </button>
              {EVENT_TYPES.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEventFilter(eventFilter === e ? '' : e)}
                  aria-pressed={eventFilter === e}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${eventFilter === e ? 'bg-primary text-white border-primary' : 'bg-background border-border hover:border-primary text-muted-foreground'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </fieldset>

          {/* 9.2 — City filter */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2">
              <label htmlFor="city-filter" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">City</label>
              <Select value={cityFilter || 'all'} onValueChange={v => setCityFilter(v === 'all' ? '' : v)}>
                <SelectTrigger id="city-filter" aria-label="Filter by city" className="w-44 h-8 text-sm rounded-full">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {GEO_CITIES.filter(c => c !== 'Other').map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3 h-3" aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}{hasFilters ? ' matching your filters' : ''}
          </p>

          {/* Grid */}
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground" role="status" aria-live="polite">Loading portfolio...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground" role="status" aria-live="polite">
              <p className="mb-3">No entries found matching your filters.</p>
              {hasFilters && <button type="button" onClick={clearFilters} className="text-primary underline text-sm">Clear filters</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                >
                  <Link to={`/projects/${project.slug}`} className="group block">
                    <div className="rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 bg-white border border-border/30">
                      {project.featured_image && (
                        <div className="aspect-[4/3] overflow-hidden">
                          <img src={project.featured_image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {(project.service_types || []).slice(0, 2).map(s => (
                            <Badge key={s} className="rounded-full text-xs bg-primary/10 text-primary border-primary/20">{s}</Badge>
                          ))}
                          {(project.event_types || []).slice(0, 1).map(e => (
                            <Badge key={e} variant="secondary" className="rounded-full text-xs">{e}</Badge>
                          ))}
                          {project.featured && <Badge className="rounded-full text-xs bg-yellow-400 text-yellow-900">Featured</Badge>}
                        </div>
                        <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{project.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{project.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {project.event_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" aria-hidden="true" />
                              {format(new Date(project.event_date), 'MMM d, yyyy')}
                            </span>
                          )}
                          {(project.geo_city || project.event_location) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" aria-hidden="true" />
                              {project.geo_city || project.event_location}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex items-center text-primary font-semibold text-sm">
                          View Entry <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
