import {
  buildPaymentReceiptEmailHtml,
  createPaymentRecord,
  createResendClient,
  createSupabaseAdminClient,
  getMailFrom,
  updateInvoiceStatusFromPayments,
} from './_client-ops.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId, amount, paymentMethod, sourceReference, note, paidAt, recordedBy, sendReceipt = true } = req.body || {};
  if (!invoiceId || !amount) {
    return res.status(400).json({ error: 'invoiceId and amount are required.' });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const from = getMailFrom();

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', invoice.client_id)
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const payment = await createPaymentRecord(supabase, invoice, {
      amount,
      paymentMethod,
      sourceReference,
      note,
      paidAt,
      recordedBy,
    });

    const { data: allPayments, error: allPaymentsError } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoice.id);

    if (allPaymentsError) throw new Error(allPaymentsError.message);
    const status = await updateInvoiceStatusFromPayments(supabase, invoice, allPayments || [payment]);

    let receiptSent = false;
    if (sendReceipt && client.email) {
      const resend = createResendClient();
      const html = buildPaymentReceiptEmailHtml({ client, invoice, payment });
      await resend.emails.send({
        from: `BalloonCraft KC <${from}>`,
        to: client.email,
        subject: `Payment received for ${invoice.invoice_code}`,
        html,
        tags: [{ name: 'flow', value: 'invoice_payment_receipt' }],
      });
      receiptSent = true;

      await supabase
        .from('invoice_payments')
        .update({ email_receipt_sent: true })
        .eq('id', payment.id);
    }

    return res.status(200).json({
      success: true,
      payment,
      invoiceStatus: status,
      receiptSent,
    });
  } catch (error) {
    console.error('record-invoice-payment error:', error);
    return res.status(500).json({ error: error.message || 'Failed to record payment.' });
  }
}
