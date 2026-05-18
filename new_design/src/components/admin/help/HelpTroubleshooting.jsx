import React, { useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, HelpCircle, Send, CheckCircle2, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/lib/uploadFile';
import { toast } from 'sonner';

const issues = [
  {
    problem: "My changes aren't showing on the website",
    solution: "Click Save first, then wait about 30 seconds. Then do a hard refresh: on Mac press Cmd+Shift+R, on Windows press Ctrl+Shift+R. This forces your browser to load the latest version instead of a cached old version.",
  },
  {
    problem: "I uploaded a photo but it's not showing",
    solution: "Make sure the file is under 10MB and is a JPG, PNG, or WebP format. Very large files sometimes fail silently. Try resizing the photo first using a free tool like squoosh.app, then upload again.",
  },
  {
    problem: "The contact form isn't sending me email notifications",
    solution: "Check that your Resend API key and email addresses (CONTACT_EMAIL_TO and CONTACT_EMAIL_FROM) are set correctly in your Vercel environment variables. Also make sure the \"from\" email address is verified in your Resend account. Contact your developer if you're not sure how to check this.",
  },
  {
    problem: "I forgot my admin password",
    solution: "Contact your developer to reset it in Supabase. Go to your Supabase project → Authentication → Users → find your email → click the three dots → Send password reset email.",
  },
  {
    problem: "A post is published but I can't see it on the website",
    solution: "Edit the post and double-check that the Status dropdown is set to \"Published\" (not \"Draft\" or \"Archived\"). Also make sure the Slug field is filled in — posts without a slug can't be accessed by URL.",
  },
  {
    problem: "The theme changed in the admin but my website looks the same",
    solution: "Do a hard refresh on your website: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows). Your browser may be showing a cached version. If it still doesn't update after 2 minutes, try opening the site in a private/incognito window.",
  },
  {
    problem: "The gallery images aren't saving in the right order",
    solution: "After dragging to reorder, make sure you click Save Post before closing the editor. The order is saved when you save the post.",
  },
  {
    problem: "I accidentally deleted a post",
    solution: "Unfortunately deleted posts can't be recovered from the admin panel. If it was an important post, contact your developer — they may be able to recover it from the database backup.",
  },
  {
    problem: "The SEO preview shows \"yourdomain.com\" instead of my real domain",
    solution: "The SEO preview uses a placeholder domain in the editor. Your actual live posts will show your real domain. This is just a display issue in the editor — it doesn't affect your actual website.",
  },
  {
    problem: "I can't log in — it says \"Invalid login credentials\"",
    solution: "Double-check your email and password. Passwords are case-sensitive. If you've forgotten your password, contact your developer to reset it in Supabase.",
  },
  {
    problem: "The website is loading slowly",
    solution: "Large image files are the most common cause of slow loading. Try to keep photos under 2MB each. Use squoosh.app to compress images before uploading. Also, having many high-resolution gallery images on one post can slow it down.",
  },
  {
    problem: "I see an error message when I try to save",
    solution: "Take a screenshot of the error message and send it to your developer. Common causes: internet connection dropped during save, or a required field was left blank.",
  },
];

function DeveloperSupportForm() {
  const [form, setForm] = useState({ name: '', email: '', description: '' });
  const [screenshots, setScreenshots] = useState([]); // { file, url, uploading }
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const screenshotInputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newEntries = files.map(f => ({ name: f.name, url: null, uploading: true }));
    setScreenshots(prev => [...prev, ...newEntries]);

    for (let i = 0; i < files.length; i++) {
      try {
        const { file_url } = await uploadFile(files[i]);
        setScreenshots(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(s => s.name === files[i].name && s.uploading);
          if (idx !== -1) updated[idx] = { name: files[i].name, url: file_url, uploading: false };
          return updated;
        });
      } catch (err) {
        toast.error(`Failed to upload ${files[i].name}`);
        setScreenshots(prev => prev.filter(s => !(s.name === files[i].name && s.uploading)));
      }
    }
    e.target.value = '';
  };

  const removeScreenshot = (idx) => {
    setScreenshots(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (screenshots.some(s => s.uploading)) {
      toast.error('Please wait for all screenshots to finish uploading.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/send-developer-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          screenshot_urls: screenshots.filter(s => s.url).map(s => s.url),
        }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch (err) {
      toast.error('Failed to send. Please try again or email your developer directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-green-800 mb-1">Support request sent!</p>
        <p className="text-sm text-green-700">Your developer has been notified and will get back to you as soon as possible.</p>
        <button
          type="button"
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', description: '' }); setScreenshots([]); }}
          className="mt-4 text-xs text-green-600 underline"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Your Name *</Label>
          <Input
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Toni"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Your Email *</Label>
          <Input
            type="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="toni@example.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Describe the problem *</Label>
        <Textarea
          required
          rows={4}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Tell me what you were doing, what you expected to happen, and what actually happened. The more detail the better!"
        />
      </div>

      {/* Screenshot upload */}
      <div className="space-y-2">
        <Label>Screenshots (optional)</Label>
        <p className="text-xs text-muted-foreground">Attach one or more screenshots — works on mobile too. JPG, PNG, WebP supported.</p>

        {screenshots.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {screenshots.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1 text-xs">
                {s.uploading
                  ? <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  : <CheckCircle2 className="w-3 h-3 text-green-500" />
                }
                <span className="max-w-[120px] truncate">{s.name}</span>
                {!s.uploading && (
                  <button type="button" onClick={() => removeScreenshot(i)} aria-label={`Remove screenshot ${s.name}`}>
                    <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <label
          className="flex items-center gap-2 cursor-pointer w-fit bg-muted hover:bg-muted/80 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              screenshotInputRef.current?.click();
            }
          }}
        >
          <Upload className="w-4 h-4" />
          {screenshots.length > 0 ? 'Add more screenshots' : 'Attach screenshots'}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFiles}
            ref={screenshotInputRef}
          />
        </label>
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
          : <><Send className="w-4 h-4 mr-2" /> Send to Developer</>
        }
      </Button>
    </form>
  );
}

export default function HelpTroubleshooting() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Troubleshooting</h2>
          <p className="text-sm text-muted-foreground">Solutions to common problems</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-blue-800 text-sm">First thing to try for almost any problem</p>
          <p className="text-sm text-blue-700 mt-1">Do a hard refresh: <strong>Cmd+Shift+R</strong> on Mac or <strong>Ctrl+Shift+R</strong> on Windows. This clears your browser's cache and loads the latest version of the page. It fixes about 50% of issues.</p>
        </div>
      </div>

      <div className="space-y-3">
        {issues.map((issue, i) => (
          <div key={i} className="border rounded-xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="font-semibold text-sm">{issue.problem}</p>
            </div>
            <div className="px-4 py-3 bg-white">
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.solution}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Still stuck — developer contact form */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <p className="font-bold text-gray-800 mb-1">Still stuck?</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            If none of the above solutions work, use the form below to contact your developer directly. You can attach screenshots right from your phone or computer — the more detail you provide, the faster it gets fixed.
          </p>
        </div>
        <DeveloperSupportForm />
      </div>
    </div>
  );
}
