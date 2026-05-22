import { Resend } from 'resend';
import {
  appendTrackingPixel,
  createSupabaseAdminClient,
  createTrackedEmail,
  getBaseUrl,
} from './_server-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, fullName, source = 'homepage' } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();

    const { data: existing } = await supabase
      .from('newsletter_signups')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    let record = existing;
    if (existing) {
      const { data, error } = await supabase
        .from('newsletter_signups')
        .update({
          full_name: fullName || existing.full_name,
          status: 'subscribed',
          source,
          unsubscribed_at: null,
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      record = data;
    } else {
      const { data, error } = await supabase
        .from('newsletter_signups')
        .insert({
          email: normalizedEmail,
          full_name: fullName || null,
          source,
          status: 'subscribed',
        })
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      record = data;
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';
    if (apiKey && record) {
      const resend = new Resend(apiKey);
      const baseUrl = getBaseUrl(req);
      const unsubscribeUrl = `${baseUrl}/newsletter/unsubscribe?token=${record.unsubscribe_token}`;

      const tracking = await createTrackedEmail({
        supabase,
        relatedType: 'newsletter_welcome',
        relatedId: record.id,
        recipientName: record.full_name,
        recipientEmail: record.email,
        subject: 'You’re on the BalloonCraft KC list',
        metadata: { source },
        baseUrl,
      });

      const html = appendTrackingPixel(`
        <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
            <div style="padding:28px 32px;background:linear-gradient(135deg,#ec4899 0%,#f59e0b 100%);color:#ffffff;">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">BalloonCraft KC</p>
              <h1 style="margin:0;font-size:28px;line-height:1.2;">You’re officially subscribed</h1>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;opacity:0.96;">We’ll send occasional BalloonCraft KC updates, launch notes, and newsletter-style announcements.</p>
            </div>
            <div style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${record.full_name || 'there'},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Thanks for joining the BalloonCraft KC newsletter list. This subscription only covers newsletter-style emails and promotions.</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">Important: unsubscribing from the newsletter will <strong>not</strong> stop event-specific emails such as payment reminders, contract signing requests, upcoming payment notices, or anything else that still requires action.</p>
              <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f3d4e4;">
                <p style="margin:0;font-size:13px;color:#6b7280;">Want to stop just newsletter emails later? <a href="${unsubscribeUrl}" style="color:#db2777;">Unsubscribe here</a>.</p>
              </div>
            </div>
          </div>
        </div>
      `, tracking.pixelUrl);

      await resend.emails.send({
        from: `BalloonCraft KC <${from}>`,
        to: record.email,
        subject: 'You’re on the BalloonCraft KC list',
        html,
        tags: [
          { name: 'flow', value: 'newsletter_welcome' },
        ],
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Newsletter signup failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to sign up' });
  }
}
