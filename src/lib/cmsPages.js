export const CMS_CONTENT_PAGES = [
  { key: 'hero', label: '🏠 Hero', previewUrl: '/', editable: true },
  { key: 'about', label: '👥 About', previewUrl: '/about', editable: true },
  { key: 'contact', label: '📬 Contact', previewUrl: '/contact', editable: true },
  { key: 'testimonials', label: '⭐ Testimonials', previewUrl: '/testimonials', editable: true },
  { key: 'projects', label: '🖼️ Projects', previewUrl: '/projects', editable: true },
  { key: 'gallery', label: '🖼️ Gallery', previewUrl: '/gallery', editable: true },
  { key: 'navbar', label: '🔗 Navbar', previewUrl: '/', editable: true },
  { key: 'footer', label: '🦶 Footer', previewUrl: '/', editable: true },
  { key: 'privacy', label: '🔒 Privacy', previewUrl: '/privacy', editable: true },
  { key: 'terms', label: '📄 Terms', previewUrl: '/terms', editable: true },
  { key: 'legal', label: '⚖️ Legal', previewUrl: '/legal', editable: true },
];

export const CMS_CONTENT_PAGE_KEYS = CMS_CONTENT_PAGES.map((page) => page.key);

export const CMS_CONTENT_PAGE_LABELS = Object.fromEntries(
  CMS_CONTENT_PAGES.map((page) => [page.key, page.label]),
);

export const CMS_CONTENT_PREVIEW_URLS = Object.fromEntries(
  CMS_CONTENT_PAGES.map((page) => [page.key, page.previewUrl]),
);

export function isCmsContentPageKey(value) {
  return CMS_CONTENT_PAGE_KEYS.includes(value);
}

export function getCmsEditorHref(pageKey) {
  return `/admin?page=${pageKey}`;
}
