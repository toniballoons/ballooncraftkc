const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'venmo', label: 'Venmo' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const CONTRACT_STATUS_OPTIONS = [
  { value: 'not_sent', label: 'Not Sent' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'received', label: 'Received' },
];

export const TAX_PERIOD_TYPES = [
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semiannual', label: 'Semiannual' },
  { value: 'yearly', label: 'Yearly' },
];

export function toMoneyNumber(value) {
  const parsed = Number.parseFloat(value ?? 0);
  if (Number.isNaN(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function formatCurrency(value) {
  return CURRENCY_FORMATTER.format(toMoneyNumber(value));
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getCustomerDisplayName(customer) {
  return customer?.full_name || customer?.company_name || customer?.email || 'Unnamed Customer';
}

export function calculateLineTotal(lineItem) {
  return toMoneyNumber((lineItem?.quantity || 0) * (lineItem?.unit_price || 0));
}

export function calculateDraftTotals(lineItems = [], taxRate = 0, discountAmount = 0) {
  const subtotal = toMoneyNumber(
    lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0),
  );
  const taxableSubtotal = toMoneyNumber(
    lineItems
      .filter((item) => item.taxable !== false)
      .reduce((sum, item) => sum + calculateLineTotal(item), 0),
  );
  const safeTaxRate = Number.parseFloat(taxRate || 0) || 0;
  const discount = toMoneyNumber(discountAmount || 0);
  const taxAmount = toMoneyNumber(taxableSubtotal * safeTaxRate);
  const total = Math.max(0, toMoneyNumber(subtotal - discount + taxAmount));

  return {
    subtotal,
    taxableSubtotal,
    discount,
    taxRate: safeTaxRate,
    taxAmount,
    total,
  };
}

export function getInvoiceDisplayStatus(invoice, now = new Date()) {
  const status = invoice?.status || 'draft';
  if (status === 'cancelled') return 'cancelled';
  if (toMoneyNumber(invoice?.balance_due) <= 0 && toMoneyNumber(invoice?.total_amount) > 0) {
    return 'paid';
  }

  if (
    status !== 'draft' &&
    status !== 'paid' &&
    invoice?.due_at &&
    new Date(`${invoice.due_at}T23:59:59`) < now &&
    toMoneyNumber(invoice?.balance_due) > 0
  ) {
    return 'overdue';
  }

  return status;
}

export function humanizeStatus(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function buildPaymentInstructions(settings = {}) {
  const lines = [];

  if (settings.payment_instructions) {
    lines.push(settings.payment_instructions.trim());
  }
  if (settings.venmo_handle) {
    lines.push(`Venmo: ${settings.venmo_handle}`);
  }
  if (settings.cashapp_handle) {
    lines.push(`Cash App: ${settings.cashapp_handle}`);
  }
  if (settings.zelle_detail) {
    lines.push(`Zelle: ${settings.zelle_detail}`);
  }

  return lines.filter(Boolean).join('\n');
}

function asDateOnly(dateInput) {
  const date = new Date(dateInput);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getPeriodRange(periodType, year, segment) {
  const safeYear = Number.parseInt(year, 10);
  const endOfMonth = (monthIndex) => new Date(safeYear, monthIndex + 1, 0);

  if (periodType === 'quarterly') {
    const quarter = Number.parseInt(segment, 10);
    const startMonth = (quarter - 1) * 3;
    return {
      label: `Q${quarter} ${safeYear}`,
      start: new Date(safeYear, startMonth, 1),
      end: endOfMonth(startMonth + 2),
    };
  }

  if (periodType === 'semiannual') {
    const half = Number.parseInt(segment, 10);
    const startMonth = half === 2 ? 6 : 0;
    return {
      label: `H${half} ${safeYear}`,
      start: new Date(safeYear, startMonth, 1),
      end: endOfMonth(startMonth + 5),
    };
  }

  return {
    label: `${safeYear}`,
    start: new Date(safeYear, 0, 1),
    end: new Date(safeYear, 11, 31),
  };
}

function isWithinRange(dateValue, start, end) {
  if (!dateValue) return false;
  const date = asDateOnly(`${dateValue}T12:00:00`);
  return date >= asDateOnly(start) && date <= asDateOnly(end);
}

export function summarizeTaxReport({ invoices = [], payments = [], start, end }) {
  const invoicesInRange = invoices.filter((invoice) => isWithinRange(invoice.issued_at, start, end));
  const completedPayments = payments.filter(
    (payment) => payment.status === 'completed' && isWithinRange(payment.payment_date, start, end),
  );

  const grossInvoiced = invoicesInRange.reduce((sum, invoice) => sum + toMoneyNumber(invoice.total_amount), 0);
  const taxBilled = invoicesInRange.reduce((sum, invoice) => sum + toMoneyNumber(invoice.tax_amount), 0);
  const discounts = invoicesInRange.reduce((sum, invoice) => sum + toMoneyNumber(invoice.discount_amount), 0);
  const openReceivables = invoicesInRange.reduce((sum, invoice) => sum + toMoneyNumber(invoice.balance_due), 0);
  const cashReceived = completedPayments.reduce((sum, payment) => sum + toMoneyNumber(payment.amount), 0);

  const byMethod = completedPayments.reduce((acc, payment) => {
    const key = payment.payment_method || 'other';
    acc[key] = toMoneyNumber((acc[key] || 0) + toMoneyNumber(payment.amount));
    return acc;
  }, {});

  return {
    invoicesInRange,
    completedPayments,
    summary: {
      grossInvoiced: toMoneyNumber(grossInvoiced),
      taxBilled: toMoneyNumber(taxBilled),
      discounts: toMoneyNumber(discounts),
      openReceivables: toMoneyNumber(openReceivables),
      cashReceived: toMoneyNumber(cashReceived),
      invoiceCount: invoicesInRange.length,
      paymentCount: completedPayments.length,
      byMethod,
    },
  };
}

function escapeCsvValue(value) {
  const text = String(value ?? '');
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(rows = []) {
  return rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');
}

export function downloadCsv(filename, rows) {
  const csv = buildCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
