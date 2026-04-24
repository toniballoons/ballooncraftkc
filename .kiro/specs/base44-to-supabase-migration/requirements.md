# Requirements Document

## Introduction

This feature migrates the BalloonCraft website away from Base44 and onto a self-owned stack consisting of Supabase (database, auth, and file storage), Resend (transactional email), Vercel (hosting and deployment), and Git (version control). Every page and admin feature that currently works on Base44 must continue to work identically after the migration. No Base44 SDK, API client, or runtime dependency may remain in the codebase.

The site is a React/Vite app with Tailwind CSS and shadcn/ui. It has a public-facing site (Home, About, Projects, ProjectDetail, Testimonials, Contact, LegalPage) and a password-protected admin panel (Dashboard, PageEditor, ProjectsAdmin, TestimonialsAdmin, MessagesAdmin, SiteAssets, ThemeSettings). Data is currently stored in Base44 entities (ContactSubmission, Project, SiteAsset, SiteContent, SiteTheme, Testimonial). File uploads go through `db.integrations.Core.UploadFile`. Authentication is handled by Base44 auth with token-based redirects.

---

## Glossary

- **Supabase_Client**: The `@supabase/supabase-js` browser client configured with the project URL and anon key.
- **Supabase_Auth**: Supabase's built-in authentication service, used to replace Base44 auth.
- **Supabase_DB**: Supabase's PostgreSQL database accessed via the Supabase_Client, used to replace Base44 entity storage.
- **Supabase_Storage**: Supabase's file storage service, used to replace `db.integrations.Core.UploadFile`.
- **Resend_API**: The Resend email delivery service, called from a Vercel Serverless Function to send notification emails.
- **Vercel_Function**: A serverless API route deployed on Vercel (under `/api/`) that handles server-side operations such as sending email via Resend.
- **AuthContext**: The React context at `src/lib/AuthContext.jsx` that provides authentication state to the entire app.
- **Entity**: A data table in Supabase_DB corresponding to one of the original Base44 entities: `contact_submissions`, `projects`, `site_assets`, `site_content`, `site_themes`, `testimonials`.
- **Admin_Panel**: The password-protected section of the site accessible under `/admin/*`.
- **Base44_Shim**: The stub object at the top of many files (`const db = globalThis.__B44_DB__ || ...`) that must be removed entirely.
- **RLS**: Row-Level Security policies in Supabase_DB that control read/write access per table.

---

## Requirements

### Requirement 1: Remove All Base44 Dependencies

**User Story:** As a developer, I want all Base44 code and packages removed from the project, so that the site has no runtime or build-time dependency on Base44.

#### Acceptance Criteria

1. THE Codebase SHALL contain no import or reference to `@base44/sdk`, `@base44/vite-plugin`, or any `base44` npm package after migration.
2. THE Codebase SHALL contain no `const db = globalThis.__B44_DB__ || ...` shim lines in any source file.
3. THE Codebase SHALL contain no references to `db.entities`, `db.auth`, or `db.integrations.Core.UploadFile` in any source file.
4. THE `src/api/base44Client.js` file SHALL be replaced with a `src/api/supabaseClient.js` file that exports the configured Supabase_Client.
5. THE `src/lib/app-params.js` file SHALL be removed and all references to `appParams` SHALL be deleted from the codebase.
6. WHEN the project is built with `vite build`, THE Build_System SHALL complete without errors related to missing Base44 modules.

---

### Requirement 2: Supabase Database Schema

**User Story:** As a developer, I want all Base44 entity data modelled as Supabase PostgreSQL tables, so that the application can read and write data using the Supabase_Client.

#### Acceptance Criteria

1. THE Supabase_DB SHALL contain a `contact_submissions` table with columns: `id` (uuid, primary key), `name` (text, not null), `email` (text, not null), `phone` (text), `event_type` (text), `event_date` (date), `message` (text, not null), `status` (text, default `'new'`), `created_at` (timestamptz, default `now()`).
2. THE Supabase_DB SHALL contain a `projects` table with columns matching all fields defined in `entities/Project`: `id`, `title`, `slug`, `excerpt`, `content`, `featured_image`, `gallery_images` (text array), `category`, `tags` (text array), `meta_title`, `meta_description`, `meta_keywords`, `og_image`, `status`, `featured`, `event_date`, `event_location`, `client_name`, `publish_date`, `author`, `created_at`.
3. THE Supabase_DB SHALL contain a `site_content` table with columns: `id`, `page_key` (text, unique, not null), `content_json` (text), `updated_at` (timestamptz, default `now()`).
4. THE Supabase_DB SHALL contain a `site_themes` table with columns: `id`, `key` (text, not null), `active` (boolean, default false), `updated_at`.
5. THE Supabase_DB SHALL contain a `testimonials` table with columns: `id`, `name` (text, not null), `role` (text), `quote` (text, not null), `rating` (integer), `avatar_url` (text), `featured` (boolean, default false), `status` (text, default `'approved'`), `created_at`.
6. THE Supabase_DB SHALL contain a `site_assets` table with columns: `id`, `name` (text, not null), `file_url` (text, not null), `category` (text), `tags` (text array), `width` (integer), `height` (integer), `created_at`.
7. THE Migration SHALL provide a SQL migration script (or Supabase migration file) that creates all tables and RLS policies described in Requirements 2.1–2.6.

---

### Requirement 3: Row-Level Security

**User Story:** As a site owner, I want database access controlled by RLS policies, so that public visitors can only read approved data and only authenticated admins can write data.

#### Acceptance Criteria

1. THE `contact_submissions` table SHALL have an RLS policy that allows INSERT for all roles (anonymous included) and SELECT/UPDATE/DELETE only for authenticated users.
2. THE `projects` table SHALL have an RLS policy that allows SELECT for all roles where `status = 'published'`, and full CRUD for authenticated users.
3. THE `site_content` table SHALL have an RLS policy that allows SELECT for all roles and INSERT/UPDATE/DELETE only for authenticated users.
4. THE `site_themes` table SHALL have an RLS policy that allows SELECT for all roles and INSERT/UPDATE/DELETE only for authenticated users.
5. THE `testimonials` table SHALL have an RLS policy that allows SELECT for all roles where `status = 'approved'`, and full CRUD for authenticated users.
6. THE `site_assets` table SHALL have an RLS policy that allows SELECT for all roles and INSERT/UPDATE/DELETE only for authenticated users.
7. WHEN an unauthenticated request attempts a write operation on a protected table, THE Supabase_DB SHALL return an error and THE Application SHALL surface a user-visible error message.

---

### Requirement 4: Supabase Authentication

**User Story:** As an admin, I want to log in with an email and password managed by Supabase Auth, so that I can access the Admin_Panel without relying on Base44.

#### Acceptance Criteria

1. THE AuthContext SHALL use `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()` to determine authentication state on page load.
2. WHEN an unauthenticated user navigates to any `/admin/*` route, THE Application SHALL redirect the user to a `/admin/login` page.
3. THE `/admin/login` page SHALL present an email and password form that calls `supabase.auth.signInWithPassword()`.
4. WHEN `supabase.auth.signInWithPassword()` returns an error, THE Login_Page SHALL display a descriptive error message to the user.
5. WHEN `supabase.auth.signInWithPassword()` succeeds, THE Application SHALL redirect the user to `/admin`.
6. WHEN an authenticated admin clicks logout, THE Application SHALL call `supabase.auth.signOut()` and redirect to `/admin/login`.
7. THE AuthContext SHALL expose `user`, `isAuthenticated`, `isLoadingAuth`, and `logout` to all consumers, maintaining the same interface shape used by existing components.
8. THE `ProtectedRoute` component SHALL use the updated AuthContext to guard all `/admin/*` routes, rendering the login redirect when `isAuthenticated` is false.

---

### Requirement 5: Data Access Layer

**User Story:** As a developer, I want a typed data access layer that wraps Supabase queries, so that all components can read and write data without directly embedding Supabase query syntax.

#### Acceptance Criteria

1. THE Codebase SHALL contain entity modules under `src/entities/` (e.g., `src/entities/Project.js`, `src/entities/ContactSubmission.js`) that export `list`, `filter`, `get`, `create`, `update`, and `delete` functions backed by Supabase_Client queries.
2. WHEN `list(orderBy)` is called on an entity module, THE Entity_Module SHALL return all rows from the corresponding table ordered by the given column, or by `created_at` descending by default.
3. WHEN `filter(conditions)` is called on an entity module, THE Entity_Module SHALL return rows matching all key-value pairs in the conditions object.
4. WHEN `get(id)` is called on an entity module, THE Entity_Module SHALL return the single row with the matching `id`.
5. WHEN `create(data)` is called on an entity module, THE Entity_Module SHALL insert a new row and return the created record including its generated `id` and `created_at`.
6. WHEN `update(id, data)` is called on an entity module, THE Entity_Module SHALL update the row with the matching `id` and return the updated record.
7. WHEN `delete(id)` is called on an entity module, THE Entity_Module SHALL delete the row with the matching `id`.
8. IF a Supabase query returns an error, THEN THE Entity_Module SHALL throw a JavaScript Error with the Supabase error message so callers can handle it.

---

### Requirement 6: File Upload via Supabase Storage

**User Story:** As an admin, I want to upload images through the admin panel and have them stored in Supabase Storage, so that all media is hosted independently of Base44.

#### Acceptance Criteria

1. THE Codebase SHALL contain a `src/lib/uploadFile.js` utility that accepts a `File` object, uploads it to a Supabase_Storage bucket named `site-assets`, and returns a `{ file_url }` object containing the public URL.
2. WHEN `uploadFile` is called with a valid image file, THE Supabase_Storage bucket SHALL store the file and THE Function SHALL return a publicly accessible HTTPS URL.
3. THE `ImageUploadField` component SHALL call `uploadFile` instead of `db.integrations.Core.UploadFile`.
4. THE `ProjectsAdmin` page SHALL call `uploadFile` for featured image and gallery image uploads.
5. THE `TestimonialsAdmin` page SHALL call `uploadFile` for avatar uploads.
6. THE `SiteAssets` page SHALL call `uploadFile` for image replacement.
7. IF `uploadFile` encounters a Supabase_Storage error, THEN THE Component SHALL display a toast error message and leave the existing image value unchanged.

---

### Requirement 7: Contact Form Submission and Email Notification

**User Story:** As a site visitor, I want to submit the contact form and receive confirmation that my message was received, and as the site owner I want to receive an email notification for each new submission.

#### Acceptance Criteria

1. WHEN a visitor submits the contact form with valid required fields (name, email, message), THE Contact_Page SHALL insert a new row into `contact_submissions` via the Entity_Module.
2. WHEN the contact form submission is saved to Supabase_DB, THE Application SHALL call the `/api/send-contact-email` Vercel_Function with the submission data.
3. WHEN the `/api/send-contact-email` Vercel_Function receives a valid submission, THE Vercel_Function SHALL use the Resend_API to send a notification email to the site owner's configured email address.
4. THE notification email SHALL include the submitter's name, email, phone (if provided), event type (if provided), event date (if provided), and message.
5. WHEN the Resend_API call succeeds, THE Contact_Page SHALL display the success message defined in `site_content` for the contact page.
6. IF the Resend_API call fails, THEN THE Vercel_Function SHALL return a 500 error and THE Contact_Page SHALL still show the success message to the visitor (the submission is already saved).
7. THE Resend sender address and recipient address SHALL be configurable via Vercel environment variables (`RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM`).

---

### Requirement 8: Admin Panel — Full CRUD Parity

**User Story:** As an admin, I want all admin panel pages to function identically to their Base44 versions, so that I can manage site content without any loss of functionality.

#### Acceptance Criteria

1. THE `Dashboard` page SHALL display counts of projects, new messages, and testimonials by querying Supabase_DB via the Entity_Modules.
2. THE `MessagesAdmin` page SHALL list all contact submissions ordered by `created_at` descending, and SHALL allow status updates and deletion via the Entity_Modules.
3. THE `ProjectsAdmin` page SHALL support creating, editing, and deleting projects, including image uploads, via the Entity_Modules and `uploadFile`.
4. THE `TestimonialsAdmin` page SHALL support creating, editing, and deleting testimonials, including avatar uploads, via the Entity_Modules and `uploadFile`.
5. THE `PageEditor` page SHALL load and save `site_content` rows via the Entity_Module, preserving the existing tab-based editor UI.
6. THE `ThemeSettings` page SHALL load and save `site_themes` rows via the Entity_Module, preserving the existing theme picker UI.
7. THE `SiteAssets` page SHALL load `site_content` for image extraction and SHALL save updated content via the Entity_Module, preserving the hover-to-replace UI.
8. WHEN any admin mutation (create, update, delete) succeeds, THE Admin_Panel SHALL invalidate the relevant React Query cache keys so the UI reflects the latest data.

---

### Requirement 9: Public Site — Full Read Parity

**User Story:** As a site visitor, I want all public pages to display content loaded from Supabase, so that the site looks and behaves exactly as it did on Base44.

#### Acceptance Criteria

1. THE `useSiteContent` hook SHALL query the `site_content` table via the Entity_Module and fall back to `DEFAULT_CONTENT` when no database row exists for a given `page_key`.
2. THE `useAllSiteContent` hook SHALL query all rows from `site_content` and merge them over `DEFAULT_CONTENT`.
3. THE `ThemeContext` SHALL query the `site_themes` table for the active theme and fall back to `'rainbow_birthday'` when no active theme row exists.
4. THE `Projects` page SHALL query only published projects (`status = 'published'`) from Supabase_DB.
5. THE `ProjectDetail` page SHALL query a single project by `slug` from Supabase_DB.
6. THE `Testimonials` page SHALL query only approved testimonials (`status = 'approved'`) from Supabase_DB.
7. WHEN Supabase_DB returns an empty result for any public query, THE Page SHALL render gracefully using default content or an empty-state UI without throwing a JavaScript error.

---

### Requirement 10: Environment Configuration

**User Story:** As a developer, I want all secrets and service URLs stored in environment variables, so that the codebase contains no hardcoded credentials and the app can be deployed to Vercel without modification.

#### Acceptance Criteria

1. THE Application SHALL read the Supabase project URL from `VITE_SUPABASE_URL` and the anon key from `VITE_SUPABASE_ANON_KEY` at build time.
2. THE Vercel_Function SHALL read `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, and `CONTACT_EMAIL_FROM` from Vercel environment variables at runtime.
3. THE Codebase SHALL contain a `.env.example` file listing all required environment variables with placeholder values and inline comments.
4. THE `.gitignore` file SHALL include `.env` and `.env.local` to prevent secrets from being committed to Git.
5. IF `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing at build time, THEN THE Supabase_Client initialisation SHALL throw a descriptive error so the misconfiguration is caught early.

---

### Requirement 11: Vercel Deployment Configuration

**User Story:** As a developer, I want the project configured for Vercel deployment with correct routing, so that the SPA and serverless API routes work correctly in production.

#### Acceptance Criteria

1. THE Repository SHALL contain a `vercel.json` file that configures all non-API routes to serve `index.html` (SPA fallback), enabling client-side routing.
2. THE `vercel.json` SHALL route requests matching `/api/*` to the Vercel_Function handlers in the `api/` directory.
3. THE `package.json` build script SHALL remain `vite build` so Vercel's default build detection works without additional configuration.
4. THE Repository SHALL contain a `README.md` section describing the required Vercel environment variables and deployment steps.

---

### Requirement 12: Git Repository Initialisation

**User Story:** As a developer, I want the project committed to a Git repository with a clean history, so that the codebase is version-controlled and ready for Vercel's Git integration.

#### Acceptance Criteria

1. THE Repository SHALL have a `.gitignore` that excludes `node_modules/`, `dist/`, `.env`, `.env.local`, and any Base44-specific build artefacts.
2. THE Repository SHALL contain an initial commit that includes all migrated source files and configuration.
3. WHEN Vercel is connected to the Git repository, THE Vercel_Build SHALL trigger automatically on push to the main branch.
