import React from 'react';
import { computeSeoScore } from '@/lib/seo';
import { CheckCircle2, XCircle } from 'lucide-react';

const LABELS = [
  'Keyword in title',
  'Keyword in meta description',
  'Keyword in content',
  'Keyword in slug',
];

/**
 * Displays a live SEO score checklist for a focus keyword.
 */
export default function FocusKeywordPanel({ keyword = '', post = {} }) {
  const { score, checks } = computeSeoScore(keyword, post);

  if (!keyword) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Enter a focus keyword above to see your SEO score.
      </p>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">SEO Score</p>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${score === 4 ? 'bg-green-100 text-green-700' : score >= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
          {score} / 4
        </span>
      </div>
      <ul className="space-y-1">
        {LABELS.map((label, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            {checks[i]
              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            }
            <span className={checks[i] ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
