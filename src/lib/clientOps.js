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
  { key: 'client_name', label: 'Client name' },
  { key: 'business_name', label: 'Business name' },
  { key: 'event_type', label: 'Event type' },
  { key: 'event_date', label: 'Event date' },
  { key: 'event_location', label: 'Event location' },
  { key: 'service_summary', label: 'Service summary' },
  { key: 'contract_amount', label: 'Contract amount' },
  { key: 'down_payment_amount', label: 'Down payment amount' },
  { key: 'down_payment_due_date', label: 'Down payment due date' },
  { key: 'final_payment_amount', label: 'Final payment amount' },
  { key: 'final_payment_due_date', label: 'Final payment due date' },
  { key: 'invoice_code', label: 'Invoice ID' },
  { key: 'payment_instructions', label: 'Payment instructions' },
  { key: 'additional_terms', label: 'Additional terms' },
];

export const DEFAULT_CONTRACT_TEMPLATE = {
  name: 'Balloon event service agreement',
  description: 'Starter agreement for balloon decor events, deposits, and final payment terms.',
  subject_line: 'Your BalloonCraft KC booking package is ready',
  intro_text: 'Please review the agreement below, confirm the invoice details, and sign digitally to move forward with your booking.',
  document_title: 'BalloonCraft KC Service Agreement',
  closing_text: 'Once signed, both sides will receive a completed copy by email.',
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
