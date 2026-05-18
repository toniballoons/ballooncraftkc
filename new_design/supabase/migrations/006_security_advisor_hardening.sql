-- ============================================================
-- Security Advisor hardening follow-up
-- ------------------------------------------------------------
-- This migration mirrors manual Supabase dashboard SQL changes
-- for environments that include these functions and policies.
-- It is intentionally guarded so environments without the same
-- objects will safely no-op instead of failing.
-- ============================================================

-- 1) Set an explicit search_path on flagged functions.
DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at_column()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = public';
  END IF;

  IF to_regprocedure('public.decrement_reply_count(uuid)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.decrement_reply_count(uuid) SET search_path = public';
  END IF;

  IF to_regprocedure('public.increment_reply_count(uuid)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.increment_reply_count(uuid) SET search_path = public';
  END IF;

  IF to_regprocedure('public.is_admin()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.is_admin() SET search_path = public';
  END IF;

  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.handle_new_user() SET search_path = public';
  END IF;

  IF to_regprocedure('public.increment_post_count(uuid)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.increment_post_count(uuid) SET search_path = public';
  END IF;

  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.rls_auto_enable() SET search_path = pg_catalog';
  END IF;
END $$;

-- 2) Revoke direct execution on internal SECURITY DEFINER functions.
DO $$
BEGIN
  IF to_regprocedure('public.handle_new_user()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated';
  END IF;

  IF to_regprocedure('public.increment_post_count(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.increment_post_count(uuid) FROM public, anon, authenticated';
  END IF;

  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated';
  END IF;
END $$;

-- 3) Tighten Security Advisor-flagged RLS policies when those
-- exact policy names are present.
DO $$
BEGIN
  IF to_regclass('public.contact_submissions') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS contact_public_insert ON public.contact_submissions';
    EXECUTE 'DROP POLICY IF EXISTS contact_admin_select ON public.contact_submissions';
    EXECUTE 'DROP POLICY IF EXISTS contact_admin_delete ON public.contact_submissions';

    IF EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'contact_submissions'
        AND policyname = 'contact_submissions_public_insert'
    ) THEN
      EXECUTE 'DROP POLICY contact_submissions_public_insert ON public.contact_submissions';
      EXECUTE $policy$
        CREATE POLICY contact_submissions_public_insert
        ON public.contact_submissions
        FOR INSERT
        TO anon
        WITH CHECK ((SELECT auth.role()) = 'anon')
      $policy$;
    END IF;

    IF to_regprocedure('public.is_admin()') IS NOT NULL AND EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'contact_submissions'
        AND policyname = 'contact_submissions_admin_all'
    ) THEN
      EXECUTE 'DROP POLICY contact_submissions_admin_all ON public.contact_submissions';
      EXECUTE $policy$
        CREATE POLICY contact_submissions_admin_all
        ON public.contact_submissions
        FOR ALL
        TO authenticated
        USING ((SELECT is_admin()))
        WITH CHECK ((SELECT is_admin()))
      $policy$;
    END IF;
  END IF;

  IF to_regclass('public.newsletter_signups') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS newsletter_public_insert ON public.newsletter_signups';
    EXECUTE 'DROP POLICY IF EXISTS newsletter_admin_select ON public.newsletter_signups';

    IF to_regprocedure('public.is_admin()') IS NOT NULL AND EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'newsletter_signups'
        AND policyname = 'newsletter_admin_delete'
    ) THEN
      EXECUTE 'DROP POLICY newsletter_admin_delete ON public.newsletter_signups';
      EXECUTE $policy$
        CREATE POLICY newsletter_admin_delete
        ON public.newsletter_signups
        FOR DELETE
        TO authenticated
        USING ((SELECT is_admin()))
      $policy$;
    END IF;

    IF to_regprocedure('public.is_admin()') IS NOT NULL AND EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'newsletter_signups'
        AND policyname = 'newsletter_signups_admin_read'
    ) THEN
      EXECUTE 'DROP POLICY newsletter_signups_admin_read ON public.newsletter_signups';
      EXECUTE $policy$
        CREATE POLICY newsletter_signups_admin_read
        ON public.newsletter_signups
        FOR SELECT
        TO authenticated
        USING ((SELECT is_admin()))
      $policy$;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'newsletter_signups'
        AND policyname = 'newsletter_signups_public_insert'
    ) THEN
      EXECUTE 'DROP POLICY newsletter_signups_public_insert ON public.newsletter_signups';
      EXECUTE $policy$
        CREATE POLICY newsletter_signups_public_insert
        ON public.newsletter_signups
        FOR INSERT
        TO anon
        WITH CHECK ((SELECT auth.role()) = 'anon')
      $policy$;
    END IF;
  END IF;
END $$;
