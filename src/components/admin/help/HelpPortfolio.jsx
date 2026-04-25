import React from 'react';
import { FileText, Plus, Image, Tag, MapPin, Star, Search, Eye, Copy, CheckSquare } from 'lucide-react';

export default function HelpPortfolio() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <FileText className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Portfolio / Blog</h2>
          <p className="text-sm text-muted-foreground">Your most powerful tool for getting found on Google</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="font-bold text-green-800 mb-1">💡 Why this section matters most</p>
        <p className="text-sm text-green-700 leading-relaxed">
          Every post you create does two things at once: it shows your work to potential clients AND it tells Google what you do and where you do it. The more posts you have with good descriptions and photos, the higher you'll rank in Google searches like "balloon decorations Kansas City" or "balloon arch Overland Park wedding." <strong>Post after every single event.</strong>
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Plus className="w-4 h-4 text-green-500" /> How to Create a New Post — Step by Step</h3>

        <div className="space-y-3">
          {[
            {
              step: '1',
              title: 'Click "New Post"',
              desc: 'The big button in the top right corner of the Portfolio / Blog page.',
            },
            {
              step: '2',
              title: 'Title',
              desc: 'Make it descriptive and include the city and event type. Good examples: "Pink Balloon Arch — Overland Park Birthday Party" or "Gold Balloon Garland — Kansas City Corporate Gala". Bad example: "Birthday Party". The more specific, the better for Google.',
            },
            {
              step: '3',
              title: 'Slug (URL)',
              desc: 'Leave this blank — it auto-generates from your title. For example, "Pink Balloon Arch — Overland Park Birthday Party" becomes "/projects/pink-balloon-arch-overland-park-birthday-party". You can edit it manually if you want, but auto is fine.',
            },
            {
              step: '4',
              title: 'Excerpt',
              desc: 'Write 1-2 sentences that summarize the event. This shows up in the portfolio grid on your website. Example: "A stunning pink and gold balloon arch for Emma\'s 5th birthday party in Overland Park. Featuring a 12-foot organic garland with custom balloon bouquets."',
            },
            {
              step: '5',
              title: 'Content (the description)',
              desc: 'This is where you write about the event. Use the Markdown editor — just type normally, no special skills needed. Aim for at least 150 words. Describe what you created, the colors, the client\'s vision, the venue, how it turned out. The more you write, the better Google understands what you do. Tip: the right panel shows a live preview as you type.',
            },
            {
              step: '6',
              title: 'Featured Image',
              desc: 'The main photo that shows in the portfolio grid. Always add one — posts without a photo look blank. Click "Upload" and choose your best photo from the event. Use a high-quality photo (at least 1200px wide).',
            },
            {
              step: '7',
              title: 'Gallery Images',
              desc: 'Add multiple photos to showcase the full event. Click "Add photos" to upload several at once. Drag the thumbnails to reorder them. For before/after transformations, click the "Before" or "After" button on each photo — they\'ll show a badge on your website.',
            },
            {
              step: '8',
              title: 'Service Types',
              desc: 'Click the tags that describe what balloon services you used: Balloon Arch, Balloon Garland, Balloon Column, etc. You can select multiple. These become filter buttons on your portfolio page so visitors can find exactly what they\'re looking for.',
            },
            {
              step: '9',
              title: 'Event Types',
              desc: 'Click the tags that describe the type of event: Wedding, Birthday, Corporate, Baby Shower, etc. Again, select all that apply. These also become filter buttons.',
            },
            {
              step: '10',
              title: 'Geo City',
              desc: 'Pick the Kansas City area city where the event happened. This is VERY important for local SEO — it tells Google "this business does balloon decorations in Overland Park" which helps you show up when someone in Overland Park searches for balloon decorations.',
            },
            {
              step: '11',
              title: 'Client Testimonial',
              desc: 'If the client gave you a quote or review, paste it here along with their name. It shows up on the post page as a highlighted quote, which builds trust with new visitors.',
            },
            {
              step: '12',
              title: 'Focus Keyword',
              desc: 'Type the phrase you want Google to find you for with this specific post. Example: "balloon arch Overland Park birthday". The SEO Score checklist below it will show green checkmarks as you use that phrase in your title, description, content, and URL. Try to get all 4 green.',
            },
            {
              step: '13',
              title: 'SEO Settings',
              desc: 'These fields control how your post appears in Google search results. They auto-fill from your title and excerpt when you save — so if you\'ve filled those in well, you\'re already done. You can customize them if you want. Meta Title = the blue link in Google (max 60 characters). Meta Description = the gray text under it (max 160 characters). The character counters turn green when you\'re in the ideal range.',
            },
            {
              step: '14',
              title: 'Status',
              desc: 'Draft = saved but not visible on your website. Published = live for everyone to see. Start as Draft while you\'re working on it, then switch to Published when it\'s ready.',
            },
            {
              step: '15',
              title: 'Click Save Post',
              desc: 'Your post is saved! If any SEO fields were empty, they\'ll be auto-filled from your content and you\'ll see a notification.',
            },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
              <div>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Eye className="w-4 h-4 text-blue-500" /> Preview Button</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          In the top right of the post editor, there's a <strong>Preview</strong> button. Click it to open your post in a new browser tab exactly as visitors will see it. Note: you need to save the post first before previewing — if you haven't saved yet, it'll remind you.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Copy className="w-4 h-4 text-purple-500" /> Duplicate Button</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each post in the list has a <strong>Duplicate</strong> button (the copy icon). Click it to create an exact copy of that post as a new draft. This is great when you do similar events — duplicate an old post and just update the photos, title, and description instead of starting from scratch.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><CheckSquare className="w-4 h-4 text-orange-500" /> Bulk Actions</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Check the boxes on the left side of multiple posts to select them. A toolbar appears at the top letting you change the status of all selected posts at once — useful for publishing a batch of drafts or archiving old posts.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="font-bold text-blue-800 mb-2">📅 How often should you post?</p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Post after <strong>every event</strong> you do — even small ones</li>
          <li>• Aim for at least 2-3 posts per week when you're busy</li>
          <li>• Google rewards websites that post consistently and frequently</li>
          <li>• Even a simple post with 3 photos and 150 words is better than nothing</li>
        </ul>
      </div>
    </div>
  );
}
