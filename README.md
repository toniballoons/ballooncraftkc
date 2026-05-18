# BalloonCraft KC

This repo now uses the `/new_design` shell as the main website, CMS, and admin experience.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, shadcn/ui
- Data/Auth/Storage: Supabase
- Email: Resend via Vercel serverless functions
- Hosting: Vercel

## What The Main App Includes

- The new multi-theme public shell
- The current live wording, logo, footer, and content structure
- Supabase-backed projects, testimonials, uploads, and site content
- Admin theme browser, site assets manager, and pages manager

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in your Supabase, Resend, and Vercel values.
4. Run `npm run dev` or `npm run preview`.

## Environment Notes

- `VITE_ACTIVE_THEME` is the default production theme baked into the build.
- `VITE_NEW_DESIGN_ACTIVE_THEME` is the default for the promoted new shell.
- `VITE_SKIP_ADMIN_AUTH=true` is only meant for local preview bypasses.

## Database Setup

Run the migrations in `supabase/migrations/` against the connected Supabase project, then create a public storage bucket named `site-assets`.

## Deployment

This root project is the deployable app. Keep Vercel pointed at the repo root, and add the same environment variables from `.env` into the Vercel project settings.
