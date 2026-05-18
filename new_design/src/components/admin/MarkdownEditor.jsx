import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';

/**
 * Lightweight regex-based Markdown renderer.
 * Supports: H1–H3, bold, italic, unordered lists, ordered lists, links.
 */
function renderMarkdown(md) {
  if (!md) return '';
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline" target="_blank" rel="noopener">$1</a>')
    // Unordered lists
    .replace(/^\s*[-*+] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Wrap consecutive <li> in <ul>/<ol> — simple approach: wrap all li blocks
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, match => `<ul class="my-2 space-y-0.5">${match}</ul>`)
    // Paragraphs: lines not already wrapped in a block tag
    .replace(/^(?!<[hulo]|<\/[hulo])(.+)$/gm, '<p class="mb-2">$1</p>');

  return html;
}

export default function MarkdownEditor({ value = '', onChange, label = 'Content' }) {
  const preview = useMemo(() => renderMarkdown(value), [value]);

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-sm font-semibold">{label}</Label>}
      <p className="text-xs text-muted-foreground">Write in Markdown. Preview updates live on the right.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Editor */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">✏️ Editor</p>
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full h-64 font-mono text-sm p-3 border rounded-xl bg-gray-50 resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder={`# Event Title\n\nDescribe the event here...\n\n**Bold text**, *italic text*\n\n- Bullet point\n- Another point`}
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            Tip: # Heading, **bold**, *italic*, - list, [link](url)
          </p>
        </div>
        {/* Preview */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">👁️ Preview</p>
          <div
            className="w-full h-64 p-3 border rounded-xl bg-white overflow-y-auto text-sm prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: preview || '<p class="text-muted-foreground italic">Start typing to see a preview...</p>' }}
          />
        </div>
      </div>
    </div>
  );
}
