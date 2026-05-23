import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as SiteContent from '@/entities/SiteContent';
import { uploadFile } from '@/lib/uploadFile';

import { useAllSiteContent } from '@/lib/useSiteContent';
import { useTheme } from '@/lib/ThemeContext';
import { DEFAULT_CONTENT } from '@/lib/siteDefaults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Pencil, ExternalLink, Palette, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Extract all image fields from content with their path so we can patch them back
function extractImageFields(obj, path = []) {
  const fields = [];
  if (!obj || typeof obj !== 'object') return fields;
  for (const [k, v] of Object.entries(obj)) {
    const currentPath = [...path, k];
    const isImageKey = k.includes('image') || k.includes('img') || k.includes('bg_image') || k.includes('avatar') || k.includes('og_image') || k.includes('featured_image') || k.includes('photo');
    if (typeof v === 'string' && v.startsWith('http') && isImageKey) {
      fields.push({ path: currentPath, url: v, label: currentPath.join(' › ') });
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        fields.push(...extractImageFields(item, [...currentPath, i]));
      });
    } else if (typeof v === 'object' && v !== null) {
      fields.push(...extractImageFields(v, currentPath));
    }
  }
  return fields;
}

// Deep-set a value at a path in an object (immutable)
function setAtPath(obj, path, value) {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = [...obj];
    copy[head] = setAtPath(copy[head], rest, value);
    return copy;
  }
  return { ...obj, [head]: setAtPath(obj[head], rest, value) };
}

function ImageCard({ field, pageKey, onReplace }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef();
  const openPicker = () => fileRef.current?.click();
  const handlePickerKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploadFile(file);
      onReplace(pageKey, field.path, file_url);
      toast.success('Image replaced!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const label = field.path.slice(1).join(' › ');

  return (
    <div className="rounded-xl overflow-hidden border bg-card shadow-sm group">
      <div className="aspect-video bg-muted relative">
        <img src={field.url} alt={label} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <label
            className="cursor-pointer bg-white text-black text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            tabIndex={0}
            onKeyDown={handlePickerKeyDown}
          >
            <Upload className="w-3.5 h-3.5" /> {uploading ? 'Uploading...' : 'Replace'}
            <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} ref={fileRef} />
          </label>
          <a href={field.url} target="_blank" rel="noopener noreferrer"
            className="bg-white/20 text-white text-xs px-2 py-2 rounded-lg flex items-center gap-1 hover:bg-white/30"
            aria-label={`${label} preview (opens in a new tab)`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-white text-sm font-semibold animate-pulse">Uploading...</div>
          </div>
        )}
      </div>
      <div className="p-2 space-y-1">
        <p className="text-xs font-semibold text-foreground truncate capitalize">{label.replace(/_/g, ' ')}</p>
        <Badge variant="outline" className="text-xs">{pageKey}</Badge>
      </div>
    </div>
  );
}

export default function SiteAssets() {
  const queryClient = useQueryClient();
  const { content } = useAllSiteContent();
  const { theme, activeThemeId } = useTheme();

  const { data: allDbContent = [] } = useQuery({
    queryKey: ['admin-site-content'],
    queryFn: () => SiteContent.list(),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ pageKey, newContent }) => {
      const json = JSON.stringify(newContent);
      const existing = allDbContent.find(c => c.page_key === pageKey);
      if (existing) {
        await SiteContent.update(existing.id, { content_json: json });
      } else {
        await SiteContent.create({ page_key: pageKey, content_json: json });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-content'] });
      queryClient.invalidateQueries({ queryKey: ['site-content'] });
      queryClient.invalidateQueries({ queryKey: ['site-content-all'] });
    },
  });

  const handleReplace = (pageKey, path, newUrl) => {
    const pageContent = content[pageKey] || DEFAULT_CONTENT[pageKey] || {};
    // path[0] is the pageKey, path[1..] is the actual path within the page content
    const innerPath = path.slice(1);
    const newContent = setAtPath(pageContent, innerPath, newUrl);
    saveMutation.mutate({ pageKey, newContent });
  };

  // Gather all images grouped by page
  const pageKeys = Object.keys(DEFAULT_CONTENT).filter(k => !['privacy', 'terms', 'legal'].includes(k));
  const allImagesByPage = pageKeys.map(pageKey => {
    const pageContent = content[pageKey] || {};
    const fields = extractImageFields(pageContent, [pageKey]);
    return { pageKey, fields };
  }).filter(p => p.fields.length > 0);

  const totalImages = allImagesByPage.reduce((sum, p) => sum + p.fields.length, 0);

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Site Images</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalImages} images across your site — hover any image to replace it instantly</p>
        </div>
        <Link to="/admin/pages">
          <Button variant="outline" size="sm">
            <Pencil className="w-4 h-4 mr-1" /> Edit Content
          </Button>
        </Link>
      </div>

      {/* Active Theme */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Active Theme</CardTitle>
            <Link to="/admin/theme">
              <Button size="sm" variant="outline" className="text-xs h-7">Change Theme</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="w-20 h-12 rounded-xl shadow-md flex-shrink-0 border" style={{ background: theme.hero?.bg || '#ddd' }} />
          <div>
            <div className="font-bold text-base">{theme.emoji} {theme.name}</div>
            <div className="text-muted-foreground text-sm">{theme.description}</div>
            <div className="flex gap-2 mt-2">
              {(theme.preview || []).map((c, i) => (
                <span key={i} className="w-5 h-5 rounded-full border shadow-sm" style={{ background: c }} title={c} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images by page */}
      {allImagesByPage.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No images found in site content yet.</p>
          <Link to="/admin/pages"><Button className="mt-4" size="sm">Go to CMS</Button></Link>
        </div>
      ) : (
        allImagesByPage.map(({ pageKey, fields }) => (
          <div key={pageKey}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-bold capitalize">{pageKey}</h2>
              <Badge variant="outline" className="text-xs">{fields.length} image{fields.length !== 1 ? 's' : ''}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fields.map((field, i) => (
                <ImageCard key={i} field={field} pageKey={pageKey} onReplace={handleReplace} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
