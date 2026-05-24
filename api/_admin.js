import { createSupabaseServerClient } from './_supabase.js';
import { createFallbackAdminProfile, hasAdminPermission, normalizeAdminProfile } from '../src/lib/adminPermissions.js';

function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export async function requireAdminSession(req, { permission = 'account', requireAdmin = false, requireOwner = false } = {}) {
  const supabase = createSupabaseServerClient();
  const token = readBearerToken(req);

  if (!token) {
    return { error: { status: 401, message: 'Missing admin authorization.' } };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return { error: { status: 401, message: 'Your admin session is invalid. Please sign in again.' } };
  }

  const user = authData.user;
  const { data: profileRow, error: profileError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError && !createFallbackAdminProfile(user)) {
    return { error: { status: 403, message: 'Admin access is not configured for this account yet.' } };
  }

  const profile = normalizeAdminProfile(user, profileRow || null);
  if (!profile || profile.is_active === false) {
    return { error: { status: 403, message: 'This staff account is not active.' } };
  }

  if (requireOwner && profile.is_owner !== true) {
    return { error: { status: 403, message: 'Only Toni can perform that action.' } };
  }

  if (requireAdmin && !hasAdminPermission(profile, 'admin')) {
    return { error: { status: 403, message: 'Full admin access is required for that action.' } };
  }

  if (permission && !hasAdminPermission(profile, permission)) {
    return { error: { status: 403, message: 'This account does not have permission for that area.' } };
  }

  return { supabase, user, profile };
}

export function sendAdminError(res, error) {
  return res.status(error.status || 500).json({ error: error.message || 'Request failed.' });
}
