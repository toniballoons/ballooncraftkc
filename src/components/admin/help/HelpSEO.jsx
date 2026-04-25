import React from 'react';
import { Search, TrendingUp, MapPin, FileText, Star, CheckCircle2 } from 'lucide-react';

export default function HelpSEO() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Search className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">SEO — Getting Found on Google</h2>
          <p className="text-sm text-muted-foreground">Plain English guide to ranking higher in search results</p>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <p className="font-bold text-orange-800 mb-1">What is SEO?</p>
        <p className="text-sm text-orange-700 leading-relaxed">
          SEO stands for Search Engine Optimization. It's the process of making your website show up higher when someone searches on Google. When someone in Kansas City types "balloon decorations for birthday party" — SEO determines whether your website shows up on page 1 or page 10. Page 1 gets almost all the clicks. Page 10 gets almost none.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> The Most Important Things You Can Do</h3>
        <div className="space-y-2">
          {[
            {
              num: '1',
              title: 'Post after every single event',
              desc: 'Google loves websites that publish new content regularly. Every post you create is another page Google can find and show to people searching for balloon decorations. 50 posts = 50 chances to be found. 5 posts = 5 chances.',
              color: 'bg-green-500',
            },
            {
              num: '2',
              title: 'Include the city name in your post titles',
              desc: 'Instead of "Pink Balloon Arch Birthday Party", write "Pink Balloon Arch — Overland Park Birthday Party". When someone searches "balloon arch Overland Park", your post is much more likely to show up.',
              color: 'bg-blue-500',
            },
            {
              num: '3',
              title: 'Write at least 150 words per post',
              desc: 'Google reads your content to understand what your page is about. More words = more context = better ranking. Describe the event, the colors, the client\'s vision, the venue, what you created. It doesn\'t have to be perfect — just genuine.',
              color: 'bg-purple-500',
            },
            {
              num: '4',
              title: 'Always add a featured image',
              desc: 'Posts with photos get more clicks in search results and on social media. Google also uses your images to understand your content. Always upload at least one photo per post.',
              color: 'bg-pink-500',
            },
            {
              num: '5',
              title: 'Fill in the Focus Keyword',
              desc: 'The focus keyword is the phrase you want to rank for with that specific post. Use it in your title, your description, your content, and your URL. The SEO score checklist shows you how you\'re doing.',
              color: 'bg-orange-500',
            },
            {
              num: '6',
              title: 'Tag every post with Service Type and Event Type',
              desc: 'These tags help visitors filter your portfolio AND help Google understand what services you offer. A post tagged "Balloon Arch" + "Wedding" tells Google you do wedding balloon arches.',
              color: 'bg-teal-500',
            },
          ].map(s => (
            <div key={s.num} className="flex gap-3">
              <div className={`w-7 h-7 rounded-full ${s.color} text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}>{s.num}</div>
              <div>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base">SEO Terms Explained Simply</h3>
        <div className="space-y-2">
          {[
            {
              term: 'Meta Title',
              simple: 'The blue link text in Google search results',
              detail: 'This is what people see as the clickable headline in Google. Keep it under 60 characters. Include your focus keyword and the city. Example: "Pink Balloon Arch — Overland Park Birthday | BalloonCraft KC". It auto-fills from your post title when you save.',
            },
            {
              term: 'Meta Description',
              simple: 'The gray text under the title in Google',
              detail: 'This is the 1-2 sentence description that appears under your title in search results. It doesn\'t directly affect your ranking but it affects whether people click. Write something that makes them want to click. Keep it under 160 characters. It auto-fills from your excerpt when you save.',
            },
            {
              term: 'Focus Keyword',
              simple: 'The phrase you want Google to find you for',
              detail: 'Pick one specific phrase per post. Think about what your ideal client would type into Google. "balloon arch Kansas City wedding" is better than just "balloons". Use it naturally in your title, description, and content.',
            },
            {
              term: 'Slug / URL',
              simple: 'The web address of your post',
              detail: 'Example: /projects/pink-balloon-arch-overland-park-birthday. It auto-generates from your title. Keep it short and descriptive. Include your focus keyword if possible. Never use spaces — use hyphens instead.',
            },
            {
              term: 'Canonical URL',
              simple: 'Tells Google which version of a page is the "real" one',
              detail: 'Your website handles this automatically. You don\'t need to do anything.',
            },
            {
              term: 'Sitemap',
              simple: 'A list of all your pages that you give to Google',
              detail: 'Your website automatically generates a sitemap at /sitemap.xml. Submit this URL to Google Search Console so Google can find all your pages faster. Do this once when you first set up your site.',
            },
            {
              term: 'Local SEO',
              simple: 'Getting found by people in your city',
              detail: 'Since you serve Kansas City and surrounding areas, local SEO is your most important focus. Use city names in your posts, keep your Google Business Profile updated, and get Google reviews. These three things will get you more local bookings than anything else.',
            },
          ].map(t => (
            <div key={t.term} className="bg-muted/40 rounded-xl p-4 border">
              <p className="font-semibold text-sm">{t.term} <span className="text-muted-foreground font-normal">— {t.simple}</span></p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> Local SEO — Your Biggest Opportunity</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You don't need to compete with balloon companies in New York or LA. You just need to be the #1 result in Kansas City. Here's how:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• <strong>Google Business Profile</strong> — claim and complete your free listing at business.google.com. Add photos, hours, services, and your website URL.</li>
          <li>• <strong>City tags on every post</strong> — use the Geo City field to tag which KC area city each event was in</li>
          <li>• <strong>City names in titles</strong> — "Balloon Arch Overland Park" beats "Balloon Arch" every time</li>
          <li>• <strong>Google reviews</strong> — ask every happy client. 10+ reviews puts you on the map (literally)</li>
          <li>• <strong>Consistent NAP</strong> — your Name, Address, and Phone number should be identical everywhere online</li>
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> SEO Score Checklist (in the post editor)</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When you enter a Focus Keyword in the post editor, a checklist appears showing 4 items:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>✅ <strong>Keyword in title</strong> — your focus keyword appears in the post title</li>
          <li>✅ <strong>Keyword in meta description</strong> — your focus keyword appears in the meta description</li>
          <li>✅ <strong>Keyword in content</strong> — your focus keyword appears somewhere in the post body</li>
          <li>✅ <strong>Keyword in slug</strong> — your focus keyword appears in the URL</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Try to get all 4 green checkmarks before publishing. A score of 4/4 means Google will clearly understand what your post is about.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="font-bold text-green-800 mb-2">📈 How long does SEO take?</p>
        <p className="text-sm text-green-700 leading-relaxed">
          SEO is not instant — it typically takes 3-6 months to see significant results. But every post you publish is an investment that keeps paying off. A post you write today could be bringing you clients 2 years from now. The key is consistency: post regularly, use good titles, write real descriptions, and add photos. Over time, you'll climb the rankings and the bookings will follow.
        </p>
      </div>
    </div>
  );
}
