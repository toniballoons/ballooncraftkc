import { Resend } from 'resend';

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
    </div>
  `;

  try {
    await resend.emails.send({
      from: `${senderName} <${from}>`,
      to: to_email,
      subject: `Re: Your inquiry — BalloonCraft KC`,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend reply error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send reply' });
  }
}
