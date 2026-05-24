import { requireAdminSession, sendAdminError } from './_admin.js';

function pickProfileFields(row, fallbackUser) {
  return {
    id: row?.id || fallbackUser?.id || null,
    staff_member_id: row?.staff_member_id || null,
    email: row?.email || fallbackUser?.email || '',
    display_name: row?.display_name || fallbackUser?.user_metadata?.display_name || '',
    avatar_url: row?.avatar_url || fallbackUser?.user_metadata?.avatar_url || null,
    role: row?.role || 'editor',
    is_owner: row?.is_owner === true,
    is_active: row?.is_active !== false,
    can_manage_messages: row?.can_manage_messages === true,
    can_manage_site: row?.can_manage_site === true,
    can_manage_clients: row?.can_manage_clients === true,
    can_manage_schedule: row?.can_manage_schedule === true,
  };
}

export default async function handler(req, res) {
  const session = await requireAdminSession(req, { permission: 'account' });
  if (session.error) return sendAdminError(res, session.error);

  const { supabase, user, profile } = session;

  if (req.method === 'GET') {
    let staffMember = null;
    if (profile.staff_member_id) {
      const { data } = await supabase
        .from('staff_members')
        .select('*')
        .eq('id', profile.staff_member_id)
        .maybeSingle();
      staffMember = data || null;
    }

    return res.status(200).json({
      profile: pickProfileFields(profile, user),
      staffMember,
    });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    displayName,
    email,
    avatarUrl,
    password,
    phone,
    title,
  } = req.body || {};

  const nextEmail = (email || user.email || '').trim().toLowerCase();
  const nextDisplayName = (displayName || profile.display_name || user.email?.split('@')[0] || 'Staff member').trim();
  const nextAvatarUrl = avatarUrl?.trim() || null;

  if (!nextEmail) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const authUpdatePayload = {
    email: nextEmail,
    email_confirm: true,
    user_metadata: {
      ...(user.user_metadata || {}),
      display_name: nextDisplayName,
      avatar_url: nextAvatarUrl,
    },
  };

  if (password) {
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    authUpdatePayload.password = password;
  }

  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, authUpdatePayload);
  if (authUpdateError) {
    return res.status(400).json({ error: authUpdateError.message });
  }

  const adminPayload = {
    email: nextEmail,
    display_name: nextDisplayName,
    avatar_url: nextAvatarUrl,
  };

  const { data: savedProfile, error: profileError } = await supabase
    .from('admin_users')
    .upsert({
      id: user.id,
      role: profile.role || 'editor',
      is_owner: profile.is_owner === true,
      is_active: profile.is_active !== false,
      can_manage_messages: profile.can_manage_messages === true,
      can_manage_site: profile.can_manage_site === true,
      can_manage_clients: profile.can_manage_clients === true,
      can_manage_schedule: profile.can_manage_schedule === true,
      staff_member_id: profile.staff_member_id || null,
      ...adminPayload,
    })
    .select('*')
    .single();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  let savedStaffMember = null;
  const staffPayload = {
    linked_user_id: user.id,
    display_name: nextDisplayName,
    email: nextEmail,
    photo_url: nextAvatarUrl,
    phone: phone?.trim() || null,
    title: title?.trim() || null,
    can_login: true,
    is_assignable: true,
  };

  if (savedProfile.staff_member_id) {
    const { data, error } = await supabase
      .from('staff_members')
      .update(staffPayload)
      .eq('id', savedProfile.staff_member_id)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    savedStaffMember = data;
  } else {
    const { data, error } = await supabase
      .from('staff_members')
      .insert(staffPayload)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    savedStaffMember = data;

    const { error: linkError } = await supabase
      .from('admin_users')
      .update({ staff_member_id: data.id })
      .eq('id', user.id);

    if (linkError) {
      return res.status(500).json({ error: linkError.message });
    }
  }

  return res.status(200).json({
    success: true,
    profile: pickProfileFields({ ...savedProfile, staff_member_id: savedStaffMember?.id || savedProfile.staff_member_id }, user),
    staffMember: savedStaffMember,
  });
}
