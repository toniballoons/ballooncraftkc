import { createSupabaseServerClient } from './_supabase.js';

function createSupabaseAdminClient() {
  return createSupabaseServerClient();
}

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseAdminClient();
    const token = req.method === 'GET' ? req.query?.token : req.body?.token;

    if (!token) {
      return res.status(400).json({ error: 'Missing unsubscribe token.' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('newsletter_signups')
        .select('email, first_name, status')
        .eq('unsubscribe_token', token)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return res.status(404).json({ error: 'Subscriber not found.' });

      return res.status(200).json({
        email: data.email,
        firstName: data.first_name,
        status: data.status,
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { reason, note } = req.body || {};
    const { data, error } = await supabase
      .from('newsletter_signups')
      .update({
        status: 'unsubscribed',
        marketing_consent: false,
        unsubscribe_reason: reason || null,
        unsubscribe_note: note || null,
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('unsubscribe_token', token)
      .select('email')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ error: 'Subscriber not found.' });

    return res.status(200).json({ success: true, email: data.email });
  } catch (error) {
    console.error('newsletter-unsubscribe error:', error);
    return res.status(500).json({ error: error.message || 'Failed to unsubscribe.' });
  }
}
