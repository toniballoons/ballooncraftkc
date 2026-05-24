import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BarChart3,
  BadgeDollarSign,
  BriefcaseBusiness,
  ClipboardSignature,
  Copy,
  Download,
  ExternalLink,
  FileUp,
  MailCheck,
  Pencil,
  ReceiptText,
  Send,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import * as ClientRecord from '@/entities/ClientRecord';
import * as Invoice from '@/entities/Invoice';
import * as InvoicePayment from '@/entities/InvoicePayment';
import * as ContractTemplate from '@/entities/ContractTemplate';
import * as ContractPackage from '@/entities/ContractPackage';
import { useAuth } from '@/lib/AuthContext';
import {
  CONTRACT_PLACEHOLDERS,
  DEFAULT_CONTRACT_TEMPLATE,
  GENERATED_DOCUMENT_TARGET,
  SIGNATURE_FIELD_TYPES,
  SIGNATURE_PREFILL_OPTIONS,
  buildMergedFields,
  computeInvoiceStatus,
  formatDate,
  formatMoney,
  getDocumentTargetOptions,
  makeClientCode,
  makeDocumentAssetId,
  makeInvoiceCode,
  makeSignerFieldId,
  makeTemplateCode,
  mergeTemplateText,
  normalizeSignatureFields,
  normalizeUploadedDocuments,
  parseMoney,
  renderTextSections,
} from '@/lib/clientOps';
import { uploadFile } from '@/lib/uploadFile';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const CLIENT_STATUSES = ['lead', 'quoted', 'booked', 'active', 'completed'];
const INVOICE_STATUSES = ['draft', 'sent', 'viewed', 'pending_payment', 'partially_paid', 'deposit_paid', 'paid'];
const PAYMENT_METHODS = ['venmo', 'cash_app', 'zelle', 'cash', 'check', 'bank_transfer', 'other'];
const CLIENT_STUDIO_TABS = ['overview', 'clients', 'invoices', 'contracts', 'packages', 'payments', 'reports'];
const PACKAGE_STATUSES = {
  sent: 'bg-slate-900 text-white',
  viewed: 'bg-sky-600 text-white',
  signed: 'bg-emerald-600 text-white',
};

const emptyClientForm = {
  client_code: '',
  status: 'lead',
  contact_name: '',
  business_name: '',
  email: '',
  phone: '',
  event_type: '',
  event_date: '',
  venue_name: '',
  venue_address: '',
  guest_count: '',
  notes: '',
};

const emptyInvoiceForm = {
  invoice_code: '',
  client_id: '',
  status: 'draft',
  invoice_title: '',
  event_type: '',
  event_date: '',
  event_location: '',
  service_summary: '',
  contract_amount: '',
  down_payment_amount: '',
  down_payment_due_date: '',
  final_payment_amount: '',
  final_payment_due_date: '',
  payment_instructions: '',
  additional_terms: '',
  venmo_link: '',
  cash_app_link: '',
  zelle_link: '',
  other_payment_link: '',
};

const emptyTemplateForm = {
  template_code: '',
  status: 'active',
  name: '',
  description: '',
  subject_line: '',
  intro_text: '',
  document_title: '',
  body_text: '',
  closing_text: '',
  uploaded_documents: [],
  signature_fields: [],
};

const emptyPackageForm = {
  clientId: '',
  invoiceId: '',
  templateId: '',
  packetTitle: '',
  emailStage: 'downpayment',
};

const emptyPaymentForm = {
  invoiceId: '',
  amount: '',
  paymentMethod: 'venmo',
  sourceReference: '',
  note: '',
  paidAt: new Date().toISOString().slice(0, 10),
  sendReceipt: true,
};
const TEMPLATE_EDITOR_FIELDS = ['subject_line', 'document_title', 'intro_text', 'body_text', 'closing_text'];

function serializeCsvValue(value) {
  const normalized = value == null
    ? ''
    : Array.isArray(value)
      ? value.join(', ')
      : String(value);

  return `"${normalized.replace(/"/g, '""')}"`;
}

function downloadCsvFile(filename, rows) {
  if (typeof window === 'undefined' || !rows.length) return false;

  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set()));

  const csv = [
    headers.map(serializeCsvValue).join(','),
    ...rows.map((row) => headers.map((header) => serializeCsvValue(row[header])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
}

function SetupRequired({ error }) {
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="py-8 space-y-3">
        <h2 className="font-display text-2xl text-amber-950">BalloonCraft KC Signature Center needs one database migration</h2>
        <p className="text-sm text-amber-900 leading-6">
          The UI is wired, but the new invoicing and agreement tables are not available in this environment yet.
          Run the latest client migrations in Supabase, including <code>009_client_operations.sql</code> and <code>011_contract_document_fields.sql</code>, then refresh this page.
        </p>
        {error ? <p className="text-xs text-amber-800">{error.message}</p> : null}
      </CardContent>
    </Card>
  );
}

function OverviewCard({ icon: Icon, title, value, detail }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-sm text-muted-foreground mt-1">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ icon: Icon, title, detail, actionLabel, onAction }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
        <Button variant="outline" className="w-full justify-center" onClick={onAction}>
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ value, variantMap = {} }) {
  const className = variantMap[value] || 'bg-muted text-foreground';
  return <Badge className={className}>{value.replace(/_/g, ' ')}</Badge>;
}

function PaymentLinksSummary({ invoice }) {
  const links = [
    ['Venmo', invoice.payment_links?.venmo],
    ['Cash App', invoice.payment_links?.cash_app],
    ['Zelle', invoice.payment_links?.zelle],
    ['Other', invoice.payment_links?.other],
  ].filter(([, value]) => value);

  if (!links.length) {
    return <p className="text-sm text-muted-foreground">No payment links attached yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([label, url]) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold hover:bg-muted"
        >
          {label}
          <ExternalLink className="w-3 h-3" />
        </a>
      ))}
    </div>
  );
}

function DocumentPreview({ template, client, invoice, packetTitle }) {
  if (!template || !client || !invoice) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
        Choose a client, invoice, and agreement template to preview the BalloonCraft KC delivery before sending it.
      </div>
    );
  }

  const mergedFields = buildMergedFields({ client, invoice });
  const intro = mergeTemplateText(template.intro_text || '', mergedFields);
  const title = mergeTemplateText(template.document_title || '', mergedFields);
  const body = mergeTemplateText(template.body_text || '', mergedFields);
  const closing = mergeTemplateText(template.closing_text || '', mergedFields);
  const uploadedDocuments = normalizeUploadedDocuments(template.uploaded_documents || []);
  const signatureFields = normalizeSignatureFields(template.signature_fields || [], uploadedDocuments);

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          {packetTitle || `${client.contact_name} BalloonCraft KC document delivery`}
        </p>
        <h3 className="font-display text-2xl">{title}</h3>
      </div>

      {renderTextSections(intro).map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}

      {renderTextSections(body).map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7 whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}

      {renderTextSections(closing).map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}

      <div className="rounded-2xl border bg-primary/5 p-4 space-y-3">
        <p className="text-sm font-semibold">BalloonCraft KC Signature Center flow</p>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <p><strong>1.</strong> BalloonCraft KC sends the official document delivery by secure link.</p>
          <p><strong>2.</strong> Your client reviews the generated agreement and every uploaded file you attached here.</p>
          <p><strong>3.</strong> Your configured sign, initial, date, and text checkpoints appear in the hosted signing page.</p>
          <p><strong>4.</strong> After completion, the signed record and finished copy are emailed back automatically.</p>
        </div>
      </div>

      {signatureFields.length > 0 ? (
        <div className="rounded-2xl border bg-primary/5 p-4 space-y-2">
          <p className="text-sm font-semibold">Configured client checkpoints</p>
          <div className="flex flex-wrap gap-2">
            {signatureFields.map((field) => {
              const targetLabel = field.target_document_id === GENERATED_DOCUMENT_TARGET
                ? 'Generated agreement'
                : uploadedDocuments.find((document) => document.id === field.target_document_id)?.name || 'Uploaded document';

              return (
                <span key={field.id} className="rounded-full border bg-white px-3 py-1 text-xs">
                  {field.label} • {field.type} • {targetLabel}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {uploadedDocuments.length > 0 ? (
        <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">Uploaded documents included in this delivery</p>
          {uploadedDocuments.map((document) => (
            <div key={document.id} className="rounded-2xl border bg-white px-4 py-3">
              <p className="font-medium">{document.name}</p>
              {document.description ? <p className="text-sm text-muted-foreground mt-1">{document.description}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ClientStudio({ embedded = false, initialTab = 'overview', onNavigateTab }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(CLIENT_STUDIO_TABS.includes(initialTab) ? initialTab : 'overview');

  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [editingClientId, setEditingClientId] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [uploadingTemplateDocument, setUploadingTemplateDocument] = useState(false);
  const [activeTemplateField, setActiveTemplateField] = useState('body_text');
  const [selectedPlaceholderKey, setSelectedPlaceholderKey] = useState('client_name');

  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

  useEffect(() => {
    setActiveTab(CLIENT_STUDIO_TABS.includes(initialTab) ? initialTab : 'overview');
  }, [initialTab]);

  const queryOptions = { initialData: [], retry: false };

  const clientsQuery = useQuery({
    queryKey: ['admin-clients'],
    queryFn: () => ClientRecord.list('-created_at'),
    ...queryOptions,
  });

  const invoicesQuery = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: () => Invoice.list('-created_at'),
    ...queryOptions,
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin-invoice-payments'],
    queryFn: () => InvoicePayment.list('-paid_at'),
    ...queryOptions,
  });

  const templatesQuery = useQuery({
    queryKey: ['admin-contract-templates'],
    queryFn: () => ContractTemplate.list('-updated_at'),
    ...queryOptions,
  });

  const packagesQuery = useQuery({
    queryKey: ['admin-contract-packages'],
    queryFn: () => ContractPackage.list('-created_at'),
    ...queryOptions,
  });

  const setupError = clientsQuery.error || invoicesQuery.error || paymentsQuery.error || templatesQuery.error || packagesQuery.error;

  const clients = clientsQuery.data || [];
  const invoices = invoicesQuery.data || [];
  const payments = paymentsQuery.data || [];
  const templates = templatesQuery.data || [];
  const packages = packagesQuery.data || [];

  const invoiceSummaries = useMemo(() => {
    const result = {};
    invoices.forEach((invoice) => {
      result[invoice.id] = computeInvoiceStatus(invoice, payments);
    });
    return result;
  }, [invoices, payments]);

  const invoicesByClient = useMemo(() => {
    return invoices.filter((invoice) => !packageForm.clientId || invoice.client_id === packageForm.clientId);
  }, [invoices, packageForm.clientId]);

  const selectedPackageClient = clients.find((client) => client.id === packageForm.clientId);
  const selectedPackageInvoice = invoices.find((invoice) => invoice.id === packageForm.invoiceId);
  const selectedPackageTemplate = templates.find((template) => template.id === packageForm.templateId);
  const totalCollected = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const outstandingInvoices = invoices.filter((invoice) => (invoiceSummaries[invoice.id]?.balance ?? 0) > 0).length;
  const openedDeliveries = packages.filter((packet) => Boolean(packet.viewed_at) && !packet.signed_at).length;
  const signedDeliveries = packages.filter((packet) => Boolean(packet.signed_at) || packet.status === 'signed').length;

  const clientReportRows = useMemo(() => clients.map((client) => ({
    client_code: client.client_code,
    status: client.status,
    contact_name: client.contact_name,
    business_name: client.business_name || '',
    email: client.email || '',
    phone: client.phone || '',
    event_type: client.event_type || '',
    event_date: client.event_date || '',
    venue_name: client.venue_name || '',
    guest_count: client.guest_count ?? '',
    created_at: client.created_at || '',
  })), [clients]);

  const invoiceReportRows = useMemo(() => invoices.map((invoice) => {
    const client = clients.find((item) => item.id === invoice.client_id);
    const summary = invoiceSummaries[invoice.id] || computeInvoiceStatus(invoice, payments);

    return {
      invoice_code: invoice.invoice_code,
      invoice_title: invoice.invoice_title,
      client_name: client?.contact_name || '',
      client_email: client?.email || '',
      event_type: invoice.event_type || '',
      event_date: invoice.event_date || '',
      status: summary.status,
      contract_amount: Number(invoice.contract_amount || 0).toFixed(2),
      balance_remaining: Number(summary.balance || 0).toFixed(2),
      sent_at: invoice.sent_at || '',
      created_at: invoice.created_at || '',
    };
  }), [clients, invoiceSummaries, invoices, payments]);

  const paymentReportRows = useMemo(() => payments.map((payment) => {
    const invoice = invoices.find((item) => item.id === payment.invoice_id);
    const client = clients.find((item) => item.id === invoice?.client_id);

    return {
      transaction_code: payment.transaction_code,
      confirmation_code: payment.confirmation_code,
      client_name: client?.contact_name || '',
      client_email: client?.email || '',
      invoice_code: invoice?.invoice_code || '',
      invoice_title: invoice?.invoice_title || '',
      amount: Number(payment.amount || 0).toFixed(2),
      payment_method: payment.payment_method || '',
      paid_at: payment.paid_at || '',
      receipt_sent: payment.email_receipt_sent ? 'yes' : 'no',
      source_reference: payment.source_reference || '',
    };
  }), [clients, invoices, payments]);

  const deliveryReportRows = useMemo(() => packages.map((packet) => ({
    package_code: packet.package_code,
    packet_title: packet.packet_title,
    recipient_name: packet.recipient_name || '',
    recipient_email: packet.recipient_email || '',
    status: packet.status || '',
    viewed_at: packet.viewed_at || '',
    signed_at: packet.signed_at || '',
    created_at: packet.created_at || '',
  })), [packages]);

  const handleClientStudioTabChange = (nextTab) => {
    setActiveTab(nextTab);
    onNavigateTab?.(nextTab);
  };

  const placeholderGroups = useMemo(() => CONTRACT_PLACEHOLDERS.reduce((groups, field) => {
    const group = field.group || 'Template fields';
    if (!groups[group]) groups[group] = [];
    groups[group].push(field);
    return groups;
  }, {}), []);
  const placeholderOptions = useMemo(() => CONTRACT_PLACEHOLDERS.map((field) => ({
    value: field.key,
    label: `${field.group}: ${field.label}`,
  })), []);

  const handleExport = (filename, rows, label) => {
    if (!rows.length) {
      toast.info(`No ${label.toLowerCase()} records are available to export yet.`);
      return;
    }

    downloadCsvFile(filename, rows);
    toast.success(`${label} export downloaded.`);
  };

  const insertTemplatePlaceholder = async (placeholderKey = selectedPlaceholderKey) => {
    const token = `{{${placeholderKey}}}`;

    if (!activeTemplateField || !TEMPLATE_EDITOR_FIELDS.includes(activeTemplateField)) {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(token);
        toast.success('Placeholder copied.');
      }
      return;
    }

    setTemplateForm((current) => {
      const existingValue = current[activeTemplateField] || '';
      const prefix = existingValue && !existingValue.endsWith(' ') && !existingValue.endsWith('\n') ? ' ' : '';

      return {
        ...current,
        [activeTemplateField]: `${existingValue}${prefix}${token}`,
      };
    });

    const activeFieldLabel = CONTRACT_PLACEHOLDERS.find((field) => field.key === placeholderKey)?.label || 'Placeholder';
    toast.success(`${activeFieldLabel} inserted into ${activeTemplateField.replace(/_/g, ' ')}.`);
  };

  const clientMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...clientForm,
        guest_count: clientForm.guest_count ? Number.parseInt(clientForm.guest_count, 10) : null,
        updated_at: new Date().toISOString(),
      };

      if (editingClientId) {
        return ClientRecord.update(editingClientId, payload);
      }

      return ClientRecord.create({
        ...payload,
        client_code: makeClientCode(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      toast.success(editingClientId ? 'Client updated.' : 'Client created.');
      setClientForm(emptyClientForm);
      setEditingClientId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const invoiceMutation = useMutation({
    mutationFn: async () => {
      const payment_links = {
        venmo: invoiceForm.venmo_link || null,
        cash_app: invoiceForm.cash_app_link || null,
        zelle: invoiceForm.zelle_link || null,
        other: invoiceForm.other_payment_link || null,
      };

      const contractAmount = parseMoney(invoiceForm.contract_amount);
      const downPaymentAmount = parseMoney(invoiceForm.down_payment_amount);
      const finalPaymentAmount = invoiceForm.final_payment_amount
        ? parseMoney(invoiceForm.final_payment_amount)
        : Math.max(contractAmount - downPaymentAmount, 0);

      const payload = {
        client_id: invoiceForm.client_id,
        status: invoiceForm.status,
        invoice_title: invoiceForm.invoice_title,
        event_type: invoiceForm.event_type || null,
        event_date: invoiceForm.event_date || null,
        event_location: invoiceForm.event_location || null,
        service_summary: invoiceForm.service_summary || null,
        contract_amount: contractAmount,
        down_payment_amount: downPaymentAmount,
        down_payment_due_date: invoiceForm.down_payment_due_date || null,
        final_payment_amount: finalPaymentAmount,
        final_payment_due_date: invoiceForm.final_payment_due_date || null,
        payment_links,
        payment_instructions: invoiceForm.payment_instructions || null,
        additional_terms: invoiceForm.additional_terms || null,
        updated_at: new Date().toISOString(),
      };

      if (editingInvoiceId) {
        return Invoice.update(editingInvoiceId, payload);
      }

      return Invoice.create({
        ...payload,
        invoice_code: makeInvoiceCode(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success(editingInvoiceId ? 'Invoice updated.' : 'Invoice created.');
      setInvoiceForm(emptyInvoiceForm);
      setEditingInvoiceId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const templateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...templateForm,
        uploaded_documents: normalizeUploadedDocuments(templateForm.uploaded_documents || []),
        signature_fields: normalizeSignatureFields(templateForm.signature_fields || [], templateForm.uploaded_documents || []),
        updated_at: new Date().toISOString(),
      };

      if (editingTemplateId) {
        return ContractTemplate.update(editingTemplateId, payload);
      }

      return ContractTemplate.create({
        ...payload,
        template_code: makeTemplateCode(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contract-templates'] });
      toast.success(editingTemplateId ? 'Agreement template updated.' : 'Agreement template created.');
      setTemplateForm(emptyTemplateForm);
      setEditingTemplateId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const sendPackageMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/send-client-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packageForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send delivery.');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contract-packages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success(`Delivery sent. Secure link: ${data.packageCode}`);
      setPackageForm((current) => ({ ...current, packetTitle: '' }));
    },
    onError: (error) => toast.error(error.message),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/record-invoice-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: paymentForm.invoiceId,
          amount: paymentForm.amount,
          paymentMethod: paymentForm.paymentMethod,
          sourceReference: paymentForm.sourceReference,
          note: paymentForm.note,
          paidAt: paymentForm.paidAt ? new Date(`${paymentForm.paidAt}T12:00:00`).toISOString() : undefined,
          recordedBy: user?.email || null,
          sendReceipt: paymentForm.sendReceipt,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to record payment.');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoice-payments'] });
      toast.success(`Payment recorded. Confirmation code: ${data.payment.confirmation_code}`);
      setPaymentForm(emptyPaymentForm);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleEditClient = (client) => {
    setEditingClientId(client.id);
    setClientForm({
      client_code: client.client_code,
      status: client.status,
      contact_name: client.contact_name || '',
      business_name: client.business_name || '',
      email: client.email || '',
      phone: client.phone || '',
      event_type: client.event_type || '',
      event_date: client.event_date || '',
      venue_name: client.venue_name || '',
      venue_address: client.venue_address || '',
      guest_count: client.guest_count ? String(client.guest_count) : '',
      notes: client.notes || '',
    });
  };

  const handleEditInvoice = (invoice) => {
    setEditingInvoiceId(invoice.id);
    setInvoiceForm({
      invoice_code: invoice.invoice_code,
      client_id: invoice.client_id,
      status: invoice.status,
      invoice_title: invoice.invoice_title || '',
      event_type: invoice.event_type || '',
      event_date: invoice.event_date || '',
      event_location: invoice.event_location || '',
      service_summary: invoice.service_summary || '',
      contract_amount: String(invoice.contract_amount ?? ''),
      down_payment_amount: String(invoice.down_payment_amount ?? ''),
      down_payment_due_date: invoice.down_payment_due_date || '',
      final_payment_amount: String(invoice.final_payment_amount ?? ''),
      final_payment_due_date: invoice.final_payment_due_date || '',
      payment_instructions: invoice.payment_instructions || '',
      additional_terms: invoice.additional_terms || '',
      venmo_link: invoice.payment_links?.venmo || '',
      cash_app_link: invoice.payment_links?.cash_app || '',
      zelle_link: invoice.payment_links?.zelle || '',
      other_payment_link: invoice.payment_links?.other || '',
    });
  };

  const handleEditTemplate = (template) => {
    setEditingTemplateId(template.id);
    setTemplateForm({
      template_code: template.template_code,
      status: template.status,
      name: template.name || '',
      description: template.description || '',
      subject_line: template.subject_line || '',
      intro_text: template.intro_text || '',
      document_title: template.document_title || '',
      body_text: template.body_text || '',
      closing_text: template.closing_text || '',
      uploaded_documents: normalizeUploadedDocuments(template.uploaded_documents || []),
      signature_fields: normalizeSignatureFields(template.signature_fields || [], template.uploaded_documents || []),
    });
  };

  const updateTemplateDocument = (documentId, changes) => {
    setTemplateForm((current) => ({
      ...current,
      uploaded_documents: normalizeUploadedDocuments(current.uploaded_documents || []).map((document) => (
        document.id === documentId ? { ...document, ...changes } : document
      )),
    }));
  };

  const removeTemplateDocument = (documentId) => {
    setTemplateForm((current) => {
      const uploaded_documents = normalizeUploadedDocuments(current.uploaded_documents || [])
        .filter((document) => document.id !== documentId);
      const signature_fields = normalizeSignatureFields(current.signature_fields || [], uploaded_documents)
        .filter((field) => field.target_document_id !== documentId);

      return {
        ...current,
        uploaded_documents,
        signature_fields,
      };
    });
  };

  const handleTemplateDocumentUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploadingTemplateDocument(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await uploadFile(file);
        uploaded.push({
          id: makeDocumentAssetId(),
          name: file.name,
          file_url,
          file_type: file.type || '',
          description: '',
        });
      }

      setTemplateForm((current) => ({
        ...current,
        uploaded_documents: [
          ...normalizeUploadedDocuments(current.uploaded_documents || []),
          ...uploaded,
        ],
      }));

      toast.success(`${uploaded.length} document${uploaded.length === 1 ? '' : 's'} uploaded.`);
    } catch (error) {
      toast.error(error.message || 'Failed to upload document.');
    } finally {
      setUploadingTemplateDocument(false);
      event.target.value = '';
    }
  };

  const addTemplateSignerField = () => {
    const uploadedDocuments = normalizeUploadedDocuments(templateForm.uploaded_documents || []);
    const defaultTarget = uploadedDocuments[0]?.id || GENERATED_DOCUMENT_TARGET;

    setTemplateForm((current) => ({
      ...current,
      signature_fields: [
        ...normalizeSignatureFields(current.signature_fields || [], current.uploaded_documents || []),
        {
          id: makeSignerFieldId(),
          target_document_id: defaultTarget,
          type: 'signature',
          label: 'Client signature',
          required: true,
          placeholder: '',
          help_text: '',
          page_hint: '',
          anchor_hint: '',
          prefill_key: '',
        },
      ],
    }));
  };

  const updateTemplateSignerField = (fieldId, changes) => {
    setTemplateForm((current) => ({
      ...current,
      signature_fields: normalizeSignatureFields(current.signature_fields || [], current.uploaded_documents || []).map((field) => (
        field.id === fieldId ? { ...field, ...changes } : field
      )),
    }));
  };

  const removeTemplateSignerField = (fieldId) => {
    setTemplateForm((current) => ({
      ...current,
      signature_fields: normalizeSignatureFields(current.signature_fields || [], current.uploaded_documents || [])
        .filter((field) => field.id !== fieldId),
    }));
  };

  const selectedPaymentInvoice = invoices.find((invoice) => invoice.id === paymentForm.invoiceId);

  if (setupError) {
    return <SetupRequired error={setupError} />;
  }

  return (
    <div className="space-y-8">
      {embedded ? (
        <div className="rounded-2xl border bg-primary/5 px-4 py-4 text-sm">
          <p className="font-semibold text-primary">BalloonCraft KC Signature Center inside CMS</p>
          <p className="text-muted-foreground mt-1">
            Register clients, build invoices, place signing checkpoints, send official BalloonCraft KC document deliveries, and track every completed copy from this CMS workspace.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => handleClientStudioTabChange('packages')}>
              Send client delivery
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleClientStudioTabChange('reports')}>
              Open reports
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl">BalloonCraft KC Signature Center</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              Register clients, create invoices with deposit and final-payment schedules, build BalloonCraft KC agreement templates,
              and send polished secure document deliveries for review, signing, and payment from one admin workspace.
            </p>
          </div>
          <div className="rounded-2xl border bg-primary/5 px-4 py-3 text-sm">
            <p className="font-semibold text-primary">BalloonCraft KC-owned signing flow</p>
            <p className="text-muted-foreground">BalloonCraft KC sends the delivery, captures every required checkpoint, and auto-emails the completed copy back after signature.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <OverviewCard icon={BriefcaseBusiness} title="Clients" value={clients.length} detail="Lead and booking records" />
        <OverviewCard icon={ReceiptText} title="Invoices" value={invoices.length} detail="Custom event proposals and balances" />
        <OverviewCard icon={Wallet} title="Payments" value={payments.length} detail="Recorded receipts and confirmations" />
        <OverviewCard icon={ClipboardSignature} title="Templates" value={templates.length} detail="Reusable signature-ready agreements" />
        <OverviewCard icon={MailCheck} title="Deliveries" value={packages.length} detail="Sent, opened, and signed document deliveries" />
      </div>

      <Tabs value={activeTab} onValueChange={handleClientStudioTabChange} className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contracts">Agreement Builder</TabsTrigger>
          <TabsTrigger value="packages">Deliveries</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <QuickActionCard
              icon={BriefcaseBusiness}
              title="Register client"
              detail="Create the client record first so their event details and contact info stay tied to every invoice and document."
              actionLabel="Open client records"
              onAction={() => handleClientStudioTabChange('clients')}
            />
            <QuickActionCard
              icon={ReceiptText}
              title="Create invoice"
              detail="Build the custom event invoice with the contract amount, deposit amount, final payment date, and payment links."
              actionLabel="Open invoices"
              onAction={() => handleClientStudioTabChange('invoices')}
            />
            <QuickActionCard
              icon={ClipboardSignature}
              title="Build agreement"
              detail="Write the BalloonCraft KC agreement, upload supporting documents, and mark where the client signs, initials, dates, or types."
              actionLabel="Open agreement builder"
              onAction={() => handleClientStudioTabChange('contracts')}
            />
            <QuickActionCard
              icon={MailCheck}
              title="Send official delivery"
              detail="Package the invoice and documents into BalloonCraft KC’s secure signing link, then email it directly to the client."
              actionLabel="Open deliveries"
              onAction={() => handleClientStudioTabChange('packages')}
            />
            <QuickActionCard
              icon={Wallet}
              title="Record payment"
              detail="Track deposits, final payments, transaction IDs, and confirmation codes after Toni confirms payment outside the site."
              actionLabel="Open payments"
              onAction={() => handleClientStudioTabChange('payments')}
            />
            <QuickActionCard
              icon={BarChart3}
              title="Download reports"
              detail="Export client, invoice, payment, and delivery reports so the business always has a clean operations record."
              actionLabel="Open reports"
              onAction={() => handleClientStudioTabChange('reports')}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle>BalloonCraft KC client workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-2xl border bg-primary/5 p-4 space-y-3">
                  <p className="font-semibold text-primary">How to send a complete BalloonCraft KC client package</p>
                  <div className="grid gap-2 text-muted-foreground">
                    <p><strong>Step 1:</strong> Register the client and save their event details.</p>
                    <p><strong>Step 2:</strong> Create the invoice with deposit and final-payment amounts.</p>
                    <p><strong>Step 3:</strong> Build the agreement and upload any addendums or support files.</p>
                    <p><strong>Step 4:</strong> Mark every signature, initial, date, or text checkpoint the client must complete.</p>
                    <p><strong>Step 5:</strong> Send the official BalloonCraft KC delivery link for review, signing, and payment follow-through.</p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Open invoices</p>
                    <p className="text-2xl font-bold mt-2">{outstandingInvoices}</p>
                    <p className="text-muted-foreground mt-1">Invoices still carrying a remaining balance.</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Signed deliveries</p>
                    <p className="text-2xl font-bold mt-2">{signedDeliveries}</p>
                    <p className="text-muted-foreground mt-1">Completed document deliveries returned through the Signature Center.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What clients receive</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                  <p className="font-semibold">Official BalloonCraft KC delivery email</p>
                  <p className="text-muted-foreground">
                    The client gets a branded email that opens BalloonCraft KC’s secure document center instead of a generic third-party signing page.
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                  <p className="font-semibold">Hosted signing center</p>
                  <p className="text-muted-foreground">
                    They can review the invoice, generated agreement, uploaded documents, payment instructions, required checkpoints, and final signature all from one link.
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                  <p className="font-semibold">Completed copy returned automatically</p>
                  <p className="text-muted-foreground">
                    Once signed, BalloonCraft KC stores the completion record and emails the finished copy back to the client.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleClientStudioTabChange('packages')}>
                    Start a delivery
                  </Button>
                  <Button variant="outline" onClick={() => handleClientStudioTabChange('contracts')}>
                    Configure document fields
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>{editingClientId ? 'Edit client record' : 'Register a new client'}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Contact name</Label>
                <Input value={clientForm.contact_name} onChange={(event) => setClientForm({ ...clientForm, contact_name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Business name</Label>
                <Input value={clientForm.business_name} onChange={(event) => setClientForm({ ...clientForm, business_name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={clientForm.phone} onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={clientForm.status} onValueChange={(value) => setClientForm({ ...clientForm, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLIENT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Event type</Label>
                <Input value={clientForm.event_type} onChange={(event) => setClientForm({ ...clientForm, event_type: event.target.value })} placeholder="Wedding, corporate, grand opening..." />
              </div>
              <div className="space-y-2">
                <Label>Event date</Label>
                <Input type="date" value={clientForm.event_date} onChange={(event) => setClientForm({ ...clientForm, event_date: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Guest count</Label>
                <Input type="number" value={clientForm.guest_count} onChange={(event) => setClientForm({ ...clientForm, guest_count: event.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Venue name</Label>
                <Input value={clientForm.venue_name} onChange={(event) => setClientForm({ ...clientForm, venue_name: event.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Venue address</Label>
                <Input value={clientForm.venue_address} onChange={(event) => setClientForm({ ...clientForm, venue_address: event.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={5} value={clientForm.notes} onChange={(event) => setClientForm({ ...clientForm, notes: event.target.value })} placeholder="Vision, logistics, referral source, follow-up notes..." />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button onClick={() => clientMutation.mutate()} disabled={clientMutation.isPending || !clientForm.contact_name || !clientForm.email}>
                  {clientMutation.isPending ? 'Saving...' : editingClientId ? 'Update client' : 'Create client'}
                </Button>
                <Button variant="outline" onClick={() => { setClientForm(emptyClientForm); setEditingClientId(null); }}>
                  Reset form
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No client records yet.</p>
              ) : clients.map((client) => (
                <div key={client.id} className="rounded-2xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{client.contact_name}</p>
                        <StatusBadge value={client.status} />
                      </div>
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">{client.client_code}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEditClient(client)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{client.business_name || 'No business name added'}</p>
                    <p>{client.email}</p>
                    <p>{client.event_type || 'Event type not set'} • {client.event_date ? formatDate(client.event_date) : 'No date yet'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>{editingInvoiceId ? 'Edit invoice' : 'Create invoice and payment plan'}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Client</Label>
                <Select value={invoiceForm.client_id} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, client_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Choose a client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.contact_name}{client.business_name ? ` — ${client.business_name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Invoice title</Label>
                <Input value={invoiceForm.invoice_title} onChange={(event) => setInvoiceForm({ ...invoiceForm, invoice_title: event.target.value })} placeholder="Grand opening balloon install" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={invoiceForm.status} onValueChange={(value) => setInvoiceForm({ ...invoiceForm, status: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Event type</Label>
                <Input value={invoiceForm.event_type} onChange={(event) => setInvoiceForm({ ...invoiceForm, event_type: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Event date</Label>
                <Input type="date" value={invoiceForm.event_date} onChange={(event) => setInvoiceForm({ ...invoiceForm, event_date: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Event location</Label>
                <Input value={invoiceForm.event_location} onChange={(event) => setInvoiceForm({ ...invoiceForm, event_location: event.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Service summary</Label>
                <Textarea rows={4} value={invoiceForm.service_summary} onChange={(event) => setInvoiceForm({ ...invoiceForm, service_summary: event.target.value })} placeholder="Organic garland for entry, 2 jumbo clusters, branded photo backdrop..." />
              </div>
              <div className="space-y-2">
                <Label>Contract amount</Label>
                <Input type="number" min="0" step="0.01" value={invoiceForm.contract_amount} onChange={(event) => setInvoiceForm({ ...invoiceForm, contract_amount: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Down payment amount</Label>
                <Input type="number" min="0" step="0.01" value={invoiceForm.down_payment_amount} onChange={(event) => setInvoiceForm({ ...invoiceForm, down_payment_amount: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Down payment due date</Label>
                <Input type="date" value={invoiceForm.down_payment_due_date} onChange={(event) => setInvoiceForm({ ...invoiceForm, down_payment_due_date: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Final payment due date</Label>
                <Input type="date" value={invoiceForm.final_payment_due_date} onChange={(event) => setInvoiceForm({ ...invoiceForm, final_payment_due_date: event.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Final payment amount</Label>
                <Input type="number" min="0" step="0.01" value={invoiceForm.final_payment_amount} onChange={(event) => setInvoiceForm({ ...invoiceForm, final_payment_amount: event.target.value })} placeholder="Leave blank to auto-calculate total minus deposit" />
              </div>
              <div className="space-y-2">
                <Label>Venmo link</Label>
                <Input value={invoiceForm.venmo_link} onChange={(event) => setInvoiceForm({ ...invoiceForm, venmo_link: event.target.value })} placeholder="https://venmo.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Cash App link</Label>
                <Input value={invoiceForm.cash_app_link} onChange={(event) => setInvoiceForm({ ...invoiceForm, cash_app_link: event.target.value })} placeholder="https://cash.app/$..." />
              </div>
              <div className="space-y-2">
                <Label>Zelle instructions</Label>
                <Input value={invoiceForm.zelle_link} onChange={(event) => setInvoiceForm({ ...invoiceForm, zelle_link: event.target.value })} placeholder="Email, phone, or custom Zelle note" />
              </div>
              <div className="space-y-2">
                <Label>Other payment link</Label>
                <Input value={invoiceForm.other_payment_link} onChange={(event) => setInvoiceForm({ ...invoiceForm, other_payment_link: event.target.value })} placeholder="Private portal or bank link" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Payment instructions</Label>
                <Textarea rows={4} value={invoiceForm.payment_instructions} onChange={(event) => setInvoiceForm({ ...invoiceForm, payment_instructions: event.target.value })} placeholder="Tell the client how to pay, what memo line to use, and who to notify after payment." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Additional invoice terms</Label>
                <Textarea rows={4} value={invoiceForm.additional_terms} onChange={(event) => setInvoiceForm({ ...invoiceForm, additional_terms: event.target.value })} placeholder="Rush fees, rental return terms, venue timing notes..." />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <Button onClick={() => invoiceMutation.mutate()} disabled={invoiceMutation.isPending || !invoiceForm.client_id || !invoiceForm.invoice_title}>
                  {invoiceMutation.isPending ? 'Saving...' : editingInvoiceId ? 'Update invoice' : 'Create invoice'}
                </Button>
                <Button variant="outline" onClick={() => { setInvoiceForm(emptyInvoiceForm); setEditingInvoiceId(null); }}>
                  Reset form
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices created yet.</p>
              ) : invoices.map((invoice) => {
                const client = clients.find((item) => item.id === invoice.client_id);
                const summary = invoiceSummaries[invoice.id] || computeInvoiceStatus(invoice, payments);

                return (
                  <div key={invoice.id} className="rounded-2xl border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{invoice.invoice_title}</p>
                          <StatusBadge value={summary.status} />
                        </div>
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">{invoice.invoice_code}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleEditInvoice(invoice)}>
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{client?.contact_name || 'Unknown client'}</p>
                      <p>{formatMoney(invoice.contract_amount)} total • {formatMoney(summary.balance)} remaining</p>
                      <p>{invoice.event_date ? formatDate(invoice.event_date) : 'No event date set'} • {invoice.event_location || 'Location pending'}</p>
                    </div>
                    <PaymentLinksSummary invoice={invoice} />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>{editingTemplateId ? 'Edit signature template' : 'Build a BalloonCraft KC signature template'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-semibold">How BalloonCraft KC document signing works</p>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p><strong>Step 1:</strong> Write the agreement text BalloonCraft KC wants generated for every delivery.</p>
                  <p><strong>Step 2:</strong> Upload any supporting files, addendums, rental sheets, or custom contracts that should travel with it.</p>
                  <p><strong>Step 3:</strong> Add a signer field for every place your client should sign, initial, date, or type a response.</p>
                  <p><strong>Step 4:</strong> Use the page and placement hints to tell the client exactly where that checkpoint belongs on the original file.</p>
                  <p><strong>Step 5:</strong> Send the secure delivery and let BalloonCraft KC collect and return the finished signed copy.</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/40 p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Simple smart fields</p>
                  <p className="text-xs text-muted-foreground">
                    Choose a saved client or invoice detail below and insert it into the template section you are currently editing. Right now, inserts go into
                    <span className="font-semibold text-foreground"> {activeTemplateField.replace(/_/g, ' ')}</span>.
                  </p>
                </div>
                <div className="rounded-2xl border bg-white p-4 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[1.2fr_auto]">
                    <div className="space-y-2">
                      <Label>Choose a saved field to insert</Label>
                      <Select value={selectedPlaceholderKey} onValueChange={setSelectedPlaceholderKey}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {placeholderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" className="w-full lg:w-auto" onClick={() => insertTemplatePlaceholder()}>
                        Insert selected field
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    BalloonCraft KC stores the technical code for you automatically. Toni does not need to type placeholder syntax by hand.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {Object.entries(placeholderGroups).map(([groupName, fields]) => (
                    <div key={groupName} className="rounded-2xl border bg-white p-4 space-y-3">
                      <p className="text-sm font-semibold">{groupName}</p>
                      <div className="space-y-2">
                        {fields.map((field) => (
                          <div key={field.key} className="rounded-2xl border px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="block text-sm font-semibold">{field.label}</span>
                                <span className="mt-1 block text-xs text-muted-foreground">{field.help}</span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPlaceholderKey(field.key);
                                  insertTemplatePlaceholder(field.key);
                                }}
                              >
                                Use field
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Template name</Label>
                  <Input value={templateForm.name} onChange={(event) => setTemplateForm({ ...templateForm, name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={templateForm.status} onValueChange={(value) => setTemplateForm({ ...templateForm, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="archived">archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={3} value={templateForm.description} onChange={(event) => setTemplateForm({ ...templateForm, description: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fallback subject line</Label>
                <Input
                  value={templateForm.subject_line}
                  onFocus={() => setActiveTemplateField('subject_line')}
                  onChange={(event) => setTemplateForm({ ...templateForm, subject_line: event.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Downpayment and final-payment invoice emails use automatic BalloonCraft KC subject lines. This stays available as a fallback for future non-invoice delivery sends.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Document title</Label>
                <Input
                  value={templateForm.document_title}
                  onFocus={() => setActiveTemplateField('document_title')}
                  onChange={(event) => setTemplateForm({ ...templateForm, document_title: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Intro text</Label>
                <Textarea
                  rows={4}
                  value={templateForm.intro_text}
                  onFocus={() => setActiveTemplateField('intro_text')}
                  onChange={(event) => setTemplateForm({ ...templateForm, intro_text: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Agreement body</Label>
                <Textarea
                  rows={14}
                  value={templateForm.body_text}
                  onFocus={() => setActiveTemplateField('body_text')}
                  onChange={(event) => setTemplateForm({ ...templateForm, body_text: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Closing text</Label>
                <Textarea
                  rows={4}
                  value={templateForm.closing_text}
                  onFocus={() => setActiveTemplateField('closing_text')}
                  onChange={(event) => setTemplateForm({ ...templateForm, closing_text: event.target.value })}
                />
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Uploaded documents</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add PDFs, Word docs, or images that should travel with this official document delivery.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-muted">
                    <FileUp className="w-4 h-4" />
                    {uploadingTemplateDocument ? 'Uploading…' : 'Upload documents'}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                      multiple
                      className="hidden"
                      onChange={handleTemplateDocumentUpload}
                      disabled={uploadingTemplateDocument}
                    />
                  </label>
                </div>

                {normalizeUploadedDocuments(templateForm.uploaded_documents || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No uploaded documents attached to this template yet.</p>
                ) : (
                  <div className="space-y-3">
                    {normalizeUploadedDocuments(templateForm.uploaded_documents || []).map((document) => (
                      <div key={document.id} className="rounded-2xl border bg-white p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold break-words">{document.name}</p>
                            <a href={document.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">
                              {document.file_url}
                            </a>
                          </div>
                          <Button size="icon" variant="outline" onClick={() => removeTemplateDocument(document.id)} aria-label={`Remove ${document.name}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label>Document description</Label>
                          <Textarea
                            rows={2}
                            value={document.description || ''}
                            onChange={(event) => updateTemplateDocument(document.id, { description: event.target.value })}
                            placeholder="Explain what this file is and what the client should review before signing."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Signer field configuration</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add sign, initial, date, or text checkpoints for the generated agreement or any uploaded document in this delivery.
                    </p>
                  </div>
                  <Button variant="outline" onClick={addTemplateSignerField}>
                    <ClipboardSignature className="w-3.5 h-3.5 mr-1" />
                    Add signer field
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border bg-white p-3 text-sm">
                    <p className="font-semibold">Signature</p>
                    <p className="text-muted-foreground mt-1">Use for a full legal name on a signature line.</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-3 text-sm">
                    <p className="font-semibold">Initials</p>
                    <p className="text-muted-foreground mt-1">Use for short approvals beside individual clauses or sections.</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-3 text-sm">
                    <p className="font-semibold">Date</p>
                    <p className="text-muted-foreground mt-1">Use when the client must confirm the signing date on the document.</p>
                  </div>
                  <div className="rounded-2xl border bg-white p-3 text-sm">
                    <p className="font-semibold">Text entry</p>
                    <p className="text-muted-foreground mt-1">Use for typed acknowledgements, names, business names, or short answers.</p>
                  </div>
                </div>

                {normalizeSignatureFields(templateForm.signature_fields || [], templateForm.uploaded_documents || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No custom signer fields yet. The delivery still uses the main electronic signature block; add fields here if uploaded documents need initials, dates, or typed acknowledgements.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {normalizeSignatureFields(templateForm.signature_fields || [], templateForm.uploaded_documents || []).map((field) => (
                      <div key={field.id} className="rounded-2xl border bg-white p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{field.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              This field appears in the hosted signing flow and is stored with the signed delivery.
                            </p>
                          </div>
                          <Button size="icon" variant="outline" onClick={() => removeTemplateSignerField(field.id)} aria-label={`Remove ${field.label}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>File to mark</Label>
                            <Select value={field.target_document_id} onValueChange={(value) => updateTemplateSignerField(field.id, { target_document_id: value })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {getDocumentTargetOptions(templateForm.uploaded_documents || []).map((option) => (
                                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>What the client completes</Label>
                            <Select value={field.type} onValueChange={(value) => updateTemplateSignerField(field.id, { type: value })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {SIGNATURE_FIELD_TYPES.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Field name shown to client</Label>
                            <Input value={field.label} onChange={(event) => updateTemplateSignerField(field.id, { label: event.target.value })} placeholder="Client initials on cancellation clause" />
                          </div>
                          <div className="space-y-2">
                            <Label>Input prompt</Label>
                            <Input value={field.placeholder || ''} onChange={(event) => updateTemplateSignerField(field.id, { placeholder: event.target.value })} placeholder="Type your initials" />
                          </div>
                          <div className="space-y-2">
                            <Label>Page number or section</Label>
                            <Input value={field.page_hint || ''} onChange={(event) => updateTemplateSignerField(field.id, { page_hint: event.target.value })} placeholder="Page 2, pricing section, paragraph 4" />
                          </div>
                          <div className="space-y-2">
                            <Label>Where on the document</Label>
                            <Input value={field.anchor_hint || ''} onChange={(event) => updateTemplateSignerField(field.id, { anchor_hint: event.target.value })} placeholder="Bottom right signature line under payment terms" />
                          </div>
                          <div className="space-y-2">
                            <Label>Auto-fill this answer with</Label>
                            <Select value={field.prefill_key || ''} onValueChange={(value) => updateTemplateSignerField(field.id, { prefill_key: value })}>
                              <SelectTrigger><SelectValue placeholder="Choose saved info if this should fill itself in" /></SelectTrigger>
                              <SelectContent>
                                {SIGNATURE_PREFILL_OPTIONS.map((option) => (
                                  <SelectItem key={option.value || 'none'} value={option.value}>{option.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Client instructions</Label>
                            <Textarea rows={2} value={field.help_text || ''} onChange={(event) => updateTemplateSignerField(field.id, { help_text: event.target.value })} placeholder="Tell the client exactly what they are acknowledging and where they should complete this field." />
                          </div>
                        </div>

                        <label className="flex items-center gap-3 text-sm">
                          <Checkbox
                            checked={field.required !== false}
                            onCheckedChange={(checked) => updateTemplateSignerField(field.id, { required: checked === true })}
                          />
                          This signer field is required before the delivery can be completed.
                        </label>

                        <div className="rounded-2xl border bg-primary/5 p-3 text-xs text-muted-foreground">
                          BalloonCraft KC uses this checkpoint in the hosted signing page. Match the original file by choosing the right document,
                          naming the action clearly, and filling in the page and placement hints so the client knows exactly where to sign, initial, date, or type.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => templateMutation.mutate()} disabled={templateMutation.isPending || !templateForm.name || !templateForm.document_title || !templateForm.body_text}>
                  {templateMutation.isPending ? 'Saving...' : editingTemplateId ? 'Update template' : 'Create template'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setTemplateForm({
                    ...DEFAULT_CONTRACT_TEMPLATE,
                    template_code: '',
                    status: 'active',
                    uploaded_documents: [],
                    signature_fields: [],
                  });
                  setEditingTemplateId(null);
                }}>
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Load starter template
                </Button>
                <Button variant="outline" onClick={() => { setTemplateForm(emptyTemplateForm); setEditingTemplateId(null); }}>
                  Reset form
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is a business tool, not legal advice. Review your final agreement language with counsel if you need formal legal review.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved agreement templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No templates yet. Load the starter template, then customize it.</p>
              ) : templates.map((template) => (
                <div key={template.id} className="rounded-2xl border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{template.name}</p>
                        <StatusBadge value={template.status} />
                      </div>
                      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">{template.template_code}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description || 'No description provided.'}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full border px-3 py-1 bg-muted/40">
                      {normalizeUploadedDocuments(template.uploaded_documents || []).length} uploaded doc{normalizeUploadedDocuments(template.uploaded_documents || []).length === 1 ? '' : 's'}
                    </span>
                    <span className="rounded-full border px-3 py-1 bg-muted/40">
                      {normalizeSignatureFields(template.signature_fields || [], template.uploaded_documents || []).length} signer field{normalizeSignatureFields(template.signature_fields || [], template.uploaded_documents || []).length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Send a BalloonCraft KC signature delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-semibold">Delivery procedure</p>
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p><strong>1.</strong> Pick the client, invoice, and signature template.</p>
                  <p><strong>2.</strong> BalloonCraft KC emails a secure signing link from your branded delivery flow.</p>
                  <p><strong>3.</strong> The client reviews each document, completes every required sign/initial/date/text checkpoint, and signs.</p>
                  <p><strong>4.</strong> BalloonCraft KC records the completion and emails the final signed copy back automatically.</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-muted/30 p-4 space-y-2 text-sm">
                <p className="font-semibold">What your client receives</p>
                <p className="text-muted-foreground">
                  Each delivery opens a BalloonCraft KC Signature Center page with the agreement, uploaded files, payment details,
                  marked signer checkpoints, Word export, print/PDF export, and the final electronic signature submission.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Client</Label>
                <Select
                  value={packageForm.clientId}
                  onValueChange={(value) => {
                    setPackageForm({
                      clientId: value,
                      invoiceId: '',
                      templateId: packageForm.templateId,
                      packetTitle: packageForm.packetTitle,
                      emailStage: packageForm.emailStage,
                    });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Choose a client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.contact_name}{client.business_name ? ` — ${client.business_name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Invoice</Label>
                <Select value={packageForm.invoiceId} onValueChange={(value) => setPackageForm({ ...packageForm, invoiceId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choose an invoice" /></SelectTrigger>
                  <SelectContent>
                    {invoicesByClient.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_title} — {invoice.invoice_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Agreement template</Label>
                <Select value={packageForm.templateId} onValueChange={(value) => setPackageForm({ ...packageForm, templateId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Email type</Label>
                <Select value={packageForm.emailStage} onValueChange={(value) => setPackageForm({ ...packageForm, emailStage: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="downpayment">Downpayment invoice email</SelectItem>
                    <SelectItem value="final_payment">Final payment invoice email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Delivery title</Label>
                <Input value={packageForm.packetTitle} onChange={(event) => setPackageForm({ ...packageForm, packetTitle: event.target.value })} placeholder="Optional custom BalloonCraft KC delivery title" />
                <p className="text-xs text-muted-foreground">
                  This is the title your client sees inside the BalloonCraft KC Signature Center.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => sendPackageMutation.mutate()}
                  disabled={sendPackageMutation.isPending || !packageForm.clientId || !packageForm.invoiceId || !packageForm.templateId}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendPackageMutation.isPending ? 'Sending...' : 'Send official delivery'}
                </Button>
                <Button variant="outline" onClick={() => setPackageForm(emptyPackageForm)}>Reset</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Invoice-delivery subjects are generated automatically as “BalloonCraft KC - Downpayment Invoice for ...” or
                “BalloonCraft KC - Final Payment Invoice for ...” based on the email type you choose here.
              </p>

              <DocumentPreview
                template={selectedPackageTemplate}
                client={selectedPackageClient}
                invoice={selectedPackageInvoice}
                packetTitle={packageForm.packetTitle}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Signature delivery tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {packages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No signature deliveries sent yet.</p>
              ) : packages.map((packet) => {
                const packetUrl = `${window.location.origin}/documents/sign/${packet.access_token}`;
                return (
                  <div key={packet.id} className="rounded-2xl border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{packet.packet_title}</p>
                          <StatusBadge value={packet.status} variantMap={PACKAGE_STATUSES} />
                        </div>
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">{packet.package_code}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" onClick={() => window.open(packetUrl, '_blank')} aria-label="Open secure document center">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={async () => {
                            await navigator.clipboard.writeText(packetUrl);
                            toast.success('Secure document link copied.');
                          }}
                          aria-label="Copy secure document link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{packet.recipient_name} • {packet.recipient_email}</p>
                      <p>Sent {packet.created_at ? format(new Date(packet.created_at), 'MMM d, yyyy h:mm a') : 'recently'}</p>
                      <p>{packet.signed_at ? `Completed and signed ${format(new Date(packet.signed_at), 'MMM d, yyyy h:mm a')}` : packet.viewed_at ? 'Opened by client in Signature Center' : 'Delivered and waiting for first review'}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <CardHeader>
              <CardTitle>Record a payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice</Label>
                <Select value={paymentForm.invoiceId} onValueChange={(value) => setPaymentForm({ ...paymentForm, invoiceId: value })}>
                  <SelectTrigger><SelectValue placeholder="Choose an invoice" /></SelectTrigger>
                  <SelectContent>
                    {invoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_title} — {invoice.invoice_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPaymentInvoice ? (
                <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                  <p className="font-semibold">{selectedPaymentInvoice.invoice_title}</p>
                  <p className="text-muted-foreground mt-1">
                    Remaining balance: {formatMoney(invoiceSummaries[selectedPaymentInvoice.id]?.balance ?? selectedPaymentInvoice.contract_amount)}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" min="0" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => <SelectItem key={method} value={method}>{method.replace(/_/g, ' ')}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Paid date</Label>
                  <Input type="date" value={paymentForm.paidAt} onChange={(event) => setPaymentForm({ ...paymentForm, paidAt: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>External reference</Label>
                  <Input value={paymentForm.sourceReference} onChange={(event) => setPaymentForm({ ...paymentForm, sourceReference: event.target.value })} placeholder="Venmo note, check number, screenshot ref..." />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Internal note</Label>
                <Textarea rows={4} value={paymentForm.note} onChange={(event) => setPaymentForm({ ...paymentForm, note: event.target.value })} />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border p-4 text-sm">
                <Checkbox checked={paymentForm.sendReceipt} onCheckedChange={(checked) => setPaymentForm({ ...paymentForm, sendReceipt: checked === true })} />
                <span>Email the client a payment confirmation with the transaction ID and confirmation code.</span>
              </label>

              <Button
                onClick={() => recordPaymentMutation.mutate()}
                disabled={recordPaymentMutation.isPending || !paymentForm.invoiceId || !paymentForm.amount}
              >
                <BadgeDollarSign className="w-4 h-4 mr-2" />
                {recordPaymentMutation.isPending ? 'Recording...' : 'Record payment'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : payments.map((payment) => {
                const invoice = invoices.find((item) => item.id === payment.invoice_id);
                const client = clients.find((item) => item.id === invoice?.client_id);

                return (
                  <div key={payment.id} className="rounded-2xl border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{formatMoney(payment.amount)} via {payment.payment_method?.replace(/_/g, ' ') || 'payment'}</p>
                        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">{payment.transaction_code}</p>
                      </div>
                      <StatusBadge value={payment.email_receipt_sent ? 'receipt_sent' : 'recorded'} variantMap={{
                        receipt_sent: 'bg-emerald-600 text-white',
                        recorded: 'bg-slate-900 text-white',
                      }} />
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{invoice?.invoice_code || 'Unknown invoice'} • {client?.contact_name || 'Unknown client'}</p>
                      <p>Confirmation: {payment.confirmation_code}</p>
                      <p>{payment.paid_at ? format(new Date(payment.paid_at), 'MMM d, yyyy h:mm a') : ''}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewCard icon={BriefcaseBusiness} title="Client records" value={clients.length} detail="Saved lead and booking profiles" />
            <OverviewCard icon={ReceiptText} title="Open balances" value={outstandingInvoices} detail="Invoices still awaiting payment" />
            <OverviewCard icon={Wallet} title="Collected" value={formatMoney(totalCollected)} detail="Recorded payments across all invoices" />
            <OverviewCard icon={MailCheck} title="Opened deliveries" value={openedDeliveries} detail="Client deliveries viewed but not yet signed" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Export business reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border bg-primary/5 p-4 text-sm text-muted-foreground">
                  Download clean CSV reports for clients, invoices, payments, and document deliveries. These exports are immediate and reflect exactly what BalloonCraft KC has stored right now.
                </div>
                <div className="grid gap-3">
                  <Button variant="outline" className="justify-between" onClick={() => handleExport('ballooncraftkc-clients.csv', clientReportRows, 'Client report')}>
                    Download client report
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="justify-between" onClick={() => handleExport('ballooncraftkc-invoices.csv', invoiceReportRows, 'Invoice report')}>
                    Download invoice report
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="justify-between" onClick={() => handleExport('ballooncraftkc-payments.csv', paymentReportRows, 'Payment report')}>
                    Download payment report
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="justify-between" onClick={() => handleExport('ballooncraftkc-deliveries.csv', deliveryReportRows, 'Delivery report')}>
                    Download delivery report
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operations snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Clients registered</p>
                    <p className="text-2xl font-bold mt-2">{clients.length}</p>
                    <p className="text-muted-foreground mt-1">Every saved lead, quote, and booked event profile.</p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Deliveries completed</p>
                    <p className="text-2xl font-bold mt-2">{signedDeliveries}</p>
                    <p className="text-muted-foreground mt-1">Document deliveries already signed and returned.</p>
                  </div>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                  <p className="font-semibold">What belongs in these reports</p>
                  <p className="text-muted-foreground">
                    Use the client export for CRM cleanup, the invoice export for event balances, the payment export for reconciliation,
                    and the delivery export to monitor which agreements are still waiting on a review or signature.
                  </p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
                  <p className="font-semibold">Suggested admin workflow</p>
                  <p className="text-muted-foreground">
                    After sending a delivery, come back here to track signatures, record payments, and download updated reports whenever you need a fresh operational snapshot.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
