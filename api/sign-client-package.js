import {
  buildSignedCompletionEmailHtml,
  createResendClient,
  createSupabaseAdminClient,
  getAdminRecipients,
  getMailFrom,
  getPrimaryAdminRecipient,
} from './_client-ops.js';
import { computeInvoiceStatus } from '../src/lib/clientOps.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, signedName, signedInitials, signedTitle, agreedToTerms, signatureFieldValues = {} } = req.body || {};

  if (!token || !signedName || !signedInitials || !agreedToTerms) {
    return res.status(400).json({ error: 'Token, signed name, initials, and agreement confirmation are required.' });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const resend = createResendClient();
    const from = getMailFrom();
    const adminRecipients = getAdminRecipients();
    const primaryAdminRecipient = getPrimaryAdminRecipient();

    const { data: packet, error: packetError } = await supabase
      .from('contract_packages')
      .select('*')
      .eq('access_token', token)
      .single();

    if (packetError || !packet) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    if (packet.signed_at) {
      return res.status(200).json({ success: true, alreadySigned: true });
    }

    const configuredFields = Array.isArray(packet.signature_fields) ? packet.signature_fields : [];
    const normalizedFieldValues = Object.fromEntries(
      Object.entries(signatureFieldValues || {}).map(([key, value]) => [key, String(value ?? '').trim()])
    );

    const missingField = configuredFields.find((field) => field.required !== false && !normalizedFieldValues[field.id]);
    if (missingField) {
      return res.status(400).json({ error: `${missingField.label || 'A required signer field'} is still required.` });
    }

    const signerIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const signedAt = new Date().toISOString();

    const { data: updatedPacket, error: signError } = await supabase
      .from('contract_packages')
      .update({
        status: 'signed',
        signed_name: signedName,
        signed_initials: signedInitials,
        signed_title: signedTitle || null,
        signature_value: signedName,
        agreed_to_terms: true,
        signature_field_values: normalizedFieldValues,
        signed_at: signedAt,
        signer_ip: Array.isArray(signerIp) ? signerIp[0] : signerIp,
        completion_email_sent: false,
        updated_at: signedAt,
      })
      .eq('id', packet.id)
      .select()
      .single();

    if (signError) throw new Error(signError.message);

    const [{ data: client, error: clientError }, { data: invoice, error: invoiceError }, { data: payments, error: paymentError }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', packet.client_id).single(),
      supabase.from('invoices').select('*').eq('id', packet.invoice_id).single(),
      supabase.from('invoice_payments').select('*').eq('invoice_id', packet.invoice_id),
    ]);

    if (clientError) throw new Error(clientError.message);
    if (invoiceError) throw new Error(invoiceError.message);
    if (paymentError) throw new Error(paymentError.message);

    const paymentSummary = computeInvoiceStatus(invoice, payments || []);
    const nextInvoiceStatus = paymentSummary.balance > 0 ? 'pending_payment' : paymentSummary.status;
    const siteUrl = (process.env.SITE_URL || 'https://www.ballooncraftkc.com').replace(/\/$/, '');
    const documentCenterUrl = `${siteUrl}/documents/sign/${packet.access_token}`;

    const { error: invoiceStatusError } = await supabase
      .from('invoices')
      .update({ status: nextInvoiceStatus, updated_at: new Date().toISOString() })
      .eq('id', invoice.id);

    if (invoiceStatusError) throw new Error(invoiceStatusError.message);

    const inboxMessage = [
      'A BalloonCraft KC document delivery was completed.',
      '',
      `Client: ${client.contact_name}`,
      client.business_name ? `Business: ${client.business_name}` : null,
      `Invoice ID: ${invoice.invoice_code}`,
      updatedPacket.package_code ? `Delivery ID: ${updatedPacket.package_code}` : null,
      invoice.event_type ? `Event Type: ${invoice.event_type}` : null,
      invoice.event_date ? `Event Date: ${invoice.event_date}` : null,
      `Signed Name: ${signedName}`,
      `Initials: ${signedInitials}`,
      signedTitle ? `Signer Title: ${signedTitle}` : null,
      `Signed At: ${signedAt}`,
      `Invoice Status: ${nextInvoiceStatus}`,
      `Balance Remaining: ${paymentSummary.balance}`,
      '',
      `Document Center: ${documentCenterUrl}`,
    ].filter(Boolean).join('\n');

    const { error: adminInboxError } = await supabase
      .from('contact_submissions')
      .insert({
        name: `${client.contact_name} signed documents`,
        email: client.email,
        phone: client.phone || null,
        event_type: invoice.event_type || 'signed_documents',
        event_date: invoice.event_date || null,
        message: inboxMessage,
        status: 'new',
      });

    if (adminInboxError) throw new Error(adminInboxError.message);

    const adminHtml = buildSignedCompletionEmailHtml({
      client,
      invoice,
      packet: updatedPacket,
      heading: 'A client signed their agreement',
      intro: `${client.contact_name} completed the official BalloonCraft KC document signing process.`,
    });
    const clientHtml = buildSignedCompletionEmailHtml({
      client,
      invoice,
      packet: updatedPacket,
      heading: 'Your agreement is complete',
      intro: 'Thank you for signing. This email is your completed copy.',
    });

    await Promise.all([
      resend.emails.send({
        from: `BalloonCraft KC <${from}>`,
        to: adminRecipients,
        replyTo: client.email,
        subject: `${client.contact_name} signed ${invoice.invoice_code}`,
        html: adminHtml,
        tags: [{ name: 'flow', value: 'contract_signed_admin' }],
      }),
      resend.emails.send({
        from: `BalloonCraft KC <${from}>`,
        to: client.email,
        replyTo: primaryAdminRecipient,
        subject: `Signed copy: ${invoice.invoice_code}`,
        html: clientHtml,
        tags: [{ name: 'flow', value: 'contract_signed_client' }],
      }),
    ]);

    await supabase
      .from('contract_packages')
      .update({
        completion_email_sent: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', packet.id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('sign-client-package error:', error);
    return res.status(500).json({ error: error.message || 'Failed to sign package.' });
  }
}
