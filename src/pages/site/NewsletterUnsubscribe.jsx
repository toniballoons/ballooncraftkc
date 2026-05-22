import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageSeo } from '@/lib/usePageSeo';
import { toast } from 'sonner';

export default function NewsletterUnsubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [email, setEmail] = useState(searchParams.get('email') || '');

  usePageSeo({
    title: 'Unsubscribe From Newsletter | BalloonCraft KC',
    description: 'Manage BalloonCraft KC newsletter preferences.',
    path: '/newsletter/unsubscribe',
    noindex: true,
  });

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/newsletter-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to unsubscribe');
      navigate('/newsletter/unsubscribed', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-muted/20 px-4 py-16">
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Newsletter unsubscribe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-muted-foreground leading-7">
          <p>
            This page only removes you from BalloonCraft KC newsletter-style emails and promotional updates.
          </p>
          <p>
            It does <strong>not</strong> stop event-specific emails that still require action, including payment emails,
            upcoming payment reminders, contract signing requests, or other client communication tied directly to your event.
          </p>
          {!token && (
            <div className="space-y-2">
              <label htmlFor="unsubscribe-email" className="text-sm font-medium text-foreground">Email address</label>
              <Input
                id="unsubscribe-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
          )}
          <Button onClick={handleUnsubscribe} disabled={(!token && !email) || loading} className="rounded-full">
            {loading ? 'Unsubscribing...' : 'Unsubscribe From Newsletter Emails'}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
