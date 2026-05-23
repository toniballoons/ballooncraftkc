# Stack Setup

This project uses four main services:

- GitHub repo: `https://github.com/toniballoons/ballooncraftkc`
- Vercel: deploy the repo root
- Supabase: app data, auth, storage
- Resend: transactional and newsletter email

## What Must Exist

### Git

- Remote repo should be `toniballoons/ballooncraftkc`
- Primary branch should be `main`

### Vercel

- Active Vercel account/team should be `toniballoons`
- Active Vercel project should be `ballooncraftkc`
- Root directory: repo root
- Public domains:
  - `https://www.ballooncraftkc.com`
  - `https://ballooncraftkc.com`
- Environment variables in Vercel should match local `.env`
- Recreate the local Vercel link with `npx vercel link` under the correct account whenever CLI access is needed

### Supabase

- Apply migrations in `supabase/migrations/`
- For remote migration work, use the repo scripts instead of relying on `supabase db push` against the pooler:
  - `npm run db:remote:status`
  - `npm run db:remote:sync`
  - `npm run db:remote:repair -- 001 002`
- Create the `site-assets` storage bucket
- Keep these values available locally and in Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - legacy fallback: `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`
  - preferred server key: `SUPABASE_SECRET_KEY`
  - legacy fallback: `SUPABASE_SERVICE_ROLE_KEY`
  - optional migration connection: `SUPABASE_DB_URL`

### Resend

- Add a verified sending domain
- Keep these values available locally and in Vercel:
  - `RESEND_API_KEY`
  - `CONTACT_EMAIL_FROM`
  - `CONTACT_EMAIL_TO`
  - `DEVELOPER_EMAIL_TO`

## Local-Only Credentials File

Use `ops/stack-access.local.md` for:

- account emails
- dashboard URLs
- project IDs
- login notes
- any secret handling notes that should never go into Git

That file is gitignored on purpose.
