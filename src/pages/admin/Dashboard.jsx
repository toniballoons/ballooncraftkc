import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import * as Project from '@/entities/Project';
import * as ContactSubmission from '@/entities/ContactSubmission';
import * as Testimonial from '@/entities/Testimonial';
import {
  computeStatusCounts,
  computeWeeklyMessageCount,
  computeSeoHealthCounts,
} from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, MessageSquare, Star, CheckCircle2, AlertCircle, Lightbulb, ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── SEO Tips ─────────────────────────────────────────────────
const SEO_TIPS = [
  'Post after every event with photos — Google rewards fresh, consistent content.',
  "Include the city name in your post title (e.g. 'Balloon Arch — Overland Park Wedding') for local SEO.",
  'Add a focus keyword to every post before publishing.',
  'Write at least 150 words of description per post for better Google ranking.',
  'Tag every post with a Service Type and Event Type so visitors can filter your portfolio.',
  'Share each new post on social media right after publishing to boost early traffic.',
  'Ask happy clients for a Google review — it directly improves your local search ranking.',
];

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, href }) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tipIndex, setTipIndex] = useState(0);

  const { data: projects = [] } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => Project.list(),
    initialData: [],
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => ContactSubmission.list(),
    initialData: [],
  });
  const { data: testimonials = [] } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: () => Testimonial.list(),
    initialData: [],
  });

  const statusCounts = computeStatusCounts(projects);
  const weeklyMessages = computeWeeklyMessageCount(messages);
  const seoHealth = computeSeoHealthCounts(projects);
  const allSeoHealthy = seoHealth.missingMeta === 0 && seoHealth.missingKeyword === 0 && seoHealth.missingImage === 0;

  const recentProjects = [...projects].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const recentMessages = [...messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Dashboard</h1>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Posts" value={projects.length} icon={FileText} color="bg-blue-500" href="/admin/projects" />
        <StatCard title="Published" value={statusCounts.published} icon={FileText} color="bg-green-500" href="/admin/projects" />
        <StatCard title="Drafts" value={statusCounts.draft} icon={FileText} color="bg-yellow-500" href="/admin/projects" />
        <StatCard title="New Messages" value={weeklyMessages} icon={MessageSquare} color="bg-purple-500" href="/admin/messages" />
        <StatCard title="Testimonials" value={testimonials.length} icon={Star} color="bg-pink-500" href="/admin/testimonials" />
      </div>

      {/* ── Recent Activity + SEO Health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Recent Posts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Recent Posts
                <Link to="/admin/projects" className="text-xs text-primary font-normal hover:underline">View all</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentProjects.length === 0 ? (
                <p className="text-xs text-muted-foreground">No posts yet.</p>
              ) : recentProjects.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate('/admin/projects')}
                  className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.created_at ? formatDistanceToNow(new Date(p.created_at), { addSuffix: true }) : ''}
                    </p>
                  </div>
                  <Badge variant={p.status === 'published' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                    {p.status}
                  </Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Recent Messages
                <Link to="/admin/messages" className="text-xs text-primary font-normal hover:underline">View all</Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground">No messages yet.</p>
              ) : recentMessages.map(m => (
                <button
                  key={m.id}
                  onClick={() => navigate('/admin/messages')}
                  className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.created_at ? formatDistanceToNow(new Date(m.created_at), { addSuffix: true }) : ''}
                    </p>
                  </div>
                  {m.status === 'new' && (
                    <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* SEO Health + Tips */}
        <div className="space-y-4">
          {/* SEO Health Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">SEO Health</CardTitle>
            </CardHeader>
            <CardContent>
              {allSeoHealthy ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <p className="text-sm font-medium">All SEO fields complete!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {seoHealth.missingMeta > 0 && (
                    <button
                      onClick={() => navigate('/admin/projects')}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm">Missing meta description</span>
                      </div>
                      <span className="text-sm font-bold text-orange-500">{seoHealth.missingMeta}</span>
                    </button>
                  )}
                  {seoHealth.missingKeyword > 0 && (
                    <button
                      onClick={() => navigate('/admin/projects')}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-sm">Missing focus keyword</span>
                      </div>
                      <span className="text-sm font-bold text-yellow-500">{seoHealth.missingKeyword}</span>
                    </button>
                  )}
                  {seoHealth.missingImage > 0 && (
                    <button
                      onClick={() => navigate('/admin/projects')}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-sm">Missing featured image</span>
                      </div>
                      <span className="text-sm font-bold text-red-500">{seoHealth.missingImage}</span>
                    </button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Tips Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                SEO Tip
                <span className="ml-auto text-xs text-muted-foreground font-normal">
                  {tipIndex + 1} of {SEO_TIPS.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{SEO_TIPS[tipIndex]}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setTipIndex((tipIndex + 1) % SEO_TIPS.length)}
              >
                Next Tip <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
