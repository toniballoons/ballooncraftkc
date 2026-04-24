# Implementation Plan: Base44 to Supabase Migration

## Overview

Replace every Base44 runtime dependency in the BalloonCraft React/Vite app with Supabase
(database, auth, storage), Resend (email via Vercel serverless function), and Vercel (hosting).
Tasks are ordered so each step compiles and runs before the next one begins. The Base44 shim
lines are removed file-by-file as each module is rewritten; no file is left in a broken
intermediate state.

---

## Tasks

- [x] 1. Project setup — dependencies, config files, and environment scaffolding
  - [x] 1.1 Install new runtime packages and remove Base44 packages
    - Run `npm install @supabase/supabase-js resend`
    - Run `npm uninstall @base44/sdk @base44/vite-plugin`
    - Confirm `package.json` no longer lists `@base44/sdk` or `@base44/vite-plugin`
    - _Requirements: 1.1, 1.6_

  - [x] 1.2 Rewrite `vite.config.js` — remove Base44 plugin, add `@` alias
    - Remove the `base44({...})` plugin call and its import
    - Add `import path from 'path'` and `resolve: { alias: { '@': path.resolve(__dirname, './src') } }`
    - Keep `@vitejs/plugin-react` and the `logLevel: 'error'` setting
    - _Requirements: 1.1, 1.6_

  - [x] 1.3 Create `.env.example` with all required variables
    - List `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM` with placeholder values and inline comments
    - _Requirements: 10.3_

  - [x] 1.4 Update `.gitignore`
    - Ensure `.env`, `.env.local`, `node_modules/`, `dist/` are present
    - Remove any Base44-specific artefact patterns if present
    - _Requirements: 10.4, 12.1_

  - [x] 1.5 Create `vercel.json`
    - Add SPA fallback: all non-`/api/*` routes rewrite to `/index.html`
    - Route `/api/*` to the `api/` directory
    - _Requirements: 11.1, 11.2_

- [x] 2. Supabase client and database schema
  - [x] 2.1 Create `src/api/supabaseClient.js`
    - Import `createClient` from `@supabase/supabase-js`
    - Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`
    - Throw a descriptive `Error` at module load time if either variable is missing
    - Export the singleton `supabase` client
    - _Requirements: 1.4, 10.1, 10.5_

  - [ ]* 2.2 Write unit test for `supabaseClient.js`
    - Test that it throws when env vars are absent
    - Test that it exports a client object when env vars are present
    - _Requirements: 1.4, 10.5_

  - [x] 2.3 Create `supabase/migrations/001_initial_schema.sql`
    - Include `CREATE TABLE` statements for all six tables exactly as specified in the design: `contact_submissions`, `projects`, `site_content`, `site_themes`, `testimonials`, `site_assets`
    - Include `ALTER TABLE … ENABLE ROW LEVEL SECURITY` for every table
    - Include all RLS `CREATE POLICY` statements from the design (public INSERT on `contact_submissions`; public SELECT on published projects; public SELECT on approved testimonials; public SELECT on `site_content`, `site_themes`, `site_assets`; authenticated full CRUD everywhere)
    - _Requirements: 2.1–2.7, 3.1–3.7_

- [x] 3. Data access layer — entity modules
  - [x] 3.1 Create `src/entities/ContactSubmission.js`
    - Export `list(orderBy)`, `filter(conditions)`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`
    - Each function calls `supabase.from('contact_submissions')`, checks `error`, and throws `new Error(error.message)` if present
    - `list` defaults to ordering by `created_at` descending; accepts an optional `orderBy` string (strip leading `-` to detect descending)
    - `filter` applies `.eq(key, value)` for every key-value pair in the conditions object
    - _Requirements: 5.1–5.8_

  - [x] 3.2 Create `src/entities/Project.js`
    - Same interface as 3.1, table name `projects`
    - _Requirements: 5.1–5.8_

  - [x] 3.3 Create `src/entities/SiteContent.js`
    - Same interface, table name `site_content`
    - _Requirements: 5.1–5.8_

  - [x] 3.4 Create `src/entities/SiteTheme.js`
    - Same interface, table name `site_themes`
    - _Requirements: 5.1–5.8_

  - [x] 3.5 Create `src/entities/Testimonial.js`
    - Same interface, table name `testimonials`
    - _Requirements: 5.1–5.8_

  - [x] 3.6 Create `src/entities/SiteAsset.js`
    - Same interface, table name `site_assets`
    - _Requirements: 5.1–5.8_

  - [ ]* 3.7 Write property test — Property 2: Entity module error propagation
    - **Property 2: Entity module error propagation**
    - Use fast-check to generate arbitrary Supabase error objects; for each of the six operations on each entity module, mock `supabase.from` to return `{ data: null, error }` and verify a `Error` is thrown with `error.message`
    - **Validates: Requirements 5.8**

  - [ ]* 3.8 Write property test — Property 3: Entity filter applies all conditions
    - **Property 3: Entity filter applies all conditions**
    - Use fast-check to generate arbitrary `Record<string, unknown>` conditions objects; mock the Supabase query builder and verify `.eq(key, value)` is called for every entry — no conditions are silently dropped
    - **Validates: Requirements 5.3**

  - [ ]* 3.9 Write property test — Property 4: Entity create returns persisted record
    - **Property 4: Entity create returns persisted record**
    - Use fast-check to generate arbitrary data objects; mock `supabase.from` to return the input merged with a generated `id` (UUID) and `created_at`; verify the returned record contains all input fields plus non-null `id` and `created_at`
    - **Validates: Requirements 5.5**

- [ ] 4. Checkpoint — entity layer
  - Ensure all entity module unit/property tests pass. Confirm `supabaseClient.js` throws on missing env vars. Ask the user if questions arise.

- [x] 5. File upload utility
  - [x] 5.1 Create `src/lib/uploadFile.js`
    - Accept a `File` object
    - Generate a unique storage path: `` `${Date.now()}-${file.name}` ``
    - Call `supabase.storage.from('site-assets').upload(path, file, { upsert: true })`
    - On storage error, throw `new Error(error.message)`
    - On success, call `.getPublicUrl(path)` and return `{ file_url: data.publicUrl }`
    - _Requirements: 6.1, 6.2_

  - [ ]* 5.2 Write property test — Property 5: uploadFile returns a valid HTTPS URL
    - **Property 5: uploadFile returns a valid HTTPS URL**
    - Use fast-check to generate arbitrary `File`-like objects; mock `supabase.storage` to return a synthetic path; verify the returned `file_url` starts with `https://` and is non-empty
    - **Validates: Requirements 6.2**

  - [ ]* 5.3 Write property test — Property 6: uploadFile error leaves caller state unchanged
    - **Property 6: uploadFile error leaves caller state unchanged**
    - Mock `supabase.storage.upload` to return an error; verify `uploadFile` throws an `Error` rather than returning a partial or empty result
    - **Validates: Requirements 6.7**

- [x] 6. Authentication — AuthContext, ProtectedRoute, Login page
  - [x] 6.1 Rewrite `src/lib/AuthContext.jsx`
    - Remove the Base44 shim line, `appParams` import, `checkAppState`, `navigateToLogin`, `isLoadingPublicSettings`, and `appPublicSettings`
    - On mount call `supabase.auth.getSession()` to hydrate `user` / `isAuthenticated`; set `isLoadingAuth = false` when done
    - Subscribe to `supabase.auth.onAuthStateChange()` to keep state in sync; unsubscribe on unmount
    - `logout()` calls `supabase.auth.signOut()` then navigates to `/admin/login` via `useNavigate`
    - Expose `{ user, isAuthenticated, isLoadingAuth, logout }` — same shape consumed by existing components
    - _Requirements: 4.1, 4.6, 4.7_

  - [x] 6.2 Rewrite `src/components/ProtectedRoute.jsx`
    - Remove `checkUserAuth`, `authChecked`, `authError`, and `UserNotRegisteredError` logic
    - Read `isAuthenticated` and `isLoadingAuth` from `useAuth()`
    - While `isLoadingAuth` is true, render the spinner fallback
    - When `isLoadingAuth` is false and `isAuthenticated` is false, render `<Navigate to="/admin/login" replace />`
    - When authenticated, render `<Outlet />`
    - _Requirements: 4.2, 4.8_

  - [x] 6.3 Create `src/pages/admin/Login.jsx`
    - Standalone page (not wrapped in `AdminLayout`)
    - Render an email + password form
    - On submit call `supabase.auth.signInWithPassword({ email, password })`
    - On error display the error message inline beneath the form
    - On success navigate to `/admin`
    - _Requirements: 4.3, 4.4, 4.5_

  - [ ]* 6.4 Write property test — Property 12: Unauthenticated access redirects to login
    - **Property 12: Unauthenticated access to any /admin/* route redirects to login**
    - Use fast-check to generate random admin sub-paths (e.g. `/admin/projects`, `/admin/messages`); render `ProtectedRoute` with `isAuthenticated=false` and `isLoadingAuth=false`; verify the rendered output is a redirect to `/admin/login`
    - **Validates: Requirements 4.2, 4.8**

  - [ ]* 6.5 Write property test — Property 13: Login error display for any signInWithPassword failure
    - **Property 13: Login error display for any signInWithPassword failure**
    - Use fast-check to generate arbitrary error objects returned by `supabase.auth.signInWithPassword`; render `Login.jsx` with the mocked client; verify a non-empty, visible error message is rendered
    - **Validates: Requirements 4.4**

- [x] 7. Update `src/App.jsx` routing
  - Remove the `AuthenticatedApp` wrapper component and its `isLoadingPublicSettings` / `authError` / `navigateToLogin` logic
  - Remove the `UserNotRegisteredError` import and usage
  - Import `Login` from `@/pages/admin/Login`
  - Add `<Route path="/admin/login" element={<Login />} />` as a standalone route (outside `ProtectedRoute`)
  - Wrap all `/admin/*` routes in `<Route element={<ProtectedRoute />}>` so `AdminLayout` is only rendered when authenticated
  - Move `<Router>` to wrap the entire app (currently it wraps only `AuthenticatedApp`)
  - _Requirements: 4.2, 4.3_

- [ ] 8. Checkpoint — auth and routing
  - Verify the app builds (`vite build`) without Base44 plugin errors. Confirm navigating to `/admin` while unauthenticated redirects to `/admin/login`. Ask the user if questions arise.

- [x] 9. Migrate `src/lib/useSiteContent.js`
  - Remove the Base44 shim line
  - Import `* as SiteContent from '@/entities/SiteContent'`
  - In `useSiteContent(pageKey)`: replace `db.entities.SiteContent.filter(...)` with `SiteContent.filter({ page_key: pageKey })`
  - In `useAllSiteContent()`: replace `db.entities.SiteContent.list()` with `SiteContent.list()`
  - Logic for merging with `DEFAULT_CONTENT` and parsing `content_json` is unchanged
  - _Requirements: 9.1, 9.2_

  - [ ]* 9.1 Write property test — Property 7: useSiteContent falls back to DEFAULT_CONTENT
    - **Property 7: useSiteContent falls back to DEFAULT_CONTENT**
    - Use fast-check to generate arbitrary `page_key` strings; mock `SiteContent.filter` to return `[]`; verify `useSiteContent(pageKey)` returns `DEFAULT_CONTENT[pageKey]` (or `{}` if absent)
    - **Validates: Requirements 9.1**

  - [ ]* 9.2 Write property test — Property 8: useAllSiteContent DB values override defaults
    - **Property 8: useAllSiteContent DB values override defaults**
    - Use fast-check to generate arbitrary arrays of `{ page_key, content_json }` rows; mock `SiteContent.list` to return them; verify DB values override `DEFAULT_CONTENT` entries and absent keys retain defaults
    - **Validates: Requirements 9.2**

- [x] 10. Migrate `src/lib/ThemeContext.jsx`
  - Remove the Base44 shim line
  - Import `* as SiteTheme from '@/entities/SiteTheme'`
  - Replace `db.entities.SiteTheme.filter({ active: true })` with `SiteTheme.filter({ active: true })`
  - Replace `db.entities.SiteTheme.list()`, `.update()`, and `.create()` calls with the corresponding `SiteTheme.*` calls
  - Logic for `setThemeMutation` (deactivate all, then activate selected) is unchanged
  - _Requirements: 9.3_

- [x] 11. Migrate `src/components/admin/ImageUploadField.jsx`
  - Remove the Base44 shim line
  - Import `uploadFile` from `@/lib/uploadFile`
  - Replace `db.integrations.Core.UploadFile({ file })` with `uploadFile(file)` inside a try/catch; on catch call `toast.error(err.message)` and return without calling `onChange`
  - _Requirements: 6.3, 6.7_

- [ ] 12. Migrate admin pages
  - [x] 12.1 Migrate `src/pages/admin/Dashboard.jsx`
    - Remove the Base44 shim line
    - Import `* as Project from '@/entities/Project'`, `* as ContactSubmission from '@/entities/ContactSubmission'`, `* as Testimonial from '@/entities/Testimonial'`
    - Replace `db.entities.Project.list()` → `Project.list()`; same for `ContactSubmission` and `Testimonial`
    - _Requirements: 8.1_

  - [x] 12.2 Migrate `src/pages/admin/MessagesAdmin.jsx`
    - Remove the Base44 shim line
    - Import `* as ContactSubmission from '@/entities/ContactSubmission'`
    - Replace all `db.entities.ContactSubmission.*` calls with `ContactSubmission.*`
    - Fix the `created_date` reference in the date display to `created_at`
    - _Requirements: 8.2_

  - [x] 12.3 Migrate `src/pages/admin/ProjectsAdmin.jsx`
    - Remove the Base44 shim line
    - Import `* as Project from '@/entities/Project'` and `uploadFile` from `@/lib/uploadFile`
    - Replace all `db.entities.Project.*` calls with `Project.*`
    - Replace `db.integrations.Core.UploadFile({ file })` in `handleImageUpload` with `uploadFile(file)` inside try/catch; on catch call `toast.error(err.message)` and return
    - _Requirements: 8.3, 6.4_

  - [x] 12.4 Migrate `src/pages/admin/TestimonialsAdmin.jsx`
    - Remove the Base44 shim line
    - Import `* as Testimonial from '@/entities/Testimonial'` and `uploadFile` from `@/lib/uploadFile`
    - Replace all `db.entities.Testimonial.*` calls with `Testimonial.*`
    - Replace `db.integrations.Core.UploadFile({ file })` in `handleAvatar` with `uploadFile(file)` inside try/catch; on catch call `toast.error(err.message)` and return
    - _Requirements: 8.4, 6.5_

  - [x] 12.5 Migrate `src/pages/admin/PageEditor.jsx`
    - Remove the Base44 shim line
    - Import `* as SiteContent from '@/entities/SiteContent'`
    - Replace all `db.entities.SiteContent.*` calls with `SiteContent.*`
    - _Requirements: 8.5_

  - [x] 12.6 Migrate `src/pages/admin/ThemeSettings.jsx`
    - No Base44 shim present; this file already uses `useTheme()` exclusively — verify no `db.*` references remain
    - _Requirements: 8.6_

  - [x] 12.7 Migrate `src/pages/admin/SiteAssets.jsx`
    - Remove the Base44 shim line
    - Import `* as SiteContent from '@/entities/SiteContent'` and `uploadFile` from `@/lib/uploadFile`
    - Replace `db.entities.SiteContent.list()`, `.update()`, and `.create()` calls with `SiteContent.*`
    - Replace `db.integrations.Core.UploadFile({ file })` in `ImageCard.handleFile` with `uploadFile(file)` inside try/catch; on catch call `toast.error(err.message)` and set `uploading = false`
    - _Requirements: 8.7, 6.6_

- [x] 13. Migrate public site pages
  - [x] 13.1 Migrate `src/pages/site/Projects.jsx`
    - Remove the Base44 shim line
    - Import `* as Project from '@/entities/Project'`
    - Replace `db.entities.Project.filter({ status: 'published' }, '-publish_date')` with `Project.filter({ status: 'published' })` — client-side sort by `publish_date` descending is already handled by the existing `filtered` array logic or add `.order('publish_date', { ascending: false })` in the entity call
    - _Requirements: 9.4_

  - [ ]* 13.2 Write property test — Property 9: Public project queries exclude non-published rows
    - **Property 9: Public project queries exclude non-published rows**
    - Use fast-check to generate arrays of projects with mixed `status` values; mock `Project.filter` to assert it is called with `{ status: 'published' }`; verify only published rows are ever passed to the render
    - **Validates: Requirements 9.4**

  - [x] 13.3 Migrate `src/pages/site/ProjectDetail.jsx`
    - Remove the Base44 shim line
    - Import `* as Project from '@/entities/Project'`
    - Replace `db.entities.Project.filter({ slug, status: 'published' })` with `Project.filter({ slug, status: 'published' })`
    - Use `useParams()` from `react-router-dom` instead of `window.location.pathname.split(...)` to get the slug
    - _Requirements: 9.5_

  - [x] 13.4 Migrate `src/pages/site/Testimonials.jsx`
    - Remove the Base44 shim line
    - Import `* as Testimonial from '@/entities/Testimonial'`
    - Replace `db.entities.Testimonial.filter({ status: 'approved' }, '-created_date')` with `Testimonial.filter({ status: 'approved' })`
    - _Requirements: 9.6_

  - [ ]* 13.5 Write property test — Property 10: Public testimonial queries exclude non-approved rows
    - **Property 10: Public testimonial queries exclude non-approved rows**
    - Use fast-check to generate arrays of testimonials with mixed `status` values; mock `Testimonial.filter` to assert it is called with `{ status: 'approved' }`; verify only approved rows are ever rendered
    - **Validates: Requirements 9.6**

  - [x] 13.6 Migrate `src/pages/site/Contact.jsx`
    - Remove the Base44 shim line
    - Import `* as ContactSubmission from '@/entities/ContactSubmission'`
    - Replace `db.entities.ContactSubmission.create(...)` with `ContactSubmission.create(...)`
    - After the DB insert succeeds, call `fetch('/api/send-contact-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })`; if the response is not 2xx, log the error but still show the success message
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

- [ ] 14. Checkpoint — public site and admin pages
  - Confirm all admin pages load data from Supabase. Confirm public pages render without errors when the DB is empty (fallback to defaults). Ask the user if questions arise.

- [x] 15. Create Vercel serverless function `api/send-contact-email.js`
  - Read `RESEND_API_KEY`, `CONTACT_EMAIL_TO`, `CONTACT_EMAIL_FROM` from `process.env`
  - Parse the request body as JSON; return 400 if `name`, `email`, or `message` are missing
  - Use the `resend` npm package to send a notification email to `CONTACT_EMAIL_TO` from `CONTACT_EMAIL_FROM`; include all provided fields (name, email, phone, event_type, event_date, message) in the email body
  - Return 200 on success; return 500 with a JSON error body on Resend failure
  - _Requirements: 7.2, 7.3, 7.4, 7.7_

  - [ ]* 15.1 Write property test — Property 11: Contact form notification email includes all provided fields
    - **Property 11: Contact form notification email includes all provided fields**
    - Use fast-check to generate arbitrary contact submission objects with varying combinations of optional fields (phone, event_type, event_date); mock the Resend client; verify the email body passed to Resend contains every field that was present in the submission
    - **Validates: Requirements 7.3, 7.4**

- [x] 16. Remove Base44 artefacts
  - [x] 16.1 Delete `src/api/base44Client.js`
    - _Requirements: 1.4_

  - [x] 16.2 Delete `src/lib/app-params.js`
    - _Requirements: 1.5_

  - [x] 16.3 Delete `src/components/UserNotRegisteredError.jsx`
    - This component is only needed for Base44's `user_not_registered` error path; remove it and any remaining imports
    - _Requirements: 1.2_

  - [x] 16.4 Delete the `entities/` directory at the project root (the Base44 JSON schema files)
    - These are `entities/ContactSubmission`, `entities/Project`, `entities/SiteAsset`, `entities/SiteContent`, `entities/SiteTheme`, `entities/Testimonial`
    - _Requirements: 1.1_

  - [x] 16.5 Remove `src/lib/siteDefaults.js` Base44 shim line
    - The file itself is still needed; only remove the `const db = globalThis.__B44_DB__ || ...` line at the top
    - _Requirements: 1.2_

- [ ] 17. Property test — Property 1: No Base44 references remain
  - [ ]* 17.1 Write property test — Property 1: No Base44 references remain in source files
    - **Property 1: No Base44 references remain in source files**
    - Use fast-check (or a simple Vitest test that reads the file system) to iterate over every `.js` / `.jsx` / `.ts` / `.tsx` file under `src/` and `api/`; assert that none contain the strings `@base44`, `__B44_DB__`, `db.entities`, `db.auth`, `db.integrations`, or `appParams`
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

- [ ] 18. Final checkpoint — build and smoke tests
  - Run `vite build` and confirm it exits with code 0
  - Confirm `.env.example` lists all five required environment variables
  - Confirm `vercel.json` is valid JSON and contains the SPA fallback rule
  - Confirm no file under `src/` or `api/` contains any of the Base44 marker strings
  - Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations each
- Each property test is annotated with its property number from the design document
- Checkpoints at tasks 4, 8, 14, and 18 ensure incremental validation before proceeding
- The `supabase/migrations/001_initial_schema.sql` file must be applied to the Supabase project (via the Supabase dashboard or CLI) before the app can read/write data
- The `site-assets` storage bucket must be created in Supabase with public read access before `uploadFile` will work
- A Supabase Auth user must be created (via the Supabase dashboard) before the admin login form can be used
