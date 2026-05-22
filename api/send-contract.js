import { Resend } from 'resend';
import {
  buildContractInviteEmailHtml,
  buildContractViewModel,
  fetchContractContext,
  generateContractDocxBuffer,
  generateContractPdfBytes,
  getBaseUrl,
  getContractAttachmentFiles,
  getPackageDocumentAttachments,
} from './_contract-utils.js';
import {
  appendTrackingPixel,
  createTrackedEmail,
  requireAdminUser,
  getRequestIp,
} from '../server/server-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await requireAdminUser(req);
    const { contractId } = req.body || {};

    if (!contractId) {
      return res.status(400).json({ error: 'Missing contractId' });
    }

    const context = await fetchContractContext(supabase, { contractId });
    if (!context) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';
    if (!apiKey) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const resend = new Resend(apiKey);
    const baseUrl = getBaseUrl(req);
    const viewModel = buildContractViewModel(context.contract, context.settings, baseUrl);
    const docxBuffer = await generateContractDocxBuffer(viewModel);
    const pdfBytes = await generateContractPdfBytes(viewModel);

    const tracking = await createTrackedEmail({
      supabase,
      relatedType: 'contract_invite',
      relatedId: context.contract.id,
      recipientName: context.contract.client_name,
      recipientEmail: context.contract.client_email,
      subject: 'Your BalloonCraft KC booking package is ready',
      metadata: {
        contract_number: context.contract.contract_number,
        event_name: context.contract.event_name,
        package_documents: viewModel.packageDocuments.length,
      },
      baseUrl,
    });

    const html = appendTrackingPixel(buildContractInviteEmailHtml(viewModel), tracking.pixelUrl);
    const packageAttachments = await getPackageDocumentAttachments(viewModel);

    await resend.emails.send({
      from: `BalloonCraft KC <${from}>`,
      to: context.contract.client_email,
      subject: 'Your BalloonCraft KC booking package is ready',
      html,
      attachments: [
        ...getContractAttachmentFiles(viewModel, docxBuffer, pdfBytes),
        ...packageAttachments,
      ],
      tags: [
        { name: 'flow', value: 'contract_invite' },
      ],
    });

    await supabase
      .from('contracts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', context.contract.id);

    await supabase.rpc('create_contract_event', {
      target_contract_id: context.contract.id,
      target_event_type: context.contract.sent_at ? 'resent' : 'sent',
      target_ip: getRequestIp(req),
      target_user_agent: req.headers['user-agent'] || null,
      target_metadata: {
        recipient: context.contract.client_email,
      },
    });

    return res.status(200).json({
      success: true,
      signingUrl: viewModel.signingUrl,
    });
  } catch (error) {
    console.error('Send contract failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to send contract' });
  }
}
