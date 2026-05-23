function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nl2br(value = '') {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

export function getSiteUrl() {
  return (process.env.SITE_URL || 'https://www.ballooncraftkc.com').replace(/\/$/, '');
}

export function buildUnsubscribeUrl(token) {
  return `${getSiteUrl()}/unsubscribe/${token}`;
}

export function renderMarketingFooter(unsubscribeToken) {
  if (!unsubscribeToken) return '';

  return `
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid #f3d4e4;color:#6b7280;font-size:12px;line-height:1.6;">
      <p style="margin:0 0 8px;">You are receiving BalloonCraft KC updates because you asked to stay in the loop on launches, inspiration, offers, or event ideas.</p>
      <p style="margin:0;">
        Want fewer emails? You can <a href="${buildUnsubscribeUrl(unsubscribeToken)}" style="color:#be185d;text-decoration:none;font-weight:700;">unsubscribe instantly here</a>.
      </p>
    </div>
  `;
}

export function wrapBrandedEmail({
  eyebrow,
  title,
  intro,
  bodyHtml,
  accent = 'linear-gradient(135deg,#ec4899 0%,#f59e0b 100%)',
  marketingFooterToken = null,
}) {
  return `
    <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
        <div style="padding:30px 34px;background:${accent};color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">${escapeHtml(title)}</h1>
          ${intro ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.65;opacity:0.96;">${nl2br(intro)}</p>` : ''}
        </div>
        <div style="padding:30px 34px;">
          ${bodyHtml}
          ${renderMarketingFooter(marketingFooterToken)}
        </div>
      </div>
    </div>
  `;
}

export { escapeHtml, nl2br };
