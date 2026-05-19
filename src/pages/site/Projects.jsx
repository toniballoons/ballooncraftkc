import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as Project from '@/entities/Project';
import {
  SERVICE_TYPES,
  EVENT_TYPES,
  GEO_CITIES,
  PRIMARY_EVENT_PHRASES,
  PRIMARY_SERVICE_PHRASES,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildProjectCollectionJsonLd,
  buildSeoKeywordSet,
} from '@/lib/seo';
import { usePageSeo } from '@/lib/usePageSeo';
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
const PORTFOLIO_KEYWORDS = buildSeoKeywordSet(
  PRIMARY_SERVICE_PHRASES,
  PRIMARY_EVENT_PHRASES,
  [
    'balloon decor portfolio Kansas City',
    'balloon arch portfolio Kansas City',
    'balloon garland portfolio Kansas City',
    'balloon wall portfolio Kansas City',
    'Kansas City event decorations portfolio',
  ]
);
const SEARCH_SUGGESTIONS = ['Balloon arch', 'Balloon garland', 'Wedding', 'Corporate', 'Grand opening', 'Overland Park'];

export default function Projects() {
  const { content } = useSiteContent('projects');
  const { content: contactContent } = useSiteContent('contact');
  const { content: footerContent } = useSiteContent('footer');
  const { theme } = useTheme();
  const heroBg = theme?.hero?.bg || 'linear-gradient(135deg, #00b894, #74b9ff)';
  const { textColor, mutedTextColor, panelStyle } = getHeroTextStyles(heroBg);

  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-public'],
    queryFn: () => Project.filter({ status: 'published' }),
    initialData: [],
  });

  const filtered = projects.filter(p => {
    const searchMatch = !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(search.toLowerCase()) ||
      (p.service_types || []).some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      (p.event_types || []).some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      p.geo_city?.toLowerCase().includes(search.toLowerCase()) ||
      p.event_location?.toLowerCase().includes(search.toLowerCase());
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

  const seoTitle = 'Balloon Decor Portfolio | Kansas City Arches, Garlands & Backdrops';
  const seoDescription = 'Browse BalloonCraft KC project examples featuring balloon arches, garlands, columns, walls, and custom installs for Kansas City weddings, birthdays, baby showers, graduations, and corporate events.';

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    path: '/projects',
    keywords: PORTFOLIO_KEYWORDS,
    schema: [
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Projects', path: '/projects' },
      ]),
      buildLocalBusinessJsonLd({
        title: 'BalloonCraft KC',
        description: seoDescription,
        path: '/projects',
        contactContent,
        footerContent,
      }),
      buildProjectCollectionJsonLd(projects, {
        title: content.title || 'Our Projects',
        description: seoDescription,
        path: '/projects',
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

      <section className="py-12 bg-white content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mb-8">
            <p className="text-muted-foreground text-lg leading-relaxed">
              Explore balloon decor examples from across Kansas City, Overland Park, Olathe, Lee&apos;s Summit, Shawnee, and nearby metro communities. This portfolio highlights balloon arches, balloon garlands, columns, walls, and event backdrops for weddings, birthday parties, baby showers, graduation celebrations, and corporate events.
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-6">
            <label htmlFor="project-search" className="sr-only">Search portfolio</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="project-search"
              placeholder="Search balloon arches, garlands, weddings, corporate events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Popular searches</span>
            {SEARCH_SUGGESTIONS.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setSearch(suggestion)}
                className="rounded-full border border-border/50 bg-muted/15 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {suggestion}
              </button>
            ))}
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
            {filtered.length} {filtered.length === 1 ? 'post' : 'posts'}{hasFilters ? ' matching your filters' : ''}
          </p>

          {/* Grid */}
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground" role="status" aria-live="polite">Loading portfolio...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground" role="status" aria-live="polite">
              <p className="mb-3">No posts found matching your filters.</p>
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
                          View Post <ArrowRight className="w-4 h-4 ml-1" />
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
