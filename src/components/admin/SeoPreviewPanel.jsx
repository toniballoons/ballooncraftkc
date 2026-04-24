import React from 'react';

/**
 * Renders a simulated Google search result snippet.
 * Updates in real time from props — no state needed.
 */
export default function SeoPreviewPanel({ metaTitle = '', metaDescription = '', slug = '', domain = 'yourdomain.com' }) {
  const displayTitle = metaTitle.length > 60
    ? metaTitle.slice(0, 60) + '…'
    : metaTitle || 'Post Title';

  const displayDesc = metaDescription.length > 160
    ? metaDescription.slice(0, 160) + '…'
    : metaDescription || 'Add a meta description to control how this post appears in Google search results.';

  const displayUrl = slug
    ? `${domain} › projects › ${slug}`
    : `${domain} › projects › your-post-slug`;

  return (
    <div className="rounded-xl border bg-white p-4 space-y-1 font-sans">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Google Preview</p>
      {/* Title */}
      <p className="text-[#1a0dab] text-lg leading-snug hover:underline cursor-pointer truncate">
        {displayTitle}
      </p>
      {/* URL breadcrumb */}
      <p className="text-[#006621] text-sm truncate">{displayUrl}</p>
      {/* Description */}
      <p className="text-[#545454] text-sm leading-relaxed line-clamp-2">{displayDesc}</p>
    </div>
  );
}
