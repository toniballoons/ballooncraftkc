import { createClient } from '@supabase/supabase-js';

export function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    null
  );
}

export function getSupabasePublishableKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    null
  );
}

export function getSupabaseAdminKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function createSupabaseServerClient({ allowPublishableFallback = false, requireKey = true } = {}) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAdminKey() || (allowPublishableFallback ? getSupabasePublishableKey() : null);

  if (!supabaseUrl || !supabaseKey) {
    if (requireKey) {
      throw new Error(
        'Supabase server environment variables are missing. ' +
        'Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SECRET_KEY ' +
        '(or SUPABASE_SERVICE_ROLE_KEY).'
      );
    }

    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
