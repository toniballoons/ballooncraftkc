# Requirements Document

## Introduction

This feature delivers 25 targeted improvements to the BalloonCraft admin panel and public-facing website, with the goal of out-ranking Kansas City balloon decoration competitors on Google. The "Projects" section (currently a portfolio) is repositioned as a dual-purpose **Portfolio / Blog** — the primary SEO engine for the business. Improvements span four areas: Admin UX, SEO infrastructure, content/portfolio enrichment, and dashboard intelligence.

The business serves all event types (weddings, birthdays, corporate, baby showers, graduations, galas, brand activations, etc.) across the Kansas City metro area including Overland Park, Olathe, Lee's Summit, and Independence.

---

## Glossary

- **Admin**: The authenticated business owner using the admin panel at `/admin/*`
- **Portfolio_Blog**: The renamed "Projects" section — a combined portfolio showcase and SEO blog, accessible at `/projects` publicly and `/admin/projects` in the admin panel
- **Post**: A single Portfolio_Blog entry (previously called "Project") stored in the `projects` table
- **Post_Editor**: The admin dialog/form used to create or edit a Post
- **SEO_Preview_Panel**: A UI component in the Post_Editor that renders a simulated Google search result snippet
- **Focus_Keyword**: A single target keyword phrase entered per Post used to compute an SEO score
- **SEO_Score**: A checklist-based score (0–4) indicating how well a Post is optimized for its Focus_Keyword
- **Service_Type**: A controlled vocabulary tag describing the balloon service shown in a Post (e.g., Balloon Arch, Balloon Garland)
- **Event_Type**: A controlled vocabulary tag describing the event category of a Post (e.g., Wedding, Corporate)
- **Geo_Tag**: A city or neighborhood field on a Post used in SEO metadata and structured data
- **Slug**: A URL-safe, lowercase, hyphenated string uniquely identifying a Post (e.g., `pink-balloon-arch-wedding-kansas-city`)
- **Structured_Data**: JSON-LD markup embedded in a page's `<head>` for Google rich results
- **Canonical_URL**: An HTML `<link rel="canonical">` tag pointing to the preferred URL of a page
- **OG_Image**: The Open Graph image used when a page is shared on social media
- **Sitemap**: An XML file at `/sitemap.xml` listing all published Posts for Google indexing
- **Quick_Stats_Widget**: A dashboard card showing aggregate counts of Posts, messages, and testimonials
- **SEO_Health_Panel**: A dashboard panel reporting Posts missing critical SEO fields
- **Recent_Activity_Feed**: A dashboard feed showing the last 5 published Posts and last 5 received messages
- **Before_After_Image**: A gallery image tagged as either "before" or "after" for transformation showcases
- **Related_Posts**: Up to 3 Posts shown at the bottom of a Post detail page sharing the same Service_Type or Event_Type
- **Duplicate_Post**: A copy of an existing Post created as a new draft with all fields pre-filled

---

## Requirements

---

### Requirement 1: Rename "Projects" to "Portfolio / Blog" Throughout Admin

**User Story:** As an Admin, I want the "Projects" section to be clearly labeled as "Portfolio / Blog" with explanatory helper text, so that I understand it serves both as a portfolio showcase and an SEO blog.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display the navigation label "Portfolio / Blog" in all locations where "Projects" previously appeared, including the sidebar navigation, page headings, and breadcrumbs.
2. THE Post_Editor SHALL display a helper text block reading: "Each post showcases an event AND helps Google find your business. Post after every event with photos and a description for best SEO results."
3. THE Admin_Panel SHALL preserve all existing routes (`/admin/projects`) and public routes (`/projects`) without change, so that no existing links break.

---

### Requirement 2: Replace react-quill with a Clean Prose Editor

**User Story:** As an Admin, I want a clean, minimal content editor without large toolbar arrows or visual clutter, so that writing post content feels simple and distraction-free.

#### Acceptance Criteria

1. THE Post_Editor SHALL replace the `ReactQuill` component with a plain `<textarea>` that accepts Markdown-formatted text.
2. WHEN the Admin types in the content textarea, THE Post_Editor SHALL render a live Markdown preview panel beside or below the textarea showing formatted output.
3. THE Post_Editor SHALL support the following Markdown elements in the preview: headings (H1–H3), bold, italic, unordered lists, ordered lists, and hyperlinks.
4. THE Post_Editor SHALL NOT display the react-quill toolbar or any large arrow/button artifacts.
5. WHEN a Post with existing HTML content is opened for editing, THE Post_Editor SHALL display the raw HTML in the textarea so no content is lost.

---

### Requirement 3: Auto-Generate SEO Fields on Save

**User Story:** As an Admin, I want SEO fields to be automatically populated when I save a post, so that I never have to manually fill in meta titles, meta descriptions, or OG images.

#### Acceptance Criteria

1. WHEN a Post is saved and `meta_title` is empty, THE Post_Editor SHALL set `meta_title` to the Post's `title` value, truncated to 60 characters.
2. WHEN a Post is saved and `meta_description` is empty, THE Post_Editor SHALL set `meta_description` to the Post's `excerpt` value, truncated to 160 characters.
3. WHEN a Post is saved and `meta_description` is still empty after checking `excerpt`, THE Post_Editor SHALL set `meta_description` to the first 160 characters of the Post's plain-text `content` (HTML/Markdown stripped).
4. WHEN a Post is saved and `og_image` is empty, THE Post_Editor SHALL set `og_image` to the Post's `featured_image` value.
5. WHEN a Post is saved and `og_image` is still empty after checking `featured_image`, THE Post_Editor SHALL set `og_image` to the first image URL in the Post's `gallery_images` array.
6. WHEN auto-generation fills a field, THE Post_Editor SHALL display a toast notification reading "SEO fields auto-filled from your content."

---

### Requirement 4: Multi-Photo Gallery with Drag-and-Drop Reordering

**User Story:** As an Admin, I want to upload multiple gallery photos and reorder them by dragging, so that I can control the visual sequence of images in a post.

#### Acceptance Criteria

1. THE Post_Editor SHALL display gallery images in a visual grid of thumbnail cards, each showing the image preview.
2. WHEN the Admin drags a gallery thumbnail card to a new position, THE Post_Editor SHALL reorder the `gallery_images` array to reflect the new position.
3. THE Post_Editor SHALL allow uploading multiple image files simultaneously via a single file input that accepts `multiple` files.
4. WHEN multiple files are selected for upload, THE Post_Editor SHALL upload each file and append all resulting URLs to `gallery_images` in the order they were selected.
5. WHEN the Admin clicks the remove button on a gallery thumbnail, THE Post_Editor SHALL remove that image from `gallery_images`.
6. THE Post_Editor SHALL display an upload progress indicator while files are being uploaded.

---

### Requirement 5: Quick Stats Widget on Dashboard

**User Story:** As an Admin, I want a Quick Stats widget on the Dashboard showing key counts at a glance, so that I can immediately understand the state of my content and inbox.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Quick_Stats_Widget containing five stat cards: "Total Posts", "Published Posts", "Draft Posts", "New Messages This Week", and "Total Testimonials".
2. THE Quick_Stats_Widget SHALL compute "New Messages This Week" as the count of `contact_submissions` records with `created_at` within the last 7 calendar days.
3. THE Quick_Stats_Widget SHALL compute "Published Posts" as the count of `projects` records with `status = 'published'`.
4. THE Quick_Stats_Widget SHALL compute "Draft Posts" as the count of `projects` records with `status = 'draft'`.
5. WHEN the Admin clicks a stat card, THE Dashboard SHALL navigate to the corresponding admin section.

---

### Requirement 6: SEO Preview Panel in Post Editor

**User Story:** As an Admin, I want to see exactly how my post will appear in Google search results while I'm editing it, so that I can write compelling titles and descriptions.

#### Acceptance Criteria

1. THE Post_Editor SHALL display an SEO_Preview_Panel that renders a simulated Google search result showing: the `meta_title` (or `title` if empty) in blue link text, the canonical URL in green text, and the `meta_description` in gray body text.
2. WHEN the Admin edits `meta_title`, `meta_description`, or `slug`, THE SEO_Preview_Panel SHALL update in real time without requiring a save.
3. THE SEO_Preview_Panel SHALL truncate the displayed `meta_title` at 60 characters with an ellipsis if it exceeds that length.
4. THE SEO_Preview_Panel SHALL truncate the displayed `meta_description` at 160 characters with an ellipsis if it exceeds that length.
5. THE SEO_Preview_Panel SHALL display the canonical URL in the format: `yourdomain.com › projects › {slug}`.

---

### Requirement 7: Character Counters for Meta Fields

**User Story:** As an Admin, I want character counters on the meta title and meta description fields with color warnings, so that I know when my SEO copy is too long or too short.

#### Acceptance Criteria

1. THE Post_Editor SHALL display a character counter below the `meta_title` input showing the current character count and the maximum of 60 (e.g., "42 / 60").
2. THE Post_Editor SHALL display a character counter below the `meta_description` textarea showing the current character count and the maximum of 160 (e.g., "118 / 160").
3. WHEN the `meta_title` character count exceeds 60, THE Post_Editor SHALL render the counter text in red.
4. WHEN the `meta_description` character count exceeds 160, THE Post_Editor SHALL render the counter text in red.
5. WHEN the `meta_title` character count is between 50 and 60 (inclusive), THE Post_Editor SHALL render the counter text in green to indicate an optimal length.
6. WHEN the `meta_description` character count is between 120 and 160 (inclusive), THE Post_Editor SHALL render the counter text in green to indicate an optimal length.

---

### Requirement 8: Duplicate Post Button

**User Story:** As an Admin, I want to duplicate an existing post as a starting point for a new one, so that I can quickly create similar posts without re-entering all fields.

#### Acceptance Criteria

1. THE Portfolio_Blog admin list SHALL display a "Duplicate" button (or icon) on each Post row alongside the existing Edit and Delete buttons.
2. WHEN the Admin clicks "Duplicate" on a Post, THE Admin_Panel SHALL create a new Post record with all fields copied from the original, with `title` prefixed by "Copy of ", `status` set to `'draft'`, and `slug` set to empty so a new unique slug is generated on save.
3. WHEN the duplicate Post is created, THE Admin_Panel SHALL open the Post_Editor pre-filled with the duplicated data so the Admin can make changes before saving.
4. THE Admin_Panel SHALL display a toast notification reading "Post duplicated — make your changes and save."

---

### Requirement 9: Bulk Status Change in Posts List

**User Story:** As an Admin, I want to select multiple posts and change their status in bulk, so that I can publish or archive many posts at once without editing each one individually.

#### Acceptance Criteria

1. THE Portfolio_Blog admin list SHALL display a checkbox on each Post row and a "Select All" checkbox in the list header.
2. WHEN one or more Post checkboxes are selected, THE Portfolio_Blog admin list SHALL display a bulk action toolbar showing the count of selected posts and a status dropdown with options: "Publish", "Set to Draft", "Archive".
3. WHEN the Admin selects a bulk status and confirms, THE Admin_Panel SHALL update the `status` field of all selected Posts to the chosen value in a single batch operation.
4. WHEN the bulk update completes, THE Admin_Panel SHALL display a toast notification stating how many posts were updated (e.g., "3 posts updated to Published").
5. WHEN the bulk update completes, THE Portfolio_Blog admin list SHALL deselect all checkboxes.

---

### Requirement 10: Preview Post Button

**User Story:** As an Admin, I want a "Preview Post" button in the Post Editor that opens the live post in a new browser tab, so that I can see exactly how it looks to visitors before or after publishing.

#### Acceptance Criteria

1. THE Post_Editor SHALL display a "Preview" button in the editor header/toolbar area.
2. WHEN the Admin clicks "Preview", THE Admin_Panel SHALL open a new browser tab navigating to `/projects/{slug}`.
3. IF the Post has no `slug` yet, THEN THE Admin_Panel SHALL display a tooltip or toast reading "Save the post first to generate a preview URL."

---

### Requirement 11: Auto-Generate Unique Slug with Collision Detection

**User Story:** As an Admin, I want slugs to be automatically generated from the post title and guaranteed to be unique, so that I never encounter duplicate URL errors.

#### Acceptance Criteria

1. WHEN a Post is saved and `slug` is empty, THE Post_Editor SHALL generate a slug by converting `title` to lowercase, replacing all non-alphanumeric characters with hyphens, and trimming leading/trailing hyphens.
2. WHEN a generated slug already exists in the `projects` table (for a different Post), THE Post_Editor SHALL append a numeric suffix (e.g., `-2`, `-3`) and increment until a unique slug is found.
3. WHEN the Admin manually edits the `slug` field and the entered slug already exists for a different Post, THE Post_Editor SHALL display an inline validation error reading "This slug is already in use — please choose a different one."
4. THE Post_Editor SHALL sanitize manually entered slugs by converting uppercase letters to lowercase and replacing spaces with hyphens before saving.

---

### Requirement 12: Structured Data (JSON-LD) on Post Pages

**User Story:** As a site visitor (and Google crawler), I want each post page to include structured data, so that Google understands the business and content type for rich search results.

#### Acceptance Criteria

1. THE ProjectDetail page SHALL inject a `<script type="application/ld+json">` tag into the page `<head>` containing a `BlogPosting` schema with: `headline` (post title), `description` (meta_description or excerpt), `image` (featured_image), `datePublished` (publish_date or created_at), `dateModified` (updated_at or created_at), and `author` (post author or business name).
2. THE ProjectDetail page SHALL include a nested `LocalBusiness` schema within the structured data containing: `name` (business name from site content), `address` with `addressLocality` set to the Post's `geo_city` field (or "Kansas City" as default), `addressRegion` "MO", and `url` (site canonical URL).
3. WHEN a Post has a `geo_city` value, THE ProjectDetail page SHALL include the `geo_city` value in the `LocalBusiness` `addressLocality` field of the structured data.
4. THE structured data SHALL be valid JSON-LD and SHALL NOT cause Google Search Console structured data errors for required fields.

---

### Requirement 13: Open Graph Image Auto-Fallback

**User Story:** As a site owner, I want every post to have an OG image for social sharing even if I forget to set one, so that shared links always display a photo.

#### Acceptance Criteria

1. WHEN a Post page is rendered and `og_image` is empty, THE ProjectDetail page SHALL use `featured_image` as the OG image in the `<meta property="og:image">` tag.
2. WHEN a Post page is rendered and both `og_image` and `featured_image` are empty, THE ProjectDetail page SHALL use the first URL in `gallery_images` as the OG image.
3. WHEN a Post page is rendered and `og_image`, `featured_image`, and `gallery_images` are all empty, THE ProjectDetail page SHALL use the site's default OG image from site content.
4. THE ProjectDetail page SHALL always render an `<meta property="og:title">` tag using `meta_title` or `title`, and an `<meta property="og:description">` tag using `meta_description` or `excerpt`.

---

### Requirement 14: Sitemap.xml Route

**User Story:** As a site owner, I want a sitemap.xml file automatically generated from all published posts, so that Google can discover and index all my portfolio pages.

#### Acceptance Criteria

1. THE Site SHALL serve a valid XML sitemap at the path `/sitemap.xml` accessible to unauthenticated requests.
2. THE Sitemap SHALL include one `<url>` entry for each Post with `status = 'published'`, containing: `<loc>` (full canonical URL of the post), `<lastmod>` (ISO 8601 date of `updated_at` or `created_at`), and `<changefreq>` set to `monthly`.
3. THE Sitemap SHALL include `<url>` entries for the following static pages: `/`, `/about`, `/projects`, `/testimonials`, `/contact`.
4. WHEN a new Post is published, THE Sitemap SHALL include the new Post's URL on the next request to `/sitemap.xml` without requiring a manual rebuild.
5. THE Sitemap SHALL be served with `Content-Type: application/xml`.

---

### Requirement 15: Canonical URL Meta Tags on All Public Pages

**User Story:** As a site owner, I want every public page to have a canonical URL tag, so that Google does not penalize the site for duplicate content.

#### Acceptance Criteria

1. THE Site SHALL render a `<link rel="canonical" href="{full_url}">` tag in the `<head>` of every public page.
2. THE canonical URL SHALL use the HTTPS protocol and the site's primary domain.
3. WHEN a Post detail page is rendered, THE canonical URL SHALL be `https://{domain}/projects/{slug}`.
4. WHEN a static page (Home, About, Projects index, Testimonials, Contact) is rendered, THE canonical URL SHALL be the full HTTPS URL of that page.

---

### Requirement 16: Focus Keyword Field with SEO Score Checklist

**User Story:** As an Admin, I want to enter a focus keyword for each post and see a simple SEO score checklist, so that I know whether my post is optimized for that keyword before publishing.

#### Acceptance Criteria

1. THE Post_Editor SHALL include a "Focus Keyword" text input field that stores the value in a `focus_keyword` column on the `projects` table.
2. WHEN the Admin enters a Focus_Keyword, THE Post_Editor SHALL display an SEO_Score checklist with four items: "Keyword in title", "Keyword in meta description", "Keyword in content", "Keyword in slug".
3. WHEN a checklist item condition is met (case-insensitive match), THE Post_Editor SHALL render that checklist item with a green checkmark icon.
4. WHEN a checklist item condition is not met, THE Post_Editor SHALL render that checklist item with a gray or red X icon.
5. THE Post_Editor SHALL display the SEO_Score as a fraction (e.g., "3 / 4") next to the checklist heading, updating in real time as the Admin edits the Post fields.

---

### Requirement 17: Service Type Tags

**User Story:** As an Admin, I want to tag each post with one or more Service Types, so that visitors can filter the portfolio by balloon service and Google can find service-specific pages.

#### Acceptance Criteria

1. THE Post_Editor SHALL include a "Service Type" multi-select field with the following fixed options: Balloon Arch, Balloon Garland, Balloon Column, Balloon Wall, Photo Backdrop, Balloon Sculpture, Balloon Bouquet, Balloon Ceiling, Marquee Letters, Custom Installation.
2. THE Post_Editor SHALL store selected Service_Type values in a `service_types` text array column on the `projects` table.
3. THE Public Projects page SHALL display Service_Type filter chips above the project grid, allowing visitors to filter posts by a single Service_Type.
4. WHEN a visitor selects a Service_Type chip, THE Public Projects page SHALL show only Posts that include that Service_Type in their `service_types` array.
5. THE Public Projects page SHALL display a "All" chip that clears the Service_Type filter and shows all published Posts.

---

### Requirement 18: Event Type Tags

**User Story:** As an Admin, I want to tag each post with one or more Event Types, so that visitors can filter the portfolio by event category and Google can find event-specific pages.

#### Acceptance Criteria

1. THE Post_Editor SHALL include an "Event Type" multi-select field with the following fixed options: Wedding, Birthday, Corporate, Baby Shower, Graduation, Office Party, Community Event, Gala, Brand Activation, Holiday.
2. THE Post_Editor SHALL store selected Event_Type values in an `event_types` text array column on the `projects` table.
3. THE Public Projects page SHALL display Event_Type filter chips, allowing visitors to filter posts by a single Event_Type.
4. WHEN a visitor selects an Event_Type chip, THE Public Projects page SHALL show only Posts that include that Event_Type in their `event_types` array.
5. WHEN both a Service_Type filter and an Event_Type filter are active simultaneously, THE Public Projects page SHALL show only Posts matching both filters.

---

### Requirement 19: Client Testimonial Field on Posts

**User Story:** As an Admin, I want to embed a client quote directly on a post, so that social proof appears in context with the event photos and helps convert visitors.

#### Acceptance Criteria

1. THE Post_Editor SHALL include a "Client Testimonial" section with two fields: `client_quote` (textarea) and `client_quote_name` (text input for the client's name/attribution), stored as columns on the `projects` table.
2. WHEN a Post has a non-empty `client_quote`, THE ProjectDetail page SHALL render the quote in a visually distinct blockquote element with the `client_quote_name` attribution below it.
3. THE ProjectDetail page SHALL render the client testimonial section between the post content and the gallery section.
4. WHEN `client_quote` is empty, THE ProjectDetail page SHALL NOT render the testimonial section or any empty placeholder.

---

### Requirement 20: Before/After Image Tagging in Gallery

**User Story:** As an Admin, I want to mark gallery images as "before" or "after", so that visitors can see transformation showcases and understand the impact of the balloon decor.

#### Acceptance Criteria

1. THE Post_Editor SHALL display a "Before" / "After" / "None" toggle on each gallery image thumbnail, stored as metadata alongside the image URL.
2. THE Post_Editor SHALL store gallery image metadata as a JSON array of objects with shape `{ url: string, label: "before" | "after" | null }` in a `gallery_images_meta` column on the `projects` table, replacing the plain `gallery_images` text array for Posts that use this feature.
3. WHEN a Post has gallery images with `label: "before"` or `label: "after"`, THE ProjectDetail page SHALL render those images with a visible "Before" or "After" badge overlaid on the thumbnail.
4. WHEN a Post has no before/after labels, THE ProjectDetail page SHALL render the gallery without any badges.

---

### Requirement 21: Geo-Tagging Field per Post

**User Story:** As an Admin, I want to tag each post with a city or neighborhood, so that the post appears in Google searches for balloon decorations in that specific Kansas City area location.

#### Acceptance Criteria

1. THE Post_Editor SHALL include a "City / Neighborhood" dropdown field (`geo_city`) with the following options: Kansas City, Overland Park, Olathe, Lee's Summit, Independence, Lenexa, Shawnee, Prairie Village, Leawood, Other.
2. THE Post_Editor SHALL store the selected value in a `geo_city` text column on the `projects` table.
3. WHEN a Post has a non-empty `geo_city`, THE ProjectDetail page SHALL append the `geo_city` value to the `meta_title` in the format: "{meta_title} | {geo_city}" when rendering the `<title>` tag, unless the `meta_title` already contains the `geo_city` string.
4. WHEN a Post has a non-empty `geo_city`, THE ProjectDetail page SHALL include the `geo_city` in the `LocalBusiness` structured data `addressLocality` field.
5. THE Public Projects page SHALL display a "City" filter dropdown allowing visitors to filter posts by `geo_city`.

---

### Requirement 22: Related Posts Section on Post Detail Page

**User Story:** As a site visitor, I want to see related posts at the bottom of each post page, so that I can discover more of the portfolio and spend more time on the site.

#### Acceptance Criteria

1. THE ProjectDetail page SHALL display a "Related Posts" section at the bottom of the page showing up to 3 published Posts.
2. THE Related_Posts selection algorithm SHALL first find Posts sharing at least one `service_types` value with the current Post, then fall back to Posts sharing at least one `event_types` value, then fall back to the 3 most recently published Posts.
3. THE Related_Posts section SHALL NOT include the current Post in the results.
4. WHEN fewer than 3 related Posts exist, THE ProjectDetail page SHALL display however many are available without showing empty placeholders.
5. WHEN no published Posts exist other than the current Post, THE ProjectDetail page SHALL NOT render the Related_Posts section.
6. EACH related post card in the Related_Posts section SHALL display: featured image, title, Service_Type tags, and a link to the post detail page.

---

### Requirement 23: Recent Activity Feed on Dashboard

**User Story:** As an Admin, I want a Recent Activity feed on the Dashboard showing the latest posts and messages, so that I can quickly see what's new without navigating to each section.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Recent_Activity_Feed panel showing two lists side by side: "Recent Posts" (last 5 Posts ordered by `created_at` descending) and "Recent Messages" (last 5 `contact_submissions` ordered by `created_at` descending).
2. EACH entry in the "Recent Posts" list SHALL display: post title, status badge, and relative time (e.g., "2 days ago").
3. EACH entry in the "Recent Messages" list SHALL display: sender name, email, and relative time.
4. WHEN the Admin clicks a Recent Post entry, THE Dashboard SHALL navigate to the Post_Editor for that Post.
5. WHEN the Admin clicks a Recent Message entry, THE Dashboard SHALL navigate to the Messages admin page.

---

### Requirement 24: SEO Health Panel on Dashboard

**User Story:** As an Admin, I want an SEO Health panel on the Dashboard showing which posts are missing critical SEO fields, so that I can prioritize fixing gaps that hurt Google rankings.

#### Acceptance Criteria

1. THE Dashboard SHALL display an SEO_Health_Panel showing three counts: "Posts missing meta description", "Posts missing focus keyword", "Posts missing featured image" — computed across all published Posts.
2. WHEN the Admin clicks a count in the SEO_Health_Panel, THE Dashboard SHALL navigate to the Portfolio_Blog admin list pre-filtered to show only Posts with that specific missing field.
3. WHEN all published Posts have meta descriptions, focus keywords, and featured images, THE SEO_Health_Panel SHALL display a green "All SEO fields complete!" message instead of counts.
4. THE SEO_Health_Panel SHALL only count published Posts (status = 'published') in its health metrics, not drafts or archived Posts.

---

### Requirement 25: Top Tips Onboarding Card on Dashboard

**User Story:** As an Admin, I want a rotating tips card on the Dashboard with SEO advice, so that I am reminded of best practices for using the portfolio/blog to improve Google rankings.

#### Acceptance Criteria

1. THE Dashboard SHALL display a "Top Tips" card showing one SEO tip at a time from a fixed list of at least 5 tips relevant to the balloon decor business.
2. THE tips list SHALL include the following tips (at minimum): "Post after every event with photos — Google rewards fresh, consistent content", "Include the city name in your post title (e.g., 'Balloon Arch — Overland Park Wedding') for local SEO", "Add a focus keyword to every post before publishing", "Write at least 150 words of description per post for better Google ranking", "Tag every post with a Service Type and Event Type so visitors can filter your portfolio".
3. WHEN the Admin clicks a "Next Tip" button, THE Dashboard SHALL display the next tip in the list, cycling back to the first tip after the last.
4. THE Top_Tips card SHALL display the current tip index (e.g., "Tip 2 of 5") so the Admin knows how many tips are available.
