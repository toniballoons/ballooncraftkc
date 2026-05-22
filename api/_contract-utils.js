import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  buildContractAuditSummary,
  buildContractSections,
  buildContractSigningUrl,
  buildContractSummary,
  getCustomSignerFields,
  getContractBaseFilename,
  getPackageDocuments,
  getPackageNextSteps,
  hydrateContractPayload,
} from '../src/lib/contracts.js';
import { formatCurrency, formatDate, humanizeStatus, toMoneyNumber } from '../src/lib/billing.js';
import { FALLBACK_CONTACT_EMAIL_TO, getBaseUrl, getAdminInboxRecipients } from './_server-utils.js';

const ACCENT = 'C0266D';
const ACCENT_RGB = rgb(0.75, 0.15, 0.43);
const TEXT_RGB = rgb(0.13, 0.14, 0.18);
const MUTED_RGB = rgb(0.4, 0.43, 0.5);

function paragraphFromText(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.after ?? 160, line: 320 },
    children: [
      new TextRun({
        text: text || '',
        bold: options.bold || false,
        color: options.color || '222222',
        size: options.size || 22,
      }),
    ],
  });
}

function summaryTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        new TableCell({
          width: { size: 32, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          shading: { fill: 'FAF5F8' },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'E7D4DE' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E7D4DE' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'E7D4DE' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'E7D4DE' },
          },
          children: [paragraphFromText(label, { bold: true, color: '5F3A4E', size: 20, after: 0 })],
        }),
        new TableCell({
          width: { size: 68, type: WidthType.PERCENTAGE },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'E7D4DE' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E7D4DE' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'E7D4DE' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'E7D4DE' },
          },
          children: [paragraphFromText(value, { size: 20, after: 0 })],
        }),
      ],
    })),
  });
}

function wrapText(text, font, size, maxWidth) {
  const paragraphs = String(text || '').split('\n');
  const output = [];

  paragraphs.forEach((paragraph) => {
    if (!paragraph.trim()) {
      output.push('');
      return;
    }

    const words = paragraph.split(/\s+/);
    let line = '';

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) output.push(line);
        line = word;
      }
    });

    if (line) output.push(line);
    output.push('');
  });

  while (output.length > 0 && output[output.length - 1] === '') {
    output.pop();
  }

  return output;
}

function createPdfWriter(pdfDoc, contractNumber) {
  let page = pdfDoc.addPage([612, 792]);
  let y = 742;
  const marginX = 54;
  const contentWidth = 612 - marginX * 2;

  const decoratePage = () => {
    page.drawLine({
      start: { x: marginX, y: 770 },
      end: { x: 612 - marginX, y: 770 },
      thickness: 2,
      color: ACCENT_RGB,
    });
    page.drawText(contractNumber, {
      x: marginX,
      y: 22,
      size: 9,
      color: MUTED_RGB,
    });
    page.drawText('BalloonCraft KC', {
      x: 612 - marginX - 90,
      y: 22,
      size: 9,
      color: MUTED_RGB,
    });
  };

  decoratePage();

  return {
    get page() {
      return page;
    },
    get y() {
      return y;
    },
    set y(nextY) {
      y = nextY;
    },
    marginX,
    contentWidth,
    addPage() {
      page = pdfDoc.addPage([612, 792]);
      y = 742;
      decoratePage();
    },
    ensureSpace(height = 30) {
      if (y - height < 70) {
        this.addPage();
      }
    },
  };
}

function drawWrappedParagraph(writer, font, text, size = 11, color = TEXT_RGB, extraGap = 6) {
  const lines = wrapText(text, font, size, writer.contentWidth);
  const lineHeight = size * 1.45;

  writer.ensureSpace(lines.length * lineHeight + extraGap + 10);
  lines.forEach((line) => {
    if (!line) {
      writer.y -= lineHeight * 0.55;
      return;
    }

    writer.page.drawText(line, {
      x: writer.marginX,
      y: writer.y,
      size,
      color,
      font,
    });
    writer.y -= lineHeight;
  });
  writer.y -= extraGap;
}

function drawSummaryBlock(writer, fontBold, fontRegular, rows) {
  rows.forEach(([label, value]) => {
    writer.ensureSpace(26);
    writer.page.drawText(`${label}:`, {
      x: writer.marginX,
      y: writer.y,
      size: 10.5,
      font: fontBold,
      color: MUTED_RGB,
    });
    writer.page.drawText(String(value || '—'), {
      x: writer.marginX + 150,
      y: writer.y,
      size: 10.5,
      font: fontRegular,
      color: TEXT_RGB,
    });
    writer.y -= 18;
  });
  writer.y -= 8;
}

export async function fetchCurrentBillingSettings(supabase) {
  const { data, error } = await supabase
    .from('billing_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data || {};
}

export async function fetchContractContext(supabase, { contractId = null, token = null }) {
  let query = supabase.from('contracts').select('*');
  query = contractId ? query.eq('id', contractId) : query.eq('signing_token', token);

  const { data: contract, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!contract) return null;

  const [settings, customer, events] = await Promise.all([
    fetchCurrentBillingSettings(supabase),
    supabase.from('customers').select('*').eq('id', contract.customer_id).maybeSingle(),
    supabase.from('contract_events').select('*').eq('contract_id', contract.id).order('occurred_at', { ascending: false }),
  ]);

  if (customer.error) throw new Error(customer.error.message);
  if (events.error) throw new Error(events.error.message);

  return {
    contract,
    settings,
    customer: customer.data || null,
    events: events.data || [],
  };
}

export function buildContractViewModel(contract, settings, baseUrl) {
  const payload = hydrateContractPayload(contract);
  const summaryRows = buildContractSummary(contract, settings);
  const sections = buildContractSections(contract, settings);
  const signingUrl = buildContractSigningUrl(baseUrl, contract.signing_token);
  const packageDocuments = getPackageDocuments(payload);
  const packageNextSteps = getPackageNextSteps(payload);
  const customSignerFields = getCustomSignerFields(payload);
  const host = (() => {
    try {
      return new URL(baseUrl).host;
    } catch (_error) {
      return 'ballooncraftkc.com';
    }
  })();

  return {
    baseUrl,
    host,
    contract,
    payload,
    settings,
    sections,
    summaryRows,
    signingUrl,
    packageDocuments,
    packageNextSteps,
    customSignerFields,
    auditRows: buildContractAuditSummary(contract, host),
    businessName: settings.business_name || 'BalloonCraft KC',
    businessEmail: settings.business_email || process.env.CONTACT_EMAIL_FROM || FALLBACK_CONTACT_EMAIL_TO,
    businessPhone: settings.business_phone || '',
    businessAddress: settings.business_address || '',
  };
}

function inferFileNameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname.split('/').pop() || 'agreement-file';
    return decodeURIComponent(pathname);
  } catch (_error) {
    return 'agreement-file';
  }
}

function inferMimeTypeFromFileName(fileName) {
  const normalized = String(fileName || '').toLowerCase();
  if (normalized.endsWith('.pdf')) return 'application/pdf';
  if (normalized.endsWith('.doc')) return 'application/msword';
  if (normalized.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (normalized.endsWith('.txt')) return 'text/plain';
  if (normalized.endsWith('.rtf')) return 'application/rtf';
  if (normalized.endsWith('.jpg') || normalized.endsWith('.jpeg')) return 'image/jpeg';
  if (normalized.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

export async function getPackageDocumentAttachments(viewModel) {
  const attachments = [];

  await Promise.allSettled(
    viewModel.packageDocuments.map(async (document) => {
      const response = await fetch(document.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${document.url}: ${response.status}`);
      }

      const fileName = document.name || inferFileNameFromUrl(document.url);
      const arrayBuffer = await response.arrayBuffer();
      attachments.push({
        filename: fileName,
        content: Buffer.from(arrayBuffer).toString('base64'),
        contentType: document.mime_type || response.headers.get('content-type') || inferMimeTypeFromFileName(fileName),
      });
    }),
  );

  return attachments;
}

export async function generateContractDocxBuffer(viewModel) {
  const sectionParagraphs = [];

  viewModel.sections.forEach((section) => {
    sectionParagraphs.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({ text: section.title, bold: true, color: ACCENT, size: 28 }),
      ],
    }));
    section.paragraphs.forEach((paragraph) => {
      sectionParagraphs.push(paragraphFromText(paragraph, { size: 21 }));
    });
  });

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'BalloonCraft KC',
                bold: true,
                color: ACCENT,
                size: 36,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: viewModel.contract.title,
                bold: true,
                size: 30,
                color: '222222',
              }),
            ],
          }),
          paragraphFromText(`Contract Number: ${viewModel.contract.contract_number}`, { bold: true, color: '4B5563' }),
          paragraphFromText(`Status: ${humanizeStatus(viewModel.contract.status || 'draft')}`, { color: '4B5563' }),
          summaryTable(viewModel.summaryRows.slice(0, 12)),
          ...sectionParagraphs,
          new Paragraph({
            spacing: { before: 320, after: 120 },
            children: [
              new TextRun({ text: 'Client Signature', bold: true, color: ACCENT, size: 24 }),
            ],
          }),
          paragraphFromText(viewModel.contract.signed_at
            ? `${viewModel.contract.signer_name || viewModel.contract.client_name} signed electronically on ${new Date(viewModel.contract.signed_at).toLocaleString('en-US')}.`
            : 'Signature will be captured electronically through the hosted BalloonCraft KC signing link.'),
          ...(
            viewModel.auditRows.length > 0
              ? [
                new Paragraph({ children: [new PageBreak()] }),
                new Paragraph({
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 160 },
                  children: [
                    new TextRun({ text: 'Signing Record', bold: true, color: ACCENT, size: 28 }),
                  ],
                }),
                summaryTable(viewModel.auditRows),
              ]
              : []
          ),
        ],
      },
    ],
  });

  return Packer.toBuffer(document);
}

export async function generateContractPdfBytes(viewModel, { includeAuditPage = true } = {}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const writer = createPdfWriter(pdfDoc, viewModel.contract.contract_number);

  writer.page.drawText('BalloonCraft KC', {
    x: writer.marginX,
    y: writer.y,
    size: 20,
    font: fontBold,
    color: ACCENT_RGB,
  });
  writer.y -= 26;
  writer.page.drawText(viewModel.contract.title, {
    x: writer.marginX,
    y: writer.y,
    size: 18,
    font: fontBold,
    color: TEXT_RGB,
  });
  writer.y -= 30;

  drawSummaryBlock(writer, fontBold, fontRegular, viewModel.summaryRows.slice(0, 12));

  viewModel.sections.forEach((section) => {
    writer.ensureSpace(50);
    writer.page.drawText(section.title, {
      x: writer.marginX,
      y: writer.y,
      size: 13,
      font: fontBold,
      color: ACCENT_RGB,
    });
    writer.y -= 22;
    section.paragraphs.forEach((paragraph) => drawWrappedParagraph(writer, fontRegular, paragraph));
    writer.y -= 6;
  });

  writer.ensureSpace(120);
  writer.page.drawText('Client Signature', {
    x: writer.marginX,
    y: writer.y,
    size: 13,
    font: fontBold,
    color: ACCENT_RGB,
  });
  writer.y -= 24;

  if (viewModel.contract.signature_data_url) {
    try {
      const signatureBytes = Buffer.from(viewModel.contract.signature_data_url.split(',')[1] || '', 'base64');
      const signatureImage = viewModel.contract.signature_data_url.includes('image/jpeg')
        ? await pdfDoc.embedJpg(signatureBytes)
        : await pdfDoc.embedPng(signatureBytes);
      writer.page.drawImage(signatureImage, {
        x: writer.marginX,
        y: writer.y - 34,
        width: 180,
        height: 54,
      });
      writer.y -= 62;
    } catch (error) {
      console.warn('Failed to embed signature image in PDF:', error);
    }
  } else {
    writer.page.drawLine({
      start: { x: writer.marginX, y: writer.y },
      end: { x: writer.marginX + 220, y: writer.y },
      thickness: 1,
      color: MUTED_RGB,
    });
    writer.y -= 18;
  }

  drawWrappedParagraph(
    writer,
    fontRegular,
    viewModel.contract.signed_at
      ? `${viewModel.contract.signer_name || viewModel.contract.client_name} electronically signed on ${new Date(viewModel.contract.signed_at).toLocaleString('en-US')}.`
      : `Unsigned copy. Hosted signing link: ${viewModel.signingUrl}`,
    10.5,
    MUTED_RGB,
  );

  if (includeAuditPage && viewModel.auditRows.length > 0) {
    writer.addPage();
    writer.page.drawText('Signing Record', {
      x: writer.marginX,
      y: writer.y,
      size: 18,
      font: fontBold,
      color: ACCENT_RGB,
    });
    writer.y -= 28;
    drawSummaryBlock(writer, fontBold, fontRegular, viewModel.auditRows);
  }

  return pdfDoc.save();
}

export function buildContractInviteEmailHtml(viewModel) {
  const packageDocumentsMarkup = viewModel.packageDocuments.length > 0
    ? `
      <div style="margin:18px 0 0;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">Included Documents</p>
        <ul style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.8;">
          ${viewModel.packageDocuments.map((document) => (
            `<li><a href="${document.url}" style="color:#db2777;">${document.name}</a></li>`
          )).join('')}
        </ul>
      </div>
    `
    : '';
  const nextStepsMarkup = viewModel.packageNextSteps.length > 0
    ? `
      <div style="margin:24px 0;padding:18px 20px;border:1px solid #f3d4e4;border-radius:18px;background:#fffdf7;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">What Happens Next</p>
        <ol style="margin:0;padding-left:18px;color:#374151;font-size:14px;line-height:1.8;">
          ${viewModel.packageNextSteps.map((step) => `<li>${step}</li>`).join('')}
        </ol>
      </div>
    `
    : '';
  const downPaymentButtonMarkup = viewModel.payload.down_payment_link
    ? `
      <div style="margin:0 0 18px;text-align:center;">
        <a href="${viewModel.payload.down_payment_link}" style="display:inline-block;background:#ec4899;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:700;">${viewModel.payload.down_payment_link_label || 'Submit Down Payment'}</a>
      </div>
    `
    : '';
  const packageIntro = viewModel.payload.package_intro || 'We prepared your BalloonCraft KC booking package so you can move forward with booking, agreements, and payment in one place.';

  return `
    <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#ec4899 0%,#f59e0b 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">BalloonCraft KC</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">Your Booking Package Is Ready</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;opacity:0.96;">Review your agreement, complete the hosted signing steps, and move forward with booking from one BalloonCraft KC package.</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${viewModel.contract.client_name || 'there'},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">${packageIntro}</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">We prepared your BalloonCraft KC agreement for <strong>${viewModel.payload.event_name || 'your event'}</strong>. We attached editable and PDF copies of the contract for your records, and you can complete everything online using the secure link below.</p>
          <div style="margin:24px 0;padding:18px 20px;border:1px solid #f3d4e4;border-radius:18px;background:#fff8fb;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">Event Snapshot</p>
            <p style="margin:0;font-size:14px;line-height:1.8;color:#374151;">
              Contract number: ${viewModel.contract.contract_number}<br />
              Event date: ${formatDate(viewModel.payload.event_date)}<br />
              Event location: ${viewModel.payload.event_location || 'To be confirmed'}<br />
              Contract total: ${formatCurrency(viewModel.contract.contract_total)}<br />
              Initial down payment: ${formatCurrency(viewModel.contract.retainer_amount)}
            </p>
          </div>
          ${packageDocumentsMarkup}
          ${nextStepsMarkup}
          <div style="margin:24px 0 18px;text-align:center;">
            <a href="${viewModel.signingUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700;">Review and Sign on ${viewModel.host}</a>
          </div>
          ${downPaymentButtonMarkup}
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">If you prefer, you can also paste this signing link into your browser:<br /><a href="${viewModel.signingUrl}" style="color:#db2777;">${viewModel.signingUrl}</a></p>
          <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">Payment instructions: ${viewModel.payload.payment_instructions || 'Use the approved payment method Toni shared with you for the initial down payment and any remaining balance.'}</p>
          <p style="margin:0;font-size:15px;line-height:1.7;">Thank you,<br /><strong>${viewModel.businessName}</strong></p>
          <p style="margin:18px 0 0;font-size:12px;line-height:1.7;color:#6b7280;">
            Newsletter preferences: <a href="${viewModel.baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(viewModel.contract.client_email)}" style="color:#db2777;">manage newsletter emails here</a>.
            This link only affects newsletter-style emails and will not stop contract, payment, or event emails that still require action.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function buildSignedContractEmailHtml(viewModel) {
  return `
    <div style="margin:0;padding:24px;background:#fff7fb;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #f3d4e4;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(219,39,119,0.08);">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#ec4899 0%,#f59e0b 100%);color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.92;">BalloonCraft KC</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">Signed Contract Attached</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;opacity:0.96;">Your signed agreement is complete and attached for easy reference.</p>
        </div>
        <div style="padding:28px 32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Hi ${viewModel.contract.client_name || 'there'},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Your BalloonCraft KC agreement has been signed and attached as a PDF. We also sent a copy to our team so everyone stays aligned on the event details.</p>
          <div style="margin:24px 0;padding:18px 20px;border:1px solid #f3d4e4;border-radius:18px;background:#fff8fb;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#be185d;">Signing Details</p>
            <p style="margin:0;font-size:14px;line-height:1.8;color:#374151;">
              Contract number: ${viewModel.contract.contract_number}<br />
              Signed by: ${viewModel.contract.signer_name || viewModel.contract.client_name}<br />
              Signed at: ${viewModel.contract.signed_at ? new Date(viewModel.contract.signed_at).toLocaleString('en-US') : '—'}<br />
              Event date: ${formatDate(viewModel.payload.event_date)}
            </p>
          </div>
          <p style="margin:0;font-size:15px;line-height:1.7;">Thank you,<br /><strong>${viewModel.businessName}</strong></p>
          <p style="margin:18px 0 0;font-size:12px;line-height:1.7;color:#6b7280;">
            Newsletter preferences: <a href="${viewModel.baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(viewModel.contract.client_email)}" style="color:#db2777;">manage newsletter emails here</a>.
            This will not stop signed-contract copies, payment notices, or other event-specific emails.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function getContractAttachmentFiles(viewModel, docxBuffer, pdfBytes) {
  const baseName = getContractBaseFilename(viewModel.contract);
  return [
    {
      filename: `${baseName}.docx`,
      content: Buffer.from(docxBuffer).toString('base64'),
    },
    {
      filename: `${baseName}.pdf`,
      content: Buffer.from(pdfBytes).toString('base64'),
    },
  ];
}

export function getContractResponseFilename(contract, format) {
  return `${getContractBaseFilename(contract)}.${format === 'docx' ? 'docx' : 'pdf'}`;
}

export function getContractMailRecipients() {
  return getAdminInboxRecipients();
}

export { getBaseUrl };
