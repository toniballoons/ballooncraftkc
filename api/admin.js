import { requireAdminSession, sendAdminError } from './_admin.js';

const SITE_ASSETS_BUCKET = 'site-assets';

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

function makeStoragePath(fileName = 'upload-file') {
  const safeName = String(fileName)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'upload-file';

  return `admin-assets/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

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

function sanitizeIso(value) {
  return value ? new Date(value).toISOString() : null;
}

async function handleAccountGet(req, res, session) {
  const { supabase, user, profile } = session;
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

async function handleAccountPatch(req, res, session) {
  const { supabase, user, profile } = session;
  const { displayName, email, avatarUrl, password, phone, title } = req.body || {};

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
      email: nextEmail,
      display_name: nextDisplayName,
      avatar_url: nextAvatarUrl,
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

async function handleTeamGet(req, res, session) {
  try {
    const members = await loadTeamMembers(session.supabase);
    return res.status(200).json({ members });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleTeamPost(req, res, session) {
  const { supabase, user, profile } = session;
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

async function handleScheduleGet(req, res, session) {
  const { supabase } = session;
  try {
    const [
      { data: settings, error: settingsError },
      { data: entries, error: entriesError },
      { data: assignments, error: assignmentsError },
      { data: staffMembers, error: staffError },
      { data: clients, error: clientsError },
      { data: invoices, error: invoicesError },
    ] = await Promise.all([
      supabase.from('schedule_settings').select('*').eq('settings_key', 'default').maybeSingle(),
      supabase.from('schedule_entries').select('*').order('starts_at', { ascending: true }),
      supabase.from('schedule_entry_staff').select('*'),
      supabase.from('staff_members').select('*').order('sort_order', { ascending: true }).order('display_name', { ascending: true }),
      supabase.from('clients').select('id, contact_name, business_name, client_code, event_type, event_date').order('event_date', { ascending: false }),
      supabase.from('invoices').select('id, client_id, invoice_code, invoice_title, status, event_date').order('event_date', { ascending: false }),
    ]);

    for (const error of [settingsError, entriesError, assignmentsError, staffError, clientsError, invoicesError]) {
      if (error) throw error;
    }

    return res.status(200).json({
      settings: settings || null,
      entries: entries || [],
      assignments: assignments || [],
      staffMembers: staffMembers || [],
      clients: clients || [],
      invoices: invoices || [],
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function handleScheduleDelete(req, res, session) {
  const { supabase } = session;
  const { entryId } = req.body || {};
  if (!entryId) {
    return res.status(400).json({ error: 'entryId is required.' });
  }

  const { error } = await supabase.from('schedule_entries').delete().eq('id', entryId);
  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ success: true });
}

async function handleSchedulePost(req, res, session) {
  const { supabase, user } = session;
  const { type } = req.body || {};

  if (type === 'settings') {
    const {
      businessTimezone,
      workingDays,
      businessHours,
      defaultEventDurationMinutes,
      setupBufferMinutes,
      teardownBufferMinutes,
      travelBufferMinutes,
      allowDoubleBooking,
      defaultView,
    } = req.body || {};

    const payload = {
      settings_key: 'default',
      business_timezone: businessTimezone || 'America/Chicago',
      working_days: Array.isArray(workingDays) ? workingDays : [0, 1, 2, 3, 4, 5, 6],
      business_hours: businessHours || {},
      default_event_duration_minutes: Number(defaultEventDurationMinutes) || 180,
      setup_buffer_minutes: Number(setupBufferMinutes) || 90,
      teardown_buffer_minutes: Number(teardownBufferMinutes) || 60,
      travel_buffer_minutes: Number(travelBufferMinutes) || 45,
      allow_double_booking: allowDoubleBooking === true,
      default_view: defaultView || 'month',
    };

    const { data, error } = await supabase
      .from('schedule_settings')
      .upsert(payload, { onConflict: 'settings_key' })
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true, settings: data });
  }

  if (type !== 'entry') {
    return res.status(400).json({ error: 'Unknown schedule action.' });
  }

  const {
    entryId,
    title,
    status,
    allDay,
    startsAt,
    endsAt,
    setupStartsAt,
    teardownEndsAt,
    clientId,
    invoiceId,
    eventType,
    venueName,
    venueAddress,
    publicNote,
    internalNote,
    staffAssignments = [],
  } = req.body || {};

  if (!title?.trim() || !startsAt || !endsAt) {
    return res.status(400).json({ error: 'Title, start, and end are required.' });
  }

  const entryPayload = {
    title: title.trim(),
    status: status || 'unconfirmed',
    all_day: allDay === true,
    starts_at: sanitizeIso(startsAt),
    ends_at: sanitizeIso(endsAt),
    setup_starts_at: sanitizeIso(setupStartsAt),
    teardown_ends_at: sanitizeIso(teardownEndsAt),
    client_id: clientId || null,
    invoice_id: invoiceId || null,
    event_type: eventType?.trim() || null,
    venue_name: venueName?.trim() || null,
    venue_address: venueAddress?.trim() || null,
    public_note: publicNote?.trim() || null,
    internal_note: internalNote?.trim() || null,
    created_by: user.id,
  };

  const { data: settingsRow } = await supabase
    .from('schedule_settings')
    .select('allow_double_booking')
    .eq('settings_key', 'default')
    .maybeSingle();

  if (settingsRow?.allow_double_booking !== true && entryPayload.status !== 'available') {
    let overlapQuery = supabase
      .from('schedule_entries')
      .select('id, title, status')
      .in('status', ['booked', 'blocked', 'unconfirmed', 'hold'])
      .lte('starts_at', entryPayload.ends_at)
      .gte('ends_at', entryPayload.starts_at);

    if (entryId) {
      overlapQuery = overlapQuery.neq('id', entryId);
    }

    const { data: overlappingEntries, error: overlapError } = await overlapQuery;
    if (overlapError) return res.status(400).json({ error: overlapError.message });
    if ((overlappingEntries || []).length > 0) {
      return res.status(409).json({
        error: `This time overlaps with "${overlappingEntries[0].title}" while double-booking is turned off.`,
      });
    }
  }

  let savedEntry;
  if (entryId) {
    const { data, error } = await supabase
      .from('schedule_entries')
      .update(entryPayload)
      .eq('id', entryId)
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    savedEntry = data;
  } else {
    const { data, error } = await supabase
      .from('schedule_entries')
      .insert(entryPayload)
      .select('*')
      .single();
    if (error) return res.status(400).json({ error: error.message });
    savedEntry = data;
  }

  await supabase.from('schedule_entry_staff').delete().eq('schedule_entry_id', savedEntry.id);

  const normalizedAssignments = Array.isArray(staffAssignments)
    ? staffAssignments
        .filter((assignment) => assignment?.staffMemberId)
        .map((assignment) => ({
          schedule_entry_id: savedEntry.id,
          staff_member_id: assignment.staffMemberId,
          assignment_role: assignment.assignmentRole?.trim() || null,
          is_lead: assignment.isLead === true,
        }))
    : [];

  if (normalizedAssignments.length > 0) {
    const { error: assignmentError } = await supabase
      .from('schedule_entry_staff')
      .insert(normalizedAssignments);

    if (assignmentError) return res.status(400).json({ error: assignmentError.message });
  }

  return res.status(200).json({ success: true, entry: savedEntry });
}

async function handleUploadImage(req, res, session) {
  const { supabase } = session;
  const fileName = req.headers['x-upload-filename'] || req.headers['X-Upload-Filename'] || 'upload-file';
  const contentType = req.headers['content-type'] || 'application/octet-stream';
  const bytes = await readRawBody(req);

  if (!bytes.length) {
    return res.status(400).json({ error: 'Upload body was empty.' });
  }

  const path = makeStoragePath(fileName);
  const { error: uploadError } = await supabase.storage
    .from(SITE_ASSETS_BUCKET)
    .upload(path, bytes, {
      upsert: true,
      contentType,
      cacheControl: '3600',
    });

  if (uploadError) {
    return res.status(400).json({ error: uploadError.message });
  }

  const { data } = supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(path);

  return res.status(200).json({
    success: true,
    file_url: data.publicUrl,
    path,
  });
}

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action;

  if (action === 'account') {
    const session = await requireAdminSession(req, { permission: 'account' });
    if (session.error) return sendAdminError(res, session.error);
    if (req.method === 'GET') return handleAccountGet(req, res, session);
    if (req.method === 'PATCH') return handleAccountPatch(req, res, session);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (action === 'team') {
    const session = await requireAdminSession(req, { requireAdmin: true });
    if (session.error) return sendAdminError(res, session.error);
    if (req.method === 'GET') return handleTeamGet(req, res, session);
    if (req.method === 'POST') return handleTeamPost(req, res, session);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (action === 'schedule') {
    const session = await requireAdminSession(req, { permission: 'schedule' });
    if (session.error) return sendAdminError(res, session.error);
    if (req.method === 'GET') return handleScheduleGet(req, res, session);
    if (req.method === 'POST') return handleSchedulePost(req, res, session);
    if (req.method === 'DELETE') return handleScheduleDelete(req, res, session);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (action === 'upload-image') {
    const session = await requireAdminSession(req, { permission: 'account' });
    if (session.error) return sendAdminError(res, session.error);
    if (req.method === 'POST') return handleUploadImage(req, res, session);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(400).json({ error: 'Unknown admin action.' });
}
