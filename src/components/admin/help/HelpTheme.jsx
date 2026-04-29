import React from 'react';
import { Palette, Eye, Sparkles } from 'lucide-react';

export default function HelpTheme() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
          <Palette className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Theme Settings</h2>
          <p className="text-sm text-muted-foreground">Change the entire look of your website with one click</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Your theme controls the colors, fonts, button styles, navigation bar style, hero background, and footer of your entire website. Changing your theme is like redecorating your whole website in seconds — no design skills needed.
      </p>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Eye className="w-4 h-4 text-blue-500" /> How to Preview a Theme</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Just <strong>hover your mouse over any theme card</strong>. The admin panel will instantly change to show you what that theme looks like — colors, fonts, everything. Move your mouse away and it goes back to your current theme. This lets you try as many themes as you want without committing to any of them.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-sm text-blue-700">💡 A blue "Previewing" banner appears at the top while you're hovering. You can also click the <strong>Apply</strong> button in that banner to save the theme you're previewing.</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-500" /> How to Apply a Theme</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When you find a theme you love, click the <strong>Apply</strong> button on that theme card (it appears when you hover). This saves the theme to your website — your live site will update immediately for all visitors.
        </p>
        <p className="text-sm text-muted-foreground">
          The currently active theme has a checkmark badge and a highlighted border so you always know which one is live.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base">Theme Categories</h3>
        <p className="text-sm text-muted-foreground mb-2">Use the category buttons to filter themes by style:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { cat: 'Kids', desc: 'Bright, playful, colorful — great for birthday parties' },
            { cat: 'Wedding', desc: 'Elegant, romantic, sophisticated' },
            { cat: 'Baby Shower', desc: 'Soft pastels, gentle and sweet' },
            { cat: 'Corporate', desc: 'Professional, clean, business-focused' },
            { cat: 'Graduation', desc: 'Bold, celebratory, achievement-themed' },
            { cat: 'Holiday', desc: 'Seasonal themes for Christmas, Halloween, NYE, etc.' },
            { cat: 'Fun', desc: 'Festival, tropical, retro, disco vibes' },
            { cat: 'Seasonal', desc: 'Spring, summer, autumn themes' },
          ].map(c => (
            <div key={c.cat} className="bg-muted/40 rounded-xl p-3 border">
              <p className="font-semibold text-xs">{c.cat}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base">What Does a Theme Control?</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• <strong>Colors</strong> — primary color, secondary color, accent color, background</li>
          <li>• <strong>Fonts</strong> — the display font (headings) and body font</li>
          <li>• <strong>Navigation bar</strong> — background color, text color, logo color, style (solid, gradient, glass, etc.)</li>
          <li>• <strong>Hero section</strong> — the background gradient or color of your homepage banner</li>
          <li>• <strong>Footer</strong> — background color and text color</li>
          <li>• <strong>Button style</strong> — rounded, square, outlined, etc.</li>
          <li>• <strong>Decorations</strong> — the emoji decorations that appear in hero sections</li>
          <li>• <strong>Border radius</strong> — how rounded the corners of cards and buttons are</li>
        </ul>
      </div>

      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <p className="font-bold text-pink-800 mb-2">🎨 Which theme should I pick?</p>
        <ul className="text-sm text-pink-700 space-y-1.5">
          <li>• Pick something that matches your brand colors if you have them</li>
          <li>• Think about your most common clients — if you do mostly kids' parties, a bright playful theme works great</li>
          <li>• If you do a mix of everything, a versatile theme like "Rainbow Birthday" or a clean corporate theme works for all event types</li>
          <li>• You can change it anytime — there's no wrong answer, and it takes 2 seconds to switch</li>
          <li>• Use the search bar to find themes by name or description</li>
        </ul>
      </div>
    </div>
  );
}
