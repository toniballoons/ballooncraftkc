import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, event_type, event_date, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL_TO;
  const from = process.env.CONTACT_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    console.error('Missing email environment variables');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(apiKey);

  const optionalFields = [
    phone      ? `<p><strong>Phone:</strong> ${phone}</p>`           : '',
    event_type ? `<p><strong>Event Type:</strong> ${event_type}</p>` : '',
    event_date ? `<p><strong>Event Date:</strong> ${event_date}</p>` : '',
  ].filter(Boolean).join('\n');

  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    ${optionalFields}
    <p><strong>Message:</strong></p>
    <blockquote style="border-left:4px solid #ccc;padding-left:12px;color:#555">${message}</blockquote>
  `;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `New contact from ${name}`,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
