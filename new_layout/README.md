# Balloo Layout Prototype

This folder now has two layers:

- `winsfolio.net/html/balloo/`
  The mirrored upstream Balloo template captured from the ThemeForest preview iframe source.
- `index.html`, `about.html`, `services.html`, `events.html`, `projects.html`, `testimonials.html`, `seasonal.html`, `contact.html`
  A BalloonCraft KC / Toni adaptation built on top of those mirrored assets.

## What changed

- The Balloo ecommerce framing was redirected into a service business structure.
- Existing public-site content was woven in:
  - hero/about/contact copy from the current defaults
  - seeded project stories from `supabase/migrations/005_seed_projects.sql`
  - seeded testimonials from `supabase/migrations/004_seed_testimonials.sql`
- New pages were added for:
  - `services.html`
  - `events.html`
  - `seasonal.html`

## Shared files

- `assets/`
  Symlink to the mirrored Balloo asset bundle.
- `site.css`
  Local overrides that reshape the Balloo theme around BalloonCraft.
- `site.js`
  Shared page shell + content renderer for the prototype pages.

## Direction this suggests for the real app

- Good fits:
  - hero
  - services
  - event-type landing pages
  - portfolio storytelling
  - testimonials
  - conversion-focused contact page
- Weak fits unless heavily reworked:
  - cart
  - login
  - inventory language
  - prices / stock counts
  - blog/news modules that are not part of the current public site

## Next likely move

If this direction feels right, the next phase is porting these sections into the React app and swapping the static arrays in `site.js` for the existing Supabase-backed content and project/testimonial queries.
