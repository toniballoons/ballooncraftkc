import {
  buildContractViewModel,
  fetchContractContext,
  generateContractDocxBuffer,
  generateContractPdfBytes,
  getBaseUrl,
  getContractResponseFilename,
} from './_contract-utils.js';
import { requireAdminUser } from './_server-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { supabase } = await requireAdminUser(req);
    const contractId = req.query?.contractId;
    const format = req.query?.format === 'docx' ? 'docx' : 'pdf';

    if (!contractId) {
      return res.status(400).json({ error: 'Missing contractId' });
    }

    const context = await fetchContractContext(supabase, { contractId });
    if (!context) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const viewModel = buildContractViewModel(context.contract, context.settings, getBaseUrl(req));
    const bytes = format === 'docx'
      ? await generateContractDocxBuffer(viewModel)
      : await generateContractPdfBytes(viewModel);

    res.setHeader(
      'Content-Type',
      format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${getContractResponseFilename(context.contract, format)}"`);
    return res.status(200).send(Buffer.from(bytes));
  } catch (error) {
    console.error('Contract file generation failed:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Failed to generate file' });
  }
}
