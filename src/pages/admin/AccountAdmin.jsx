import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, KeyRound, Mail, ShieldCheck, UserRoundPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/AuthContext';
import { authedJson } from '@/lib/authedFetch';
import { describeAccessLevel } from '@/lib/adminPermissions';
import { uploadFile } from '@/lib/uploadFile';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const emptyTeamForm = {
  staffId: null,
  displayName: '',
  email: '',
  phone: '',
  title: '',
  photoUrl: '',
  publicBio: '',
  notes: '',
  colorHex: '#0f766e',
  employmentStatus: 'active',
  isAssignable: true,
  showOnAboutPage: false,
  sortOrder: 0,
  createLogin: false,
  loginEmail: '',
  temporaryPassword: '',
  active: true,
  access: {
    fullAdmin: false,
    canManageMessages: false,
    canManageSite: false,
    canManageClients: false,
    canManageSchedule: false,
  },
};

function AvatarPreview({ src, label }) {
  if (src) {
    return <img src={src} alt={label} className="w-20 h-20 rounded-3xl object-cover border shadow-sm" />;
  }

  return (
    <div className="w-20 h-20 rounded-3xl bg-primary/10 border flex items-center justify-center text-primary font-display text-3xl shadow-sm">
      {(label || '?')[0]}
    </div>
  );
}

function buildTeamForm(member) {
  if (!member) return emptyTeamForm;

  return {
    staffId: member.id,
    displayName: member.display_name || '',
    email: member.email || '',
    phone: member.phone || '',
    title: member.title || '',
    photoUrl: member.photo_url || '',
    publicBio: member.public_bio || '',
    notes: member.notes || '',
    colorHex: member.color_hex || '#0f766e',
    employmentStatus: member.employment_status || 'active',
    isAssignable: member.is_assignable !== false,
    showOnAboutPage: member.show_on_about_page === true,
    sortOrder: member.sort_order || 0,
    createLogin: !!member.access,
    loginEmail: member.access?.email || member.email || '',
    temporaryPassword: '',
    active: member.access?.is_active !== false,
    access: {
      fullAdmin: member.access?.role === 'admin' || member.access?.is_owner === true,
      canManageMessages: member.access?.can_manage_messages === true,
      canManageSite: member.access?.can_manage_site === true,
      canManageClients: member.access?.can_manage_clients === true,
      canManageSchedule: member.access?.can_manage_schedule === true,
    },
  };
}

export default function AccountAdmin() {
  const queryClient = useQueryClient();
  const { profile, refreshProfile, isAdmin, isOwnerAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [accountForm, setAccountForm] = useState({
    displayName: '',
    email: '',
    avatarUrl: '',
    title: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [teamForm, setTeamForm] = useState(emptyTeamForm);
  const accountAvatarInputRef = useRef(null);
  const teamAvatarInputRef = useRef(null);

  const accountQuery = useQuery({
    queryKey: ['account-settings'],
    queryFn: () => authedJson('/api/admin?action=account'),
  });

  const teamQuery = useQuery({
    queryKey: ['team-members'],
    queryFn: () => authedJson('/api/admin?action=team'),
    enabled: isAdmin,
    initialData: { members: [] },
  });

  useEffect(() => {
    if (!accountQuery.data) return;
    setAccountForm({
      displayName: accountQuery.data.profile?.display_name || '',
      email: accountQuery.data.profile?.email || '',
      avatarUrl: accountQuery.data.profile?.avatar_url || '',
      title: accountQuery.data.staffMember?.title || '',
      phone: accountQuery.data.staffMember?.phone || '',
      password: '',
      confirmPassword: '',
    });
  }, [accountQuery.data]);

  const accountMutation = useMutation({
    mutationFn: async () => {
      if (accountForm.password && accountForm.password !== accountForm.confirmPassword) {
        throw new Error('New password and confirmation password do not match.');
      }

      return authedJson('/api/admin?action=account', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: accountForm.displayName,
          email: accountForm.email,
          avatarUrl: accountForm.avatarUrl,
          title: accountForm.title,
          phone: accountForm.phone,
          password: accountForm.password || undefined,
        }),
      });
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['account-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-about-staff'] });
      toast.success('Your BalloonCraft KC account details were updated.');
      setAccountForm((current) => ({ ...current, password: '', confirmPassword: '' }));
    },
    onError: (error) => toast.error(error.message),
  });

  const teamMutation = useMutation({
    mutationFn: async () => authedJson('/api/admin?action=team', {
      method: 'POST',
      body: JSON.stringify(teamForm),
    }),
    onSuccess: (data) => {
      queryClient.setQueryData(['team-members'], data);
      queryClient.invalidateQueries({ queryKey: ['admin-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['public-about-staff'] });
      toast.success(teamForm.staffId ? 'Employee updated.' : 'Employee created.');
      setTeamForm(emptyTeamForm);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleAccountAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await uploadFile(file);
      setAccountForm((current) => ({ ...current, avatarUrl: file_url }));
      toast.success('Profile photo uploaded.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleTeamAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await uploadFile(file);
      setTeamForm((current) => ({ ...current, photoUrl: file_url }));
      toast.success('Employee photo uploaded.');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const members = teamQuery.data?.members || [];
  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.display_name || '').localeCompare(b.display_name || '')),
    [members]
  );

  return (
    <div className="space-y-6">
      <div className="max-w-3xl">
        <h1 className="font-display text-3xl">Account & Team</h1>
        <p className="text-muted-foreground mt-2 leading-7">
          Update Toni’s login details, control who can manage messages or site content, add internal employees for scheduling,
          and decide exactly which staff members show publicly on the About page.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="account">My account</TabsTrigger>
          {isAdmin ? <TabsTrigger value="team">Team access</TabsTrigger> : null}
        </TabsList>
      </Tabs>

      {activeTab === 'account' ? (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Toni’s account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-4">
                <AvatarPreview src={accountForm.avatarUrl} label={accountForm.displayName || accountForm.email} />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Upload a new photo or paste an image URL for Toni’s admin profile.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" type="button" onClick={() => accountAvatarInputRef.current?.click()}>
                      <Camera className="w-4 h-4 mr-2" /> Upload photo
                    </Button>
                  </div>
                </div>
                <input ref={accountAvatarInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAccountAvatarUpload} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Display name</Label>
                  <Input value={accountForm.displayName} onChange={(event) => setAccountForm({ ...accountForm, displayName: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={accountForm.email} onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={accountForm.title} onChange={(event) => setAccountForm({ ...accountForm, title: event.target.value })} placeholder="Owner, Creative Director..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={accountForm.phone} onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })} placeholder="816-313-8355" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Profile photo URL</Label>
                <Input value={accountForm.avatarUrl} onChange={(event) => setAccountForm({ ...accountForm, avatarUrl: event.target.value })} placeholder="https://..." />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input type="password" value={accountForm.password} onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })} placeholder="Leave blank to keep the current password" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm new password</Label>
                  <Input type="password" value={accountForm.confirmPassword} onChange={(event) => setAccountForm({ ...accountForm, confirmPassword: event.target.value })} />
                </div>
              </div>

              <Button onClick={() => accountMutation.mutate()} disabled={accountMutation.isPending || !accountForm.displayName || !accountForm.email}>
                {accountMutation.isPending ? 'Saving account...' : 'Save account changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> Current access summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Access level</p>
                <p className="font-semibold mt-2">{describeAccessLevel(profile)}</p>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-4 space-y-2 text-sm">
                <p><strong>Email:</strong> {profile?.email || '—'}</p>
                <p><strong>Public team toggle:</strong> Toni can decide from Team Access whether each employee appears on the About page.</p>
                <p><strong>Password changes:</strong> Saving a new password here replaces the current one immediately.</p>
                <p><strong>New staff logins:</strong> Create moderators, editors, or full admins from the Team Access tab.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === 'team' && isAdmin ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserRoundPlus className="w-5 h-5" /> {teamForm.staffId ? 'Edit employee or staff login' : 'Create a new employee'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap items-center gap-4">
                <AvatarPreview src={teamForm.photoUrl} label={teamForm.displayName || 'Employee'} />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">This photo can be used internally and, if enabled, on the public About page.</p>
                  <Button variant="outline" type="button" onClick={() => teamAvatarInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-2" /> Upload employee photo
                  </Button>
                </div>
                <input ref={teamAvatarInputRef} type="file" accept="image/*" className="sr-only" onChange={handleTeamAvatarUpload} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Employee name</Label>
                  <Input value={teamForm.displayName} onChange={(event) => setTeamForm({ ...teamForm, displayName: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Title / position</Label>
                  <Input value={teamForm.title} onChange={(event) => setTeamForm({ ...teamForm, title: event.target.value })} placeholder="Installer, assistant, editor..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Employee email</Label>
                  <Input type="email" value={teamForm.email} onChange={(event) => setTeamForm({ ...teamForm, email: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={teamForm.phone} onChange={(event) => setTeamForm({ ...teamForm, phone: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Roster color</Label>
                  <Input value={teamForm.colorHex} onChange={(event) => setTeamForm({ ...teamForm, colorHex: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Employment status</Label>
                  <Select value={teamForm.employmentStatus} onValueChange={(value) => setTeamForm({ ...teamForm, employmentStatus: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>About-page order</Label>
                  <Input type="number" value={teamForm.sortOrder} onChange={(event) => setTeamForm({ ...teamForm, sortOrder: Number(event.target.value) || 0 })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Photo URL</Label>
                <Input value={teamForm.photoUrl} onChange={(event) => setTeamForm({ ...teamForm, photoUrl: event.target.value })} placeholder="https://..." />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-2xl border p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={teamForm.isAssignable} onCheckedChange={(checked) => setTeamForm({ ...teamForm, isAssignable: checked === true })} />
                    <div>
                      <p className="font-medium">Assignable to events</p>
                      <p className="text-sm text-muted-foreground">Show this employee in the scheduling calendar when Toni assigns staff to a booked event.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl border p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={teamForm.showOnAboutPage} onCheckedChange={(checked) => setTeamForm({ ...teamForm, showOnAboutPage: checked === true })} />
                    <div>
                      <p className="font-medium">Show on the About page</p>
                      <p className="text-sm text-muted-foreground">Only employees with this toggle turned on will appear publicly in the About Us team section.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Public About-page bio</Label>
                <Textarea rows={4} value={teamForm.publicBio} onChange={(event) => setTeamForm({ ...teamForm, publicBio: event.target.value })} placeholder="Short public-facing bio for the About page..." />
              </div>

              <div className="space-y-1.5">
                <Label>Internal notes</Label>
                <Textarea rows={4} value={teamForm.notes} onChange={(event) => setTeamForm({ ...teamForm, notes: event.target.value })} placeholder="Availability notes, specialties, payroll reminders, admin context..." />
              </div>

              <div className="rounded-[1.75rem] border bg-muted/20 p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={teamForm.createLogin} onCheckedChange={(checked) => setTeamForm({ ...teamForm, createLogin: checked === true })} />
                  <div>
                    <p className="font-medium">Give this employee a dashboard login</p>
                    <p className="text-sm text-muted-foreground">
                      Turn this on for message moderators, site editors, client-studio operators, or schedule managers.
                    </p>
                  </div>
                </div>

                {teamForm.createLogin ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Login email</Label>
                        <Input type="email" value={teamForm.loginEmail} onChange={(event) => setTeamForm({ ...teamForm, loginEmail: event.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Temporary password</Label>
                        <Input type="password" value={teamForm.temporaryPassword} onChange={(event) => setTeamForm({ ...teamForm, temporaryPassword: event.target.value })} placeholder={teamForm.staffId ? 'Only fill this in to reset it' : 'Required for a new login'} />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        ['canManageMessages', 'Can manage messages'],
                        ['canManageSite', 'Can manage website content'],
                        ['canManageClients', 'Can manage client studio'],
                        ['canManageSchedule', 'Can manage the scheduling calendar'],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-start gap-3 rounded-2xl border bg-white p-4">
                          <Checkbox
                            checked={teamForm.access[key]}
                            onCheckedChange={(checked) => setTeamForm({
                              ...teamForm,
                              access: { ...teamForm.access, [key]: checked === true },
                            })}
                          />
                          <span className="text-sm font-medium">{label}</span>
                        </label>
                      ))}
                    </div>

                    {isOwnerAdmin ? (
                      <label className="flex items-start gap-3 rounded-2xl border bg-white p-4">
                        <Checkbox
                          checked={teamForm.access.fullAdmin}
                          onCheckedChange={(checked) => setTeamForm({
                            ...teamForm,
                            access: { ...teamForm.access, fullAdmin: checked === true },
                          })}
                        />
                        <span className="text-sm font-medium">Grant full admin power
                          <span className="block text-muted-foreground font-normal mt-1">Only Toni can turn this on. Full admins can access all internal tools.</span>
                        </span>
                      </label>
                    ) : null}

                    <label className="flex items-start gap-3 rounded-2xl border bg-white p-4">
                      <Checkbox checked={teamForm.active} onCheckedChange={(checked) => setTeamForm({ ...teamForm, active: checked === true })} />
                      <span className="text-sm font-medium">Keep this login active</span>
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => teamMutation.mutate()} disabled={teamMutation.isPending || !teamForm.displayName}>
                  {teamMutation.isPending ? 'Saving employee...' : teamForm.staffId ? 'Save employee changes' : 'Create employee'}
                </Button>
                <Button variant="outline" onClick={() => setTeamForm(emptyTeamForm)}>
                  Reset form
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Employee roster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedMembers.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  No employees have been added yet. Use the form to create BalloonCraft KC team members and optional staff logins.
                </div>
              ) : sortedMembers.map((member) => (
                <div key={member.id} className="rounded-3xl border bg-white p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AvatarPreview src={member.photo_url} label={member.display_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{member.display_name}</p>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">{member.employment_status}</span>
                        {member.show_on_about_page ? <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-semibold">Public on About</span> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.title || 'No title set yet'}</p>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        {member.email ? <p><Mail className="inline w-3.5 h-3.5 mr-1" /> {member.email}</p> : null}
                        <p><strong>Access:</strong> {member.access ? describeAccessLevel(member.access) : 'No dashboard login'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setTeamForm(buildTeamForm(member)); setActiveTab('team'); }}>
                      Edit employee
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
