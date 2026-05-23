import {
  buildClientPackageEmailHtml,
  createResendClient,
  createSupabaseAdminClient,
  getClientInvoiceTemplateBundle,
  getMailFrom,
  insertContractPackage,
  sendPackageEmail,
} from './_client-ops.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, invoiceId, templateId, packetTitle, emailStage = 'downpayment' } = req.body || {};
  if (!clientId || !invoiceId || !templateId) {
    return res.status(400).json({ error: 'clientId, invoiceId, and templateId are required.' });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const resend = createResendClient();
    const from = getMailFrom();
    const { client, invoice, template } = await getClientInvoiceTemplateBundle(supabase, {
      clientId,
      invoiceId,
      templateId,
    });

    const packet = await insertContractPackage(supabase, {
      client,
      invoice,
      template,
      packetTitle,
      emailStage,
    });

    const siteUrl = process.env.SITE_URL || 'https://www.ballooncraftkc.com';
    const accessUrl = `${siteUrl.replace(/\/$/, '')}/documents/sign/${packet.access_token}`;
    const html = buildClientPackageEmailHtml({ client, invoice, packet, accessUrl });

    await sendPackageEmail({
      resend,
      from,
      to: client.email,
      subject: packet.subject_line || 'Your BalloonCraft KC official documents are ready',
      html,
    });

    const { error: invoiceUpdateError } = await supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (invoiceUpdateError) {
      throw new Error(invoiceUpdateError.message);
    }

    return res.status(200).json({
      success: true,
      packetId: packet.id,
      packageCode: packet.package_code,
      accessUrl,
    });
  } catch (error) {
    console.error('send-client-package error:', error);
    return res.status(500).json({ error: error.message || 'Failed to send package.' });
  }
}
