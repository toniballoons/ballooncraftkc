import { Resend } from 'resend';
import {
  appendTrackingPixel,
  createSupabaseAdminClient,
  createTrackedEmail,
  FALLBACK_CONTACT_EMAIL_TO,
  getBaseUrl,
} from '../server/server-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, event_type, event_date, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const adminRecipients = [...new Set([
    FALLBACK_CONTACT_EMAIL_TO,
    process.env.CONTACT_EMAIL_TO,
  ].filter(Boolean))];
  const from = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey || adminRecipients.length === 0 || !from) {
    console.error('Missing email environment variables');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(apiKey);
  const supabase = createSupabaseAdminClient();
  const baseUrl = getBaseUrl(req);

  const optionalFields = [
    phone ? `
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Phone</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;">${phone}</td>
      </tr>
    ` : '',
    event_type ? `
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Event Type</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;">${event_type}</td>
      </tr>
    ` : '',
    event_date ? `
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Event Date</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;">${event_date}</td>
      </tr>
    ` : '',
  ].filter(Boolean).join('\n');

  const html = `
    <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#ec4899 0%,#f59e0b 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">BalloonCraft KC</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;">New Contact Form Inquiry</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;opacity:0.96;">A new lead just came in from the website contact form.</p>
        </div>

        <div style="padding:28px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Name</td>
              <td style="padding:10px 0;color:#111827;font-size:14px;">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Email</td>
              <td style="padding:10px 0;color:#111827;font-size:14px;"><a href="mailto:${email}" style="color:#db2777;text-decoration:none;">${email}</a></td>
            </tr>
            ${optionalFields}
          </table>

          <div style="margin-top:24px;padding:20px 22px;background:#fff8fb;border:1px solid #f6d3e2;border-radius:18px;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">Project Details</p>
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const confirmationHtml = `
    <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#ec4899 0%,#f59e0b 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">BalloonCraft KC</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;">We Received Your Message</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;opacity:0.96;">Thanks for reaching out. We’re excited to hear more about your event.</p>
        </div>

        <div style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${name},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">We’ve received your inquiry and will be in touch shortly. In the meantime, here’s a copy of what you sent us:</p>

          <div style="margin:0 0 22px;padding:20px 22px;background:#fff8fb;border:1px solid #f6d3e2;border-radius:18px;">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">Your Message</p>
            <p style="margin:0;color:#374151;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${event_type ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;font-weight:600;">Event Type</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;">${event_type}</td>
              </tr>
            ` : ''}
            ${event_date ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;font-weight:600;">Event Date</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;">${event_date}</td>
              </tr>
            ` : ''}
            ${phone ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;font-weight:600;">Phone</td>
                <td style="padding:8px 0;color:#111827;font-size:14px;">${phone}</td>
              </tr>
            ` : ''}
          </table>

          <p style="margin:24px 0 0;font-size:15px;line-height:1.7;">Thank you,<br /><strong>BalloonCraft KC</strong></p>
          <p style="margin:20px 0 0;font-size:12px;line-height:1.7;color:#6b7280;">
            Newsletter preferences: <a href="${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(email)}" style="color:#db2777;">manage newsletter emails here</a>.
            This does not affect quotes, contracts, payment reminders, or any other event-specific emails.
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    let stored = false;

    if (supabase) {
      const { error: insertError } = await supabase.from('contact_submissions').insert({
        name,
        email,
        phone: phone || null,
        event_type: event_type || null,
        event_date: event_date || null,
        message,
        status: 'new',
      });

      if (insertError) {
        console.error('Supabase contact insert error:', insertError);
      } else {
        stored = true;
      }
    }

    const adminEmailResult = await resend.emails.send({
      from: `BalloonCraft KC <${from}>`,
      to: adminRecipients,
      replyTo: email,
      subject: `New contact from ${name}`,
      html,
      tags: [
        { name: 'flow', value: 'contact_admin_notification' },
      ],
    });

    let confirmationSent = false;

    try {
      const tracking = await createTrackedEmail({
        supabase,
        relatedType: 'contact_confirmation',
        relatedId: null,
        recipientName: name,
        recipientEmail: email,
        subject: 'We received your BalloonCraft KC inquiry',
        metadata: {
          event_type: event_type || null,
          event_date: event_date || null,
        },
        baseUrl,
      });

      await resend.emails.send({
        from: `BalloonCraft KC <${from}>`,
        to: email,
        subject: 'We received your BalloonCraft KC inquiry',
        html: appendTrackingPixel(confirmationHtml, tracking.pixelUrl),
        tags: [
          { name: 'flow', value: 'contact_confirmation' },
        ],
      });
      confirmationSent = true;
    } catch (confirmationError) {
      console.error('Resend confirmation email error:', confirmationError);
    }

    return res.status(200).json({
      success: true,
      stored,
      confirmationSent,
      adminEmailId: adminEmailResult?.data?.id || adminEmailResult?.id || null,
    });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
