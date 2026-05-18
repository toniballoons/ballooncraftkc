## new_design

`new_design` is the standalone replacement shell for the public site, CMS, and admin.

It now runs on the same stack as the live app:

- Supabase for auth, content, storage, and data
- Vercel for the frontend build and serverless API routes
- Resend for contact/support/reply emails

### What this folder keeps

- The current public site wording, logo, footer, and working content flow
- The current Supabase-backed admin, uploads, and email behavior
- The expanded theme browser from the new shell
- The pages/sections manager from the new shell

### Local setup

1. Copy `.env.example` to `.env.local` or `.env`.
2. Fill in the Supabase, Resend, and Vercel environment variables.
3. Run `npm install` if this folder will be used as a standalone project.
4. Run `npm run dev`.

### Deployment notes

- `vercel.json` is included in this folder.
- `api/` contains the email and sitemap routes.
- `supabase/` contains the current schema and seed migrations.
- Base44 is no longer part of the runtime plan for this folder.
