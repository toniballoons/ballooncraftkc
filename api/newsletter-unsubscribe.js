import { createSupabaseAdminClient } from './_server-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, email } = req.body || {};
  if (!token && !email) {
    return res.status(400).json({ error: 'Missing unsubscribe token or email' });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }

  try {
    let query = supabase
      .from('newsletter_signups')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      });

    query = token
      ? query.eq('unsubscribe_token', token)
      : query.eq('email', String(email).trim().toLowerCase());

    const { data, error } = await query.select('id').single();

    if (error || !data) {
      throw new Error(error?.message || 'Unable to unsubscribe');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Newsletter unsubscribe failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to unsubscribe' });
  }
}
