import React from 'react';
import { LayoutDashboard, TrendingUp, MessageSquare, AlertCircle, Lightbulb } from 'lucide-react';

export default function HelpDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">Your home base — everything at a glance</p>
        </div>
      </div>

      <p className="text-muted-foreground leading-relaxed">
        Every time you log in, you land on the Dashboard. Think of it as your control room — it shows you what's happening on your website right now without having to click around.
      </p>

      <div className="space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> The 5 Stat Cards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'Total Posts', desc: 'How many portfolio/blog posts you have in total — published, drafts, and archived combined.' },
            { title: 'Published Posts', desc: 'Posts that are live on your website right now. Visitors can see these.' },
            { title: 'Drafts', desc: 'Posts you\'ve started but haven\'t published yet. Only you can see these.' },
            { title: 'New Messages This Week', desc: 'Contact form submissions received in the last 7 days. Check these daily — fast replies = more bookings!' },
            { title: 'Testimonials', desc: 'Total number of client reviews you\'ve added. Click to go manage them.' },
          ].map(s => (
            <div key={s.title} className="bg-muted/40 rounded-xl p-4 border">
              <p className="font-semibold text-sm mb-1">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-500" /> Recent Activity Feed</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Below the stat cards you'll see two lists side by side:
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2"><span className="text-foreground font-semibold min-w-fit">Recent Posts:</span> Your last 5 posts. Click any one to jump straight to editing it.</li>
          <li className="flex gap-2"><span className="text-foreground font-semibold min-w-fit">Recent Messages:</span> Your last 5 contact form submissions. Click to go to the Messages page.</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><AlertCircle className="w-4 h-4 text-orange-500" /> SEO Health Panel</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This panel tells you which of your published posts are missing important information that Google needs. If any of these numbers are above zero, click them to go fix those posts.
        </p>
        <ul className="space-y-2 text-sm">
          <li className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="font-semibold text-orange-800">Missing meta description</p>
            <p className="text-orange-700 text-xs mt-1">The meta description is the short text that appears under your post title in Google search results. Without it, Google makes something up — and it's usually not great. Fix it by editing the post and filling in the Meta Description field in the SEO Settings section.</p>
          </li>
          <li className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="font-semibold text-yellow-800">Missing focus keyword</p>
            <p className="text-yellow-700 text-xs mt-1">The focus keyword is the phrase you want Google to find you for (e.g. "balloon arch Kansas City wedding"). Without it, Google doesn't know what your post is about. Fix it by editing the post and filling in the Focus Keyword field.</p>
          </li>
          <li className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="font-semibold text-red-800">Missing featured image</p>
            <p className="text-red-700 text-xs mt-1">Posts without a featured image look blank in your portfolio grid and don't get shared well on social media. Always add a photo! Fix it by editing the post and uploading a Featured Image.</p>
          </li>
        </ul>
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          🎉 When all three counts are zero, you'll see a green "All SEO fields complete!" message. That's the goal!
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-500" /> SEO Tips Card</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The tips card in the bottom right shows you one SEO tip at a time. Click <strong>Next Tip</strong> to cycle through all 7 tips. These are practical things you can do right now to help Google find your business faster. Read through all of them — they're short and worth it!
        </p>
      </div>
    </div>
  );
}
