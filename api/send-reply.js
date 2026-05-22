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

  const { to_name, to_email, reply_body, original_message } = req.body || {};

  if (!to_email || !reply_body) {
    return res.status(400).json({ error: 'to_email and reply_body are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';
  const senderName = 'Toni — BalloonCraft KC';

  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(apiKey);
  const supabase = createSupabaseAdminClient();
  const baseUrl = getBaseUrl(req);

  const originalQuote = original_message
    ? `<div style="margin-top:24px;padding:12px 16px;border-left:3px solid #ccc;color:#888;font-size:13px;">
        <p style="margin:0 0 4px;font-weight:bold;color:#aaa">Original message:</p>
        <p style="margin:0;white-space:pre-wrap">${original_message}</p>
       </div>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
      <p>Hi ${to_name || 'there'},</p>
      <div style="white-space:pre-wrap;line-height:1.7;font-size:15px">${reply_body}</div>
      <p style="margin-top:24px">Best regards,<br/><strong>Toni</strong><br/>BalloonCraft KC</p>
      ${originalQuote}
      <p style="margin-top:24px;font-size:12px;line-height:1.7;color:#6b7280;">
        Newsletter preferences: <a href="${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(to_email)}" style="color:#db2777;">manage newsletter emails here</a>.
        This does not affect quotes, contracts, payment reminders, or other event-specific communication.
      </p>
    </div>
  `;

  try {
    const tracking = await createTrackedEmail({
      supabase,
      relatedType: 'client_reply',
      relatedId: null,
      recipientName: to_name,
      recipientEmail: to_email,
      subject: `Re: Your inquiry — BalloonCraft KC`,
      metadata: {},
      baseUrl,
    });

    await resend.emails.send({
      from: `${senderName} <${from}>`,
      to: to_email,
      subject: `Re: Your inquiry — BalloonCraft KC`,
      html: appendTrackingPixel(html, tracking.pixelUrl),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend reply error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reply' });
  }
}
