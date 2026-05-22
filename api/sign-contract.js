import { Resend } from 'resend';
import {
  buildContractViewModel,
  buildSignedContractEmailHtml,
  fetchContractContext,
  generateContractDocxBuffer,
  generateContractPdfBytes,
  getBaseUrl,
  getContractAttachmentFiles,
  getContractMailRecipients,
} from './_contract-utils.js';
import {
  getCustomSignerFields,
  isCustomFieldResponseFilled,
} from '../src/lib/contracts.js';
import {
  appendTrackingPixel,
  createSupabaseAdminClient,
  createTrackedEmail,
  getRequestIp,
} from './_server-utils.js';

function normalizeCustomFieldResponses(fields, responses) {
  const responseMap = responses && typeof responses === 'object' ? responses : {};

  return fields.reduce((acc, field) => {
    const rawValue = responseMap[field.id];
    acc[field.id] = field.type === 'checkbox' ? Boolean(rawValue) : String(rawValue || '').trim();
    return acc;
  }, {});
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }

  try {
    const {
      token,
      signerName,
      signerEmail,
      signerInitials,
      signatureDataUrl,
      customFieldResponses,
    } = req.body || {};

    if (!token || !signerName || !signerEmail || !signerInitials || !signatureDataUrl) {
      return res.status(400).json({ error: 'Missing required signature fields' });
    }

    const context = await fetchContractContext(supabase, { token });
    if (!context) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (context.contract.status === 'signed') {
      return res.status(400).json({ error: 'This contract has already been signed' });
    }

    const customFields = getCustomSignerFields(context.contract.payload);
    const normalizedCustomFieldResponses = normalizeCustomFieldResponses(customFields, customFieldResponses);
    const missingRequiredField = customFields.find((field) => (
      field.required && !isCustomFieldResponseFilled(field, normalizedCustomFieldResponses[field.id])
    ));

    if (missingRequiredField) {
      return res.status(400).json({ error: `${missingRequiredField.label} is required before signing.` });
    }

    const signedAt = new Date().toISOString();
    const updatedPayload = {
      ...(context.contract.payload || {}),
      signature_completed_at: signedAt,
      custom_field_responses: {
        ...(context.contract.payload?.custom_field_responses || {}),
        ...normalizedCustomFieldResponses,
      },
    };

    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update({
        status: 'signed',
        signed_at: signedAt,
        signer_name: signerName,
        signer_email: signerEmail.toLowerCase(),
        signer_initials: signerInitials.toUpperCase(),
        signature_data_url: signatureDataUrl,
        signer_ip: getRequestIp(req),
        signer_user_agent: req.headers['user-agent'] || null,
        payload: updatedPayload,
      })
      .eq('id', context.contract.id)
      .select('*')
      .single();

    if (updateError || !updatedContract) {
      throw new Error(updateError?.message || 'Failed to update contract');
    }

    await supabase.rpc('create_contract_event', {
      target_contract_id: updatedContract.id,
      target_event_type: 'signed',
      target_ip: getRequestIp(req),
      target_user_agent: req.headers['user-agent'] || null,
      target_metadata: {
        signer_name: signerName,
        signer_email: signerEmail.toLowerCase(),
      },
    });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';
    if (!apiKey) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const resend = new Resend(apiKey);
    const baseUrl = getBaseUrl(req);
    const viewModel = buildContractViewModel(updatedContract, context.settings, baseUrl);
    const pdfBytes = await generateContractPdfBytes(viewModel);
    const docxBuffer = await generateContractDocxBuffer(viewModel);

    const tracking = await createTrackedEmail({
      supabase,
      relatedType: 'signed_contract_copy',
      relatedId: updatedContract.id,
      recipientName: updatedContract.client_name,
      recipientEmail: updatedContract.client_email,
      subject: 'Your signed BalloonCraft KC contract',
      metadata: {
        contract_number: updatedContract.contract_number,
      },
      baseUrl,
    });

    const clientHtml = appendTrackingPixel(buildSignedContractEmailHtml(viewModel), tracking.pixelUrl);

    await resend.emails.send({
      from: `BalloonCraft KC <${from}>`,
      to: updatedContract.client_email,
      subject: 'Your signed BalloonCraft KC contract',
      html: clientHtml,
      attachments: getContractAttachmentFiles(viewModel, docxBuffer, pdfBytes).slice(1),
      tags: [
        { name: 'flow', value: 'signed_contract_copy' },
      ],
    });

    await resend.emails.send({
      from: `BalloonCraft KC <${from}>`,
      to: getContractMailRecipients(),
      subject: `Signed contract received from ${updatedContract.client_name}`,
      html: buildSignedContractEmailHtml(viewModel),
      attachments: getContractAttachmentFiles(viewModel, docxBuffer, pdfBytes).slice(1),
      tags: [
        { name: 'flow', value: 'signed_contract_admin_copy' },
      ],
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sign contract failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to sign contract' });
  }
}
