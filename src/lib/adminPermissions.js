export const OWNER_ADMIN_EMAIL = 'tonihall015@gmail.com';

const PERMISSION_KEYS = ['messages', 'site', 'clients', 'schedule'];

export function isOwnerEmail(email = '') {
  return String(email).trim().toLowerCase() === OWNER_ADMIN_EMAIL;
}

export function createFallbackAdminProfile(user) {
  if (!user) return null;

  const owner = isOwnerEmail(user.email);
  if (!owner) return null;

  return {
    id: user.id,
    staff_member_id: null,
    email: user.email,
    display_name: user.user_metadata?.display_name || 'Toni',
    avatar_url: user.user_metadata?.avatar_url || null,
    role: 'admin',
    is_owner: true,
    is_active: true,
    can_manage_messages: true,
    can_manage_site: true,
    can_manage_clients: true,
    can_manage_schedule: true,
  };
}

export function normalizeAdminProfile(user, profile) {
  const fallback = createFallbackAdminProfile(user);
  const base = profile || fallback;

  if (!base) return null;

  return {
    ...base,
    email: base.email || user?.email || '',
    display_name: base.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Staff member',
    avatar_url: base.avatar_url || user?.user_metadata?.avatar_url || null,
    role: base.role || (base.is_owner ? 'admin' : 'editor'),
    is_owner: base.is_owner === true,
    is_active: base.is_active !== false,
    can_manage_messages: base.can_manage_messages === true || base.role === 'admin' || base.is_owner === true,
    can_manage_site: base.can_manage_site === true || base.role === 'admin' || base.is_owner === true,
    can_manage_clients: base.can_manage_clients === true || base.role === 'admin' || base.is_owner === true,
    can_manage_schedule: base.can_manage_schedule === true || base.role === 'admin' || base.is_owner === true,
  };
}

export function hasAdminPermission(profile, permission) {
  if (!profile || profile.is_active === false) return false;
  if (!permission || permission === 'account') return true;
  if (permission === 'admin') return profile.role === 'admin' || profile.is_owner === true;
  if (profile.role === 'admin' || profile.is_owner === true) return true;

  switch (permission) {
    case 'messages':
      return profile.can_manage_messages === true;
    case 'site':
      return profile.can_manage_site === true;
    case 'clients':
      return profile.can_manage_clients === true;
    case 'schedule':
      return profile.can_manage_schedule === true;
    default:
      return false;
  }
}

export function listGrantedPermissions(profile) {
  return PERMISSION_KEYS.filter((permission) => hasAdminPermission(profile, permission));
}

export function getAdminHomePath(profile) {
  if (hasAdminPermission(profile, 'site')) return '/admin';
  if (hasAdminPermission(profile, 'clients')) return '/admin?panel=clients';
  if (hasAdminPermission(profile, 'schedule')) return '/admin/schedule';
  if (hasAdminPermission(profile, 'messages')) return '/admin/messages';
  return '/admin/account';
}

export function describeAccessLevel(profile) {
  if (!profile) return 'No admin profile';
  if (profile.is_owner) return 'Owner admin';
  if (profile.role === 'admin') return 'Full admin';

  const labels = [];
  if (hasAdminPermission(profile, 'messages')) labels.push('Messages');
  if (hasAdminPermission(profile, 'site')) labels.push('Site content');
  if (hasAdminPermission(profile, 'clients')) labels.push('Client studio');
  if (hasAdminPermission(profile, 'schedule')) labels.push('Schedule');

  return labels.length ? labels.join(' • ') : 'Limited staff access';
}
