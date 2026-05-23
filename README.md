# BalloonCraft KC

This repo is the root app for the public website and the `/admin` CMS.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, shadcn/ui
- Data/Auth/Storage: Supabase
- Email: Resend through Vercel functions
- Hosting: Vercel

## Local Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env`.
3. Fill in the required Supabase, Resend, and site email values.
4. Run `npm run dev` for local work or `npm run build` to verify production output.

## Required Environment Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- legacy fallback: `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- preferred server key: `SUPABASE_SECRET_KEY`
- legacy server key fallback: `SUPABASE_SERVICE_ROLE_KEY`
- optional remote migration connection: `SUPABASE_DB_URL`
- `RESEND_API_KEY`
- `SITE_URL`
- `CONTACT_EMAIL_TO`
- `CONTACT_EMAIL_FROM`
- `DEVELOPER_EMAIL_TO`
- `VITE_NEW_DESIGN_ACTIVE_THEME`
- `VITE_VERCEL_DEPLOY_HOOK`

## Supabase Setup

- For day-to-day remote migration work, prefer:
  - `npm run db:remote:status`
  - `npm run db:remote:sync`
  - `npm run db:remote:repair -- 001 002`
- These scripts use `psql` plus the `supabase_migrations.schema_migrations` table directly, which avoids the prepared-statement issue we hit through the Supabase CLI on the pooled connection.
- `SUPABASE_DB_URL` should be set to a working Postgres connection string for the project.
- Make sure the public storage bucket `site-assets` exists.
- The client studio and newsletter flows require:
  - `009_client_operations.sql`
  - `010_newsletter_signups.sql`

## Ops Notes

- Actual secrets stay local in `.env` and in the matching Vercel project environment variables.
- Local account/setup notes belong in `ops/stack-access.local.md`, which is gitignored.
- Shared non-secret setup guidance lives in [ops/stack-setup.md](/Users/doyle/Desktop/Toni_Parlor/ops/stack-setup.md).
- The local `.vercel/` link was intentionally removed during cleanup. Re-link the folder under the correct Vercel account when you actually need CLI deploy access.
