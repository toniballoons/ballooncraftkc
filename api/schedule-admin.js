import { requireAdminSession, sendAdminError } from './_admin.js';

function sanitizeIso(value) {
  return value ? new Date(value).toISOString() : null;
}

export default async function handler(req, res) {
  const session = await requireAdminSession(req, { permission: 'schedule' });
  if (session.error) return sendAdminError(res, session.error);

  const { supabase, user } = session;

  if (req.method === 'GET') {
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

  if (req.method === 'DELETE') {
    const { entryId } = req.body || {};
    if (!entryId) {
      return res.status(400).json({ error: 'entryId is required.' });
    }

    const { error } = await supabase.from('schedule_entries').delete().eq('id', entryId);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  if (type === 'entry') {
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

  return res.status(400).json({ error: 'Unknown schedule action.' });
}
