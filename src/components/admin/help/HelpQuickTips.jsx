import React from 'react';
import { Zap, Instagram, Star, Clock, Camera, TrendingUp } from 'lucide-react';

export default function HelpQuickTips() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Quick Tips for Success</h2>
          <p className="text-sm text-muted-foreground">Simple habits that will grow your business</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-5 h-5 text-pink-600" />
            <p className="font-bold text-pink-800">📸 Photo Every Event</p>
          </div>
          <p className="text-sm text-pink-700 leading-relaxed">
            Before you leave every event, take at least 10-15 photos from different angles. Get wide shots showing the full setup, close-ups of details, and photos with people enjoying the decorations. These photos are your most valuable marketing asset.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <p className="font-bold text-purple-800">⏰ Post Within 24 Hours</p>
          </div>
          <p className="text-sm text-purple-700 leading-relaxed">
            Post about each event while it's fresh in your mind. The details are easier to write, the photos are already on your phone, and Google indexes new content faster when it's published promptly after the event date.
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Instagram className="w-5 h-5 text-orange-600" />
            <p className="font-bold text-orange-800">📱 Share on Social Media</p>
          </div>
          <p className="text-sm text-orange-700 leading-relaxed">
            After publishing a post, share the link on your Instagram and Facebook. Add the photos to your Instagram feed too. Social media traffic to your website is a positive signal to Google. Link your website in your Instagram bio.
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-green-600" />
            <p className="font-bold text-green-800">⭐ Ask for Reviews</p>
          </div>
          <p className="text-sm text-green-700 leading-relaxed">
            Text every happy client right after the event: "It was so great working with you! Would you mind leaving us a quick Google review? It really helps our small business. [your Google review link]". Most people are happy to help if you ask directly.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <p className="font-bold text-blue-800">📊 Check Your Dashboard Weekly</p>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">
            Spend 5 minutes every Monday checking your Dashboard. Look at the SEO Health panel — fix any posts missing meta descriptions or focus keywords. Check new messages. Review your recent posts. Small consistent actions add up over time.
          </p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-teal-600" />
            <p className="font-bold text-teal-800">💬 Reply to Messages Fast</p>
          </div>
          <p className="text-sm text-teal-700 leading-relaxed">
            Check your Messages page daily. Responding within a few hours dramatically increases your chance of booking. Set up email notifications on your phone so you know the moment someone reaches out.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary/10 to-pink-100 border border-primary/20 rounded-xl p-5">
        <p className="font-bold text-lg mb-3">🎯 Your Weekly Routine (takes 30 minutes)</p>
        <div className="space-y-2">
          {[
            { day: 'Monday', task: 'Check Dashboard — fix any SEO health issues, reply to any new messages' },
            { day: 'After each event', task: 'Upload photos, create a new post with description, tag service/event types and city, publish' },
            { day: 'After each event', task: 'Text the client asking for a Google review' },
            { day: 'After publishing', task: 'Share the post link on Instagram and Facebook' },
            { day: 'Monthly', task: 'Review your Testimonials — add any new reviews you\'ve received' },
          ].map((r, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">{r.day}</span>
              <p className="text-sm text-muted-foreground">{r.task}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
