import React from 'react';
import { Star, Plus, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';

export default function HelpTestimonials() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
          <Star className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Testimonials</h2>
          <p className="text-sm text-muted-foreground">Client reviews that build trust and win bookings</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Testimonials are client reviews that appear on your Testimonials page and — if marked as Featured — on your homepage too. They're one of the most powerful things on your website because potential clients trust other clients more than they trust you (no offense!). The more genuine reviews you have, the more bookings you'll get.
      </p>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Plus className="w-4 h-4 text-yellow-500" /> How to Add a Testimonial</h3>
        <div className="space-y-2">
          {[
            { step: '1', text: 'Click "Add Testimonial" in the top right corner.' },
            { step: '2', text: 'Name — the client\'s name (first name and last initial is fine, e.g. "Sarah M.")' },
            { step: '3', text: 'Role / Event Type — what kind of event they had, e.g. "Wedding Client" or "Birthday Party Mom"' },
            { step: '4', text: 'Quote — paste exactly what they said. Copy it from their Google review, text message, or email. Keep it authentic.' },
            { step: '5', text: 'Rating — click the stars to set their rating (1-5). Most happy clients are 5 stars.' },
            { step: '6', text: 'Avatar — optionally upload their photo. If you don\'t have one, their initial will show in a colored circle.' },
            { step: '7', text: 'Status — set to "Approved" to make it visible on your website. "Pending" and "Hidden" keep it off the site.' },
            { step: '8', text: 'Featured — toggle ON to show this review on your homepage. Pick your best 3-4 reviews to feature.' },
            { step: '9', text: 'Click Save.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base">Status Options Explained</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <Eye className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Approved</p>
              <p className="text-green-700 text-xs">Visible on your Testimonials page. Use this for reviews you want to show.</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
            <EyeOff className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">Pending</p>
              <p className="text-yellow-700 text-xs">Saved but not visible yet. Use this while you're deciding whether to publish it.</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <EyeOff className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-700">Hidden</p>
              <p className="text-gray-600 text-xs">Permanently hidden from visitors. Use this for reviews you want to keep on file but not display.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><ArrowUp className="w-4 h-4" /><ArrowDown className="w-4 h-4" /> Reordering Testimonials</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each testimonial has up and down arrow buttons on the left side. Click them to change the order they appear on your website. Put your most impressive reviews at the top.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="font-bold text-yellow-800 mb-2">⭐ How to get more reviews</p>
        <ul className="text-sm text-yellow-700 space-y-1.5">
          <li>• Ask every happy client right after the event — that's when they're most excited</li>
          <li>• Send them a text: "Would you mind leaving us a quick Google review? It really helps! [link]"</li>
          <li>• Also ask them to send you a quote you can add here</li>
          <li>• Aim for at least 10 reviews on Google — it significantly boosts your local search ranking</li>
          <li>• Respond to every Google review (even just "Thank you so much!")</li>
        </ul>
      </div>
    </div>
  );
}
