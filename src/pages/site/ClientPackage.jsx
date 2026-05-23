import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Copy, FileSignature, Mail, ShieldCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatMoney, paymentLinkEntries, renderTextSections } from '@/lib/clientOps';

async function fetchClientPackage(token) {
  const response = await fetch(`/api/client-package?token=${encodeURIComponent(token)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load package.');
  return data;
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
    document.title = 'Client Package — BalloonCraft KC';

    return () => {
      document.title = previousTitle;
      robotsTag.setAttribute('content', '');
    };
  }, []);

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

  const packageData = data?.packet;
  const client = data?.client;
  const invoice = data?.invoice;
  const payments = data?.payments || [];
  const alreadySigned = Boolean(packageData?.signedAt);
  const paymentLinks = useMemo(() => paymentLinkEntries(packageData?.paymentLinks || {}), [packageData?.paymentLinks]);

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
            <h1 className="font-display text-3xl">Package not available</h1>
            <p className="text-muted-foreground">{error?.message || 'This booking package could not be found.'}</p>
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
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground font-semibold">BalloonCraft KC Client Package</p>
                <h1 className="font-display text-3xl mt-2">{packageData.packetTitle}</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  Review your event details, invoice schedule, and agreement below. When everything looks right, sign digitally and we will email the completed copy automatically.
                </p>
              </div>
            </div>
            <div className="rounded-3xl border bg-primary/5 px-5 py-4 min-w-[260px]">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Package status</p>
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
                  Sign the agreement
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
                        I have reviewed this BalloonCraft KC package, I agree to the terms above, and I understand that typing my name below serves as my electronic signature.
                      </span>
                    </label>
                    <Button
                      onClick={() => signMutation.mutate()}
                      disabled={signMutation.isPending || !signatureForm.signedName || !signatureForm.signedInitials || !signatureForm.agreedToTerms}
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
            <CardHeader>
              <CardTitle>Agreement document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[28px] border bg-white p-6 sm:p-8 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">BalloonCraft KC</p>
                  <h2 className="font-display text-2xl mt-2">{packageData.documentTitle}</h2>
                </div>

                {renderTextSections(packageData.documentIntro).map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}

                {renderTextSections(packageData.documentBody).map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}

                {renderTextSections(packageData.documentClosing).map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                    {paragraph}
                  </p>
                ))}

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

              <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  <p className="font-semibold">Need help?</p>
                </div>
                <p>
                  If you need changes before signing, reply directly to the BalloonCraft KC email you received and Toni can update your package before you submit it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
