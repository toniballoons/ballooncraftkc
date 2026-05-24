import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { CalendarDays, Clock3, MapPin, Settings2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { authedJson } from '@/lib/authedFetch';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const STATUS_COLORS = {
  available: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  unconfirmed: 'bg-amber-100 text-amber-900 border-amber-200',
  booked: 'bg-primary/15 text-primary border-primary/25',
  blocked: 'bg-rose-100 text-rose-900 border-rose-200',
  completed: 'bg-slate-200 text-slate-900 border-slate-300',
  hold: 'bg-sky-100 text-sky-900 border-sky-200',
};

const DEFAULT_SETTINGS = {
  businessTimezone: 'America/Chicago',
  workingDays: [0, 1, 2, 3, 4, 5, 6],
  businessHours: {
    0: { enabled: false, start: '09:00', end: '17:00' },
    1: { enabled: true, start: '09:00', end: '18:00' },
    2: { enabled: true, start: '09:00', end: '18:00' },
    3: { enabled: true, start: '09:00', end: '18:00' },
    4: { enabled: true, start: '09:00', end: '18:00' },
    5: { enabled: true, start: '09:00', end: '18:00' },
    6: { enabled: true, start: '10:00', end: '16:00' },
  },
  defaultEventDurationMinutes: 180,
  setupBufferMinutes: 90,
  teardownBufferMinutes: 60,
  travelBufferMinutes: 45,
  allowDoubleBooking: false,
  defaultView: 'month',
};

function buildDefaultEntryForm(date, durationMinutes = 180) {
  const baseDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
  const startTime = '09:00';
  const endTime = `${String(Math.floor((9 * 60 + durationMinutes) / 60)).padStart(2, '0')}:${String((9 * 60 + durationMinutes) % 60).padStart(2, '0')}`;

  return {
    entryId: null,
    title: '',
    status: 'unconfirmed',
    allDay: false,
    startDate: baseDate,
    startTime,
    endDate: baseDate,
    endTime,
    setupStartsAt: '',
    teardownEndsAt: '',
    clientId: '',
    invoiceId: '',
    eventType: '',
    venueName: '',
    venueAddress: '',
    publicNote: '',
    internalNote: '',
    staffAssignments: [],
  };
}

function toDateTimeValue(isoString) {
  if (!isoString) return { date: '', time: '' };
  const parsed = parseISO(isoString);
  return {
    date: format(parsed, 'yyyy-MM-dd'),
    time: format(parsed, 'HH:mm'),
  };
}

function toDateTimeLocalInput(isoString) {
  if (!isoString) return '';
  return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm");
}

function buildEntryForm(entry, assignments = []) {
  if (!entry) return buildDefaultEntryForm(new Date());

  const start = toDateTimeValue(entry.starts_at);
  const end = toDateTimeValue(entry.ends_at);

  return {
    entryId: entry.id,
    title: entry.title || '',
    status: entry.status || 'unconfirmed',
    allDay: entry.all_day === true,
    startDate: start.date,
    startTime: start.time || '09:00',
    endDate: end.date,
    endTime: end.time || '12:00',
    setupStartsAt: toDateTimeLocalInput(entry.setup_starts_at),
    teardownEndsAt: toDateTimeLocalInput(entry.teardown_ends_at),
    clientId: entry.client_id || '',
    invoiceId: entry.invoice_id || '',
    eventType: entry.event_type || '',
    venueName: entry.venue_name || '',
    venueAddress: entry.venue_address || '',
    publicNote: entry.public_note || '',
    internalNote: entry.internal_note || '',
    staffAssignments: assignments.map((assignment) => ({
      staffMemberId: assignment.staff_member_id,
      assignmentRole: assignment.assignment_role || '',
      isLead: assignment.is_lead === true,
    })),
  };
}

function combineLocalDateTime(date, time, allDay = false) {
  if (!date) return null;
  const safeTime = allDay ? '12:00' : (time || '09:00');
  return new Date(`${date}T${safeTime}:00`).toISOString();
}

function normalizeSettings(settings) {
  if (!settings) return DEFAULT_SETTINGS;
  return {
    businessTimezone: settings.business_timezone || DEFAULT_SETTINGS.businessTimezone,
    workingDays: settings.working_days || DEFAULT_SETTINGS.workingDays,
    businessHours: settings.business_hours || DEFAULT_SETTINGS.businessHours,
    defaultEventDurationMinutes: settings.default_event_duration_minutes || DEFAULT_SETTINGS.defaultEventDurationMinutes,
    setupBufferMinutes: settings.setup_buffer_minutes || DEFAULT_SETTINGS.setupBufferMinutes,
    teardownBufferMinutes: settings.teardown_buffer_minutes || DEFAULT_SETTINGS.teardownBufferMinutes,
    travelBufferMinutes: settings.travel_buffer_minutes || DEFAULT_SETTINGS.travelBufferMinutes,
    allowDoubleBooking: settings.allow_double_booking === true,
    defaultView: settings.default_view || DEFAULT_SETTINGS.defaultView,
  };
}

export default function ScheduleAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('calendar');
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);
  const [entryForm, setEntryForm] = useState(buildDefaultEntryForm(new Date(), DEFAULT_SETTINGS.defaultEventDurationMinutes));

  const scheduleQuery = useQuery({
    queryKey: ['admin-schedule'],
    queryFn: () => authedJson('/api/admin?action=schedule'),
  });

  useEffect(() => {
    if (!scheduleQuery.data?.settings) return;
    const normalized = normalizeSettings(scheduleQuery.data.settings);
    setSettingsForm(normalized);
  }, [scheduleQuery.data?.settings]);

  useEffect(() => {
    setEntryForm((current) => current.entryId ? current : buildDefaultEntryForm(selectedDate, settingsForm.defaultEventDurationMinutes));
  }, [selectedDate, settingsForm.defaultEventDurationMinutes]);

  const entries = scheduleQuery.data?.entries || [];
  const assignments = scheduleQuery.data?.assignments || [];
  const staffMembers = scheduleQuery.data?.staffMembers || [];
  const clients = scheduleQuery.data?.clients || [];
  const invoices = scheduleQuery.data?.invoices || [];

  const assignmentsByEntryId = useMemo(() => assignments.reduce((accumulator, assignment) => {
    if (!accumulator[assignment.schedule_entry_id]) accumulator[assignment.schedule_entry_id] = [];
    accumulator[assignment.schedule_entry_id].push(assignment);
    return accumulator;
  }, {}), [assignments]);

  const entriesByDayKey = useMemo(() => entries.reduce((accumulator, entry) => {
    const dayKey = format(parseISO(entry.starts_at), 'yyyy-MM-dd');
    if (!accumulator[dayKey]) accumulator[dayKey] = [];
    accumulator[dayKey].push(entry);
    return accumulator;
  }, {}), [entries]);

  const filteredInvoices = useMemo(
    () => invoices.filter((invoice) => !entryForm.clientId || invoice.client_id === entryForm.clientId),
    [invoices, entryForm.clientId]
  );

  const selectedDayEntries = useMemo(
    () => entriesByDayKey[format(selectedDate, 'yyyy-MM-dd')] || [],
    [entriesByDayKey, selectedDate]
  );

  const saveSettingsMutation = useMutation({
    mutationFn: async () => authedJson('/api/admin?action=schedule', {
      method: 'POST',
      body: JSON.stringify({
        type: 'settings',
        ...settingsForm,
      }),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedule'] });
      setSettingsForm(normalizeSettings(data.settings));
      toast.success('Schedule settings saved.');
    },
    onError: (error) => toast.error(error.message),
  });

  const saveEntryMutation = useMutation({
    mutationFn: async () => authedJson('/api/admin?action=schedule', {
      method: 'POST',
      body: JSON.stringify({
        type: 'entry',
        entryId: entryForm.entryId,
        title: entryForm.title,
        status: entryForm.status,
        allDay: entryForm.allDay,
        startsAt: combineLocalDateTime(entryForm.startDate, entryForm.startTime, entryForm.allDay),
        endsAt: combineLocalDateTime(entryForm.endDate, entryForm.endTime, entryForm.allDay),
        setupStartsAt: entryForm.setupStartsAt || null,
        teardownEndsAt: entryForm.teardownEndsAt || null,
        clientId: entryForm.clientId || null,
        invoiceId: entryForm.invoiceId || null,
        eventType: entryForm.eventType,
        venueName: entryForm.venueName,
        venueAddress: entryForm.venueAddress,
        publicNote: entryForm.publicNote,
        internalNote: entryForm.internalNote,
        staffAssignments: entryForm.staffAssignments,
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedule'] });
      toast.success(entryForm.entryId ? 'Schedule item updated.' : 'Schedule item created.');
      setEntryForm(buildDefaultEntryForm(selectedDate, settingsForm.defaultEventDurationMinutes));
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId) => authedJson('/api/admin?action=schedule', {
      method: 'DELETE',
      body: JSON.stringify({ entryId }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedule'] });
      toast.success('Schedule item removed.');
      setEntryForm(buildDefaultEntryForm(selectedDate, settingsForm.defaultEventDurationMinutes));
    },
    onError: (error) => toast.error(error.message),
  });

  const calendarStart = startOfWeek(startOfMonth(currentMonth));
  const calendarEnd = endOfWeek(endOfMonth(currentMonth));
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const handleEditEntry = (entry) => {
    const entryAssignments = assignmentsByEntryId[entry.id] || [];
    setEntryForm(buildEntryForm(entry, entryAssignments));
    setSelectedDate(parseISO(entry.starts_at));
  };

  const toggleAssignedStaff = (staffMemberId) => {
    setEntryForm((current) => {
      const exists = current.staffAssignments.some((assignment) => assignment.staffMemberId === staffMemberId);
      if (exists) {
        return {
          ...current,
          staffAssignments: current.staffAssignments.filter((assignment) => assignment.staffMemberId !== staffMemberId),
        };
      }

      return {
        ...current,
        staffAssignments: [
          ...current.staffAssignments,
          { staffMemberId, assignmentRole: '', isLead: current.staffAssignments.length === 0 },
        ],
      };
    });
  };

  const updateAssignedStaff = (staffMemberId, patch) => {
    setEntryForm((current) => ({
      ...current,
      staffAssignments: current.staffAssignments.map((assignment) => {
        if (assignment.staffMemberId !== staffMemberId) return patch.isLead ? { ...assignment, isLead: false } : assignment;
        return { ...assignment, ...patch };
      }),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="max-w-4xl">
        <h1 className="font-display text-3xl">Scheduling Calendar</h1>
        <p className="text-muted-foreground mt-2 leading-7">
          Block dates, mark availability, track unconfirmed holds, assign individual or multiple staff members, and keep
          BalloonCraft KC’s internal calendar organized around real event logistics.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="staff">Staff roster</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'calendar' ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> {format(currentMonth, 'MMMM yyyy')}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>Today</Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => <div key={label}>{label}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayEntries = entriesByDayKey[dayKey] || [];
                    const selected = isSameDay(day, selectedDate);

                    return (
                      <button
                        key={dayKey}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`min-h-32 rounded-2xl border p-3 text-left align-top transition-colors ${selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40'} ${isSameMonth(day, currentMonth) ? 'bg-white' : 'bg-muted/20 text-muted-foreground'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-semibold ${selected ? 'text-primary' : ''}`}>{format(day, 'd')}</span>
                          <span className="text-[11px] text-muted-foreground">{dayEntries.length ? `${dayEntries.length} item${dayEntries.length === 1 ? '' : 's'}` : ''}</span>
                        </div>
                        <div className="space-y-1.5">
                          {dayEntries.slice(0, 3).map((entry) => (
                            <div key={entry.id} className={`rounded-xl border px-2 py-1 text-[11px] font-medium ${STATUS_COLORS[entry.status] || STATUS_COLORS.unconfirmed}`}>
                              {entry.title}
                            </div>
                          ))}
                          {dayEntries.length > 3 ? <p className="text-[11px] text-muted-foreground">+ {dayEntries.length - 3} more</p> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{format(selectedDate, 'EEEE, MMMM d')} schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedDayEntries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-5 text-sm text-muted-foreground">
                    Nothing is scheduled for this day yet. Use the event form to block the date, hold it as unconfirmed, or mark it booked.
                  </div>
                ) : selectedDayEntries.map((entry) => {
                  const dayAssignments = assignmentsByEntryId[entry.id] || [];
                  return (
                    <div key={entry.id} className="rounded-3xl border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{entry.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.all_day ? 'All day' : `${format(parseISO(entry.starts_at), 'p')} – ${format(parseISO(entry.ends_at), 'p')}`}
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[entry.status] || STATUS_COLORS.unconfirmed}`}>
                          {entry.status}
                        </span>
                      </div>
                      {entry.venue_name || entry.venue_address ? (
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5" /> {[entry.venue_name, entry.venue_address].filter(Boolean).join(' — ')}
                        </p>
                      ) : null}
                      {dayAssignments.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          <strong>Assigned staff:</strong> {dayAssignments.map((assignment) => {
                            const member = staffMembers.find((staff) => staff.id === assignment.staff_member_id);
                            const suffix = assignment.is_lead ? ' (lead)' : '';
                            return `${member?.display_name || 'Staff'}${suffix}`;
                          }).join(', ')}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)}>Edit</Button>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteEntryMutation.mutate(entry.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock3 className="w-5 h-5" /> {entryForm.entryId ? 'Edit schedule item' : 'Create a schedule item'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Title</Label>
                  <Input value={entryForm.title} onChange={(event) => setEntryForm({ ...entryForm, title: event.target.value })} placeholder="Wedding install, blocked date, consultation..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={entryForm.status} onValueChange={(value) => setEntryForm({ ...entryForm, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="hold">Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 rounded-2xl border p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={entryForm.allDay} onCheckedChange={(checked) => setEntryForm({ ...entryForm, allDay: checked === true })} />
                    <div>
                      <p className="font-medium">All-day event or blocked date</p>
                      <p className="text-sm text-muted-foreground">Use this for full-day bookings, blackout days, or dates Toni wants held.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <Input type="date" value={entryForm.startDate} onChange={(event) => setEntryForm({ ...entryForm, startDate: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>End date</Label>
                  <Input type="date" value={entryForm.endDate} onChange={(event) => setEntryForm({ ...entryForm, endDate: event.target.value })} />
                </div>
                {!entryForm.allDay ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Start time</Label>
                      <Input type="time" value={entryForm.startTime} onChange={(event) => setEntryForm({ ...entryForm, startTime: event.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>End time</Label>
                      <Input type="time" value={entryForm.endTime} onChange={(event) => setEntryForm({ ...entryForm, endTime: event.target.value })} />
                    </div>
                  </>
                ) : null}
                <div className="space-y-1.5">
                  <Label>Linked client</Label>
                  <Select value={entryForm.clientId || 'none'} onValueChange={(value) => setEntryForm({ ...entryForm, clientId: value === 'none' ? '' : value, invoiceId: '' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.contact_name}{client.business_name ? ` — ${client.business_name}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Linked invoice</Label>
                  <Select value={entryForm.invoiceId || 'none'} onValueChange={(value) => setEntryForm({ ...entryForm, invoiceId: value === 'none' ? '' : value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked invoice</SelectItem>
                      {filteredInvoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_code} — {invoice.invoice_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Event type</Label>
                  <Input value={entryForm.eventType} onChange={(event) => setEntryForm({ ...entryForm, eventType: event.target.value })} placeholder="Wedding, birthday, blocked date..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Venue name</Label>
                  <Input value={entryForm.venueName} onChange={(event) => setEntryForm({ ...entryForm, venueName: event.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Venue address</Label>
                <Input value={entryForm.venueAddress} onChange={(event) => setEntryForm({ ...entryForm, venueAddress: event.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Setup begins</Label>
                  <Input type="datetime-local" value={entryForm.setupStartsAt} onChange={(event) => setEntryForm({ ...entryForm, setupStartsAt: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Teardown ends</Label>
                  <Input type="datetime-local" value={entryForm.teardownEndsAt} onChange={(event) => setEntryForm({ ...entryForm, teardownEndsAt: event.target.value })} />
                </div>
              </div>

              <div className="space-y-3 rounded-[1.75rem] border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Assigned staff</p>
                    <p className="text-sm text-muted-foreground">Assign one employee, multiple employees, or leave Toni off the event entirely when the job belongs to other staff.</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/account">Create employees</Link>
                  </Button>
                </div>
                {staffMembers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                    No employees are available yet. Add staff from Account & Team, then come back here to assign them to dates.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {staffMembers.filter((member) => member.is_assignable !== false && member.employment_status !== 'inactive').map((member) => {
                      const assigned = entryForm.staffAssignments.find((assignment) => assignment.staffMemberId === member.id);
                      return (
                        <div key={member.id} className="rounded-2xl border bg-white p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Checkbox checked={!!assigned} onCheckedChange={() => toggleAssignedStaff(member.id)} />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{member.display_name}</p>
                              <p className="text-sm text-muted-foreground">{member.title || 'BalloonCraft KC staff member'}</p>
                            </div>
                          </div>
                          {assigned ? (
                            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                              <div className="space-y-1.5">
                                <Label>Assignment note / role</Label>
                                <Input
                                  value={assigned.assignmentRole}
                                  onChange={(event) => updateAssignedStaff(member.id, { assignmentRole: event.target.value })}
                                  placeholder="Lead install, delivery help, teardown..."
                                />
                              </div>
                              <label className="flex items-center gap-3 rounded-2xl border bg-muted/20 px-4 py-3 text-sm font-medium">
                                <Checkbox checked={assigned.isLead} onCheckedChange={() => updateAssignedStaff(member.id, { isLead: true })} />
                                Lead staff
                              </label>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Client-facing note</Label>
                <Textarea rows={3} value={entryForm.publicNote} onChange={(event) => setEntryForm({ ...entryForm, publicNote: event.target.value })} placeholder="Optional note about timing, setup window, or what’s reserved for the date..." />
              </div>

              <div className="space-y-1.5">
                <Label>Internal note</Label>
                <Textarea rows={4} value={entryForm.internalNote} onChange={(event) => setEntryForm({ ...entryForm, internalNote: event.target.value })} placeholder="Staff notes, load-in instructions, reminders, venue restrictions..." />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => saveEntryMutation.mutate()} disabled={saveEntryMutation.isPending || !entryForm.title || !entryForm.startDate || !entryForm.endDate}>
                  {saveEntryMutation.isPending ? 'Saving schedule item...' : entryForm.entryId ? 'Save changes' : 'Add to calendar'}
                </Button>
                <Button variant="outline" onClick={() => setEntryForm(buildDefaultEntryForm(selectedDate, settingsForm.defaultEventDurationMinutes))}>
                  Reset form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === 'staff' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Staff roster used for assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These are the employees Toni can assign to dates from the calendar. Public profile visibility is controlled per employee.
            </p>
            <Button variant="outline" asChild>
              <Link to="/admin/account">Open Account & Team</Link>
            </Button>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {staffMembers.map((member) => (
                <div key={member.id} className="rounded-3xl border p-4 space-y-2">
                  <p className="font-semibold">{member.display_name}</p>
                  <p className="text-sm text-muted-foreground">{member.title || 'No title set yet'}</p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-muted px-2.5 py-1 font-semibold uppercase tracking-wide">{member.employment_status}</span>
                    {member.is_assignable ? <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 font-semibold">Assignable</span> : null}
                    {member.show_on_about_page ? <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-1 font-semibold">Public on About</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'settings' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5" /> Calendar settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Input value={settingsForm.businessTimezone} onChange={(event) => setSettingsForm({ ...settingsForm, businessTimezone: event.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Default event duration (minutes)</Label>
                <Input type="number" value={settingsForm.defaultEventDurationMinutes} onChange={(event) => setSettingsForm({ ...settingsForm, defaultEventDurationMinutes: Number(event.target.value) || 180 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Default view</Label>
                <Select value={settingsForm.defaultView} onValueChange={(value) => setSettingsForm({ ...settingsForm, defaultView: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="agenda">Agenda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Setup buffer (minutes)</Label>
                <Input type="number" value={settingsForm.setupBufferMinutes} onChange={(event) => setSettingsForm({ ...settingsForm, setupBufferMinutes: Number(event.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Teardown buffer (minutes)</Label>
                <Input type="number" value={settingsForm.teardownBufferMinutes} onChange={(event) => setSettingsForm({ ...settingsForm, teardownBufferMinutes: Number(event.target.value) || 0 })} />
              </div>
              <div className="space-y-1.5">
                <Label>Travel buffer (minutes)</Label>
                <Input type="number" value={settingsForm.travelBufferMinutes} onChange={(event) => setSettingsForm({ ...settingsForm, travelBufferMinutes: Number(event.target.value) || 0 })} />
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border p-4">
              <Checkbox checked={settingsForm.allowDoubleBooking} onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, allowDoubleBooking: checked === true })} />
              <span className="text-sm font-medium">Allow overlapping bookings on the calendar</span>
            </label>

            <div className="space-y-3">
              <h3 className="font-semibold">Business hours by day</h3>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const row = settingsForm.businessHours[day] || { enabled: false, start: '09:00', end: '17:00' };
                return (
                  <div key={day} className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[140px_auto_1fr_1fr] md:items-center">
                    <p className="font-medium">{labels[day]}</p>
                    <label className="flex items-center gap-3 text-sm">
                      <Checkbox
                        checked={row.enabled === true}
                        onCheckedChange={(checked) => setSettingsForm({
                          ...settingsForm,
                          businessHours: {
                            ...settingsForm.businessHours,
                            [day]: { ...row, enabled: checked === true },
                          },
                        })}
                      />
                      Open
                    </label>
                    <Input
                      type="time"
                      value={row.start}
                      onChange={(event) => setSettingsForm({
                        ...settingsForm,
                        businessHours: {
                          ...settingsForm.businessHours,
                          [day]: { ...row, start: event.target.value },
                        },
                      })}
                    />
                    <Input
                      type="time"
                      value={row.end}
                      onChange={(event) => setSettingsForm({
                        ...settingsForm,
                        businessHours: {
                          ...settingsForm.businessHours,
                          [day]: { ...row, end: event.target.value },
                        },
                      })}
                    />
                  </div>
                );
              })}
            </div>

            <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
              {saveSettingsMutation.isPending ? 'Saving settings...' : 'Save calendar settings'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
