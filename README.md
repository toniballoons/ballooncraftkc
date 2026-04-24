# BalloonCraft KC

Balloon decoration website for the Kansas City metro area. Built with React + Vite, Supabase, Resend, and deployed on Vercel.

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui
- **Database / Auth / Storage**: Supabase
- **Email**: Resend (via Vercel serverless function)
- **Hosting**: Vercel
- **Version control**: Git / GitHub

## Getting Started

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your values
4. Run the dev server: `npm run dev`

## Environment Variables

See `.env.example` for all required variables:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `RESEND_API_KEY` | Resend API key for contact form emails |
| `CONTACT_EMAIL_TO` | Email address to receive contact form submissions |
| `CONTACT_EMAIL_FROM` | Verified sender address in Resend |

## Database Setup

Run the SQL migrations in order against your Supabase project:

1. `supabase/migrations/001_initial_schema.sql` — creates all tables and RLS policies
2. `supabase/migrations/002_seo_improvements.sql` — adds SEO and content columns

Also create a **public** storage bucket named `site-assets` in your Supabase project.

## Deployment

Connect this repo to Vercel. Add the environment variables above in your Vercel project settings. Every push to `main` deploys automatically.
