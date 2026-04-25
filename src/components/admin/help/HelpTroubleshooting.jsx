import React from 'react';
import { AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';

const issues = [
  {
    problem: 'My changes aren\'t showing on the website',
    solution: 'Click Save first, then wait about 30 seconds. Then do a hard refresh: on Mac press Cmd+Shift+R, on Windows press Ctrl+Shift+R. This forces your browser to load the latest version instead of a cached old version.',
  },
  {
    problem: 'I uploaded a photo but it\'s not showing',
    solution: 'Make sure the file is under 10MB and is a JPG, PNG, or WebP format. Very large files sometimes fail silently. Try resizing the photo first using a free tool like squoosh.app, then upload again.',
  },
  {
    problem: 'The contact form isn\'t sending me email notifications',
    solution: 'Check that your Resend API key and email addresses (CONTACT_EMAIL_TO and CONTACT_EMAIL_FROM) are set correctly in your Vercel environment variables. Also make sure the "from" email address is verified in your Resend account. Contact your developer if you\'re not sure how to check this.',
  },
  {
    problem: 'I forgot my admin password',
    solution: 'Contact your developer to reset it in Supabase. Go to your Supabase project → Authentication → Users → find your email → click the three dots → Send password reset email.',
  },
  {
    problem: 'A post is published but I can\'t see it on the website',
    solution: 'Edit the post and double-check that the Status dropdown is set to "Published" (not "Draft" or "Archived"). Also make sure the Slug field is filled in — posts without a slug can\'t be accessed by URL.',
  },
  {
    problem: 'The theme changed in the admin but my website looks the same',
    solution: 'Do a hard refresh on your website: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows). Your browser may be showing a cached version. If it still doesn\'t update after 2 minutes, try opening the site in a private/incognito window.',
  },
  {
    problem: 'The gallery images aren\'t saving in the right order',
    solution: 'After dragging to reorder, make sure you click Save Post before closing the editor. The order is saved when you save the post.',
  },
  {
    problem: 'I accidentally deleted a post',
    solution: 'Unfortunately deleted posts can\'t be recovered from the admin panel. If it was an important post, contact your developer — they may be able to recover it from the database backup.',
  },
  {
    problem: 'The SEO preview shows "yourdomain.com" instead of my real domain',
    solution: 'The SEO preview uses a placeholder domain in the editor. Your actual live posts will show your real domain. This is just a display issue in the editor — it doesn\'t affect your actual website.',
  },
  {
    problem: 'I can\'t log in — it says "Invalid login credentials"',
    solution: 'Double-check your email and password. Passwords are case-sensitive. If you\'ve forgotten your password, contact your developer to reset it in Supabase.',
  },
  {
    problem: 'The website is loading slowly',
    solution: 'Large image files are the most common cause of slow loading. Try to keep photos under 2MB each. Use squoosh.app to compress images before uploading. Also, having many high-resolution gallery images on one post can slow it down.',
  },
  {
    problem: 'I see an error message when I try to save',
    solution: 'Take a screenshot of the error message and send it to your developer. Common causes: internet connection dropped during save, or a required field was left blank.',
  },
];

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

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="font-bold text-gray-800 mb-2">Still stuck?</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          If none of the above solutions work, take a screenshot of what you're seeing (including any error messages) and contact your developer. The more detail you can provide about what you were doing when the problem happened, the faster it can be fixed.
        </p>
      </div>
    </div>
  );
}
