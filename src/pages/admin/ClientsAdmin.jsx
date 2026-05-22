import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import * as Customer from '@/entities/Customer';
import * as ContactSubmission from '@/entities/ContactSubmission';
import * as Contract from '@/entities/Contract';
import * as EmailDelivery from '@/entities/EmailDelivery';
import {
  buildContractRecordFromForm,
  buildContractSigningUrl,
  createCustomSignerField,
  createDefaultContractForm,
  CUSTOM_SIGNER_FIELD_TYPES,
  hydrateContractPayload,
} from '@/lib/contracts';
import { formatCurrency, formatDate, humanizeStatus, toMoneyNumber } from '@/lib/billing';
import { uploadFile } from '@/lib/uploadFile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Activity,
  ClipboardList,
  Copy,
  Download,
  Link2,
  Mail,
  Plus,
  ScrollText,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';

const emailStatusColor = {
  sent: 'bg-amber-100 text-amber-800',
  opened: 'bg-green-100 text-green-800',
};

const contractStatusColor = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-violet-100 text-violet-800',
  signed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatFileSize(size) {
  const bytes = Number(size || 0);
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatCard({ icon: Icon, label, value, tone = 'bg-primary/10 text-primary' }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractList({ contracts, selectedContractId, onSelect }) {
  return (
    <div className="space-y-3">
      {contracts.map((contract) => (
        <button
          key={contract.id}
          type="button"
          onClick={() => onSelect(contract)}
          className={`w-full rounded-2xl border p-4 text-left transition-all ${selectedContractId === contract.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/60 bg-white hover:border-primary/40'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{contract.client_name}</p>
              <p className="text-xs text-muted-foreground truncate">{contract.contract_number}</p>
            </div>
            <Badge className={contractStatusColor[contract.status] || contractStatusColor.draft}>
              {humanizeStatus(contract.status)}
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <span>{formatDate(contract.event_date)}</span>
            <span className="text-right">{formatCurrency(contract.contract_total)}</span>
          </div>
        </button>
      ))}
      {contracts.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No booking packages yet. Create the first one on the right.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ClientsTab({ customers, submissions, contracts, emails }) {
  const submissionsByCustomer = useMemo(() => submissions.reduce((acc, item) => {
    acc[item.customer_id] = (acc[item.customer_id] || 0) + 1;
    return acc;
  }, {}), [submissions]);

  const contractsByCustomer = useMemo(() => contracts.reduce((acc, item) => {
    acc[item.customer_id] = (acc[item.customer_id] || 0) + 1;
    return acc;
  }, {}), [contracts]);

  const openedEmailsByRecipient = useMemo(() => emails.reduce((acc, item) => {
    if (item.status === 'opened') {
      acc[item.recipient_email] = (acc[item.recipient_email] || 0) + 1;
    }
    return acc;
  }, {}), [emails]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Client Records" value={customers.length} />
        <StatCard icon={ScrollText} label="Packages / Contracts" value={contracts.length} tone="bg-pink-100 text-pink-700" />
        <StatCard icon={Activity} label="Opened Emails" value={emails.filter((item) => item.status === 'opened').length} tone="bg-green-100 text-green-700" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{customer.full_name || customer.company_name || customer.email}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
                </div>
                <Badge variant="outline">{customer.preferred_payment_method || 'manual follow-up'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {customer.phone && <p><strong>Phone:</strong> {customer.phone}</p>}
              <p><strong>Inquiries:</strong> {submissionsByCustomer[customer.id] || 0}</p>
              <p><strong>Packages:</strong> {contractsByCustomer[customer.id] || 0}</p>
              <p><strong>Opened emails:</strong> {openedEmailsByRecipient[customer.email] || 0}</p>
            </CardContent>
          </Card>
        ))}
        {customers.length === 0 && (
          <Card className="xl:col-span-2">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Client records will begin populating here as inquiries and booking packages are created.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function EmailActivityTab({ emails }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Mail} label="Client Emails" value={emails.length} tone="bg-sky-100 text-sky-700" />
        <StatCard icon={Activity} label="Opened" value={emails.filter((item) => item.status === 'opened').length} tone="bg-green-100 text-green-700" />
        <StatCard icon={Mail} label="Awaiting Opens" value={emails.filter((item) => item.status === 'sent').length} tone="bg-amber-100 text-amber-700" />
      </div>
      <div className="space-y-3">
        {emails.map((email) => (
          <Card key={email.id}>
            <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold truncate">{email.subject}</p>
                <p className="text-sm text-muted-foreground truncate">{email.recipient_name || email.recipient_email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sent {new Date(email.sent_at).toLocaleString('en-US')} • {humanizeStatus(email.related_type)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={emailStatusColor[email.status] || emailStatusColor.sent}>
                  {email.status === 'opened' ? `Opened ${email.open_count}x` : 'Not opened yet'}
                </Badge>
                {email.first_opened_at && (
                  <span className="text-xs text-muted-foreground">
                    First open: {new Date(email.first_opened_at).toLocaleString('en-US')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {emails.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Tracked customer emails will show here once packages, contracts, replies, and other client-facing messages are sent.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function PackageDocumentsField({ documents, uploading, onUpload, onRemove }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" />
          Uploaded Agreement Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
          <Label htmlFor="package-documents" className="text-sm font-medium">Upload PDFs, Word docs, or reference files</Label>
          <Input
            id="package-documents"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.rtf,.txt,.png,.jpg,.jpeg"
            className="mt-3"
            onChange={onUpload}
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground mt-3">
            Upload the exact agreement files or add-on documents you want the client to review alongside the hosted BalloonCraft KC signing flow.
          </p>
        </div>

        <div className="space-y-3">
          {documents.map((document) => (
            <div key={document.id} className="rounded-2xl border border-border/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium truncate">{document.name}</p>
                <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                  <span>{document.mime_type || 'File uploaded to package'}</span>
                  {document.size ? <span>{formatFileSize(document.size)}</span> : null}
                </p>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 mt-2"
                >
                  <Link2 className="w-3 h-3" />
                  View file
                </a>
              </div>
              <Button type="button" variant="ghost" onClick={() => onRemove(document.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No custom agreement files attached yet. The generated BalloonCraft KC Word and PDF contract will still be included automatically when you send the package.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CustomSignerFieldsEditor({ fields, onAdd, onChange, onRemove }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          Client Intake + Signing Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          These questions appear on the client&apos;s hosted booking page before they sign. Use them for event intake, approvals, initials, extra dates, or anything Toni needs collected up front.
        </p>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-2xl border border-border/60 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Question {index + 1}</p>
                <Button type="button" variant="ghost" onClick={() => onRemove(field.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Prompt / label</Label>
                  <Input
                    value={field.label}
                    onChange={(event) => onChange(field.id, { label: event.target.value })}
                    placeholder="What do you need the client to answer?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Field type</Label>
                  <Select value={field.type} onValueChange={(value) => onChange(field.id, { type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CUSTOM_SIGNER_FIELD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Placeholder</Label>
                  <Input
                    value={field.placeholder}
                    onChange={(event) => onChange(field.id, { placeholder: event.target.value })}
                    placeholder="Helpful example answer"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Help text</Label>
                  <Textarea
                    rows={2}
                    value={field.help_text}
                    onChange={(event) => onChange(field.id, { help_text: event.target.value })}
                    placeholder="Optional note explaining what you need here"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/60 p-4">
                <Checkbox
                  id={`required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(checked) => onChange(field.id, { required: Boolean(checked) })}
                />
                <Label htmlFor={`required-${field.id}`}>Require the client to answer this before signing.</Label>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Another Question
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ClientsAdmin() {
  const queryClient = useQueryClient();
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('none');
  const [form, setForm] = useState(createDefaultContractForm());
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => Customer.list('-created_at'),
    initialData: [],
  });
  const { data: submissions = [] } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => ContactSubmission.list('-created_at'),
    initialData: [],
  });
  const { data: contracts = [] } = useQuery({
    queryKey: ['admin-contracts'],
    queryFn: () => Contract.list('-created_at'),
    initialData: [],
  });
  const { data: emails = [] } = useQuery({
    queryKey: ['admin-email-deliveries'],
    queryFn: () => EmailDelivery.list('-sent_at'),
    initialData: [],
  });

  const selectedContract = useMemo(
    () => contracts.find((item) => item.id === selectedContractId) || null,
    [contracts, selectedContractId],
  );

  const clientBalanceDue = Math.max(0, toMoneyNumber(form.contract_total) - toMoneyNumber(form.retainer_amount));

  const resetForm = () => {
    setSelectedContractId(null);
    setSelectedCustomerId('none');
    setForm(createDefaultContractForm());
  };

  const handleSelectContract = (contract) => {
    setSelectedContractId(contract.id);
    setSelectedCustomerId(contract.customer_id || 'none');
    setForm(hydrateContractPayload(contract));
  };

  const handleCustomerChange = (value) => {
    setSelectedCustomerId(value);
    if (!value || value === 'none') return;

    const customer = customers.find((item) => item.id === value);
    if (!customer) return;

    setForm((prev) => ({
      ...prev,
      client_name: customer.full_name || prev.client_name,
      client_email: customer.email || prev.client_email,
      client_phone: customer.phone || prev.client_phone,
    }));
  };

  const resolveCustomerRecord = async () => {
    if (selectedCustomerId && selectedCustomerId !== 'none') {
      const existingCustomer = customers.find((item) => item.id === selectedCustomerId);
      if (!existingCustomer) {
        throw new Error('Selected client could not be found.');
      }

      await Customer.update(existingCustomer.id, {
        full_name: form.client_name,
        email: form.client_email.trim().toLowerCase(),
        phone: form.client_phone || null,
      });

      return { ...existingCustomer, full_name: form.client_name, email: form.client_email.trim().toLowerCase(), phone: form.client_phone || null };
    }

    const normalizedEmail = form.client_email.trim().toLowerCase();
    const existing = customers.find((item) => item.email === normalizedEmail);
    if (existing) {
      const updated = await Customer.update(existing.id, {
        full_name: form.client_name,
        phone: form.client_phone || null,
      });
      return updated;
    }

    return Customer.create({
      full_name: form.client_name,
      email: normalizedEmail,
      phone: form.client_phone || null,
      preferred_payment_method: 'manual follow-up',
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.client_name || !form.client_email) {
        throw new Error('Client name and email are required.');
      }

      const customer = await resolveCustomerRecord();
      const payload = buildContractRecordFromForm(form, customer.id);

      if (selectedContractId) {
        return Contract.update(selectedContractId, payload);
      }

      return Contract.create(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      setSelectedContractId(saved.id);
      setSelectedCustomerId(saved.customer_id || 'none');
      setForm(hydrateContractPayload(saved));
      toast.success(selectedContractId ? 'Booking package updated.' : 'Booking package created.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) throw new Error('Admin session missing. Please sign in again.');
    return { Authorization: `Bearer ${token}` };
  };

  const handleSendContract = async () => {
    if (!selectedContractId) {
      toast.error('Save the booking package first.');
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/send-contract', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractId: selectedContractId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to send package');
      queryClient.invalidateQueries({ queryKey: ['admin-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-email-deliveries'] });
      toast.success('Client package sent to client.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDownload = async (format) => {
    if (!selectedContractId) {
      toast.error('Save the booking package first.');
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/contract-file?contractId=${encodeURIComponent(selectedContractId)}&format=${format}`, {
        headers,
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to download contract');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${selectedContract?.contract_number || 'ballooncraft-contract'}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCopySigningLink = async () => {
    if (!selectedContract?.signing_token) {
      toast.error('Save the booking package first.');
      return;
    }
    await navigator.clipboard.writeText(buildContractSigningUrl(window.location.origin, selectedContract.signing_token));
    toast.success('Hosted signing link copied.');
  };

  const handleUploadPackageDocuments = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingDocuments(true);
    try {
      const uploadedFiles = await Promise.all(
        files.map((file) => uploadFile(file, { folder: 'client-packages' })),
      );

      setForm((prev) => {
        const nextDocuments = [
          ...prev.package_documents,
          ...uploadedFiles.map((file) => ({
            id: `${Date.now()}-${file.file_name}`,
            name: file.file_name,
            url: file.file_url,
            mime_type: file.mime_type,
            size: file.size,
            path: file.path,
          })),
        ];

        return {
          ...prev,
          package_documents: nextDocuments,
          template_reference_url: prev.template_reference_url || nextDocuments[0]?.url || '',
          template_reference_name: prev.template_reference_name || nextDocuments[0]?.name || '',
        };
      });

      toast.success(`${uploadedFiles.length} agreement file${uploadedFiles.length === 1 ? '' : 's'} added to the package.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingDocuments(false);
      event.target.value = '';
    }
  };

  const handleRemovePackageDocument = (documentId) => {
    setForm((prev) => {
      const nextDocuments = prev.package_documents.filter((document) => document.id !== documentId);
      return {
        ...prev,
        package_documents: nextDocuments,
        template_reference_url: nextDocuments[0]?.url || '',
        template_reference_name: nextDocuments[0]?.name || '',
      };
    });
  };

  const handleUpdateCustomField = (fieldId, updates) => {
    setForm((prev) => ({
      ...prev,
      custom_signer_fields: prev.custom_signer_fields.map((field) => (
        field.id === fieldId ? { ...field, ...updates } : field
      )),
    }));
  };

  const handleRemoveCustomField = (fieldId) => {
    setForm((prev) => ({
      ...prev,
      custom_signer_fields: prev.custom_signer_fields.filter((field) => field.id !== fieldId),
    }));
  };

  const handleAddCustomField = () => {
    setForm((prev) => ({
      ...prev,
      custom_signer_fields: [
        ...prev.custom_signer_fields,
        createCustomSignerField({
          label: '',
          placeholder: '',
          help_text: '',
          required: true,
          type: 'text',
        }),
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Client Administration</h1>
        <p className="text-muted-foreground mt-2 max-w-4xl">
          Manage client records, build full booking packages for clients who never created an account first, attach agreement files, collect intake answers, and send hosted BalloonCraft KC signing links with payment instructions in one flow.
        </p>
      </div>

      <Tabs defaultValue="clients" className="space-y-5">
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="contracts">Booking Packages</TabsTrigger>
          <TabsTrigger value="emails">Email Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <ClientsTab customers={customers} submissions={submissions} contracts={contracts} emails={emails} />
        </TabsContent>

        <TabsContent value="contracts" className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-[0.88fr_1.12fr] gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl">Client Packages</h2>
                <Button variant="outline" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Package
                </Button>
              </div>
              <ContractList
                contracts={contracts}
                selectedContractId={selectedContractId}
                onSelect={handleSelectContract}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  {selectedContractId ? 'Edit Client Booking Package' : 'Create Client Booking Package'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Choose existing client</Label>
                    <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="New client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">New client</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name || customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Agreement title</Label>
                    <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Client name</Label>
                    <Input value={form.client_name} onChange={(event) => setForm({ ...form, client_name: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Client email</Label>
                    <Input type="email" value={form.client_email} onChange={(event) => setForm({ ...form, client_email: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.client_phone} onChange={(event) => setForm({ ...form, client_phone: event.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Event name</Label>
                    <Input value={form.event_name} onChange={(event) => setForm({ ...form, event_name: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Event location</Label>
                    <Input value={form.event_location} onChange={(event) => setForm({ ...form, event_location: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Event date</Label>
                    <Input type="date" value={form.event_date} onChange={(event) => setForm({ ...form, event_date: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Event time</Label>
                    <Input value={form.event_time} onChange={(event) => setForm({ ...form, event_time: event.target.value })} placeholder="6:00 PM" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Decor description</Label>
                  <Textarea rows={3} value={form.decor_description} onChange={(event) => setForm({ ...form, decor_description: event.target.value })} placeholder="Organic balloon arch, welcome display, backdrop install..." />
                </div>
                <div className="space-y-2">
                  <Label>Deliverables / scope</Label>
                  <Textarea rows={3} value={form.deliverables} onChange={(event) => setForm({ ...form, deliverables: event.target.value })} placeholder="Exactly what BalloonCraft KC is providing for this event." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Contract total</Label>
                    <Input type="number" min="0" step="0.01" value={form.contract_total} onChange={(event) => setForm({ ...form, contract_total: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Initial down payment</Label>
                    <Input type="number" min="0" step="0.01" value={form.retainer_amount} onChange={(event) => setForm({ ...form, retainer_amount: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Balance due date</Label>
                    <Input type="date" value={form.balance_due_date} onChange={(event) => setForm({ ...form, balance_due_date: event.target.value })} />
                  </div>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Initial payment status</p>
                      <p className={`font-semibold ${toMoneyNumber(form.retainer_amount) > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                        Pending until Toni records the down payment
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Current account balance</p>
                      <p className={`font-semibold ${clientBalanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {clientBalanceDue > 0 ? `${formatCurrency(clientBalanceDue)} still outstanding` : 'Fully covered'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Management note</p>
                      <p className="font-medium text-muted-foreground">
                        Keep client accounts “in the red” after the event until Toni logs the final figures and payments.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment terms</Label>
                    <Textarea rows={4} value={form.payment_terms} onChange={(event) => setForm({ ...form, payment_terms: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment instructions</Label>
                    <Textarea rows={4} value={form.payment_instructions} onChange={(event) => setForm({ ...form, payment_instructions: event.target.value })} placeholder="Venmo, Cash App, check details, or exactly how Toni wants the deposit handled." />
                  </div>
                  <div className="space-y-2">
                    <Label>Cancellation policy</Label>
                    <Textarea rows={4} value={form.cancellation_policy} onChange={(event) => setForm({ ...form, cancellation_policy: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reschedule policy</Label>
                    <Textarea rows={4} value={form.reschedule_policy} onChange={(event) => setForm({ ...form, reschedule_policy: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weather policy</Label>
                    <Textarea rows={4} value={form.weather_policy} onChange={(event) => setForm({ ...form, weather_policy: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Damage / access clause</Label>
                    <Textarea rows={4} value={form.damage_clause} onChange={(event) => setForm({ ...form, damage_clause: event.target.value })} />
                  </div>
                </div>

                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Client Package Copy</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Intro message</Label>
                      <Textarea
                        rows={4}
                        value={form.package_intro}
                        onChange={(event) => setForm({ ...form, package_intro: event.target.value })}
                        placeholder="Short note the client sees in their booking email and hosted page."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Next steps list</Label>
                      <Textarea
                        rows={4}
                        value={form.package_next_steps}
                        onChange={(event) => setForm({ ...form, package_next_steps: event.target.value })}
                        placeholder={`One step per line\nReview the attached agreement\nSign the hosted contract\nSend the deposit`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Down payment link</Label>
                      <Input
                        value={form.down_payment_link}
                        onChange={(event) => setForm({ ...form, down_payment_link: event.target.value })}
                        placeholder="https://venmo.com/... or other payment URL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Down payment button label</Label>
                      <Input
                        value={form.down_payment_link_label}
                        onChange={(event) => setForm({ ...form, down_payment_link_label: event.target.value })}
                        placeholder="Submit Down Payment"
                      />
                    </div>
                  </CardContent>
                </Card>

                <PackageDocumentsField
                  documents={form.package_documents}
                  uploading={uploadingDocuments}
                  onUpload={handleUploadPackageDocuments}
                  onRemove={handleRemovePackageDocument}
                />

                <CustomSignerFieldsEditor
                  fields={form.custom_signer_fields}
                  onAdd={handleAddCustomField}
                  onChange={handleUpdateCustomField}
                  onRemove={handleRemoveCustomField}
                />

                <div className="space-y-2">
                  <Label>Additional custom terms</Label>
                  <Textarea rows={4} value={form.custom_terms} onChange={(event) => setForm({ ...form, custom_terms: event.target.value })} />
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-border/60 p-4">
                  <Checkbox
                    id="photo_release"
                    checked={form.photo_release}
                    onCheckedChange={(checked) => setForm({ ...form, photo_release: Boolean(checked) })}
                  />
                  <Label htmlFor="photo_release">Allow BalloonCraft KC to use event photos for portfolio and marketing by default.</Label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save Booking Package'}
                  </Button>
                  <Button variant="outline" onClick={handleSendContract} disabled={!selectedContractId}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Client Package
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('docx')} disabled={!selectedContractId}>
                    <Download className="w-4 h-4 mr-2" />
                    Word
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload('pdf')} disabled={!selectedContractId}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={handleCopySigningLink} disabled={!selectedContractId}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Hosted Link
                  </Button>
                </div>

                {selectedContract && (
                  <p className="text-xs text-muted-foreground">
                    Hosted signing link: {buildContractSigningUrl(window.location.origin, selectedContract.signing_token)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="emails">
          <EmailActivityTab emails={emails} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
