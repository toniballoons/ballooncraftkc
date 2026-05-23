import { createSupabaseAdminClient } from './_client-ops.js';
import { computeInvoiceStatus } from '../src/lib/clientOps.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.query?.token;
  if (!token) {
    return res.status(400).json({ error: 'Missing secure document token.' });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: packet, error: packetError } = await supabase
      .from('contract_packages')
      .select('*')
      .eq('access_token', token)
      .single();

    if (packetError || !packet) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    const [{ data: client, error: clientError }, { data: invoice, error: invoiceError }, { data: payments, error: paymentError }] = await Promise.all([
      supabase.from('clients').select('*').eq('id', packet.client_id).single(),
      supabase.from('invoices').select('*').eq('id', packet.invoice_id).single(),
      supabase.from('invoice_payments').select('*').eq('invoice_id', packet.invoice_id).order('paid_at', { ascending: false }),
    ]);

    if (clientError) throw new Error(clientError.message);
    if (invoiceError) throw new Error(invoiceError.message);
    if (paymentError) throw new Error(paymentError.message);

    if (!packet.viewed_at) {
      await supabase
        .from('contract_packages')
        .update({
          viewed_at: new Date().toISOString(),
          status: packet.status === 'sent' ? 'viewed' : packet.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', packet.id);
    }

    const summary = computeInvoiceStatus(invoice, payments || []);

    return res.status(200).json({
      packet: {
        id: packet.id,
        packageCode: packet.package_code,
        packetTitle: packet.packet_title,
        status: packet.status,
        recipientName: packet.recipient_name,
        recipientEmail: packet.recipient_email,
        documentTitle: packet.document_title,
        documentIntro: packet.document_intro,
        documentBody: packet.document_body,
        documentClosing: packet.document_closing,
        mergedFields: packet.merged_fields || {},
        paymentLinks: packet.payment_links || {},
        paymentInstructions: packet.payment_instructions || '',
        uploadedDocuments: packet.uploaded_documents || [],
        signatureFields: packet.signature_fields || [],
        signatureFieldValues: packet.signature_field_values || {},
        signedName: packet.signed_name,
        signedInitials: packet.signed_initials,
        signedTitle: packet.signed_title,
        signedAt: packet.signed_at,
        agreedToTerms: packet.agreed_to_terms,
      },
      client: {
        contactName: client.contact_name,
        businessName: client.business_name,
        email: client.email,
      },
      invoice: {
        invoiceCode: invoice.invoice_code,
        invoiceTitle: invoice.invoice_title,
        eventType: invoice.event_type,
        eventDate: invoice.event_date,
        eventLocation: invoice.event_location,
        contractAmount: invoice.contract_amount,
        downPaymentAmount: invoice.down_payment_amount,
        downPaymentDueDate: invoice.down_payment_due_date,
        finalPaymentAmount: invoice.final_payment_amount,
        finalPaymentDueDate: invoice.final_payment_due_date,
        serviceSummary: invoice.service_summary,
        paymentInstructions: invoice.payment_instructions,
        additionalTerms: invoice.additional_terms,
        totalPaid: summary.paid,
        balanceDue: summary.balance,
        status: summary.status,
      },
      payments: (payments || []).map((payment) => ({
        transactionCode: payment.transaction_code,
        confirmationCode: payment.confirmation_code,
        amount: payment.amount,
        method: payment.payment_method,
        paidAt: payment.paid_at,
      })),
    });
  } catch (error) {
    console.error('client-package error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load package.' });
  }
}
