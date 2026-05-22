import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageSeo } from '@/lib/usePageSeo';
import { CheckCircle2 } from 'lucide-react';

export default function NewsletterUnsubscribeSuccess() {
  usePageSeo({
    title: 'Newsletter Unsubscribed | BalloonCraft KC',
    description: 'Newsletter preferences updated.',
    path: '/newsletter/unsubscribed',
    noindex: true,
  });

  return (
    <section className="min-h-[70vh] flex items-center justify-center bg-muted/20 px-4 py-16">
      <Card className="w-full max-w-2xl shadow-sm">
        <CardHeader>
          <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <CardTitle className="font-display text-3xl">You’re unsubscribed from newsletter emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-7">
          <p>You will no longer receive BalloonCraft KC newsletter-style updates and promotional emails.</p>
          <p>
            Event-specific emails that still require action, including payment reminders, upcoming payments, and contract
            signing requests, will still be delivered if they apply to your event.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
