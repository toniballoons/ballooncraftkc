import { buildPaymentInstructions, formatCurrency, formatDate, humanizeStatus, toMoneyNumber } from '@/lib/billing';

export const CUSTOM_SIGNER_FIELD_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'paragraph', label: 'Long answer' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'initials', label: 'Extra initials' },
];

const CUSTOM_SIGNER_FIELD_TYPE_MAP = Object.fromEntries(
  CUSTOM_SIGNER_FIELD_TYPES.map((item) => [item.value, item.label]),
);

function createFieldId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `field-${crypto.randomUUID()}`;
  }

  return `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePackageDocument(document, index = 0) {
  const url = document?.url || document?.file_url || '';
  if (!url) return null;

  return {
    id: document?.id || `document-${index + 1}`,
    name: document?.name || document?.file_name || `Agreement Document ${index + 1}`,
    url,
    mime_type: document?.mime_type || '',
    size: Number(document?.size || 0),
    path: document?.path || '',
  };
}

export function createCustomSignerField(overrides = {}) {
  return {
    id: createFieldId(),
    label: '',
    type: 'text',
    required: true,
    placeholder: '',
    help_text: '',
    ...overrides,
  };
}

export function normalizeCustomSignerField(field = {}, index = 0) {
  const normalizedType = CUSTOM_SIGNER_FIELD_TYPE_MAP[field.type] ? field.type : 'text';

  return {
    id: field.id || `field-${index + 1}`,
    label: String(field.label || '').trim(),
    type: normalizedType,
    required: field.required !== false,
    placeholder: String(field.placeholder || '').trim(),
    help_text: String(field.help_text || '').trim(),
  };
}

export function getCustomSignerFields(source = {}) {
  const payload = source?.payload ? hydrateContractPayload(source) : { ...DEFAULT_CONTRACT_FORM, ...source };

  return Array.isArray(payload.custom_signer_fields)
    ? payload.custom_signer_fields
      .map((field, index) => normalizeCustomSignerField(field, index))
      .filter((field) => field.label)
    : [];
}

export function getPackageDocuments(source = {}) {
  const payload = source?.payload ? hydrateContractPayload(source) : { ...DEFAULT_CONTRACT_FORM, ...source };
  const normalizedDocuments = Array.isArray(payload.package_documents)
    ? payload.package_documents
      .map((document, index) => normalizePackageDocument(document, index))
      .filter(Boolean)
    : [];

  if (normalizedDocuments.length > 0) {
    return normalizedDocuments;
  }

  if (payload.template_reference_url) {
    return [
      normalizePackageDocument({
        id: 'legacy-template-reference',
        name: payload.template_reference_name || 'Uploaded Agreement Reference',
        url: payload.template_reference_url,
      }, 0),
    ].filter(Boolean);
  }

  return [];
}

export function getPackageNextSteps(source = {}) {
  const payload = source?.payload ? hydrateContractPayload(source) : { ...DEFAULT_CONTRACT_FORM, ...source };
  const customSteps = String(payload.package_next_steps || '')
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean);

  if (customSteps.length > 0) {
    return customSteps;
  }

  return [
    'Review the booking package details and attached agreement files.',
    'Sign the hosted BalloonCraft KC agreement to reserve your date.',
    'Submit the initial down payment using the approved payment method from Toni.',
    'Reply with any final questions, revisions, or venue details before production begins.',
  ];
}

export function getCustomFieldTypeLabel(type) {
  return CUSTOM_SIGNER_FIELD_TYPE_MAP[type] || 'Custom field';
}

export function getCustomFieldResponseDisplay(field, value) {
  if (field?.type === 'checkbox') {
    return value ? 'Confirmed' : 'Not confirmed';
  }

  return String(value || '—').trim() || '—';
}

export function isCustomFieldResponseFilled(field, value) {
  if (field?.type === 'checkbox') {
    return Boolean(value);
  }

  return String(value ?? '').trim().length > 0;
}

export const DEFAULT_INTAKE_CUSTOM_FIELDS = [
  createCustomSignerField({
    id: 'event-type',
    label: 'What type of event are you planning?',
    type: 'text',
    required: true,
    placeholder: 'Birthday party, baby shower, grand opening, corporate mixer...',
    help_text: 'This helps Toni shape the decor direction and scale.',
  }),
  createCustomSignerField({
    id: 'guest-count',
    label: 'How many people are you expecting at the event?',
    type: 'text',
    required: true,
    placeholder: 'Approximate guest count',
    help_text: 'A rough headcount helps size the install appropriately.',
  }),
  createCustomSignerField({
    id: 'setup-vision',
    label: 'What type of setup are you looking for?',
    type: 'paragraph',
    required: true,
    placeholder: 'Tell us about the setup, focal areas, colors, or overall mood.',
    help_text: 'Describe the main areas you want decorated and how you want the event to feel.',
  }),
  createCustomSignerField({
    id: 'balloon-types',
    label: 'What types of balloons or balloon styles are you interested in?',
    type: 'paragraph',
    required: true,
    placeholder: 'Garlands, arches, columns, ceiling balloons, jumbo balloons, custom prints...',
    help_text: 'Share styles, finishes, or specific balloon looks you want included.',
  }),
  createCustomSignerField({
    id: 'balloon-quantity',
    label: 'How many balloons or focal installs do you think you may need?',
    type: 'text',
    required: true,
    placeholder: 'One main install, two grab-and-go garlands, 150 table balloons...',
    help_text: 'An estimate is fine if you do not know exact counts yet.',
  }),
  createCustomSignerField({
    id: 'outside-rentals',
    label: 'Do you need any outside rentals or sourced pieces beyond current inventory?',
    type: 'paragraph',
    required: false,
    placeholder: 'Examples: marquee letters, lit backdrops, custom step-and-repeats, specialty props...',
    help_text: 'List any outside rentals or custom pieces you want BalloonCraft KC to help source.',
  }),
];

export const DEFAULT_CONTRACT_FORM = {
  title: 'BalloonCraft KC Custom Event Agreement',
  client_name: '',
  client_email: '',
  client_phone: '',
  event_name: '',
  event_date: '',
  event_time: '',
  event_location: '',
  setup_address: '',
  decor_description: '',
  deliverables: '',
  install_window: '',
  strike_window: '',
  venue_contact: '',
  contract_total: '',
  retainer_amount: '',
  balance_due_date: '',
  payment_terms: 'A non-refundable retainer is due at signing to reserve your event date. The remaining balance must be paid by the balance due date shown below.',
  payment_instructions: '',
  payment_methods: ['venmo', 'cashapp', 'zelle'],
  cancellation_policy: 'Retainers are non-refundable because your date and production time are reserved immediately upon signing.',
  reschedule_policy: 'One date change may be honored when scheduling allows and the new date is confirmed in writing.',
  weather_policy: 'Outdoor installs are subject to safe weather conditions. BalloonCraft KC may recommend design changes, indoor relocation, or removal when heat, wind, or precipitation would risk the installation.',
  damage_clause: 'The client is responsible for accurate venue access details, approved setup access, power needs if applicable, and keeping children or guests from climbing or handling the installation.',
  photo_release: true,
  package_intro: 'We put together your BalloonCraft KC booking package so you have every next step in one place, including your intake questions, agreement, and payment information.',
  package_next_steps: '',
  down_payment_link: '',
  down_payment_link_label: 'Submit Down Payment',
  template_reference_url: '',
  template_reference_name: '',
  package_documents: [],
  custom_signer_fields: DEFAULT_INTAKE_CUSTOM_FIELDS,
  custom_field_responses: {},
  custom_terms: '',
  event_notes: '',
  signer_message: 'Please review the agreement carefully, then sign below to confirm your event details and authorize BalloonCraft KC to reserve your date.',
};

export function createDefaultContractForm() {
  return hydrateContractPayload({ payload: DEFAULT_CONTRACT_FORM });
}

export function buildContractSigningUrl(baseUrl, token) {
  return `${String(baseUrl || '').replace(/\/$/, '')}/sign/${token}`;
}

export function hydrateContractPayload(contract = {}) {
  const payload = contract?.payload || {};
  return {
    ...DEFAULT_CONTRACT_FORM,
    ...payload,
    title: payload.title || contract.title || DEFAULT_CONTRACT_FORM.title,
    client_name: payload.client_name || contract.client_name || '',
    client_email: payload.client_email || contract.client_email || '',
    client_phone: payload.client_phone || contract.client_phone || '',
    event_name: payload.event_name || contract.event_name || '',
    event_date: payload.event_date || contract.event_date || '',
    event_time: payload.event_time || contract.event_time || '',
    event_location: payload.event_location || contract.event_location || '',
    setup_address: payload.setup_address || contract.setup_address || '',
    contract_total: payload.contract_total ?? contract.contract_total ?? '',
    retainer_amount: payload.retainer_amount ?? contract.retainer_amount ?? '',
    balance_due_date: payload.balance_due_date || contract.balance_due_date || '',
    package_intro: payload.package_intro || DEFAULT_CONTRACT_FORM.package_intro,
    package_next_steps: payload.package_next_steps || '',
    down_payment_link: payload.down_payment_link || '',
    down_payment_link_label: payload.down_payment_link_label || DEFAULT_CONTRACT_FORM.down_payment_link_label,
    template_reference_url: payload.template_reference_url || '',
    template_reference_name: payload.template_reference_name || '',
    package_documents: getPackageDocuments(payload),
    custom_signer_fields: getCustomSignerFields(payload),
    custom_field_responses: payload.custom_field_responses && typeof payload.custom_field_responses === 'object'
      ? payload.custom_field_responses
      : {},
  };
}

export function buildContractRecordFromForm(form, customerId, invoiceId = null) {
  const normalized = {
    ...DEFAULT_CONTRACT_FORM,
    ...form,
    payment_methods: form.payment_methods?.length ? form.payment_methods : DEFAULT_CONTRACT_FORM.payment_methods,
  };
  const packageDocuments = getPackageDocuments(normalized);
  const customSignerFields = getCustomSignerFields(normalized);
  const payload = {
    ...normalized,
    package_documents: packageDocuments,
    custom_signer_fields: customSignerFields,
    template_reference_url: normalized.template_reference_url || packageDocuments[0]?.url || '',
    template_reference_name: normalized.template_reference_name || packageDocuments[0]?.name || '',
  };

  return {
    customer_id: customerId,
    invoice_id: invoiceId,
    title: normalized.title,
    client_name: normalized.client_name.trim(),
    client_email: normalized.client_email.trim().toLowerCase(),
    client_phone: normalized.client_phone || null,
    event_name: normalized.event_name || null,
    event_date: normalized.event_date || null,
    event_time: normalized.event_time || null,
    event_location: normalized.event_location || null,
    setup_address: normalized.setup_address || null,
    contract_total: toMoneyNumber(normalized.contract_total),
    retainer_amount: toMoneyNumber(normalized.retainer_amount),
    balance_due_date: normalized.balance_due_date || null,
    payload,
  };
}

export function getContractBaseFilename(contract) {
  const contractNumber = contract?.contract_number || 'ballooncraft-contract';
  return String(contractNumber).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

export function buildContractSummary(contract, settings = {}) {
  const payload = hydrateContractPayload(contract);
  const total = toMoneyNumber(payload.contract_total);
  const retainer = toMoneyNumber(payload.retainer_amount);
  const balanceDue = Math.max(0, toMoneyNumber(total - retainer));

  return [
    ['Contract Number', contract.contract_number || 'Draft'],
    ['Client', payload.client_name || '—'],
    ['Email', payload.client_email || '—'],
    ['Phone', payload.client_phone || '—'],
    ['Event', payload.event_name || 'Custom Event'],
    ['Event Date', formatDate(payload.event_date)],
    ['Event Time', payload.event_time || '—'],
    ['Event Location', payload.event_location || '—'],
    ['Setup Address', payload.setup_address || payload.event_location || '—'],
    ['Contract Total', formatCurrency(total)],
    ['Retainer', formatCurrency(retainer)],
    ['Remaining Balance', formatCurrency(balanceDue)],
    ['Balance Due By', formatDate(payload.balance_due_date)],
    ['Status', humanizeStatus(contract.status || 'draft')],
    ['Business', settings.business_name || 'BalloonCraft KC'],
  ];
}

export function buildContractSections(contract, settings = {}) {
  const payload = hydrateContractPayload(contract);
  const customFields = getCustomSignerFields(payload);
  const packageDocuments = getPackageDocuments(payload);
  const paymentInstructions = payload.payment_instructions || buildPaymentInstructions(settings);
  const total = toMoneyNumber(payload.contract_total);
  const retainer = toMoneyNumber(payload.retainer_amount);
  const remainingBalance = Math.max(0, toMoneyNumber(total - retainer));
  const deliverables = payload.deliverables
    ? payload.deliverables
    : payload.decor_description
      ? `BalloonCraft KC will design, prepare, deliver, and install the following custom event work: ${payload.decor_description}`
      : 'BalloonCraft KC will provide custom balloon decor and event styling services as agreed with the client.';

  const sections = [
    {
      title: '1. Event Scope',
      paragraphs: [
        `${payload.client_name || 'The client'} is reserving BalloonCraft KC for ${payload.event_name || 'a custom event'} on ${formatDate(payload.event_date)}${payload.event_time ? ` at ${payload.event_time}` : ''}.`,
        deliverables,
        payload.event_notes || 'Any on-site changes requested after approval may require additional labor or materials and will be documented in writing whenever possible.',
      ],
    },
    {
      title: '2. Payment Terms',
      paragraphs: [
        `The total investment for this event is ${formatCurrency(total)}. A retainer of ${formatCurrency(retainer)} is due when this agreement is signed. The remaining balance of ${formatCurrency(remainingBalance)} is due by ${formatDate(payload.balance_due_date)}.`,
        payload.payment_terms,
        paymentInstructions || 'Payments are handled outside the website using the methods approved by BalloonCraft KC and listed in the event paperwork.',
      ],
    },
    {
      title: '3. Setup, Venue Access, and Strike',
      paragraphs: [
        `Setup window: ${payload.install_window || 'To be coordinated with the venue and client.'}`,
        `Strike or pickup window: ${payload.strike_window || 'To be coordinated with the client after the event.'}`,
        `Venue contact or access notes: ${payload.venue_contact || 'Client will provide day-of access details, setup permissions, and any special loading instructions before the event date.'}`,
        payload.damage_clause,
      ],
    },
    {
      title: '4. Cancellations and Rescheduling',
      paragraphs: [
        payload.cancellation_policy,
        payload.reschedule_policy,
      ],
    },
    {
      title: '5. Weather, Safety, and Performance Conditions',
      paragraphs: [
        payload.weather_policy,
        'Balloon installations are decorative works and naturally change over time depending on heat, wind, humidity, venue conditions, and guest interaction. BalloonCraft KC is not responsible for damage caused by weather, third parties, venue limitations, or unsafe handling after setup is complete.',
      ],
    },
    {
      title: '6. Images and Promotion',
      paragraphs: [
        payload.photo_release
          ? 'Unless the client requests otherwise in writing before the event, BalloonCraft KC may photograph the finished installation for portfolio, social media, and marketing use.'
          : 'BalloonCraft KC will not use photographs of this event for portfolio or marketing use unless the client later provides written permission.',
      ],
    },
  ];

  if (packageDocuments.length > 0) {
    sections.push({
      title: `${sections.length + 1}. Attached Agreement Documents`,
      paragraphs: [
        `BalloonCraft KC included ${packageDocuments.length === 1 ? '1 supporting agreement file' : `${packageDocuments.length} supporting agreement files`} with this booking package for reference and review.`,
        ...packageDocuments.map((document) => `${document.name} — ${document.url}`),
      ],
    });
  }

  if (customFields.length > 0) {
    sections.push({
      title: `${sections.length + 1}. Required Client Inputs`,
      paragraphs: [
        'The hosted BalloonCraft KC signing flow also collects the following required approvals or details before the agreement can be completed:',
        ...customFields.map((field) => `${field.label} (${getCustomFieldTypeLabel(field.type)}${field.required ? ', required' : ', optional'})${field.help_text ? ` — ${field.help_text}` : ''}`),
      ],
    });
  }

  sections.push({
    title: `${sections.length + 1}. Additional Terms`,
    paragraphs: [
      payload.custom_terms || 'Any additions, changes, or exceptions to this agreement must be approved in writing by both parties.',
    ],
  });

  sections.push({
    title: `${sections.length + 1}. Acceptance`,
    paragraphs: [
      `${payload.signer_message}`,
      'By signing, the client confirms that the event details are accurate, the payment schedule is accepted, and BalloonCraft KC may reserve the date and begin production planning.',
    ],
  });

  return sections;
}

export function buildContractAuditSummary(contract, signingHost) {
  if (!contract?.signed_at) return [];

  const payload = hydrateContractPayload(contract);
  const customFieldRows = getCustomSignerFields(payload)
    .map((field) => [field.label, getCustomFieldResponseDisplay(field, payload.custom_field_responses?.[field.id])])
    .filter(([, value]) => value !== '—');

  return [
    ['Signed By', contract.signer_name || contract.client_name || '—'],
    ['Signer Email', contract.signer_email || contract.client_email || '—'],
    ['Initials', contract.signer_initials || '—'],
    ['Signed At', new Date(contract.signed_at).toLocaleString('en-US')],
    ['Signing Host', signingHost || 'ballooncraftkc.com'],
    ['IP Address', contract.signer_ip || 'Captured by server'],
    ['User Agent', contract.signer_user_agent || 'Captured by server'],
    ...customFieldRows,
  ];
}
