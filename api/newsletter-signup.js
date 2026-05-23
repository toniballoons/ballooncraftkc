import { Resend } from 'resend';
import { makeAccessToken } from '../src/lib/clientOps.js';
import { wrapBrandedEmail } from './_email-template.js';
import { createSupabaseServerClient } from './_supabase.js';

function createSupabaseAdminClient() {
  return createSupabaseServerClient();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, firstName, source = 'homepage' } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existing, error: existingError } = await supabase
      .from('newsletter_signups')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    const payload = existing
      ? {
          first_name: firstName || existing.first_name,
          source,
          status: 'active',
          marketing_consent: true,
          confirmed_at: new Date().toISOString(),
          unsubscribed_at: null,
          unsubscribe_reason: null,
          unsubscribe_note: null,
          updated_at: new Date().toISOString(),
        }
      : {
          email: normalizedEmail,
          first_name: firstName || null,
          source,
          status: 'active',
          marketing_consent: true,
          unsubscribe_token: makeAccessToken(),
          confirmed_at: new Date().toISOString(),
          subscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

    const mutation = existing
      ? supabase.from('newsletter_signups').update(payload).eq('id', existing.id)
      : supabase.from('newsletter_signups').insert(payload);

    const { error } = await mutation;
    if (error) throw new Error(error.message);

    const html = wrapBrandedEmail({
      eyebrow: 'BalloonCraft KC Newsletter',
      title: 'You are officially on the list',
      intro: 'Thanks for subscribing. We will send inspiration, announcements, and occasional offers that are actually worth opening.',
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${firstName || 'there'},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Thanks for subscribing to BalloonCraft KC updates. We will keep it tasteful: launch news, event inspiration, seasonal ideas, and occasional offers.</p>
        <p style="margin:0;font-size:15px;line-height:1.7;">You are all set.</p>
      `,
    });

    await resend.emails.send({
      from: `BalloonCraft KC <${process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: normalizedEmail,
      subject: 'BalloonCraft KC - Newsletter Signup Confirmed',
      html,
      tags: [{ name: 'flow', value: 'newsletter_confirmation' }],
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('newsletter-signup error:', error);
    return res.status(500).json({ error: error.message || 'Failed to subscribe.' });
  }
}
