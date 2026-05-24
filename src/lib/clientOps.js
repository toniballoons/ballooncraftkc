const MONEY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChunk(length = 6) {
  if (!globalThis.crypto?.getRandomValues) {
    return Math.random().toString(36).slice(2, 2 + length).toUpperCase();
  }

  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join('');
}

function timestampChunk() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

export function makeClientCode() {
  return `BKC-CLIENT-${randomChunk(6)}`;
}

export function makeInvoiceCode() {
  return `BKC-INV-${timestampChunk()}-${randomChunk(4)}`;
}

export function makeTransactionCode() {
  return `BKC-TXN-${timestampChunk()}-${randomChunk(5)}`;
}

export function makeConfirmationCode() {
  return `BKC-${randomChunk(8)}`;
}

export function makeTemplateCode() {
  return `BKC-TPL-${randomChunk(5)}`;
}

export function makePackageCode() {
  return `BKC-PKG-${timestampChunk()}-${randomChunk(4)}`;
}

export function makeDocumentAssetId() {
  return `BKC-DOC-${randomChunk(6)}`;
}

export function makeSignerFieldId() {
  return `BKC-FLD-${randomChunk(6)}`;
}

export function makeAccessToken() {
  return `${randomChunk(10)}${randomChunk(10)}${randomChunk(10)}`.toLowerCase();
}

export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'custom-event';
}

export function parseMoney(value) {
  const amount = Number.parseFloat(value ?? 0);
  return Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0;
}

export function formatMoney(value) {
  return MONEY_FORMATTER.format(parseMoney(value));
}

export function formatDate(value) {
  if (!value) return 'Not set';
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

export function paymentLinkEntries(paymentLinks = {}) {
  return Object.entries(paymentLinks)
    .filter(([, value]) => value)
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (match) => match.toUpperCase()),
      value,
    }));
}

export function sumInvoicePayments(invoiceId, payments = []) {
  return parseMoney(
    payments
      .filter((payment) => payment.invoice_id === invoiceId)
      .reduce((total, payment) => total + parseMoney(payment.amount), 0)
  );
}

export function computeInvoiceStatus(invoice, payments = []) {
  const total = parseMoney(invoice?.contract_amount);
  const deposit = parseMoney(invoice?.down_payment_amount);
  const paid = sumInvoicePayments(invoice?.id, payments);
  const balance = Math.max(total - paid, 0);

  let status = invoice?.status || 'draft';
  if (paid >= total && total > 0) {
    status = 'paid';
  } else if (paid >= deposit && deposit > 0) {
    status = balance > 0 ? 'deposit_paid' : 'paid';
  } else if (paid > 0) {
    status = 'partially_paid';
  } else if (status === 'draft') {
    status = 'draft';
  } else if (status === 'signed') {
    status = 'pending_payment';
  }

  return {
    total,
    paid,
    balance,
    deposit,
    status,
  };
}

export const CONTRACT_PLACEHOLDERS = [
  { key: 'client_name', label: 'Client name', group: 'Client & event details', help: 'Pulls in the client contact name.' },
  { key: 'business_name', label: 'Business name', group: 'Client & event details', help: 'Pulls in the client business name when one exists.' },
  { key: 'event_type', label: 'Event type', group: 'Client & event details', help: 'Wedding, birthday, grand opening, corporate event, and so on.' },
  { key: 'event_date', label: 'Event date', group: 'Client & event details', help: 'Uses the saved event date from the invoice.' },
  { key: 'event_location', label: 'Event location', group: 'Client & event details', help: 'Uses the event venue or address from the invoice.' },
  { key: 'service_summary', label: 'Services included', group: 'Client & event details', help: 'Pulls in the invoice service summary or scope of work.' },
  { key: 'contract_amount', label: 'Full contract amount', group: 'Pricing & payment schedule', help: 'Shows the full event total.' },
  { key: 'down_payment_amount', label: 'Down payment amount', group: 'Pricing & payment schedule', help: 'Shows the deposit amount due to book the event.' },
  { key: 'down_payment_due_date', label: 'Down payment due date', group: 'Pricing & payment schedule', help: 'Shows when the deposit must be paid.' },
  { key: 'final_payment_amount', label: 'Final payment amount', group: 'Pricing & payment schedule', help: 'Shows the remaining balance due after the deposit.' },
  { key: 'final_payment_due_date', label: 'Final payment due date', group: 'Pricing & payment schedule', help: 'Shows when the remaining balance is due.' },
  { key: 'invoice_code', label: 'Invoice ID', group: 'Pricing & payment schedule', help: 'Pulls in the generated BalloonCraft KC invoice code.' },
  { key: 'payment_instructions', label: 'Payment instructions', group: 'Payment notes & terms', help: 'Includes Venmo, Cash App, Zelle, or any custom payment directions.' },
  { key: 'additional_terms', label: 'Additional terms', group: 'Payment notes & terms', help: 'Adds extra event-specific terms from the invoice.' },
];

export const SIGNATURE_FIELD_TYPES = [
  { value: 'signature', label: 'Signature' },
  { value: 'initials', label: 'Initials' },
  { value: 'date', label: 'Date' },
  { value: 'text', label: 'Text input' },
];

export const SIGNATURE_PREFILL_OPTIONS = [
  { value: '', label: 'No prefill' },
  { value: 'client_name', label: 'Client name' },
  { value: 'business_name', label: 'Business name' },
  { value: 'event_type', label: 'Event type' },
  { value: 'event_date', label: 'Event date' },
  { value: 'event_location', label: 'Event location' },
  { value: 'contract_amount', label: 'Contract amount' },
  { value: 'down_payment_amount', label: 'Down payment amount' },
  { value: 'final_payment_amount', label: 'Final payment amount' },
  { value: 'invoice_code', label: 'Invoice ID' },
  { value: 'today', label: 'Today’s date' },
];

export const GENERATED_DOCUMENT_TARGET = 'generated_agreement';

export const DEFAULT_CONTRACT_TEMPLATE = {
  name: 'Balloon event service agreement',
  description: 'Starter agreement for balloon decor events, deposits, and final payment terms.',
  subject_line: 'Your BalloonCraft KC official documents are ready',
  intro_text: 'Please review the agreement below, confirm the invoice details, and sign digitally to move forward with your booking.',
  document_title: 'BalloonCraft KC Service Agreement',
  closing_text: 'Once signed, both sides will receive a completed copy by email.',
  uploaded_documents: [],
  signature_fields: [],
  body_text: `This BalloonCraft KC Service Agreement is entered into by BalloonCraft KC and {{client_name}}{{business_name}} for {{event_type}} services scheduled for {{event_date}} at {{event_location}}.

BalloonCraft KC will provide the following scope of work: {{service_summary}}.

The full contract amount is {{contract_amount}}. A non-refundable down payment of {{down_payment_amount}} is due by {{down_payment_due_date}} to reserve the event date. The remaining balance of {{final_payment_amount}} is due by {{final_payment_due_date}}.

Accepted payment instructions: {{payment_instructions}}.

Client understands that balloon installations are custom work and may require minor on-site adjustments for venue access, weather, ceiling height, or safety needs. BalloonCraft KC will always preserve the overall design intent while making any required adjustments.

If the event requires venue access windows, loading, or teardown timing, the client is responsible for coordinating that access in advance. Delays caused by venue restrictions or delayed client access may affect the installation timeline.

If the client cancels after materials have been ordered or custom items have been created, the down payment remains non-refundable and any additional documented costs already incurred by BalloonCraft KC may also be due.

Additional terms: {{additional_terms}}`,
};

export function buildInvoiceEmailSubject(invoice, stage = 'downpayment') {
  const eventSlug = slugify(invoice?.invoice_title || invoice?.event_type || invoice?.event_location || 'custom-event');
  if (stage === 'final_payment') {
    return `BalloonCraft KC - Final Payment Invoice for ${eventSlug}`;
  }

  return `BalloonCraft KC - Downpayment Invoice for ${eventSlug}`;
}

export function mergeTemplateText(templateText = '', fields = {}) {
  return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => {
    const value = fields[key];
    return value === null || value === undefined || value === '' ? '—' : String(value);
  });
}

export function buildMergedFields({ client, invoice }) {
  return {
    client_name: client?.contact_name || '',
    business_name: client?.business_name ? ` (${client.business_name})` : '',
    event_type: invoice?.event_type || client?.event_type || 'Custom event',
    event_date: formatDate(invoice?.event_date || client?.event_date),
    event_location: invoice?.event_location || client?.venue_name || client?.venue_address || 'To be confirmed',
    service_summary: invoice?.service_summary || 'Custom balloon decor and event styling services.',
    contract_amount: formatMoney(invoice?.contract_amount),
    down_payment_amount: formatMoney(invoice?.down_payment_amount),
    down_payment_due_date: formatDate(invoice?.down_payment_due_date),
    final_payment_amount: formatMoney(invoice?.final_payment_amount),
    final_payment_due_date: formatDate(invoice?.final_payment_due_date),
    invoice_code: invoice?.invoice_code || '',
    payment_instructions: invoice?.payment_instructions || 'Payment details will be shared by BalloonCraft KC.',
    additional_terms: invoice?.additional_terms || 'No additional terms were added for this package.',
  };
}

export function renderTextSections(text = '') {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function getDocumentTargetOptions(uploadedDocuments = []) {
  return [
    { value: GENERATED_DOCUMENT_TARGET, label: 'Generated BalloonCraft agreement' },
    ...normalizeUploadedDocuments(uploadedDocuments).map((document) => ({
      value: document.id,
      label: document.name || 'Uploaded document',
    })),
  ];
}

export function normalizeUploadedDocuments(documents = []) {
  if (!Array.isArray(documents)) return [];

  return documents.map((document) => ({
    id: document.id || makeDocumentAssetId(),
    name: document.name || 'Untitled document',
    file_url: document.file_url || document.url || '',
    file_type: document.file_type || document.mime_type || '',
    description: document.description || '',
  })).filter((document) => document.file_url);
}

export function normalizeSignatureFields(fields = [], uploadedDocuments = []) {
  const validTargets = new Set([
    GENERATED_DOCUMENT_TARGET,
    ...normalizeUploadedDocuments(uploadedDocuments).map((document) => document.id),
  ]);

  if (!Array.isArray(fields)) return [];

  return fields.map((field) => {
    const target_document_id = validTargets.has(field.target_document_id)
      ? field.target_document_id
      : GENERATED_DOCUMENT_TARGET;

    return {
      id: field.id || makeSignerFieldId(),
      target_document_id,
      type: field.type || 'signature',
      label: field.label || 'Signature field',
      required: field.required !== false,
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      page_hint: field.page_hint || '',
      anchor_hint: field.anchor_hint || '',
      prefill_key: field.prefill_key || '',
    };
  });
}

export function resolveSignatureFieldPrefill(field, mergedFields = {}) {
  if (!field?.prefill_key) return '';
  if (field.prefill_key === 'today') {
    return field.type === 'date'
      ? new Date().toISOString().slice(0, 10)
      : new Date().toLocaleDateString('en-US');
  }

  return mergedFields[field.prefill_key] || '';
}

export function buildPackageDocumentModel({ client, invoice, template }) {
  const mergedFields = buildMergedFields({ client, invoice });
  const uploadedDocuments = normalizeUploadedDocuments(template?.uploaded_documents || []);
  const signatureFields = normalizeSignatureFields(template?.signature_fields || [], uploadedDocuments);

  return {
    uploadedDocuments,
    signatureFields,
    mergedFields,
  };
}

export function buildAgreementHtml({
  packet,
  client,
  invoice,
  signatureFields = [],
  signatureFieldValues = {},
}) {
  const uploadedDocuments = normalizeUploadedDocuments(packet?.uploadedDocuments || packet?.uploaded_documents || []);
  const fieldGroups = normalizeSignatureFields(signatureFields, uploadedDocuments)
    .reduce((groups, field) => {
      groups[field.target_document_id] ||= [];
      groups[field.target_document_id].push(field);
      return groups;
    }, {});

  const renderFieldSummary = (fields) => {
    if (!fields?.length) return '';

    return `
      <div style="margin-top:16px;padding:16px;background:#fff8fb;border:1px solid #f6d3e2;border-radius:16px;">
        <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#be185d;">Required signer fields</p>
        ${fields.map((field) => `
          <div style="margin:0 0 10px;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">${field.label}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
              ${[field.type, field.page_hint, field.anchor_hint].filter(Boolean).join(' • ')}
            </p>
            ${signatureFieldValues[field.id] ? `<p style="margin:4px 0 0;font-size:13px;color:#111827;">Captured value: ${signatureFieldValues[field.id]}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  };

  return `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.6;">
      <h1 style="font-size:28px;margin:0 0 12px;">${packet.documentTitle}</h1>
      ${renderTextSections(packet.documentIntro).map((paragraph) => `<p style="font-size:15px;color:#4b5563;margin:0 0 14px;">${paragraph}</p>`).join('')}
      ${renderTextSections(packet.documentBody).map((paragraph) => `<p style="font-size:15px;margin:0 0 14px;">${paragraph}</p>`).join('')}
      ${renderTextSections(packet.documentClosing).map((paragraph) => `<p style="font-size:15px;color:#4b5563;margin:0 0 14px;">${paragraph}</p>`).join('')}
      ${renderFieldSummary(fieldGroups[GENERATED_DOCUMENT_TARGET])}
      ${uploadedDocuments.length ? `
        <div style="margin-top:28px;">
          <h2 style="font-size:20px;margin:0 0 12px;">Attached documents</h2>
          ${uploadedDocuments.map((document) => `
            <div style="margin:0 0 16px;padding:18px;border:1px solid #e5e7eb;border-radius:16px;">
              <p style="margin:0;font-size:16px;font-weight:700;">${document.name}</p>
              ${document.description ? `<p style="margin:8px 0 0;font-size:14px;color:#6b7280;">${document.description}</p>` : ''}
              <p style="margin:8px 0 0;font-size:14px;"><a href="${document.file_url}" style="color:#be185d;text-decoration:none;">Open file</a></p>
              ${renderFieldSummary(fieldGroups[document.id])}
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:14px;"><strong>Client:</strong> ${client.contactName || client.contact_name || '—'}</p>
        <p style="margin:4px 0 0;font-size:14px;"><strong>Invoice:</strong> ${invoice.invoiceCode || invoice.invoice_code || '—'}</p>
      </div>
    </div>
  `;
}
