import {
  buildContractViewModel,
  fetchContractContext,
  getBaseUrl,
} from './_contract-utils.js';
import { createSupabaseAdminClient, getRequestIp } from '../server/server-utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.query?.token;
  if (!token) {
    return res.status(400).json({ error: 'Missing token' });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured' });
  }

  try {
    const context = await fetchContractContext(supabase, { token });
    if (!context) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const { contract, settings } = context;

    if (!contract.viewed_at && contract.status !== 'signed' && contract.status !== 'cancelled') {
      await supabase
        .from('contracts')
        .update({
          viewed_at: new Date().toISOString(),
          status: contract.status === 'draft' ? 'viewed' : 'viewed',
        })
        .eq('id', contract.id);

      await supabase.rpc('create_contract_event', {
        target_contract_id: contract.id,
        target_event_type: 'viewed',
        target_ip: getRequestIp(req),
        target_user_agent: req.headers['user-agent'] || null,
        target_metadata: { via: 'public_signing_page' },
      });

      contract.viewed_at = new Date().toISOString();
      contract.status = 'viewed';
    }

    const viewModel = buildContractViewModel(contract, settings, getBaseUrl(req));

    return res.status(200).json({
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        title: contract.title,
        status: contract.status,
        client_name: contract.client_name,
        client_email: contract.client_email,
        client_phone: contract.client_phone,
        event_name: contract.event_name,
        event_date: contract.event_date,
        event_time: contract.event_time,
        event_location: contract.event_location,
        setup_address: contract.setup_address,
        signed_at: contract.signed_at,
        signer_name: contract.signer_name,
        signer_email: contract.signer_email,
        signer_initials: contract.signer_initials,
        payload: viewModel.payload,
      },
      sections: viewModel.sections,
      summaryRows: viewModel.summaryRows,
      businessName: viewModel.businessName,
      signingHost: viewModel.host,
    });
  } catch (error) {
    console.error('Contract public fetch failed:', error);
    return res.status(500).json({ error: error.message || 'Failed to load contract' });
  }
}
