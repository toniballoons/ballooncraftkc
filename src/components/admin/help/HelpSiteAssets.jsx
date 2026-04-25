import React from 'react';
import { Image, Upload, ExternalLink, Palette } from 'lucide-react';

export default function HelpSiteAssets() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
          <Image className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Site Assets</h2>
          <p className="text-sm text-muted-foreground">Replace images across your website without editing pages one by one</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Site Assets gives you a visual overview of every image currently used across all your website pages. Instead of going into each page editor to swap a photo, you can hover over any image here and replace it instantly.
      </p>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Upload className="w-4 h-4 text-teal-500" /> How to Replace an Image</h3>
        <div className="space-y-2">
          {[
            { step: '1', text: 'Find the image you want to replace — images are organized by page (Hero, About, Contact, etc.)' },
            { step: '2', text: 'Hover your mouse over the image — a dark overlay appears with a "Replace" button' },
            { step: '3', text: 'Click "Replace" and choose a new photo from your computer' },
            { step: '4', text: 'The new photo uploads automatically and replaces the old one on your website immediately' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><ExternalLink className="w-4 h-4 text-blue-500" /> Viewing the Full Image</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When you hover over an image, there's also a small link icon next to the Replace button. Click it to open the full-size image in a new tab — useful for checking image quality.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Palette className="w-4 h-4 text-pink-500" /> Active Theme Panel</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          At the top of the Site Assets page, there's a panel showing your currently active theme — its name, description, and color swatches. Click <strong>Change Theme</strong> to jump to the Theme Settings page.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base">Which images show here?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Only images that are saved in your page content show here. If a page section has an image URL stored in it, it appears in this grid. Images are grouped by page:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>hero</strong> — the main homepage banner image</li>
          <li>• <strong>about</strong> — the About page photo and team member photos</li>
          <li>• <strong>contact</strong> — the Contact page image</li>
          <li>• Other pages as you add images to them</li>
        </ul>
      </div>

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <p className="font-bold text-teal-800 mb-2">📸 Photo tips for your website</p>
        <ul className="text-sm text-teal-700 space-y-1.5">
          <li>• Use real photos of your actual work — not stock photos</li>
          <li>• Minimum size: 1200px wide for best quality</li>
          <li>• File formats: JPG, PNG, or WebP work best</li>
          <li>• Keep file sizes under 5MB for fast loading</li>
          <li>• Good lighting makes a huge difference — natural light or a ring light works great</li>
          <li>• Take photos from multiple angles at every event</li>
        </ul>
      </div>
    </div>
  );
}
