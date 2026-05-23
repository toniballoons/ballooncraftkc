export const ADMIN_CMS_PATH = '/admin/site-management/cms';
export const ADMIN_SITE_MANAGEMENT_PATH = '/admin/site-management';
export const ADMIN_LEGACY_CMS_PATH = '/admin/pages';

export function getAdminPanelHref(panel = 'overview', page) {
  const params = new URLSearchParams();

  if (panel) {
    params.set('panel', panel);
  }

  if (page) {
    params.set('page', page);
  }

  const query = params.toString();
  return query ? `${ADMIN_CMS_PATH}?${query}` : ADMIN_CMS_PATH;
}

export const ADMIN_CMS_HOME = getAdminPanelHref('overview');

export function isAdminCmsPath(pathname) {
  return pathname === ADMIN_CMS_PATH || pathname === ADMIN_LEGACY_CMS_PATH;
}
