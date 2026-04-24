import React, { useState, useCallback } from 'react';
import { THEMES, THEME_CATEGORIES } from '@/lib/themes';
import { useTheme } from '@/lib/ThemeContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Search, Eye, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Apply a theme's CSS variables to the document root for live preview
function applyThemeCss(theme) {
  if (!theme?.css) return;
  const root = document.documentElement;
  Object.entries(theme.css).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function ThemeCard({ theme, isActive, isPreviewing, onPreview, onClearPreview, onApply }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer border-4 transition-all duration-200
        ${isActive ? 'border-primary shadow-xl scale-[1.02]' : ''}
        ${isPreviewing && !isActive ? 'border-blue-400 shadow-xl scale-[1.02]' : ''}
        ${!isActive && !isPreviewing ? 'border-transparent hover:border-primary/40 hover:shadow-lg' : ''}
      `}
      onMouseEnter={() => onPreview(theme)}
      onMouseLeave={onClearPreview}
    >
      {/* Preview swatch */}
      <div
        className="h-28 w-full relative flex items-end"
        style={{ background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1] || theme.preview[0]}, ${theme.preview[2] || theme.preview[0]})` }}
      >
        {/* Simulated nav bar */}
        <div className="absolute top-0 left-0 right-0 h-7 flex items-center px-2 gap-1" style={{ background: theme.nav.bg || 'rgba(0,0,0,0.3)' }}>
          <span className="text-[9px] font-bold" style={{ color: theme.nav.logoColor || '#fff' }}>● {theme.name}</span>
          <div className="ml-auto flex gap-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-1.5 rounded-full opacity-60" style={{ background: theme.nav.textColor || '#fff' }} />
            ))}
          </div>
        </div>
        {/* Decorations */}
        <div className="absolute inset-0 flex items-center justify-center gap-1 pt-6">
          {(theme.decorations || []).slice(0, 3).map((d, i) => (
            <span key={i} className="drop-shadow" style={{ fontSize: '20px', opacity: 0.8 }}>{d}</span>
          ))}
        </div>
        {/* Simulated footer strip */}
        <div className="w-full h-5 flex items-center px-2" style={{ background: theme.footer.bg || '#1a1a1a' }}>
          <div className="w-12 h-1 rounded-full opacity-40" style={{ background: theme.footer.textColor || '#fff' }} />
        </div>
        {/* Active check */}
        {isActive && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        {/* Previewing indicator */}
        {isPreviewing && !isActive && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
            <Eye className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Info + Apply button */}
      <div className="p-2.5 bg-white">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-base">{theme.emoji}</span>
          <span className="text-xs font-bold truncate">{theme.name}</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2 mb-1.5">{theme.description}</p>
        <div className="flex items-center justify-between gap-1">
          <Badge variant="outline" className="text-[9px] capitalize">{theme.category.replace('_', ' ')}</Badge>
          {!isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); onApply(theme.id); }}
              className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
          )}
          {isActive && (
            <span className="text-[9px] font-bold text-primary">✓ Active</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ThemeSettings() {
  const { theme: activeTheme, activeThemeId, setTheme, isChanging } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [previewThemeId, setPreviewThemeId] = useState(null);

  const filtered = THEMES.filter(t => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.category.includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Live preview: apply CSS vars immediately on hover, revert on mouse leave
  const handlePreview = useCallback((theme) => {
    setPreviewThemeId(theme.id);
    applyThemeCss(theme);
  }, []);

  const handleClearPreview = useCallback(() => {
    setPreviewThemeId(null);
    // Revert to the saved active theme
    applyThemeCss(activeTheme);
  }, [activeTheme]);

  const handleApply = (id) => {
    setPreviewThemeId(null);
    setTheme(id);
    const t = THEMES.find(x => x.id === id);
    applyThemeCss(t);
    toast.success(`Theme "${t?.name}" applied to your site!`);
  };

  const displayTheme = previewThemeId
    ? THEMES.find(t => t.id === previewThemeId)
    : activeTheme;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Theme Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hover any theme to preview it live — click <strong>Apply</strong> to save it to your site.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border">
          <span className="text-xl">{displayTheme?.emoji}</span>
          <div>
            <p className="text-xs text-muted-foreground">
              {previewThemeId && previewThemeId !== activeThemeId ? 'Previewing' : 'Active Theme'}
            </p>
            <p className="text-sm font-bold">{displayTheme?.name}</p>
          </div>
          {isChanging && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />}
          {previewThemeId && previewThemeId !== activeThemeId && (
            <button
              onClick={() => handleApply(previewThemeId)}
              className="ml-2 text-xs font-bold px-3 py-1 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> Apply
            </button>
          )}
        </div>
      </div>

      {/* Live preview banner */}
      {previewThemeId && previewThemeId !== activeThemeId && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-blue-700">
            <Eye className="w-4 h-4" />
            Previewing <strong>{THEMES.find(t => t.id === previewThemeId)?.name}</strong> — move your mouse away to revert, or click Apply to save.
          </span>
          <button onClick={handleClearPreview} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">Revert</button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search themes..."
          className="pl-9"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {THEME_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors border whitespace-nowrap
              ${activeCategory === cat.id
                ? 'bg-primary text-white border-primary'
                : 'bg-muted border-transparent hover:border-primary hover:text-primary'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} themes</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map(t => (
          <ThemeCard
            key={t.id}
            theme={t}
            isActive={t.id === activeThemeId}
            isPreviewing={t.id === previewThemeId}
            onPreview={handlePreview}
            onClearPreview={handleClearPreview}
            onApply={handleApply}
          />
        ))}
      </div>
    </div>
  );
}
