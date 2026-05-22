import { createClient } from '@supabase/supabase-js';

export const FALLBACK_CONTACT_EMAIL_TO = 'tonihall015@gmail.com';

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'ballooncraftkc.com';
  return `${protocol}://${host}`;
}

export function getRequestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.headers['x-real-ip'] || req.socket?.remoteAddress || null;
}

export function getAdminInboxRecipients() {
  return [...new Set([
    FALLBACK_CONTACT_EMAIL_TO,
    process.env.CONTACT_EMAIL_TO,
  ].filter(Boolean))];
}

export async function requireAdminUser(req) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const error = new Error('Supabase admin client is not configured');
    error.status = 500;
    throw error;
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    const error = new Error('Missing authorization token');
    error.status = 401;
    throw error;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    const error = new Error('Unable to verify user session');
    error.status = 401;
    throw error;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    const error = new Error(profileError.message);
    error.status = 500;
    throw error;
  }

  if (profile?.role !== 'admin') {
    const error = new Error('Admin access is required');
    error.status = 403;
    throw error;
  }

  return { supabase, user: userData.user, token };
}

export async function createTrackedEmail({
  supabase,
  relatedType,
  relatedId = null,
  recipientName = null,
  recipientEmail,
  subject,
  metadata = {},
  baseUrl,
}) {
  if (!supabase || !recipientEmail || !subject) {
    return { delivery: null, pixelUrl: null };
  }

  const { data, error } = await supabase
    .from('email_deliveries')
    .insert({
      related_type: relatedType,
      related_id: relatedId,
      recipient_name: recipientName,
      recipient_email: recipientEmail.toLowerCase(),
      subject,
      metadata,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Failed to create tracked email record:', error);
    return { delivery: null, pixelUrl: null };
  }

  return {
    delivery: data,
    pixelUrl: `${String(baseUrl).replace(/\/$/, '')}/api/email-open?token=${data.tracking_token}`,
  };
}

export function appendTrackingPixel(html, pixelUrl) {
  if (!pixelUrl) return html;
  return `${html}
    <img src="${pixelUrl}" alt="" width="1" height="1" style="display:block;border:0;opacity:0;max-width:1px;max-height:1px;" />
  `;
}
