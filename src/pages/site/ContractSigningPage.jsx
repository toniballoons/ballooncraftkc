import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import SignaturePad from '@/components/site/SignaturePad';
import { usePageSeo } from '@/lib/usePageSeo';
import { formatDate, humanizeStatus } from '@/lib/billing';
import {
  getCustomFieldTypeLabel,
  getCustomSignerFields,
  getPackageDocuments,
  getPackageNextSteps,
  isCustomFieldResponseFilled,
} from '@/lib/contracts';
import {
  CheckCircle2,
  ClipboardList,
  FileSignature,
  Link2,
  ShieldCheck,
} from 'lucide-react';

function renderCustomInput(field, value, onChange) {
  const commonProps = {
    id: field.id,
    value: typeof value === 'string' ? value : '',
    onChange,
    placeholder: field.placeholder || '',
  };

  switch (field.type) {
    case 'paragraph':
      return <Textarea rows={4} {...commonProps} />;
    case 'date':
      return <Input type="date" {...commonProps} />;
    case 'time':
      return <Input type="time" {...commonProps} />;
    case 'email':
      return <Input type="email" {...commonProps} />;
    case 'phone':
      return <Input type="tel" {...commonProps} />;
    case 'initials':
      return (
        <Input
          {...commonProps}
          maxLength={4}
          value={typeof value === 'string' ? value.toUpperCase() : ''}
          onChange={(event) => onChange({ target: { value: event.target.value.toUpperCase().slice(0, 4) } })}
        />
      );
    default:
      return <Input type="text" {...commonProps} />;
  }
}

export default function ContractSigningPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [contractData, setContractData] = useState(null);
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({
    signerName: '',
    signerEmail: '',
    signerInitials: '',
    signatureDataUrl: '',
    customFieldResponses: {},
  });

  usePageSeo({
    title: 'Secure Contract Signing | BalloonCraft KC',
    description: 'BalloonCraft KC hosted contract signing.',
    path: `/sign/${token || ''}`,
    noindex: true,
  });

  useEffect(() => {
    let active = true;

    async function loadContract() {
      try {
        const response = await fetch(`/api/contract-public?token=${encodeURIComponent(token)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Failed to load contract');
        if (!active) return;

        setContractData(payload);
        setForm((prev) => ({
          ...prev,
          signerName: payload.contract.client_name || '',
          signerEmail: payload.contract.client_email || '',
          customFieldResponses: payload.contract.payload?.custom_field_responses || {},
        }));
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (token) loadContract();
    else {
      setError('Missing signing token.');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [token]);

  const packageDocuments = useMemo(
    () => getPackageDocuments(contractData?.contract?.payload || {}),
    [contractData],
  );
  const packageNextSteps = useMemo(
    () => getPackageNextSteps(contractData?.contract?.payload || {}),
    [contractData],
  );
  const customFields = useMemo(
    () => getCustomSignerFields(contractData?.contract?.payload || {}),
    [contractData],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!consent) {
      toast.error('Please confirm your agreement before signing.');
      return;
    }
    if (!form.signatureDataUrl) {
      toast.error('Please draw your signature before submitting.');
      return;
    }

    const missingField = customFields.find((field) => (
      field.required && !isCustomFieldResponseFilled(field, form.customFieldResponses[field.id])
    ));
    if (missingField) {
      toast.error(`Please complete "${missingField.label}" before signing.`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/sign-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signerName: form.signerName,
          signerEmail: form.signerEmail,
          signerInitials: form.signerInitials,
          signatureDataUrl: form.signatureDataUrl,
          customFieldResponses: form.customFieldResponses,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to sign contract');
      }

      setContractData((prev) => prev ? {
        ...prev,
        contract: {
          ...prev.contract,
          status: 'signed',
          signed_at: new Date().toISOString(),
          signer_name: form.signerName,
          payload: {
            ...prev.contract.payload,
            custom_field_responses: form.customFieldResponses,
          },
        },
      } : prev);
      toast.success('Contract signed successfully.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCustomFieldChange = (field, nextValue) => {
    setForm((prev) => ({
      ...prev,
      customFieldResponses: {
        ...prev.customFieldResponses,
        [field.id]: field.type === 'checkbox' ? Boolean(nextValue) : nextValue,
      },
    }));
  };

  if (loading) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Loading contract...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-muted/20 px-4">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Unable to load contract</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const isSigned = contractData?.contract?.status === 'signed';
  const packageIntro = contractData?.contract?.payload?.package_intro;

  return (
    <section className="bg-muted/20 py-16 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8">
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/60">
            <div className="flex items-center gap-3 text-primary text-sm font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Hosted securely on BalloonCraft KC
            </div>
            <CardTitle className="font-display text-3xl mt-3">{contractData.contract.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Contract #{contractData.contract.contract_number} • Status: {humanizeStatus(contractData.contract.status)}
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {packageIntro ? (
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
                <p className="text-sm leading-7 text-foreground/85">{packageIntro}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contractData.summaryRows.slice(0, 8).map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
                  <p className="font-medium">{value}</p>
                </div>
              ))}
            </div>

            {packageDocuments.length > 0 ? (
              <div className="space-y-4">
                <h2 className="font-display text-2xl text-primary">Included Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageDocuments.map((document) => (
                    <a
                      key={document.id}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-border/60 bg-white p-4 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center gap-3">
                        <Link2 className="w-4 h-4 text-primary" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{document.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">Open attachment</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {packageNextSteps.length > 0 ? (
              <div className="space-y-4">
                <h2 className="font-display text-2xl text-primary">What Happens Next</h2>
                <ol className="space-y-3">
                  {packageNextSteps.map((step, index) => (
                    <li key={`${index + 1}-${step}`} className="rounded-2xl border border-border/50 bg-white p-4 text-sm leading-7 text-foreground/85">
                      <span className="font-semibold text-primary mr-2">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="space-y-6">
              {contractData.sections.map((section) => (
                <article key={section.title} className="space-y-3">
                  <h2 className="font-display text-2xl text-primary">{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-foreground/85">{paragraph}</p>
                  ))}
                </article>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-2xl flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-primary" />
                {isSigned ? 'Contract Completed' : 'Complete Package + Sign'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isSigned ? (
                <div className="space-y-4 rounded-2xl border border-green-200 bg-green-50 p-6">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-700">Your agreement is complete.</h3>
                    <p className="text-sm text-green-700/90 mt-2">
                      Signed by {contractData.contract.signer_name || contractData.contract.client_name} on{' '}
                      {contractData.contract.signed_at ? new Date(contractData.contract.signed_at).toLocaleString('en-US') : formatDate(contractData.contract.event_date)}.
                    </p>
                    <p className="text-sm text-green-700/90 mt-2">
                      A signed PDF copy has been emailed to you and to Toni.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {customFields.length > 0 ? (
                    <div className="space-y-4 rounded-3xl border border-border/60 bg-muted/10 p-5">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold">Event Questionnaire</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Please answer these event planning questions so BalloonCraft KC has everything needed to move your booking forward.
                      </p>
                      <div className="space-y-4">
                        {customFields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            {field.type === 'checkbox' ? (
                              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white p-4">
                                <Checkbox
                                  id={field.id}
                                  checked={Boolean(form.customFieldResponses[field.id])}
                                  onCheckedChange={(checked) => handleCustomFieldChange(field, checked)}
                                />
                                <div className="space-y-1">
                                  <Label htmlFor={field.id} className="leading-6">
                                    {field.label}
                                    {field.required ? ' *' : ''}
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    {field.help_text || getCustomFieldTypeLabel(field.type)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <Label htmlFor={field.id}>
                                  {field.label}
                                  {field.required ? ' *' : ''}
                                </Label>
                                {renderCustomInput(
                                  field,
                                  form.customFieldResponses[field.id],
                                  (event) => handleCustomFieldChange(field, event.target.value),
                                )}
                                {field.help_text ? (
                                  <p className="text-xs text-muted-foreground">{field.help_text}</p>
                                ) : null}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="signerName">Full legal name</Label>
                    <Input
                      id="signerName"
                      value={form.signerName}
                      onChange={(event) => setForm({ ...form, signerName: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signerEmail">Email address</Label>
                    <Input
                      id="signerEmail"
                      type="email"
                      value={form.signerEmail}
                      onChange={(event) => setForm({ ...form, signerEmail: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signerInitials">Initials</Label>
                    <Input
                      id="signerInitials"
                      value={form.signerInitials}
                      onChange={(event) => setForm({ ...form, signerInitials: event.target.value.toUpperCase().slice(0, 4) })}
                      maxLength={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Signature</Label>
                    <SignaturePad
                      value={form.signatureDataUrl}
                      onChange={(nextValue) => setForm({ ...form, signatureDataUrl: nextValue })}
                    />
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-muted/20 p-4">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={(checked) => setConsent(Boolean(checked))}
                    />
                    <Label htmlFor="consent" className="leading-6 text-sm">
                      I agree that this electronic signature is the legal equivalent of my handwritten signature and confirms the BalloonCraft KC agreement above.
                    </Label>
                  </div>
                  <Button type="submit" className="w-full rounded-full" size="lg" disabled={saving}>
                    {saving ? 'Submitting signature...' : 'Submit Booking Details and Sign'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-xl">Need a change before signing?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-7">
                Reply directly to Toni if any event details, rental needs, guest counts, or scope items need to change before you complete this agreement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
