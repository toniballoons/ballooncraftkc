import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  ClipboardSignature,
  Copy,
  ExternalLink,
  MailCheck,
  Pencil,
  ReceiptText,
  Send,
  Sparkles,
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
  buildMergedFields,
  computeInvoiceStatus,
  formatDate,
  formatMoney,
  makeClientCode,
  makeInvoiceCode,
  makeTemplateCode,
  mergeTemplateText,
  parseMoney,
  renderTextSections,
} from '@/lib/clientOps';

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

function SetupRequired({ error }) {
  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="py-8 space-y-3">
        <h2 className="font-display text-2xl text-amber-950">Client Studio needs one database migration</h2>
        <p className="text-sm text-amber-900 leading-6">
          The UI is wired, but the new invoicing and agreement tables are not available in this environment yet.
          Run <code>supabase/migrations/009_client_operations.sql</code> in Supabase, then refresh this page.
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
        Choose a client, invoice, and agreement template to preview the package before sending it.
      </div>
    );
  }

  const mergedFields = buildMergedFields({ client, invoice });
  const intro = mergeTemplateText(template.intro_text || '', mergedFields);
  const title = mergeTemplateText(template.document_title || '', mergedFields);
  const body = mergeTemplateText(template.body_text || '', mergedFields);
  const closing = mergeTemplateText(template.closing_text || '', mergedFields);

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
          {packetTitle || `${client.contact_name} booking package`}
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
    </div>
  );
}

export default function ClientStudio() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [editingClientId, setEditingClientId] = useState(null);

  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);

  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);

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
      if (!response.ok) throw new Error(data.error || 'Failed to send package.');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contract-packages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
      toast.success(`Package sent. Secure link: ${data.packageCode}`);
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
    });
  };

  const selectedPaymentInvoice = invoices.find((invoice) => invoice.id === paymentForm.invoiceId);

  if (setupError) {
    return <SetupRequired error={setupError} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl">Client Studio</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Register clients, create invoices with deposit and final-payment schedules, build BalloonCraft KC agreement templates,
            and send polished signature-ready booking packages from one admin workspace.
          </p>
        </div>
        <div className="rounded-2xl border bg-primary/5 px-4 py-3 text-sm">
          <p className="font-semibold text-primary">Signature flow included</p>
          <p className="text-muted-foreground">Packages send from BalloonCraft KC and auto-email the completed copy back on signature.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <OverviewCard icon={BriefcaseBusiness} title="Clients" value={clients.length} detail="Lead and booking records" />
        <OverviewCard icon={ReceiptText} title="Invoices" value={invoices.length} detail="Custom event proposals and balances" />
        <OverviewCard icon={Wallet} title="Payments" value={payments.length} detail="Recorded receipts and confirmations" />
        <OverviewCard icon={ClipboardSignature} title="Templates" value={templates.length} detail="Reusable agreement frameworks" />
        <OverviewCard icon={MailCheck} title="Packages" value={packages.length} detail="Sent, viewed, and signed packets" />
      </div>

      <Tabs defaultValue="clients" className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="contracts">Agreements</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

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
              <CardTitle>{editingTemplateId ? 'Edit agreement template' : 'Build a BalloonCraft KC agreement template'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/40 p-4 space-y-2">
                <p className="text-sm font-semibold">Available placeholders</p>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_PLACEHOLDERS.map((field) => (
                    <span key={field.key} className="rounded-full bg-white border px-3 py-1 text-xs font-mono">
                      {`{{${field.key}}}`}
                    </span>
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
                <Input value={templateForm.subject_line} onChange={(event) => setTemplateForm({ ...templateForm, subject_line: event.target.value })} />
                <p className="text-xs text-muted-foreground">
                  Downpayment and final-payment invoice emails use automatic BalloonCraft KC subject lines. This stays available as a fallback for future non-invoice package sends.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Document title</Label>
                <Input value={templateForm.document_title} onChange={(event) => setTemplateForm({ ...templateForm, document_title: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Intro text</Label>
                <Textarea rows={4} value={templateForm.intro_text} onChange={(event) => setTemplateForm({ ...templateForm, intro_text: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Agreement body</Label>
                <Textarea rows={14} value={templateForm.body_text} onChange={(event) => setTemplateForm({ ...templateForm, body_text: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Closing text</Label>
                <Textarea rows={4} value={templateForm.closing_text} onChange={(event) => setTemplateForm({ ...templateForm, closing_text: event.target.value })} />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => templateMutation.mutate()} disabled={templateMutation.isPending || !templateForm.name || !templateForm.document_title || !templateForm.body_text}>
                  {templateMutation.isPending ? 'Saving...' : editingTemplateId ? 'Update template' : 'Create template'}
                </Button>
                <Button variant="outline" onClick={() => { setTemplateForm({ ...DEFAULT_CONTRACT_TEMPLATE, template_code: '', status: 'active' }); setEditingTemplateId(null); }}>
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
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages" className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Send a client package</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label>Packet title</Label>
                <Input value={packageForm.packetTitle} onChange={(event) => setPackageForm({ ...packageForm, packetTitle: event.target.value })} placeholder="Optional custom package title" />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => sendPackageMutation.mutate()}
                  disabled={sendPackageMutation.isPending || !packageForm.clientId || !packageForm.invoiceId || !packageForm.templateId}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendPackageMutation.isPending ? 'Sending...' : 'Send package'}
                </Button>
                <Button variant="outline" onClick={() => setPackageForm(emptyPackageForm)}>Reset</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Invoice-package subjects are generated automatically as “BalloonCraft KC - Downpayment Invoice for ...” or
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
              <CardTitle>Sent package tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {packages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No packages sent yet.</p>
              ) : packages.map((packet) => {
                const packetUrl = `${window.location.origin}/client-package/${packet.access_token}`;
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
                        <Button size="icon" variant="outline" onClick={() => window.open(packetUrl, '_blank')} aria-label="Open client package">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={async () => {
                            await navigator.clipboard.writeText(packetUrl);
                            toast.success('Package link copied.');
                          }}
                          aria-label="Copy client package link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{packet.recipient_name} • {packet.recipient_email}</p>
                      <p>Sent {packet.created_at ? format(new Date(packet.created_at), 'MMM d, yyyy h:mm a') : 'recently'}</p>
                      <p>{packet.signed_at ? `Signed ${format(new Date(packet.signed_at), 'MMM d, yyyy h:mm a')}` : packet.viewed_at ? 'Viewed by client' : 'Waiting for first review'}</p>
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
      </Tabs>
    </div>
  );
}
