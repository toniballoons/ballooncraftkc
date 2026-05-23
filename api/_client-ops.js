import { Resend } from 'resend';
import { createSupabaseServerClient } from './_supabase.js';
import {
  buildInvoiceEmailSubject,
  buildMergedFields,
  computeInvoiceStatus,
  formatDate,
  formatMoney,
  makeAccessToken,
  makeConfirmationCode,
  makePackageCode,
  makeTransactionCode,
  mergeTemplateText,
  parseMoney,
  paymentLinkEntries,
  renderTextSections,
} from '../src/lib/clientOps.js';

const DEFAULT_FROM = 'onboarding@resend.dev';
const DEFAULT_ADMIN_RECIPIENT = 'tonihall015@gmail.com';

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

export function createSupabaseAdminClient() {
  return createSupabaseServerClient();
}

export function createResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is missing.');
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export function getAdminRecipients() {
  return [...new Set([
    DEFAULT_ADMIN_RECIPIENT,
    process.env.CONTACT_EMAIL_TO,
    process.env.DEVELOPER_EMAIL_TO,
  ].filter(Boolean))];
}

export function getMailFrom() {
  return process.env.CONTACT_EMAIL_FROM || DEFAULT_FROM;
}

export async function getClientInvoiceTemplateBundle(supabase, { clientId, invoiceId, templateId }) {
  const [{ data: client, error: clientError }, { data: invoice, error: invoiceError }, { data: template, error: templateError }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('invoices').select('*').eq('id', invoiceId).single(),
    supabase.from('contract_templates').select('*').eq('id', templateId).single(),
  ]);

  if (clientError) throw new Error(clientError.message);
  if (invoiceError) throw new Error(invoiceError.message);
  if (templateError) throw new Error(templateError.message);
  if (invoice.client_id !== client.id) {
    throw new Error('The selected invoice does not belong to that client.');
  }

  return { client, invoice, template };
}

export function buildPackagePayload({ client, invoice, template, packetTitle, emailStage = 'downpayment' }) {
  const mergedFields = buildMergedFields({ client, invoice });

  return {
    packetTitle: packetTitle || `${client.contact_name} booking package`,
    mergedFields,
    paymentLinks: invoice.payment_links || {},
    paymentInstructions: invoice.payment_instructions || '',
    subjectLine: buildInvoiceEmailSubject(invoice, emailStage),
    documentTitle: mergeTemplateText(template.document_title, mergedFields),
    documentIntro: mergeTemplateText(template.intro_text || '', mergedFields),
    documentBody: mergeTemplateText(template.body_text, mergedFields),
    documentClosing: mergeTemplateText(template.closing_text || '', mergedFields),
  };
}

function renderPaymentLinkCards(paymentLinks = {}) {
  const entries = paymentLinkEntries(paymentLinks);
  if (entries.length === 0) return '';

  return `
    <div style="margin:20px 0 0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">Payment links</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${entries.map((entry) => `
          <a href="${escapeHtml(entry.value)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
            ${escapeHtml(entry.label)}
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function renderDocumentHtml({ packet, includeSignature = false }) {
  const introSections = renderTextSections(packet.document_intro);
  const bodySections = renderTextSections(packet.document_body);
  const closingSections = renderTextSections(packet.document_closing);

  return `
    <div style="margin-top:24px;padding:26px;border:1px solid #f3d4e4;border-radius:22px;background:#ffffff;">
      <h2 style="margin:0 0 18px;font-size:24px;line-height:1.2;color:#111827;">${escapeHtml(packet.document_title)}</h2>
      ${introSections.map((paragraph) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#374151;">${nl2br(paragraph)}</p>`).join('')}
      ${bodySections.map((paragraph) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#111827;">${nl2br(paragraph)}</p>`).join('')}
      ${closingSections.map((paragraph) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#374151;">${nl2br(paragraph)}</p>`).join('')}

      ${includeSignature ? `
        <div style="margin-top:26px;padding-top:18px;border-top:1px solid #f3d4e4;">
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">Signature record</p>
          <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Signed by:</strong> ${escapeHtml(packet.signed_name || '—')}</p>
          <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Initials:</strong> ${escapeHtml(packet.signed_initials || '—')}</p>
          <p style="margin:0 0 8px;font-size:15px;color:#111827;"><strong>Title:</strong> ${escapeHtml(packet.signed_title || '—')}</p>
          <p style="margin:0;font-size:15px;color:#111827;"><strong>Signed at:</strong> ${escapeHtml(packet.signed_at ? new Date(packet.signed_at).toLocaleString('en-US') : '—')}</p>
        </div>
      ` : ''}
    </div>
  `;
}

function renderInvoiceSummary(invoice) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Invoice ID</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(invoice.invoice_code)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Contract amount</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(formatMoney(invoice.contract_amount))}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Down payment</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(formatMoney(invoice.down_payment_amount))} due ${escapeHtml(formatDate(invoice.down_payment_due_date))}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Final payment</td>
        <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(formatMoney(invoice.final_payment_amount))} due ${escapeHtml(formatDate(invoice.final_payment_due_date))}</td>
      </tr>
    </table>
  `;
}

export function buildClientPackageEmailHtml({ client, invoice, packet, accessUrl }) {
  return `
    <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
        <div style="padding:30px 34px;background:linear-gradient(135deg,#ec4899 0%,#f59e0b 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">BalloonCraft KC Client Package</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">Your booking package is ready</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.65;opacity:0.96;">Hi ${escapeHtml(client.contact_name)}, your event proposal, invoice summary, and signature-ready agreement are waiting for you.</p>
        </div>

        <div style="padding:30px 34px;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#374151;">${nl2br(packet.document_intro || 'Please review the agreement and sign when everything looks right.')}</p>
          ${renderInvoiceSummary(invoice)}
          ${packet.payment_instructions ? `
            <div style="margin-top:20px;padding:18px;background:#fff8fb;border:1px solid #f6d3e2;border-radius:18px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">Payment instructions</p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">${nl2br(packet.payment_instructions)}</p>
            </div>
          ` : ''}
          ${renderPaymentLinkCards(packet.payment_links)}

          <div style="margin-top:26px;">
            <a href="${escapeHtml(accessUrl)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">Review and sign your package</a>
          </div>

          <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">If the button above does not work, copy and paste this secure link into your browser:<br /><span style="color:#be185d;">${escapeHtml(accessUrl)}</span></p>
          ${renderDocumentHtml({ packet })}
        </div>
      </div>
    </div>
  `;
}

export function buildSignedCompletionEmailHtml({ client, invoice, packet, heading, intro }) {
  return `
    <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
        <div style="padding:30px 34px;background:linear-gradient(135deg,#0f766e 0%,#14b8a6 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">BalloonCraft KC Agreement Complete</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">${escapeHtml(heading)}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.65;opacity:0.96;">${escapeHtml(intro)}</p>
        </div>

        <div style="padding:30px 34px;">
          <p style="margin:0 0 18px;font-size:15px;color:#374151;">Client: <strong>${escapeHtml(client.contact_name)}</strong>${client.business_name ? ` (${escapeHtml(client.business_name)})` : ''}</p>
          ${renderInvoiceSummary(invoice)}
          ${renderDocumentHtml({ packet, includeSignature: true })}
        </div>
      </div>
    </div>
  `;
}

export function buildPaymentReceiptEmailHtml({ client, invoice, payment }) {
  return `
    <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
        <div style="padding:30px 34px;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">BalloonCraft KC Payment Confirmation</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">We received your payment</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.65;opacity:0.96;">Thank you, ${escapeHtml(client.contact_name)}. Your payment has been recorded for invoice ${escapeHtml(invoice.invoice_code)}.</p>
        </div>

        <div style="padding:30px 34px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Invoice ID</td>
              <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(invoice.invoice_code)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Transaction ID</td>
              <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(payment.transaction_code)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Confirmation code</td>
              <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(payment.confirmation_code)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Amount</td>
              <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(formatMoney(payment.amount))}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;font-size:14px;font-weight:600;">Payment method</td>
              <td style="padding:10px 0;color:#111827;font-size:14px;">${escapeHtml(payment.payment_method || 'Recorded payment')}</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `;
}

export async function insertContractPackage(supabase, { client, invoice, template, packetTitle, emailStage = 'downpayment' }) {
  const packagePayload = buildPackagePayload({ client, invoice, template, packetTitle, emailStage });

  const packageInsert = {
    package_code: makePackageCode(),
    access_token: makeAccessToken(),
    client_id: client.id,
    invoice_id: invoice.id,
    template_id: template.id,
    status: 'sent',
    email_stage: emailStage,
    packet_title: packagePayload.packetTitle,
    subject_line: packagePayload.subjectLine,
    recipient_name: client.contact_name,
    recipient_email: client.email,
    merged_fields: packagePayload.mergedFields,
    payment_links: packagePayload.paymentLinks,
    payment_instructions: packagePayload.paymentInstructions,
    document_title: packagePayload.documentTitle,
    document_intro: packagePayload.documentIntro,
    document_body: packagePayload.documentBody,
    document_closing: packagePayload.documentClosing,
  };

  const { data, error } = await supabase
    .from('contract_packages')
    .insert(packageInsert)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function sendPackageEmail({ resend, from, to, subject, html }) {
  return resend.emails.send({
    from: `BalloonCraft KC <${from}>`,
    to,
    subject,
    html,
    tags: [
      { name: 'flow', value: 'client_package' },
    ],
  });
}

export async function updateInvoiceStatusFromPayments(supabase, invoice, payments) {
  const { status } = computeInvoiceStatus(invoice, payments);
  const { error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoice.id);

  if (error) throw new Error(error.message);
  return status;
}

export async function createPaymentRecord(supabase, invoice, payload) {
  const payment = {
    invoice_id: invoice.id,
    transaction_code: makeTransactionCode(),
    confirmation_code: makeConfirmationCode(),
    status: 'recorded',
    payment_method: payload.paymentMethod || null,
    source_reference: payload.sourceReference || null,
    amount: parseMoney(payload.amount),
    paid_at: payload.paidAt || new Date().toISOString(),
    recorded_by: payload.recordedBy || null,
    note: payload.note || null,
    email_receipt_sent: false,
  };

  const { data, error } = await supabase
    .from('invoice_payments')
    .insert(payment)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
