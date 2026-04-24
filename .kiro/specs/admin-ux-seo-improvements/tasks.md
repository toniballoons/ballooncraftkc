# Implementation Plan: Admin UX & SEO Improvements

## Overview

Implement 25 improvements to the BalloonCraft admin panel and public site. Work proceeds in dependency order: database first, then pure utilities, then new UI components, then page refactors, then serverless infrastructure, then property-based tests.

## Tasks

- [x] 1. Database migration — add new columns to projects table
  - Create `supabase/migrations/002_seo_improvements.sql`
  - Add columns: `focus_keyword text`, `service_types text[] DEFAULT '{}'`, `event_types text[] DEFAULT '{}'`, `geo_city text`, `client_quote text`, `client_quote_name text`, `gallery_images_meta jsonb DEFAULT '[]'`, `updated_at timestamptz DEFAULT now()`
  - Add `set_updated_at()` trigger function and `projects_updated_at` trigger
  - _Requirements: 16.1, 17.2, 18.2, 19.1, 20.2, 21.2_

- [x] 2. Create `src/lib/seo.js` — pure SEO utility functions
  - [x] 2.1 Implement slug utilities: `generateSlug`, `sanitizeSlug`, `resolveUniqueSlug`
    - `generateSlug(title)`: lowercase, replace non-alphanumeric with hyphens, trim leading/trailing hyphens
    - `sanitizeSlug(raw)`: lowercase + spaces → hyphens
    - `resolveUniqueSlug(base, existingSlugs, currentId?)`: appends `-2`, `-3`, etc. until unique
    - _Requirements: 11.1, 11.2, 11.4_

  - [x] 2.2 Implement text utilities: `stripHtml`, `truncate`
    - `stripHtml(html)`: removes HTML tags and Markdown markers, returns plain text
    - `truncate(str, max)`: returns `str.slice(0, max)`
    - _Requirements: 3.3, 6.3, 6.4_

  - [x] 2.3 Implement `autoFillSeoFields(form)`
    - If `meta_title` empty → `truncate(title, 60)`
    - If `meta_description` empty → `truncate(excerpt, 160)` else `truncate(stripHtml(content), 160)`
    - If `og_image` empty → `featured_image` else `gallery_images_meta[0]?.url ?? gallery_images[0]`
    - Returns `{ filled: updatedForm, didFill: boolean }`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.4 Implement `resolveOgImage(post, siteDefaultOg)`
    - Waterfall: `og_image → featured_image → gallery_images_meta[0]?.url → gallery_images[0] → siteDefaultOg`
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 2.5 Implement `buildJsonLd(post, siteContent)`
    - Returns BlogPosting + LocalBusiness JSON-LD object per design schema
    - Uses `post.geo_city` for `addressLocality`, falls back to `"Kansas City"`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 2.6 Implement `computeSeoScore(keyword, post)`
    - Checks keyword (case-insensitive) in: title, meta_description, content, slug
    - Returns `{ score: number, checks: boolean[] }`
    - _Requirements: 16.2, 16.3, 16.4, 16.5_

  - [x] 2.7 Implement `computeRelatedPosts(current, candidates)`
    - Filter out current post and non-published; score: +2 per shared service_type, +1 per shared event_type; sort by score desc then created_at desc; return top 3
    - _Requirements: 22.1, 22.2, 22.3_

  - [x] 2.8 Implement dashboard stat helpers
    - `computeWeeklyMessageCount(messages)`: count where `created_at >= now - 7 days`
    - `computeStatusCounts(projects)`: `{ published, draft, archived }` counts
    - `computeSeoHealthCounts(projects)`: published posts missing `meta_description`, `focus_keyword`, `featured_image`
    - _Requirements: 5.2, 5.3, 5.4, 24.1, 24.4_

  - [x] 2.9 Implement remaining utilities
    - `formatCanonicalUrl(domain, path)`: returns `https://{domain}{path}` with no double slashes
    - `appendGeoToTitle(metaTitle, geoCity)`: appends `| {geoCity}` if not already present
    - Export controlled vocabulary constants: `SERVICE_TYPES`, `EVENT_TYPES`, `GEO_CITIES`
    - _Requirements: 15.1, 15.3, 21.3_

- [x] 3. Create new admin UI components
  - [x] 3.1 Create `src/components/admin/MarkdownEditor.jsx`
    - Props: `value: string`, `onChange: (v) => void`
    - Two-column layout: left = `<textarea>`, right = live preview
    - Implement lightweight regex-based `renderMarkdown` supporting H1–H3, bold, italic, ul, ol, links
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Create `src/components/admin/DraggableGallery.jsx`
    - Props: `images: GalleryImageMeta[]`, `onChange: (images) => void`
    - Uses `DragDropContext`, `Droppable`, `Draggable` from `@hello-pangea/dnd`
    - Each thumbnail: image preview, Before/After/None three-way toggle, remove button, drag handle
    - Multi-file upload via `<input multiple>` with per-file upload progress spinner
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 20.1_

  - [x] 3.3 Create `src/components/admin/SeoPreviewPanel.jsx`
    - Props: `metaTitle: string`, `metaDescription: string`, `slug: string`, `domain: string`
    - Renders read-only Google SERP snippet: blue link (truncated at 60), green URL breadcrumb, gray description (truncated at 160)
    - Updates in real time from props
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.4 Create `src/components/admin/CharCounter.jsx`
    - Props: `value: string`, `max: number`, `optimalMin?: number`
    - Renders `{value.length} / {max}` with color: red if over max, green if within optimal range, gray otherwise
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 3.5 Create `src/components/admin/FocusKeywordPanel.jsx`
    - Props: `keyword: string`, `post: { title, meta_description, content, slug }`
    - Renders 4-item SEO checklist using `computeSeoScore()` from `src/lib/seo.js`
    - Green checkmark when condition met, gray/red X when not; score fraction updates in real time
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 4. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 5. Refactor `src/pages/admin/ProjectsAdmin.jsx`
  - [x] 5.1 Update heading, nav label, and helper text
    - Change page heading to "Portfolio / Blog"
    - Add helper text block: "Each post showcases an event AND helps Google find your business. Post after every event with photos and a description for best SEO results."
    - _Requirements: 1.1, 1.2_

  - [x] 5.2 Replace ReactQuill with MarkdownEditor and update emptyProject state
    - Remove `ReactQuill` import; import and render `MarkdownEditor` for the content field
    - Extend `emptyProject` with: `focus_keyword`, `service_types`, `event_types`, `geo_city`, `client_quote`, `client_quote_name`, `gallery_images_meta`
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 5.3 Replace gallery section with DraggableGallery component
    - Remove existing gallery grid; render `<DraggableGallery images={form.gallery_images_meta} onChange={...} />`
    - Sync `gallery_images` from `gallery_images_meta` URLs on change for backward compatibility
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 5.4 Add Service Type, Event Type, and Geo City fields
    - Service Type: multi-select using `SERVICE_TYPES` constants, stores to `form.service_types`
    - Event Type: multi-select using `EVENT_TYPES` constants, stores to `form.event_types`
    - Geo City: dropdown using `GEO_CITIES` constants, stores to `form.geo_city`
    - _Requirements: 17.1, 17.2, 18.1, 18.2, 21.1, 21.2_

  - [x] 5.5 Add Client Testimonial fields
    - Add `client_quote` textarea and `client_quote_name` text input in a "Client Testimonial" section
    - _Requirements: 19.1_

  - [x] 5.6 Add Focus Keyword field and render FocusKeywordPanel
    - Add `focus_keyword` text input; render `<FocusKeywordPanel keyword={form.focus_keyword} post={form} />` below it
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [x] 5.7 Add SeoPreviewPanel and CharCounters to SEO section
    - Render `<SeoPreviewPanel>` in the SEO card, updating from `form.meta_title`, `form.meta_description`, `form.slug`
    - Add `<CharCounter value={form.meta_title} max={60} optimalMin={50} />` below meta_title input
    - Add `<CharCounter value={form.meta_description} max={160} optimalMin={120} />` below meta_description textarea
    - _Requirements: 6.1, 6.2, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 5.8 Add slug inline validation and Preview button
    - On slug field blur: check `projects.some(p => p.slug === enteredSlug && p.id !== editingId)` and set validation error state
    - Add "Preview" button in dialog header; on click open `/projects/{slug}` in new tab; if no slug show toast "Save the post first to generate a preview URL."
    - _Requirements: 10.1, 10.2, 10.3, 11.3_

  - [x] 5.9 Add Duplicate button per row and bulk-select with bulk action toolbar
    - Add Copy2 icon "Duplicate" button per row; on click: create copy with `title = 'Copy of ' + p.title`, `status = 'draft'`, `slug = ''`; open Post_Editor pre-filled; show toast "Post duplicated — make your changes and save."
    - Add checkbox per row and "Select All" header checkbox; when ≥1 selected show bulk toolbar with count + status dropdown (Publish / Set to Draft / Archive); on confirm batch-update all selected; show toast "N posts updated to {status}"; deselect all
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 5.10 Wire autoFillSeoFields and resolveUniqueSlug into save mutation
    - Before `Project.create/update`: call `autoFillSeoFields(form)`, then `resolveUniqueSlug(base, existingSlugs, editingId)`
    - If `didFill` is true, show toast "SEO fields auto-filled from your content."
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 11.1, 11.2_

- [ ] 6. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 7. Refactor `src/pages/admin/Dashboard.jsx`
  - [x] 7.1 Implement Quick Stats Widget (5 cards)
    - Replace existing 3-card grid with 5 stat cards: Total Posts, Published Posts, Draft Posts, New Messages This Week, Total Testimonials
    - Use `computeStatusCounts`, `computeWeeklyMessageCount` from `src/lib/seo.js`
    - Each card navigates to its admin section on click
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.2 Implement Recent Activity Feed
    - Two side-by-side lists: "Recent Posts" (last 5 by `created_at` desc) and "Recent Messages" (last 5 by `created_at` desc)
    - Recent Post entry: title, status badge, relative time; click navigates to Post_Editor
    - Recent Message entry: sender name, email, relative time; click navigates to `/admin/messages`
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

  - [x] 7.3 Implement SEO Health Panel
    - Use `computeSeoHealthCounts` from `src/lib/seo.js` to show 3 counts
    - When all counts are 0, show green "All SEO fields complete!" message
    - Each count is clickable (navigate to `/admin/projects` — filter state can be a future enhancement; navigation is sufficient for now)
    - _Requirements: 24.1, 24.2, 24.3, 24.4_

  - [x] 7.4 Implement Top Tips Card
    - Fixed list of ≥5 tips per requirements
    - "Next Tip" button cycles through tips using `(currentIndex + 1) % tips.length`
    - Display "Tip N of M" counter
    - _Requirements: 25.1, 25.2, 25.3, 25.4_

- [x] 8. Refactor `src/pages/site/ProjectDetail.jsx`
  - [x] 8.1 Inject canonical, OG meta tags, and JSON-LD via useEffect
    - Use `useEffect` to create/update `<link rel="canonical">`, `<meta property="og:*">`, and `<script type="application/ld+json">` tags on `document.head`; clean up on unmount
    - Use `resolveOgImage` for OG image, `appendGeoToTitle` for `<title>`, `buildJsonLd` for structured data
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 15.1, 15.2, 15.3, 21.3, 21.4_

  - [x] 8.2 Add client testimonial blockquote section
    - Render between content and gallery sections, only when `project.client_quote` is non-empty
    - Visually distinct blockquote with `client_quote_name` attribution below
    - _Requirements: 19.2, 19.3, 19.4_

  - [x] 8.3 Add Before/After badges to gallery images
    - Read `project.gallery_images_meta`; overlay "Before" or "After" badge on images with matching label
    - Fall back to `project.gallery_images` (plain URLs) when `gallery_images_meta` is empty
    - _Requirements: 20.3, 20.4_

  - [x] 8.4 Add Related Posts section
    - Fetch all published projects; call `computeRelatedPosts(project, allProjects)` for up to 3 results
    - Render at bottom of page; each card: featured image, title, service_type tags, link to detail page
    - Do not render section when result is empty
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [x] 9. Refactor `src/pages/site/Projects.jsx`
  - [x] 9.1 Add Service Type and Event Type filter chips
    - Render Service_Type chip row using `SERVICE_TYPES` constants; "All" chip clears filter
    - Render Event_Type chip row using `EVENT_TYPES` constants
    - When both filters active, apply AND logic: post must match both
    - _Requirements: 17.3, 17.4, 17.5, 18.3, 18.4, 18.5_

  - [x] 9.2 Add City filter dropdown
    - Render `geo_city` dropdown using `GEO_CITIES` constants; "All Cities" option clears filter
    - Include city in combined AND filter logic
    - _Requirements: 21.5_

  - [x] 9.3 Inject canonical and OG meta tags via useEffect
    - Add `useEffect` to set `<link rel="canonical">` and `<meta property="og:*">` for the `/projects` index page
    - _Requirements: 15.1, 15.4_

- [x] 10. Add canonical and OG meta tags to remaining public pages
  - Add `useEffect` head injection to: `src/pages/site/Home.jsx`, `src/pages/site/About.jsx`, `src/pages/site/Testimonials.jsx`, `src/pages/site/Contact.jsx`
  - Each page sets its own `<link rel="canonical">` and basic `<meta property="og:title">` / `<meta property="og:description">`
  - _Requirements: 15.1, 15.4_

- [x] 11. Create `api/sitemap.js` — Vercel serverless sitemap function
  - Create Supabase client using `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars
  - Query `SELECT slug, updated_at, created_at FROM projects WHERE status='published'`
  - Build XML string with static pages (`/`, `/about`, `/projects`, `/testimonials`, `/contact`) + one `<url>` per published post
  - Return HTTP 200 with `Content-Type: application/xml`
  - Return HTTP 500 with descriptive message on Supabase error or missing env vars
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 12. Update `vercel.json` to route `/sitemap.xml`
  - Add `{ "source": "/sitemap.xml", "destination": "/api/sitemap" }` as the first rewrite rule, before the SPA catch-all
  - _Requirements: 14.1_

- [ ] 13. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Install fast-check and write property-based tests in `src/lib/seo.test.js`
  - Install dev dependency: `npm install --save-dev fast-check`
  - Create test file `src/lib/seo.test.js` using Vitest + fast-check
  - Each test tagged with comment: `// Feature: admin-ux-seo-improvements, Property N: ...`

  - [ ]* 14.1 Write property test for Property 1: Markdown rendering
    - **Property 1: Markdown preview renders all supported elements**
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 14.2 Write property test for Property 2: meta_title auto-fill truncation
    - **Property 2: meta_title auto-fill truncates to 60 characters**
    - **Validates: Requirements 3.1**

  - [ ]* 14.3 Write property test for Property 3: meta_description auto-fill truncation
    - **Property 3: meta_description auto-fill truncates to 160 characters**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 14.4 Write property test for Property 4: Gallery drag-and-drop permutation
    - **Property 4: Gallery drag-and-drop produces a valid permutation**
    - **Validates: Requirements 4.2**

  - [ ]* 14.5 Write property test for Property 5: Status counts correctness
    - **Property 5: Status counts are correct for any project array**
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 14.6 Write property test for Property 6: Weekly message count
    - **Property 6: Weekly message count matches date filter**
    - **Validates: Requirements 5.2**

  - [ ]* 14.7 Write property test for Property 7: SEO preview truncation
    - **Property 7: SEO preview truncates long strings with ellipsis**
    - **Validates: Requirements 6.3, 6.4**

  - [ ]* 14.8 Write property test for Property 8: Character counter color logic
    - **Property 8: Character counter color logic is correct for any string length**
    - **Validates: Requirements 7.3, 7.4, 7.5, 7.6**

  - [ ]* 14.9 Write property test for Property 9: Duplicate post transformation
    - **Property 9: Duplicate post transformation is correct for any post**
    - **Validates: Requirements 8.2**

  - [ ]* 14.10 Write property test for Property 10: Bulk status update
    - **Property 10: Bulk status update applies to all selected posts**
    - **Validates: Requirements 9.3**

  - [ ]* 14.11 Write property test for Property 11: Generated slug is URL-safe
    - **Property 11: Generated slug is URL-safe for any title**
    - **Validates: Requirements 11.1**

  - [ ]* 14.12 Write property test for Property 12: Slug collision resolution uniqueness
    - **Property 12: Slug collision resolution always produces a unique slug**
    - **Validates: Requirements 11.2**

  - [ ]* 14.13 Write property test for Property 13: Slug sanitization idempotence
    - **Property 13: Slug sanitization is idempotent and correct**
    - **Validates: Requirements 11.4**

  - [ ]* 14.14 Write property test for Property 14: JSON-LD valid JSON with required fields
    - **Property 14: JSON-LD output is valid JSON and contains required BlogPosting fields**
    - **Validates: Requirements 12.1, 12.4**

  - [ ]* 14.15 Write property test for Property 15: JSON-LD uses geo_city
    - **Property 15: JSON-LD LocalBusiness uses geo_city when present**
    - **Validates: Requirements 12.2, 12.3, 21.4**

  - [ ]* 14.16 Write property test for Property 16: OG image fallback chain
    - **Property 16: OG image resolution follows the correct fallback chain**
    - **Validates: Requirements 13.1, 13.2, 13.3**

  - [ ]* 14.17 Write property test for Property 17: Sitemap URL count
    - **Property 17: Sitemap contains exactly one URL entry per published post**
    - **Validates: Requirements 14.2**

  - [ ]* 14.18 Write property test for Property 18: Canonical URL format
    - **Property 18: Canonical URL format is correct for any slug**
    - **Validates: Requirements 15.1, 15.3**

  - [ ]* 14.19 Write property test for Property 19: SEO score checklist accuracy
    - **Property 19: SEO score checklist correctly evaluates keyword presence**
    - **Validates: Requirements 16.2, 16.3, 16.4, 16.5**

  - [ ]* 14.20 Write property test for Property 20: Service type filter correctness
    - **Property 20: Service type filter returns only matching posts**
    - **Validates: Requirements 17.4**

  - [ ]* 14.21 Write property test for Property 21: Combined filter AND logic
    - **Property 21: Combined service + event type filter satisfies both conditions**
    - **Validates: Requirements 17.4, 18.4, 18.5**

  - [ ]* 14.22 Write property test for Property 22: Client quote render/hide
    - **Property 22: Client quote renders when present, is absent when empty**
    - **Validates: Requirements 19.2, 19.4**

  - [ ]* 14.23 Write property test for Property 23: Gallery metadata JSON round-trip
    - **Property 23: Gallery metadata round-trips through JSON serialization**
    - **Validates: Requirements 20.2**

  - [ ]* 14.24 Write property test for Property 24: Geo city title append idempotence
    - **Property 24: Geo city is appended to meta_title only when not already present**
    - **Validates: Requirements 21.3**

  - [ ]* 14.25 Write property test for Property 25: Related posts count and exclusion
    - **Property 25: Related posts never include the current post and are at most 3**
    - **Validates: Requirements 22.1, 22.3**

  - [ ]* 14.26 Write property test for Property 26: Related posts service_type preference
    - **Property 26: Related posts prefer service_type matches over event_type matches**
    - **Validates: Requirements 22.2**

  - [ ]* 14.27 Write property test for Property 27: SEO health counts only published
    - **Property 27: SEO health counts only published posts**
    - **Validates: Requirements 24.1, 24.4**

  - [ ]* 14.28 Write property test for Property 28: Tip cycling modular arithmetic
    - **Property 28: Tip cycling is correct for any starting index and click count**
    - **Validates: Requirements 25.3**

- [ ] 15. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- The `@hello-pangea/dnd` package must be installed before task 3.2: `npm install @hello-pangea/dnd`
- The `fast-check` package must be installed before task 14: `npm install --save-dev fast-check`
- Dashboard Theme Settings card and ThemeSettings.jsx live preview are already complete — do not re-implement
- `gallery_images` (plain text[]) is kept in sync with `gallery_images_meta` URLs for backward compatibility with existing public pages until all consumers are migrated
- Head tag injection uses raw `document.head` manipulation in `useEffect` (no react-helmet dependency needed)
- The `api/sitemap.js` function uses `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) to bypass RLS
