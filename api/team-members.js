import { requireAdminSession, sendAdminError } from './_admin.js';

function deriveAccessProfile({ fullAdmin = false, canManageMessages = false, canManageSite = false, canManageClients = false, canManageSchedule = false }) {
  if (fullAdmin) {
    return {
      role: 'admin',
      can_manage_messages: true,
      can_manage_site: true,
      can_manage_clients: true,
      can_manage_schedule: true,
    };
  }

  const hasOnlyMessages = canManageMessages && !canManageSite && !canManageClients && !canManageSchedule;
  return {
    role: hasOnlyMessages ? 'moderator' : 'editor',
    can_manage_messages: canManageMessages,
    can_manage_site: canManageSite,
    can_manage_clients: canManageClients,
    can_manage_schedule: canManageSchedule,
  };
}

async function loadTeamMembers(supabase) {
  const [{ data: staffMembers, error: staffError }, { data: adminUsers, error: adminError }] = await Promise.all([
    supabase.from('staff_members').select('*').order('sort_order', { ascending: true }).order('display_name', { ascending: true }),
    supabase.from('admin_users').select('*').order('created_at', { ascending: true }),
  ]);

  if (staffError) throw new Error(staffError.message);
  if (adminError) throw new Error(adminError.message);

  const adminByStaffId = new Map((adminUsers || []).filter((row) => row.staff_member_id).map((row) => [row.staff_member_id, row]));
  const adminByUserId = new Map((adminUsers || []).map((row) => [row.id, row]));

  return (staffMembers || []).map((staff) => ({
    ...staff,
    access: adminByStaffId.get(staff.id) || (staff.linked_user_id ? adminByUserId.get(staff.linked_user_id) || null : null),
  }));
}

export default async function handler(req, res) {
  const session = await requireAdminSession(req, { requireAdmin: true });
  if (session.error) return sendAdminError(res, session.error);

  const { supabase, user, profile } = session;

  if (req.method === 'GET') {
    try {
      const members = await loadTeamMembers(supabase);
      return res.status(200).json({ members });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    staffId,
    displayName,
    email,
    phone,
    title,
    photoUrl,
    publicBio,
    notes,
    colorHex,
    employmentStatus = 'active',
    isAssignable = true,
    showOnAboutPage = false,
    sortOrder = 0,
    createLogin = false,
    loginEmail,
    temporaryPassword,
    access = {},
    active = true,
  } = req.body || {};

  if (!displayName?.trim()) {
    return res.status(400).json({ error: 'Employee display name is required.' });
  }

  const wantsFullAdmin = access.fullAdmin === true;
  if (wantsFullAdmin && profile.is_owner !== true) {
    return res.status(403).json({ error: 'Only Toni can promote someone to full admin.' });
  }

  const staffPayload = {
    display_name: displayName.trim(),
    email: email?.trim().toLowerCase() || null,
    phone: phone?.trim() || null,
    title: title?.trim() || null,
    photo_url: photoUrl?.trim() || null,
    public_bio: publicBio?.trim() || null,
    notes: notes?.trim() || null,
    color_hex: colorHex?.trim() || '#0f766e',
    employment_status: employmentStatus,
    can_login: createLogin === true,
    is_assignable: isAssignable === true,
    show_on_about_page: showOnAboutPage === true,
    sort_order: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
  };

  if (staffId) {
    const { data: existingStaff, error: existingStaffError } = await supabase
      .from('staff_members')
      .select('id, linked_user_id')
      .eq('id', staffId)
      .maybeSingle();

    if (existingStaffError) return res.status(400).json({ error: existingStaffError.message });
    if (!existingStaff) return res.status(404).json({ error: 'Employee record not found.' });

    if (existingStaff.linked_user_id) {
      const { data: existingAccess, error: accessLookupError } = await supabase
        .from('admin_users')
        .select('is_owner')
        .eq('id', existingStaff.linked_user_id)
        .maybeSingle();

      if (accessLookupError) return res.status(400).json({ error: accessLookupError.message });
      if (existingAccess?.is_owner === true && profile.is_owner !== true) {
        return res.status(403).json({ error: 'Only Toni can edit the owner account.' });
      }
    }
  }

  let staffMember;
  if (staffId) {
    const { data, error } = await supabase
      .from('staff_members')
      .update(staffPayload)
      .eq('id', staffId)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    staffMember = data;
  } else {
    const { data, error } = await supabase
      .from('staff_members')
      .insert(staffPayload)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    staffMember = data;
  }

  if (createLogin === true) {
    const resolvedLoginEmail = (loginEmail || email || '').trim().toLowerCase();
    if (!resolvedLoginEmail) {
      return res.status(400).json({ error: 'A login email is required when dashboard access is enabled.' });
    }

    const permissionPayload = deriveAccessProfile({
      fullAdmin: wantsFullAdmin,
      canManageMessages: access.canManageMessages === true,
      canManageSite: access.canManageSite === true,
      canManageClients: access.canManageClients === true,
      canManageSchedule: access.canManageSchedule === true,
    });

    let targetUserId = staffMember.linked_user_id;

    if (!targetUserId) {
      if (!temporaryPassword || String(temporaryPassword).length < 8) {
        return res.status(400).json({ error: 'Set a temporary password with at least 8 characters for new dashboard users.' });
      }

      const { data: createdUserData, error: createUserError } = await supabase.auth.admin.createUser({
        email: resolvedLoginEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          display_name: staffPayload.display_name,
          avatar_url: staffPayload.photo_url,
        },
      });

      if (createUserError || !createdUserData?.user) {
        return res.status(400).json({ error: createUserError?.message || 'Could not create the new dashboard user.' });
      }

      targetUserId = createdUserData.user.id;

      const { error: linkError } = await supabase
        .from('staff_members')
        .update({ linked_user_id: targetUserId, can_login: true })
        .eq('id', staffMember.id);

      if (linkError) return res.status(400).json({ error: linkError.message });
    } else {
      const authUpdatePayload = {
        email: resolvedLoginEmail,
        email_confirm: true,
        user_metadata: {
          display_name: staffPayload.display_name,
          avatar_url: staffPayload.photo_url,
        },
      };

      if (temporaryPassword) {
        if (String(temporaryPassword).length < 8) {
          return res.status(400).json({ error: 'Temporary password must be at least 8 characters long.' });
        }
        authUpdatePayload.password = temporaryPassword;
      }

      const { error: updateUserError } = await supabase.auth.admin.updateUserById(targetUserId, authUpdatePayload);
      if (updateUserError) return res.status(400).json({ error: updateUserError.message });
    }

    const { error: accessError } = await supabase
      .from('admin_users')
      .upsert({
        id: targetUserId,
        staff_member_id: staffMember.id,
        email: resolvedLoginEmail,
        display_name: staffPayload.display_name,
        avatar_url: staffPayload.photo_url,
        created_by: user.id,
        is_active: active === true,
        is_owner: false,
        ...permissionPayload,
      });

    if (accessError) return res.status(400).json({ error: accessError.message });
  } else if (staffMember.linked_user_id) {
    const { error: deactivateError } = await supabase
      .from('admin_users')
      .update({ is_active: false })
      .eq('id', staffMember.linked_user_id);

    if (deactivateError) return res.status(400).json({ error: deactivateError.message });

    await supabase
      .from('staff_members')
      .update({ can_login: false })
      .eq('id', staffMember.id);
  }

  try {
    const members = await loadTeamMembers(supabase);
    return res.status(200).json({ success: true, members });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
