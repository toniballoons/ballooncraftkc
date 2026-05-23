import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileSignature,
  FileText,
  Mail,
  Printer,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buildAgreementHtml,
  formatDate,
  formatMoney,
  GENERATED_DOCUMENT_TARGET,
  normalizeSignatureFields,
  normalizeUploadedDocuments,
  paymentLinkEntries,
  renderTextSections,
  resolveSignatureFieldPrefill,
  slugify,
} from '@/lib/clientOps';

async function fetchClientPackage(token) {
  const response = await fetch(`/api/client-package?token=${encodeURIComponent(token)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load package.');
  return data;
}

function buildAutofillValue(field, signatureForm) {
  if (field.type === 'signature') return signatureForm.signedName || '';
  if (field.type === 'initials') return signatureForm.signedInitials || '';
  if (field.type === 'date' && field.prefill_key === 'today') return new Date().toISOString().slice(0, 10);
  return '';
}

function buildEffectiveFieldValue(field, fieldValues, signatureForm, mergedFields) {
  return fieldValues[field.id]
    || resolveSignatureFieldPrefill(field, mergedFields)
    || buildAutofillValue(field, signatureForm)
    || '';
}

function buildWordDocumentHtml(title, html) {
  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotOptimizeForBrowser />
          </w:WordDocument>
        </xml>
        <![endif]-->
      </head>
      <body>${html}</body>
    </html>
  `;
}

function downloadWordDocument(filename, html) {
  const blob = new Blob([buildWordDocumentHtml(filename, html)], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openPrintPreview(title, html) {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    toast.error('Please allow pop-ups so the print view can open.');
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 32px;
            background: #ffffff;
            font-family: Arial, sans-serif;
            color: #111827;
          }
          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

function signatureFieldTypeLabel(type) {
  switch (type) {
    case 'signature':
      return 'Signature';
    case 'initials':
      return 'Initials';
    case 'date':
      return 'Date';
    case 'text':
    default:
      return 'Text entry';
  }
}

function DocumentViewer({ document }) {
  const fileUrl = document?.file_url || '';
  const fileType = (document?.file_type || '').toLowerCase();
  const isPdf = fileType.includes('pdf') || /\.pdf(\?|$)/i.test(fileUrl);
  const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(fileUrl);

  if (isImage) {
    return (
      <div className="rounded-3xl border bg-muted/20 overflow-hidden">
        <img src={fileUrl} alt={document.name} className="w-full max-h-[540px] object-contain bg-white" />
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="rounded-3xl border bg-white overflow-hidden">
        <iframe
          title={document.name}
          src={fileUrl}
          className="w-full h-[560px]"
        />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
      This file can be opened in a new tab for review.
    </div>
  );
}

function SignatureFieldCard({
  field,
  value,
  onChange,
  disabled,
}) {
  const baseMeta = [signatureFieldTypeLabel(field.type), field.page_hint, field.anchor_hint].filter(Boolean).join(' • ');
  const placeholder = field.placeholder || (
    field.type === 'signature'
      ? 'Type your full legal name'
      : field.type === 'initials'
        ? 'Type your initials'
        : field.type === 'date'
          ? ''
          : 'Type your response'
  );

  return (
    <div className="rounded-2xl border bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{field.label}</p>
          {baseMeta ? <p className="text-xs text-muted-foreground mt-1">{baseMeta}</p> : null}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${field.required !== false ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
          {field.required !== false ? 'Required' : 'Optional'}
        </span>
      </div>

      {field.help_text ? <p className="text-sm text-muted-foreground">{field.help_text}</p> : null}

      {disabled ? (
        <div className="rounded-xl border bg-muted/20 px-3 py-2 text-sm">
          {value || '—'}
        </div>
      ) : (
        <Input
          type={field.type === 'date' ? 'date' : 'text'}
          value={value}
          maxLength={field.type === 'initials' ? 8 : undefined}
          placeholder={placeholder}
          onChange={(event) => {
            const nextValue = field.type === 'initials'
              ? event.target.value.toUpperCase()
              : event.target.value;
            onChange(nextValue);
          }}
        />
      )}
    </div>
  );
}

function DocumentSignatureSection({
  title,
  description,
  fields,
  fieldValues,
  onChange,
  disabled,
}) {
  if (!fields.length) return null;

  return (
    <div className="rounded-3xl border bg-primary/5 p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
      </div>
      <div className="grid gap-3">
        {fields.map((field) => (
          <SignatureFieldCard
            key={field.id}
            field={field}
            value={fieldValues[field.id] || ''}
            onChange={(nextValue) => onChange(field.id, nextValue)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

export default function ClientPackage() {
  const { accessToken } = useParams();
  const queryClient = useQueryClient();

  const [signatureForm, setSignatureForm] = useState({
    signedName: '',
    signedInitials: '',
    signedTitle: '',
    agreedToTerms: false,
  });
  const [signatureFieldValues, setSignatureFieldValues] = useState({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['client-package', accessToken],
    queryFn: () => fetchClientPackage(accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    const previousTitle = document.title;
    const robotsTag = document.querySelector('meta[name="robots"]') || document.createElement('meta');
    robotsTag.setAttribute('name', 'robots');
    robotsTag.setAttribute('content', 'noindex, nofollow');
    if (!robotsTag.parentNode) document.head.appendChild(robotsTag);
    document.title = 'Official BalloonCraft KC Document Signing';

    return () => {
      document.title = previousTitle;
      robotsTag.setAttribute('content', '');
    };
  }, []);

  const packageData = data?.packet;
  const client = data?.client;
  const invoice = data?.invoice;
  const payments = data?.payments || [];
  const alreadySigned = Boolean(packageData?.signedAt);

  const paymentLinks = useMemo(
    () => paymentLinkEntries(packageData?.paymentLinks || {}),
    [packageData?.paymentLinks]
  );

  const uploadedDocuments = useMemo(
    () => normalizeUploadedDocuments(packageData?.uploadedDocuments || []),
    [packageData?.uploadedDocuments]
  );

  const signatureFields = useMemo(
    () => normalizeSignatureFields(packageData?.signatureFields || [], uploadedDocuments),
    [packageData?.signatureFields, uploadedDocuments]
  );

  const groupedSignatureFields = useMemo(() => {
    return signatureFields.reduce((groups, field) => {
      groups[field.target_document_id] ||= [];
      groups[field.target_document_id].push(field);
      return groups;
    }, {});
  }, [signatureFields]);

  const mergedFields = packageData?.mergedFields || {};

  useEffect(() => {
    if (!packageData) return;

    const seededFieldValues = signatureFields.reduce((accumulator, field) => {
      accumulator[field.id] = packageData.signatureFieldValues?.[field.id]
        || resolveSignatureFieldPrefill(field, mergedFields)
        || '';
      return accumulator;
    }, {});

    setSignatureFieldValues(seededFieldValues);
    setSignatureForm({
      signedName: packageData.signedName || client?.contactName || '',
      signedInitials: packageData.signedInitials || '',
      signedTitle: packageData.signedTitle || '',
      agreedToTerms: Boolean(packageData.agreedToTerms),
    });
  }, [client?.contactName, mergedFields, packageData, signatureFields]);

  useEffect(() => {
    if (!signatureFields.length) return;

    setSignatureFieldValues((current) => {
      const nextValues = { ...current };
      let changed = false;

      signatureFields.forEach((field) => {
        if (!nextValues[field.id]) {
          const autoValue = buildAutofillValue(field, signatureForm);
          if (autoValue) {
            nextValues[field.id] = autoValue;
            changed = true;
          }
        }
      });

      return changed ? nextValues : current;
    });
  }, [signatureFields, signatureForm]);

  const effectiveFieldValues = useMemo(() => {
    return signatureFields.reduce((accumulator, field) => {
      accumulator[field.id] = buildEffectiveFieldValue(field, signatureFieldValues, signatureForm, mergedFields);
      return accumulator;
    }, {});
  }, [mergedFields, signatureFieldValues, signatureFields, signatureForm]);

  const missingFields = useMemo(
    () => signatureFields.filter((field) => field.required !== false && !String(effectiveFieldValues[field.id] || '').trim()),
    [effectiveFieldValues, signatureFields]
  );

  const agreementHtml = useMemo(() => {
    if (!packageData || !client || !invoice) return '';

    return buildAgreementHtml({
      packet: {
        documentTitle: packageData.documentTitle,
        documentIntro: packageData.documentIntro,
        documentBody: packageData.documentBody,
        documentClosing: packageData.documentClosing,
        uploadedDocuments,
      },
      client,
      invoice,
      signatureFields,
      signatureFieldValues: effectiveFieldValues,
    });
  }, [client, effectiveFieldValues, invoice, packageData, signatureFields, uploadedDocuments]);

  const documentDownloadName = useMemo(() => {
    return slugify(packageData?.packetTitle || invoice?.invoiceTitle || invoice?.eventType || 'ballooncraftkc-agreement');
  }, [invoice?.eventType, invoice?.invoiceTitle, packageData?.packetTitle]);

  const signMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sign-client-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          signedName: signatureForm.signedName,
          signedInitials: signatureForm.signedInitials,
          signedTitle: signatureForm.signedTitle,
          agreedToTerms: signatureForm.agreedToTerms,
          signatureFieldValues: effectiveFieldValues,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to complete signature.');
      return result;
    },
    onSuccess: () => {
      toast.success('Agreement signed. A completed copy is on its way to your inbox.');
      queryClient.invalidateQueries({ queryKey: ['client-package', accessToken] });
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const handleFieldValueChange = (fieldId, nextValue) => {
    setSignatureFieldValues((current) => ({
      ...current,
      [fieldId]: nextValue,
    }));
  };

  const handleDownloadWordCopy = () => {
    if (!agreementHtml) return;
    downloadWordDocument(documentDownloadName, agreementHtml);
  };

  const handlePrintCopy = () => {
    if (!agreementHtml) return;
    openPrintPreview(packageData?.documentTitle || 'BalloonCraft KC agreement', agreementHtml);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full">
          <CardContent className="py-10 text-center space-y-3">
            <h1 className="font-display text-3xl">Documents not available</h1>
            <p className="text-muted-foreground">{error?.message || 'This secure BalloonCraft KC document file could not be found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7fb] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-[28px] border bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <img src="/logo.png" alt="BalloonCraft KC" className="h-16 w-auto object-contain" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold">BalloonCraft KC Secure Document Center</p>
                <h1 className="font-display text-3xl mt-2">{packageData.packetTitle}</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  Review your official event documents, invoice schedule, uploaded agreements, and signing checkpoints below. When everything looks right, complete the digital signature workflow and we will email the finished copy automatically.
                </p>
              </div>
            </div>
            <div className="rounded-3xl border bg-primary/5 px-5 py-4 min-w-[260px]">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Document status</p>
              <div className="mt-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <p className="font-semibold capitalize">{packageData.status.replace(/_/g, ' ')}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{client.contactName} • {client.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Package ID: {packageData.packageCode}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Invoice summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Invoice ID</p>
                    <p className="mt-1 font-semibold">{invoice.invoiceCode}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Project</p>
                    <p className="mt-1 font-semibold">{invoice.invoiceTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Event date</p>
                    <p className="mt-1">{invoice.eventDate ? formatDate(invoice.eventDate) : 'To be confirmed'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Location</p>
                    <p className="mt-1">{invoice.eventLocation || 'To be confirmed'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Contract amount</p>
                    <p className="mt-1 font-semibold">{formatMoney(invoice.contractAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Remaining balance</p>
                    <p className="mt-1 font-semibold">{formatMoney(invoice.balanceDue)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border bg-muted/30 p-4 space-y-2 text-sm">
                  <p><strong>Down payment:</strong> {formatMoney(invoice.downPaymentAmount)} due {formatDate(invoice.downPaymentDueDate)}</p>
                  <p><strong>Final payment:</strong> {formatMoney(invoice.finalPaymentAmount)} due {formatDate(invoice.finalPaymentDueDate)}</p>
                  {invoice.serviceSummary ? <p><strong>Scope:</strong> {invoice.serviceSummary}</p> : null}
                  {packageData.paymentInstructions ? <p><strong>Payment instructions:</strong> {packageData.paymentInstructions}</p> : null}
                </div>

                {paymentLinks.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Payment links</p>
                    <div className="flex flex-wrap gap-2">
                      {paymentLinks.map((entry) => (
                        <a
                          key={entry.key}
                          href={entry.value}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:opacity-90"
                        >
                          {entry.label}
                          <Copy className="w-3.5 h-3.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {payments.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Recorded payments</p>
                    <div className="space-y-2">
                      {payments.map((payment) => (
                        <div key={payment.transactionCode} className="rounded-2xl border p-3 text-sm">
                          <p className="font-semibold">{formatMoney(payment.amount)} • {payment.method?.replace(/_/g, ' ') || 'Payment'}</p>
                          <p className="text-muted-foreground text-xs mt-1">Transaction {payment.transactionCode} • Confirmation {payment.confirmationCode}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5" />
                  Complete document signing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alreadySigned ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" />
                      <p className="font-semibold">This agreement has already been completed.</p>
                    </div>
                    <p className="text-sm text-emerald-800">Signed by {packageData.signedName} on {new Date(packageData.signedAt).toLocaleString('en-US')}.</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border bg-primary/5 p-4 space-y-2">
                      <p className="text-sm font-semibold">Signing checklist</p>
                      <p className="text-sm text-muted-foreground">
                        Your secure document center includes {1 + uploadedDocuments.length} document{uploadedDocuments.length ? 's' : ''} and {signatureFields.length} configured signer field{signatureFields.length === 1 ? '' : 's'}.
                      </p>
                      {missingFields.length > 0 ? (
                        <p className="text-sm text-rose-700">
                          Remaining required fields: {missingFields.map((field) => field.label).join(', ')}
                        </p>
                      ) : (
                        <p className="text-sm text-emerald-700">All required signing fields are ready to submit.</p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Full legal name</Label>
                        <Input value={signatureForm.signedName} onChange={(event) => setSignatureForm({ ...signatureForm, signedName: event.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Initials</Label>
                        <Input value={signatureForm.signedInitials} onChange={(event) => setSignatureForm({ ...signatureForm, signedInitials: event.target.value.toUpperCase() })} maxLength={6} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Title / role (optional)</Label>
                      <Input value={signatureForm.signedTitle} onChange={(event) => setSignatureForm({ ...signatureForm, signedTitle: event.target.value })} placeholder="Owner, event manager, marketing director..." />
                    </div>
                    <label className="flex items-start gap-3 rounded-2xl border p-4 text-sm">
                      <Checkbox
                        checked={signatureForm.agreedToTerms}
                        onCheckedChange={(checked) => setSignatureForm({ ...signatureForm, agreedToTerms: checked === true })}
                      />
                      <span>
                        I have reviewed these official BalloonCraft KC documents, I agree to the terms above, and I understand that typing my name below serves as my electronic signature.
                      </span>
                    </label>
                    <Button
                      onClick={() => signMutation.mutate()}
                      disabled={signMutation.isPending || !signatureForm.signedName || !signatureForm.signedInitials || !signatureForm.agreedToTerms || missingFields.length > 0}
                    >
                      {signMutation.isPending ? 'Submitting signature...' : 'Complete signature'}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      After you sign, a completed copy is emailed to both you and BalloonCraft KC automatically.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Official documents and supporting files</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Review the BalloonCraft KC agreement, complete any document-specific signer fields, and download or print an official copy whenever you need one.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadWordCopy}>
                  <Download className="w-4 h-4 mr-2" />
                  {alreadySigned ? 'Download signed Word copy' : 'Download Word copy'}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintCopy}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print / save PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[28px] border bg-white p-6 sm:p-8 space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">BalloonCraft KC</p>
                    <h2 className="font-display text-2xl mt-2">{packageData.documentTitle}</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
                    <FileText className="w-3.5 h-3.5" />
                    Generated agreement
                  </span>
                </div>

                {renderTextSections(packageData.documentIntro).map((paragraph, index) => (
                  <p key={`intro-${index}`} className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}

                {renderTextSections(packageData.documentBody).map((paragraph, index) => (
                  <p key={`body-${index}`} className="text-sm leading-7 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}

                {renderTextSections(packageData.documentClosing).map((paragraph, index) => (
                  <p key={`closing-${index}`} className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}

                <DocumentSignatureSection
                  title="Generated agreement fields"
                  description="These signature markers are attached directly to the BalloonCraft KC agreement."
                  fields={groupedSignatureFields[GENERATED_DOCUMENT_TARGET] || []}
                  fieldValues={effectiveFieldValues}
                  onChange={handleFieldValueChange}
                  disabled={alreadySigned}
                />

                {alreadySigned ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-700 font-semibold">Completed signature</p>
                    <p className="text-sm"><strong>Name:</strong> {packageData.signedName}</p>
                    <p className="text-sm"><strong>Initials:</strong> {packageData.signedInitials}</p>
                    {packageData.signedTitle ? <p className="text-sm"><strong>Title:</strong> {packageData.signedTitle}</p> : null}
                    <p className="text-sm"><strong>Signed:</strong> {new Date(packageData.signedAt).toLocaleString('en-US')}</p>
                  </div>
                ) : null}
              </div>

              {uploadedDocuments.map((document) => (
                <div key={document.id} className="rounded-[28px] border bg-white p-6 sm:p-8 space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <h3 className="font-display text-xl">{document.name}</h3>
                      {document.description ? <p className="text-sm text-muted-foreground">{document.description}</p> : null}
                    </div>
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      Open document
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <DocumentViewer document={document} />

                  <DocumentSignatureSection
                    title="Complete fields on this uploaded document"
                    description="Use the notes below to match BalloonCraft KC’s requested signature, initials, date, and text entry spots on this file."
                    fields={groupedSignatureFields[document.id] || []}
                    fieldValues={effectiveFieldValues}
                    onChange={handleFieldValueChange}
                    disabled={alreadySigned}
                  />
                </div>
              ))}

              <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  <p className="font-semibold">Need help?</p>
                </div>
                <p>
                  If you need changes before signing, reply directly to the BalloonCraft KC email you received and Toni can update your documents before you submit them.
                </p>
                <p className="mt-2">
                  If you need a PDF copy, choose <strong>Print / save PDF</strong> above. Most browsers let you save that print view directly as a PDF.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
