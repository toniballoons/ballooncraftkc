# Design Document: Admin UX & SEO Improvements

## Overview

This document describes the technical design for 25 improvements to the BalloonCraft admin panel and public site. The goal is to out-rank Kansas City balloon decoration competitors on Google by transforming the Projects section into a dual-purpose Portfolio/Blog SEO engine, enriching post metadata, and adding dashboard intelligence.

The stack is React 18 + Vite, Tailwind CSS, shadcn/ui, @tanstack/react-query v5, Supabase (PostgreSQL + Storage), and Vercel serverless functions. All changes are additive — no existing routes or data are broken.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Public Site (React SPA)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Projects    │  │ ProjectDetail│  │  Other pages     │  │
│  │  (filter UI) │  │ (JSON-LD,    │  │  (canonical,     │  │
│  │              │  │  OG, canon.) │  │   OG meta)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Admin Panel (React SPA, protected)                         │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │  Dashboard   │  │  ProjectsAdmin (Post_Editor dialog)  │ │
│  │  (stats,     │  │  (markdown editor, SEO preview,      │ │
│  │   activity,  │  │   focus keyword, DnD gallery,        │ │
│  │   SEO health,│  │   service/event types, geo, quote)   │ │
│  │   tips)      │  │                                      │ │
│  └──────────────┘  └──────────────┘                        │ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Vercel Serverless                                          │
│  api/sitemap.js  →  queries Supabase, returns XML           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL)                                      │
│  projects table  +  new columns (migration 002)             │
└─────────────────────────────────────────────────────────────┘
```

Data flows:
- Admin saves a post → `autoFillSeoFields()` runs client-side → Supabase upsert
- Public page loads → React renders `<Helmet>`-equivalent head tags (canonical, OG, JSON-LD)
- `/sitemap.xml` request → Vercel function queries Supabase → returns XML string
- Dashboard loads → three parallel React Query fetches (projects, messages, testimonials)

---

## Components and Interfaces

### 1. Database Migration (`supabase/migrations/002_seo_improvements.sql`)

Adds new columns to the `projects` table. No existing columns are altered.

### 2. `src/lib/seo.js` — Pure SEO utility functions

Exports:
- `generateSlug(title: string): string` — converts title to URL-safe slug
- `sanitizeSlug(raw: string): string` — lowercases and replaces spaces with hyphens
- `resolveUniqueSlug(base: string, existingSlugs: string[], currentId?: string): string` — appends `-2`, `-3`, etc. until unique
- `autoFillSeoFields(form: object): { filled: object, didFill: boolean }` — returns updated form fields and whether any were auto-filled
- `stripHtml(html: string): string` — removes HTML/Markdown tags for plain-text extraction
- `truncate(str: string, max: number): string` — truncates to max chars
- `resolveOgImage(post: object, siteDefaultOg: string): string` — waterfall: og_image → featured_image → gallery_images_meta[0].url → gallery_images[0] → siteDefaultOg
- `buildJsonLd(post: object, siteContent: object): object` — returns BlogPosting + LocalBusiness JSON-LD object
- `computeSeoScore(keyword: string, post: object): { score: number, checks: boolean[] }` — evaluates 4 checklist items
- `computeRelatedPosts(current: object, candidates: object[]): object[]` — returns up to 3 related posts
- `computeWeeklyMessageCount(messages: object[]): number` — counts messages from last 7 days
- `computeStatusCounts(projects: object[]): { published: number, draft: number, archived: number }` — counts by status
- `computeSeoHealthCounts(projects: object[]): { missingMeta: number, missingKeyword: number, missingImage: number }` — counts published posts missing each field
- `formatCanonicalUrl(domain: string, path: string): string` — returns `https://{domain}{path}`
- `appendGeoToTitle(metaTitle: string, geoCity: string): string` — appends `| {geoCity}` if not already present

### 3. `src/pages/admin/ProjectsAdmin.jsx` — Refactored

Key changes:
- Rename heading/nav label to "Portfolio / Blog"
- Add helper text block
- Replace `ReactQuill` with `MarkdownEditor` component
- Add `DraggableGallery` component using `@hello-pangea/dnd`
- Add Duplicate button per row
- Add bulk-select checkboxes + bulk action toolbar
- Add SEO Preview Panel, character counters, focus keyword checklist
- Add Service Type multi-select, Event Type multi-select, geo_city dropdown
- Add client_quote + client_quote_name fields
- Add Before/After label toggles on gallery images
- Add Preview button that opens `/projects/{slug}` in new tab
- Call `autoFillSeoFields()` before save; show toast if fields were filled
- Call `resolveUniqueSlug()` before save

### 4. `src/components/admin/MarkdownEditor.jsx` — New component

Props: `value: string`, `onChange: (v: string) => void`

Renders a two-column layout: left = `<textarea>`, right = live preview using a lightweight Markdown parser (no external library needed — a small regex-based renderer for H1–H3, bold, italic, ul, ol, links is sufficient and keeps the bundle small).

### 5. `src/components/admin/DraggableGallery.jsx` — New component

Props: `images: GalleryImageMeta[]`, `onChange: (images: GalleryImageMeta[]) => void`

Uses `DragDropContext`, `Droppable`, `Draggable` from `@hello-pangea/dnd`. Each thumbnail shows the image, a Before/After/None toggle (three-way button group), a remove button, and a drag handle. Supports multi-file upload via `<input multiple>`.

Type: `GalleryImageMeta = { url: string, label: 'before' | 'after' | null }`

### 6. `src/components/admin/SeoPreviewPanel.jsx` — New component

Props: `metaTitle: string`, `metaDescription: string`, `slug: string`, `domain: string`

Renders a read-only Google SERP snippet: blue link (truncated at 60), green URL breadcrumb, gray description (truncated at 160). Updates in real time from props.

### 7. `src/components/admin/CharCounter.jsx` — New component

Props: `value: string`, `max: number`

Renders `{value.length} / {max}` with color: red if over max, green if within optimal range (50–60 for title, 120–160 for description), gray otherwise.

### 8. `src/components/admin/FocusKeywordPanel.jsx` — New component

Props: `keyword: string`, `post: { title, meta_description, content, slug }`

Renders the 4-item SEO checklist and score fraction. Uses `computeSeoScore()` from `src/lib/seo.js`.

### 9. `src/pages/admin/Dashboard.jsx` — Refactored

Replaces the existing 4-card grid with four panels:
- `QuickStatsWidget` — 5 stat cards (Total Posts, Published, Draft, New Messages This Week, Total Testimonials)
- `RecentActivityFeed` — two side-by-side lists (Recent Posts, Recent Messages)
- `SeoHealthPanel` — 3 counts with click-to-filter navigation
- `TopTipsCard` — rotating tips with Next Tip button and "Tip N of M" counter

### 10. `src/pages/site/ProjectDetail.jsx` — Refactored

Adds:
- `<Helmet>`-style head injection for canonical, OG tags, JSON-LD (using `document.head` manipulation in a `useEffect`, or a lightweight `react-helmet-async` if added as a dependency — see note below)
- Client testimonial blockquote section (between content and gallery)
- Before/After badges on gallery images (reads `gallery_images_meta`)
- Related Posts section at bottom
- Geo-city appended to `<title>` tag

Note on head injection: The project does not currently use react-helmet. The simplest approach is a `useEffect` that creates/updates `<meta>` and `<script>` tags directly on `document.head`, cleaning up on unmount. This avoids adding a new dependency.

### 11. `src/pages/site/Projects.jsx` — Refactored

Adds:
- Service Type filter chips row
- Event Type filter chips row
- City filter dropdown
- Combined filter logic (AND across active filters)
- Canonical + OG meta tags via `useEffect`

### 12. `api/sitemap.js` — New Vercel serverless function

Queries Supabase for all published projects, builds XML string, returns with `Content-Type: application/xml`.

### 13. `vercel.json` — Updated

Adds a rewrite rule so `/sitemap.xml` routes to `api/sitemap.js` before the SPA catch-all.

---

## Data Models

### Migration SQL (`supabase/migrations/002_seo_improvements.sql`)

```sql
-- New SEO and content columns on projects table
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS focus_keyword       text,
  ADD COLUMN IF NOT EXISTS service_types       text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS event_types         text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS geo_city            text,
  ADD COLUMN IF NOT EXISTS client_quote        text,
  ADD COLUMN IF NOT EXISTS client_quote_name   text,
  ADD COLUMN IF NOT EXISTS gallery_images_meta jsonb    DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();

-- Trigger to auto-update updated_at on every row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### `GalleryImageMeta` shape (stored in `gallery_images_meta` JSONB column)

```json
[
  { "url": "https://...", "label": "before" },
  { "url": "https://...", "label": "after" },
  { "url": "https://...", "label": null }
]
```

### Extended `emptyProject` form state

```js
const emptyProject = {
  // existing fields ...
  focus_keyword: '',
  service_types: [],
  event_types: [],
  geo_city: '',
  client_quote: '',
  client_quote_name: '',
  gallery_images_meta: [],
};
```

### Controlled vocabulary constants (`src/lib/seo.js`)

```js
export const SERVICE_TYPES = [
  'Balloon Arch', 'Balloon Garland', 'Balloon Column', 'Balloon Wall',
  'Photo Backdrop', 'Balloon Sculpture', 'Balloon Bouquet', 'Balloon Ceiling',
  'Marquee Letters', 'Custom Installation',
];

export const EVENT_TYPES = [
  'Wedding', 'Birthday', 'Corporate', 'Baby Shower', 'Graduation',
  'Office Party', 'Community Event', 'Gala', 'Brand Activation', 'Holiday',
];

export const GEO_CITIES = [
  'Kansas City', 'Overland Park', 'Olathe', "Lee's Summit",
  'Independence', 'Lenexa', 'Shawnee', 'Prairie Village', 'Leawood', 'Other',
];
```

### JSON-LD schema shape

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "description": "...",
  "image": "...",
  "datePublished": "2025-01-01",
  "dateModified": "2025-01-15",
  "author": { "@type": "Person", "name": "..." },
  "publisher": {
    "@type": "LocalBusiness",
    "name": "BalloonCraft",
    "@id": "https://ballooncraft.com",
    "url": "https://ballooncraft.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kansas City",
      "addressRegion": "MO",
      "addressCountry": "US"
    }
  }
}
```

---

## Data Flow

### SEO Auto-Generation on Save

```
Admin clicks "Save Project"
  │
  ▼
autoFillSeoFields(form) in src/lib/seo.js
  ├─ if meta_title empty  → truncate(title, 60)
  ├─ if meta_description empty → truncate(excerpt, 160)
  │    └─ still empty? → truncate(stripHtml(content), 160)
  ├─ if og_image empty → featured_image
  │    └─ still empty? → gallery_images_meta[0]?.url ?? gallery_images[0]
  └─ returns { filled: updatedForm, didFill: boolean }
  │
  ▼
resolveUniqueSlug(base, existingSlugs, currentId) in src/lib/seo.js
  ├─ if slug empty → generateSlug(title)
  ├─ check against existing slugs (excluding current post)
  └─ append -2, -3, ... until unique
  │
  ▼
Project.create(data) or Project.update(id, data)
  │
  ▼
if didFill → toast.success("SEO fields auto-filled from your content.")
```

### Slug Collision Detection

The `resolveUniqueSlug` function receives the full list of existing slugs (fetched with the admin projects query). It is a pure function — no additional Supabase calls needed. The admin projects query already fetches all projects, so slugs are available in memory.

For manual slug edits, an inline validator runs on blur: it checks `projects.some(p => p.slug === enteredSlug && p.id !== editingId)` and sets a validation error state.

### Sitemap Generation (`api/sitemap.js`)

```
GET /sitemap.xml
  │
  ▼
api/sitemap.js
  ├─ creates Supabase client with service role key
  ├─ queries: SELECT slug, updated_at, created_at FROM projects WHERE status='published'
  ├─ builds XML string:
  │    - static pages: /, /about, /projects, /testimonials, /contact
  │    - one <url> per published post
  └─ returns 200 with Content-Type: application/xml
```

The `vercel.json` rewrite must be ordered so `/sitemap.xml` is matched before the SPA catch-all:

```json
{
  "rewrites": [
    { "source": "/sitemap.xml", "destination": "/api/sitemap" },
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### Related Posts Algorithm

```
computeRelatedPosts(current, candidates):
  1. filter out current post from candidates
  2. filter to published only
  3. score each candidate:
     - +2 for each shared service_type
     - +1 for each shared event_type
  4. sort by score desc, then by created_at desc
  5. return top 3
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The pure utility functions in `src/lib/seo.js` are the primary targets for property-based testing. They have clear input/output behavior, no side effects, and universal properties that hold across a wide input space.

**Property Reflection:** After reviewing all prework items, the following consolidations were made:
- Requirements 5.3 and 5.4 (published/draft counts) are combined into one status-counting property.
- Requirements 6.3 and 6.4 (truncation in preview) are combined into one truncation property.
- Requirements 7.1–7.6 (character counters and color coding) are combined into two properties (counter display and color logic).
- Requirements 12.1, 12.2, 12.4 (JSON-LD validity and fields) are combined into two properties.
- Requirements 13.1–13.3 (OG image fallback chain) are combined into one property.
- Requirements 22.1, 22.3 (related posts count and exclusion) are combined into one property.

---

### Property 1: Markdown preview renders all supported elements

*For any* markdown string containing headings (H1–H3), bold, italic, unordered lists, ordered lists, or hyperlinks, the `renderMarkdown(input)` function should return an HTML string containing the corresponding HTML tags for each element present in the input.

**Validates: Requirements 2.2, 2.3**

---

### Property 2: meta_title auto-fill truncates to 60 characters

*For any* post form object where `meta_title` is empty and `title` is a non-empty string, `autoFillSeoFields(form).filled.meta_title` should equal `title.slice(0, 60)` and its length should never exceed 60.

**Validates: Requirements 3.1**

---

### Property 3: meta_description auto-fill truncates to 160 characters

*For any* post form object where `meta_description` is empty, `autoFillSeoFields(form).filled.meta_description` should be derived from `excerpt` (if non-empty) or `stripHtml(content)`, truncated to at most 160 characters.

**Validates: Requirements 3.2, 3.3**

---

### Property 4: Gallery drag-and-drop produces a valid permutation

*For any* `gallery_images_meta` array of length N and any valid drag operation (sourceIndex, destinationIndex both in [0, N-1]), the resulting array should be a permutation of the original — same elements, same length, no duplicates added or removed, with the dragged item at `destinationIndex`.

**Validates: Requirements 4.2**

---

### Property 5: Status counts are correct for any project array

*For any* array of project objects with arbitrary `status` values, `computeStatusCounts(projects).published` should equal the number of projects where `status === 'published'`, and `computeStatusCounts(projects).draft` should equal the number where `status === 'draft'`.

**Validates: Requirements 5.3, 5.4**

---

### Property 6: Weekly message count matches date filter

*For any* array of contact_submission objects with arbitrary `created_at` timestamps, `computeWeeklyMessageCount(messages)` should equal the count of messages where `created_at >= Date.now() - 7 * 24 * 60 * 60 * 1000`.

**Validates: Requirements 5.2**

---

### Property 7: SEO preview truncates long strings with ellipsis

*For any* string of length greater than the limit (60 for meta_title, 160 for meta_description), the preview display function should return a string of length `limit + 3` (the extra 3 being `...`) whose first `limit` characters equal the original string's first `limit` characters.

**Validates: Requirements 6.3, 6.4**

---

### Property 8: Character counter color logic is correct for any string length

*For any* string and its associated field limit, the `getCounterColor(length, max, optimalMin)` function should return `'red'` when `length > max`, `'green'` when `optimalMin <= length <= max`, and `'gray'` otherwise. These three cases are mutually exclusive and exhaustive.

**Validates: Requirements 7.3, 7.4, 7.5, 7.6**

---

### Property 9: Duplicate post transformation is correct for any post

*For any* post object, the `duplicatePost(post)` function should return a new object where `title === 'Copy of ' + post.title`, `status === 'draft'`, `slug === ''`, and all other fields are equal to the original post's fields.

**Validates: Requirements 8.2**

---

### Property 10: Bulk status update applies to all selected posts

*For any* array of post objects and any subset of their IDs and any valid status string, after `applyBulkStatus(posts, selectedIds, newStatus)`, every post whose ID is in `selectedIds` should have `status === newStatus`, and every post whose ID is not in `selectedIds` should have its original status unchanged.

**Validates: Requirements 9.3**

---

### Property 11: Generated slug is URL-safe for any title

*For any* non-empty title string, `generateSlug(title)` should return a string that matches the pattern `/^[a-z0-9]+(-[a-z0-9]+)*$/` — lowercase, alphanumeric segments separated by single hyphens, no leading or trailing hyphens.

**Validates: Requirements 11.1**

---

### Property 12: Slug collision resolution always produces a unique slug

*For any* base slug string and any finite set of existing slugs, `resolveUniqueSlug(base, existingSlugs)` should return a string that is not present in `existingSlugs`.

**Validates: Requirements 11.2**

---

### Property 13: Slug sanitization is idempotent and correct

*For any* string input, `sanitizeSlug(s)` should return a lowercase string with spaces replaced by hyphens, and applying it twice should produce the same result as applying it once: `sanitizeSlug(sanitizeSlug(s)) === sanitizeSlug(s)`.

**Validates: Requirements 11.4**

---

### Property 14: JSON-LD output is valid JSON and contains required BlogPosting fields

*For any* post object with non-null title, the output of `buildJsonLd(post, siteContent)` should be serializable to valid JSON (i.e., `JSON.parse(JSON.stringify(jsonLd))` should not throw), and the resulting object should contain `@type: 'BlogPosting'`, `headline`, `description`, `image`, `datePublished`, `author`, and a nested `publisher` with `@type: 'LocalBusiness'`.

**Validates: Requirements 12.1, 12.4**

---

### Property 15: JSON-LD LocalBusiness uses geo_city when present

*For any* post object where `geo_city` is a non-empty string, `buildJsonLd(post, siteContent).publisher.address.addressLocality` should equal `post.geo_city`.

**Validates: Requirements 12.2, 12.3, 21.4**

---

### Property 16: OG image resolution follows the correct fallback chain

*For any* post object, `resolveOgImage(post, siteDefaultOg)` should return the first non-empty string in the ordered sequence: `[post.og_image, post.featured_image, post.gallery_images_meta?.[0]?.url, post.gallery_images?.[0], siteDefaultOg]`. The result should never be empty if `siteDefaultOg` is non-empty.

**Validates: Requirements 13.1, 13.2, 13.3**

---

### Property 17: Sitemap contains exactly one URL entry per published post

*For any* array of published post objects, `generateSitemapXml(posts, staticPages, domain)` should return an XML string containing exactly `posts.length + staticPages.length` `<url>` elements, each with a `<loc>` tag whose value is the full canonical URL of the post.

**Validates: Requirements 14.2**

---

### Property 18: Canonical URL format is correct for any slug

*For any* slug string, `formatCanonicalUrl(domain, '/projects/' + slug)` should return a string matching `https://{domain}/projects/{slug}` with no double slashes.

**Validates: Requirements 15.1, 15.3**

---

### Property 19: SEO score checklist correctly evaluates keyword presence

*For any* focus keyword string and any post object (title, meta_description, content, slug), `computeSeoScore(keyword, post)` should return a `checks` array of 4 booleans where each boolean is `true` if and only if the corresponding field contains the keyword (case-insensitive), and `score` equals the count of `true` values.

**Validates: Requirements 16.2, 16.3, 16.4, 16.5**

---

### Property 20: Service type filter returns only matching posts

*For any* array of post objects and any service type string, `filterByServiceType(posts, serviceType)` should return only posts where `post.service_types.includes(serviceType)`, and no post in the result should be missing that service type.

**Validates: Requirements 17.4**

---

### Property 21: Combined service + event type filter satisfies both conditions

*For any* array of post objects and any (serviceType, eventType) filter pair, `filterPosts(posts, { serviceType, eventType })` should return only posts where `post.service_types.includes(serviceType) && post.event_types.includes(eventType)`.

**Validates: Requirements 17.4, 18.4, 18.5**

---

### Property 22: Client quote renders when present, is absent when empty

*For any* post object where `client_quote` is a non-empty string, the rendered ProjectDetail should contain a blockquote element with the quote text. *For any* post object where `client_quote` is empty or null, the rendered ProjectDetail should not contain a testimonial blockquote.

**Validates: Requirements 19.2, 19.4**

---

### Property 23: Gallery metadata round-trips through JSON serialization

*For any* array of `GalleryImageMeta` objects `{ url: string, label: 'before' | 'after' | null }`, serializing to JSON and deserializing should produce an array equal to the original: `JSON.parse(JSON.stringify(meta))` should deep-equal the input.

**Validates: Requirements 20.2**

---

### Property 24: Geo city is appended to meta_title only when not already present

*For any* `meta_title` string and any `geo_city` string, `appendGeoToTitle(metaTitle, geoCity)` should return `metaTitle + ' | ' + geoCity` when `metaTitle` does not already contain `geoCity`, and should return `metaTitle` unchanged when it already contains `geoCity`. Applying the function twice should produce the same result as applying it once.

**Validates: Requirements 21.3**

---

### Property 25: Related posts never include the current post and are at most 3

*For any* current post and any array of candidate published posts, `computeRelatedPosts(current, candidates)` should return an array of length at most 3, and the array should not contain any post with `id === current.id`.

**Validates: Requirements 22.1, 22.3**

---

### Property 26: Related posts prefer service_type matches over event_type matches

*For any* current post with at least one `service_type` and a candidate pool containing posts that share a `service_type` and posts that share only an `event_type`, `computeRelatedPosts` should rank the service_type-sharing posts higher (appear earlier in the result) than the event_type-only posts.

**Validates: Requirements 22.2**

---

### Property 27: SEO health counts only published posts

*For any* array of post objects with mixed statuses, `computeSeoHealthCounts(posts)` should return counts equal to those computed by filtering to `status === 'published'` first, then counting missing fields. Draft and archived posts should never contribute to the counts.

**Validates: Requirements 24.1, 24.4**

---

### Property 28: Tip cycling is correct for any starting index and click count

*For any* starting tip index `i` (in [0, N-1]) and any non-negative integer number of "Next Tip" clicks `k`, the resulting displayed tip index should equal `(i + k) % N`, where `N` is the total number of tips.

**Validates: Requirements 25.3**

---

## Error Handling

### Save Failures
- Supabase errors on `Project.create` / `Project.update` are caught in the mutation's `onError` handler and displayed via `toast.error(error.message)`.
- Slug collision on manual entry shows an inline validation error below the slug field; the save button is disabled until resolved.

### Image Upload Failures
- Each file upload in `DraggableGallery` is wrapped in try/catch; failed uploads show `toast.error` and do not append to the gallery array.
- A per-file upload progress indicator (spinner overlay on the thumbnail placeholder) is shown during upload.

### Sitemap Errors
- If the Supabase query in `api/sitemap.js` fails, the function returns HTTP 500 with a plain-text error. This is acceptable — Google will retry on the next crawl.
- Missing environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) cause an early 500 with a descriptive message.

### JSON-LD Errors
- `buildJsonLd` never throws — all fields have safe fallbacks (empty string or "Kansas City" for geo_city).
- The `<script>` tag is only injected if `buildJsonLd` returns a non-null object.

### Missing Slug on Preview
- If `form.slug` is empty when the Preview button is clicked, a `toast.info("Save the post first to generate a preview URL.")` is shown and `window.open` is not called.

### Related Posts Edge Cases
- If `computeRelatedPosts` returns an empty array, the Related Posts section is not rendered (conditional render on `relatedPosts.length > 0`).

---

## Testing Strategy

### Unit Tests (Vitest)

All pure functions in `src/lib/seo.js` should have unit tests covering:
- `generateSlug`: specific examples (spaces, special chars, uppercase, leading/trailing hyphens)
- `sanitizeSlug`: spaces → hyphens, uppercase → lowercase
- `resolveUniqueSlug`: no collision, single collision, multiple collisions
- `autoFillSeoFields`: all combinations of empty/non-empty fields
- `stripHtml`: HTML tags removed, Markdown markers removed
- `truncate`: at limit, below limit, above limit
- `resolveOgImage`: each fallback level
- `buildJsonLd`: required fields present, geo_city used when set, default city when not set
- `computeSeoScore`: all 4 checks pass, none pass, partial
- `computeRelatedPosts`: service_type preference, event_type fallback, recency fallback, excludes current
- `computeWeeklyMessageCount`: messages within 7 days, messages outside 7 days, boundary
- `computeStatusCounts`: mixed statuses
- `computeSeoHealthCounts`: published only, all complete
- `appendGeoToTitle`: appends when absent, no-op when present

### Property-Based Tests (fast-check, Vitest)

Use `fast-check` for property-based testing. Each test runs a minimum of 100 iterations.

Install: `npm install --save-dev fast-check`

Test file: `src/lib/seo.test.js`

Each property test is tagged with a comment in the format:
`// Feature: admin-ux-seo-improvements, Property {N}: {property_text}`

Properties to implement as PBT:
- Property 1: Markdown rendering (arbitrary markdown strings)
- Property 2: meta_title auto-fill truncation (arbitrary title strings)
- Property 3: meta_description auto-fill truncation (arbitrary excerpt/content strings)
- Property 4: Gallery drag-and-drop permutation (arbitrary arrays, arbitrary indices)
- Property 5: Status counts (arbitrary project arrays with random statuses)
- Property 6: Weekly message count (arbitrary message arrays with random timestamps)
- Property 7: SEO preview truncation (arbitrary strings over the limit)
- Property 8: Character counter color logic (arbitrary lengths)
- Property 9: Duplicate post transformation (arbitrary post objects)
- Property 10: Bulk status update (arbitrary post arrays, arbitrary subsets, arbitrary status)
- Property 11: Generated slug is URL-safe (arbitrary title strings)
- Property 12: Slug collision resolution uniqueness (arbitrary base slug, arbitrary existing slug sets)
- Property 13: Slug sanitization idempotence (arbitrary strings)
- Property 14: JSON-LD is valid JSON with required fields (arbitrary post objects)
- Property 15: JSON-LD uses geo_city when present (arbitrary post objects with geo_city)
- Property 16: OG image fallback chain (arbitrary post objects with varying empty/non-empty image fields)
- Property 17: Sitemap URL count (arbitrary published post arrays)
- Property 18: Canonical URL format (arbitrary slug strings)
- Property 19: SEO score checklist accuracy (arbitrary keyword + post field combinations)
- Property 20: Service type filter correctness (arbitrary post arrays, arbitrary service type)
- Property 21: Combined filter AND logic (arbitrary post arrays, arbitrary filter pairs)
- Property 22: Client quote render/hide (arbitrary post objects)
- Property 23: Gallery metadata JSON round-trip (arbitrary GalleryImageMeta arrays)
- Property 24: Geo city title append idempotence (arbitrary title + geo_city strings)
- Property 25: Related posts count ≤ 3 and excludes current (arbitrary post arrays)
- Property 26: Related posts service_type preference (constructed post arrays)
- Property 27: SEO health counts only published (arbitrary post arrays with mixed statuses)
- Property 28: Tip cycling modular arithmetic (arbitrary start index, arbitrary click count)

### Integration Tests

- `api/sitemap.js`: deploy to Vercel preview and assert HTTP 200, `Content-Type: application/xml`, valid XML structure, and that a newly published post appears in the response.
- Supabase migration: run `002_seo_improvements.sql` against a test database and verify all new columns exist with correct types and defaults.

### Smoke Tests

- `/sitemap.xml` returns 200 with `Content-Type: application/xml` (single request, no input variation needed).
- All existing routes (`/admin/projects`, `/projects`) still resolve after the rename (route config unchanged).

### Manual / Visual Tests

- SEO Preview Panel renders correctly in the Post_Editor dialog.
- Before/After badges appear on gallery images in ProjectDetail.
- Drag-and-drop reordering works in the gallery.
- JSON-LD is valid in Google's Rich Results Test tool.
- Canonical tags are present in page source for all public pages.
