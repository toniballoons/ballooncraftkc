import React from 'react';
import { Settings, Save, RotateCcw, Code, Eye } from 'lucide-react';

export default function HelpPageEditor() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Site Content</h2>
          <p className="text-sm text-muted-foreground">Edit every page on your website — no coding needed</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        The Site Content area inside your CMS lets you change the text, images, and content on every page of your website. Click a tab at the top to select a page, make your changes in the form fields, and click Save. Your website updates immediately.
      </p>

      <div className="space-y-3">
        <h3 className="font-bold text-base">The Page Tabs — What Each One Controls</h3>
        <div className="space-y-2">
          {[
            {
              tab: '🏠 Hero',
              page: 'Homepage banner',
              fields: 'Headline (the big text), Subheadline (smaller text below), CTA Button text and link (the main button), second button text and link, hero image (the big photo on the right)',
            },
            {
              tab: '👥 About',
              page: 'About page',
              fields: 'Page title, subtitle, intro paragraph, your story, your mission, team members (name, role, bio, photo for each), your values (title and description for each)',
            },
            {
              tab: '📬 Contact',
              page: 'Contact page',
              fields: 'Page title, subtitle, your email address, phone number, physical address, business hours, contact page image, social media links (Instagram, Facebook, etc.)',
            },
            {
              tab: '⭐ Testimonials',
              page: 'Testimonials page',
              fields: 'Page title and subtitle text at the top of the page',
            },
            {
              tab: '🖼️ Projects',
              page: 'Portfolio page',
              fields: 'Page title and subtitle text at the top of the portfolio grid',
            },
            {
              tab: '🔗 Navbar',
              page: 'Navigation bar (top of every page)',
              fields: 'Your business name/logo text, navigation link labels and URLs',
            },
            {
              tab: '🦶 Footer',
              page: 'Footer (bottom of every page)',
              fields: 'Footer tagline, copyright text, footer links, social media links',
            },
            {
              tab: '🔒 Privacy / Terms / Legal',
              page: 'Legal pages',
              fields: 'The text content of your privacy policy, terms of service, and legal pages',
            },
          ].map(p => (
            <div key={p.tab} className="bg-muted/40 rounded-xl p-4 border">
              <div className="flex items-start gap-3">
                <div>
                  <p className="font-semibold text-sm">{p.tab} <span className="text-muted-foreground font-normal">— {p.page}</span></p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed"><strong>What you can edit:</strong> {p.fields}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Save className="w-4 h-4 text-green-500" /> Saving Your Changes</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Click the <strong>Save</strong> button in the top right corner after making changes. Your website updates immediately — no waiting, no publishing step needed. If you navigate away without saving, your changes will be lost.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><RotateCcw className="w-4 h-4 text-orange-500" /> Reset Button</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong>Reset</strong> button puts the page back to its original default content. <strong>Warning:</strong> this undoes all your custom changes for that page. Only use this if you want to start fresh. It doesn't save automatically — you'd still need to click Save after resetting.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Eye className="w-4 h-4 text-blue-500" /> Live Preview</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The right side of the screen shows a live preview of the page as you edit. It updates as you type. You can also click <strong>Open Page</strong> (the small link in the top right of the editor card) to open the actual live page in a new tab.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Code className="w-4 h-4 text-gray-500" /> JSON Button</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The <strong>JSON</strong> button switches to a raw code view of the page content. <strong>Don't use this unless you know what you're doing</strong> — it's easy to accidentally break something. Stick to the visual editor (click "Visual" to switch back).
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="font-bold text-indigo-800 mb-2">💡 Tips for Site Content</p>
        <ul className="text-sm text-indigo-700 space-y-1.5">
          <li>• Update your Contact page with your real phone number, email, and hours right away</li>
          <li>• Add your Instagram and Facebook links in the Contact and Footer sections</li>
          <li>• Write your About page in your own voice — clients connect with real stories</li>
          <li>• Update the Hero headline to include "Kansas City" for local SEO</li>
          <li>• Add a real photo of yourself or your work to the About page</li>
        </ul>
      </div>
    </div>
  );
}
