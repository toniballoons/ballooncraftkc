import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, description, screenshot_urls } = req.body || {};

  if (!name || !email || !description) {
    return res.status(400).json({ error: 'name, email, and description are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DEVELOPER_EMAIL_TO || process.env.CONTACT_EMAIL_TO;
  const from = process.env.CONTACT_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    console.error('Missing email environment variables for developer support');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(apiKey);

  const screenshotHtml = Array.isArray(screenshot_urls) && screenshot_urls.length > 0
    ? `<p><strong>Screenshots:</strong></p>
       <ul>${screenshot_urls.map(url => `<li><a href="${url}">${url}</a></li>`).join('')}</ul>
       <div style="margin-top:12px">${screenshot_urls.map(url =>
         `<img src="${url}" style="max-width:600px;margin-bottom:12px;border:1px solid #ddd;border-radius:8px" />`
       ).join('')}</div>`
    : '<p><em>No screenshots attached.</em></p>';

  const html = `
    <h2>🛠️ Developer Support Request</h2>
    <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
    <hr />
    <p><strong>Description of issue:</strong></p>
    <blockquote style="border-left:4px solid #ccc;padding-left:12px;color:#555;white-space:pre-wrap">${description}</blockquote>
    <hr />
    ${screenshotHtml}
  `;

  try {
    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Support Request from ${name} — BalloonCraft KC`,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send support email' });
  }
}
