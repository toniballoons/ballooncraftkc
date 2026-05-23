import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const REASONS = [
  { value: 'too_many_emails', label: 'Too many emails' },
  { value: 'not_relevant', label: 'The content is not relevant' },
  { value: 'signed_up_by_mistake', label: 'I signed up by mistake' },
  { value: 'prefer_social_only', label: 'I only want to follow on social' },
  { value: 'no_longer_planning', label: 'I am not planning an event anymore' },
  { value: 'other', label: 'Other' },
];

async function fetchSubscriber(token) {
  const response = await fetch(`/api/newsletter-unsubscribe?token=${encodeURIComponent(token)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Unable to load unsubscribe details.');
  return data;
}

export default function Unsubscribe() {
  const { accessToken } = useParams();
  const [reason, setReason] = useState('too_many_emails');
  const [note, setNote] = useState('');
  const [completed, setCompleted] = useState(false);

  const subscriberQuery = useQuery({
    queryKey: ['newsletter-unsubscribe', accessToken],
    queryFn: () => fetchSubscriber(accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Unsubscribe — BalloonCraft KC';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/newsletter-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: accessToken,
          reason,
          note,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to unsubscribe.');
      return data;
    },
    onSuccess: () => {
      setCompleted(true);
      toast.success('You have been unsubscribed immediately.');
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Newsletter unsubscribe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {subscriberQuery.isLoading ? (
            <p className="text-muted-foreground">Loading your subscription details...</p>
          ) : subscriberQuery.error ? (
            <p className="text-destructive">{subscriberQuery.error.message}</p>
          ) : completed || subscriberQuery.data?.status === 'unsubscribed' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-semibold">You are unsubscribed immediately.</p>
              </div>
              <p className="text-sm text-emerald-800">
                {subscriberQuery.data?.email || 'Your email'} will not receive future BalloonCraft KC newsletter emails.
              </p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">
                We can unsubscribe <strong>{subscriberQuery.data?.email}</strong> right away. If you want, tell us why so we can improve.
              </p>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REASONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Anything else you want us to know?</Label>
                <Textarea rows={5} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional feedback" />
              </div>
              <div className="space-y-3">
                <Button onClick={() => unsubscribeMutation.mutate()} disabled={unsubscribeMutation.isPending} className="rounded-full px-6">
                  {unsubscribeMutation.isPending ? 'Unsubscribing...' : 'Unsubscribe now'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  This removes newsletter marketing immediately. Transactional messages about active invoices, payments, or signed agreements are handled separately.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
