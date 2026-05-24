-- ============================================================
-- BalloonCraft KC — Staff access + employee roster + scheduling
-- ============================================================

CREATE TABLE IF NOT EXISTS staff_members (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linked_user_id       uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name         text NOT NULL,
  email                text,
  phone                text,
  title                text,
  photo_url            text,
  public_bio           text,
  notes                text,
  color_hex            text NOT NULL DEFAULT '#0f766e',
  employment_status    text NOT NULL DEFAULT 'active',
  can_login            boolean NOT NULL DEFAULT false,
  is_assignable        boolean NOT NULL DEFAULT true,
  show_on_about_page   boolean NOT NULL DEFAULT false,
  sort_order           integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_members_employment_status_check
    CHECK (employment_status IN ('active', 'inactive', 'contractor'))
);

CREATE TABLE IF NOT EXISTS admin_users (
  id                    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_member_id       uuid UNIQUE REFERENCES staff_members(id) ON DELETE SET NULL,
  email                 text NOT NULL UNIQUE,
  display_name          text,
  avatar_url            text,
  role                  text NOT NULL DEFAULT 'editor',
  is_owner              boolean NOT NULL DEFAULT false,
  is_active             boolean NOT NULL DEFAULT true,
  can_manage_messages   boolean NOT NULL DEFAULT false,
  can_manage_site       boolean NOT NULL DEFAULT false,
  can_manage_clients    boolean NOT NULL DEFAULT false,
  can_manage_schedule   boolean NOT NULL DEFAULT false,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_role_check
    CHECK (role IN ('admin', 'moderator', 'editor'))
);

CREATE TABLE IF NOT EXISTS schedule_settings (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_key                 text NOT NULL UNIQUE DEFAULT 'default',
  business_timezone            text NOT NULL DEFAULT 'America/Chicago',
  working_days                 integer[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  business_hours               jsonb NOT NULL DEFAULT '{
    "0": {"enabled": false, "start": "09:00", "end": "17:00"},
    "1": {"enabled": true, "start": "09:00", "end": "18:00"},
    "2": {"enabled": true, "start": "09:00", "end": "18:00"},
    "3": {"enabled": true, "start": "09:00", "end": "18:00"},
    "4": {"enabled": true, "start": "09:00", "end": "18:00"},
    "5": {"enabled": true, "start": "09:00", "end": "18:00"},
    "6": {"enabled": true, "start": "10:00", "end": "16:00"}
  }'::jsonb,
  default_event_duration_minutes integer NOT NULL DEFAULT 180,
  setup_buffer_minutes          integer NOT NULL DEFAULT 90,
  teardown_buffer_minutes       integer NOT NULL DEFAULT 60,
  travel_buffer_minutes         integer NOT NULL DEFAULT 45,
  allow_double_booking          boolean NOT NULL DEFAULT false,
  default_view                  text NOT NULL DEFAULT 'month',
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedule_settings_default_view_check
    CHECK (default_view IN ('month', 'week', 'agenda'))
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  status              text NOT NULL DEFAULT 'unconfirmed',
  all_day             boolean NOT NULL DEFAULT false,
  starts_at           timestamptz NOT NULL,
  ends_at             timestamptz NOT NULL,
  setup_starts_at     timestamptz,
  teardown_ends_at    timestamptz,
  client_id           uuid REFERENCES clients(id) ON DELETE SET NULL,
  invoice_id          uuid REFERENCES invoices(id) ON DELETE SET NULL,
  event_type          text,
  venue_name          text,
  venue_address       text,
  public_note         text,
  internal_note       text,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedule_entries_status_check
    CHECK (status IN ('available', 'unconfirmed', 'booked', 'blocked', 'completed', 'hold')),
  CONSTRAINT schedule_entries_time_check
    CHECK (ends_at >= starts_at)
);

CREATE TABLE IF NOT EXISTS schedule_entry_staff (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_entry_id   uuid NOT NULL REFERENCES schedule_entries(id) ON DELETE CASCADE,
  staff_member_id     uuid NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  assignment_role     text,
  is_lead             boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedule_entry_staff_unique_assignment
    UNIQUE (schedule_entry_id, staff_member_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_members_sort_order
  ON staff_members (show_on_about_page, sort_order, display_name);

CREATE INDEX IF NOT EXISTS idx_schedule_entries_starts_at
  ON schedule_entries (starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_schedule_entry_staff_entry
  ON schedule_entry_staff (schedule_entry_id);

CREATE INDEX IF NOT EXISTS idx_schedule_entry_staff_staff
  ON schedule_entry_staff (staff_member_id);

DROP TRIGGER IF EXISTS staff_members_updated_at ON staff_members;
CREATE TRIGGER staff_members_updated_at
  BEFORE UPDATE ON staff_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users;
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS schedule_settings_updated_at ON schedule_settings;
CREATE TRIGGER schedule_settings_updated_at
  BEFORE UPDATE ON schedule_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS schedule_entries_updated_at ON schedule_entries;
CREATE TRIGGER schedule_entries_updated_at
  BEFORE UPDATE ON schedule_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS schedule_entry_staff_updated_at ON schedule_entry_staff;
CREATE TRIGGER schedule_entry_staff_updated_at
  BEFORE UPDATE ON schedule_entry_staff
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_entry_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_members_public_about_read" ON staff_members;
CREATE POLICY "staff_members_public_about_read"
  ON staff_members FOR SELECT TO anon
  USING (show_on_about_page = true AND employment_status = 'active');

DROP POLICY IF EXISTS "staff_members_public_about_read_auth" ON staff_members;
CREATE POLICY "staff_members_public_about_read_auth"
  ON staff_members FOR SELECT TO authenticated
  USING (show_on_about_page = true AND employment_status = 'active');

DROP POLICY IF EXISTS "admin_users_self_read" ON admin_users;
CREATE POLICY "admin_users_self_read"
  ON admin_users FOR SELECT TO authenticated
  USING (auth.uid() = id);

INSERT INTO schedule_settings (settings_key)
SELECT 'default'
WHERE NOT EXISTS (
  SELECT 1 FROM schedule_settings WHERE settings_key = 'default'
);

WITH owner_user AS (
  SELECT
    id,
    email,
    COALESCE(raw_user_meta_data ->> 'display_name', 'Toni Hall') AS display_name,
    NULLIF(raw_user_meta_data ->> 'avatar_url', '') AS avatar_url
  FROM auth.users
  WHERE lower(email) = 'tonihall015@gmail.com'
  LIMIT 1
),
owner_staff AS (
  INSERT INTO staff_members (
    linked_user_id,
    display_name,
    email,
    title,
    photo_url,
    can_login,
    is_assignable,
    show_on_about_page,
    public_bio,
    sort_order
  )
  SELECT
    id,
    display_name,
    email,
    'Owner / Lead Balloon Artist',
    avatar_url,
    true,
    true,
    true,
    'Founder of BalloonCraft KC, leading custom installs, client planning, and event-day design execution across the Kansas City metro.',
    1
  FROM owner_user
  ON CONFLICT (linked_user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    title = EXCLUDED.title,
    photo_url = COALESCE(EXCLUDED.photo_url, staff_members.photo_url),
    can_login = true,
    is_assignable = true,
    show_on_about_page = true
  RETURNING id, linked_user_id
)
INSERT INTO admin_users (
  id,
  staff_member_id,
  email,
  display_name,
  avatar_url,
  role,
  is_owner,
  is_active,
  can_manage_messages,
  can_manage_site,
  can_manage_clients,
  can_manage_schedule
)
SELECT
  owner_staff.linked_user_id,
  owner_staff.id,
  owner_user.email,
  owner_user.display_name,
  owner_user.avatar_url,
  'admin',
  true,
  true,
  true,
  true,
  true,
  true
FROM owner_user
JOIN owner_staff
  ON owner_staff.linked_user_id = owner_user.id
ON CONFLICT (id)
DO UPDATE SET
  staff_member_id = EXCLUDED.staff_member_id,
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  avatar_url = COALESCE(EXCLUDED.avatar_url, admin_users.avatar_url),
  role = 'admin',
  is_owner = true,
  is_active = true,
  can_manage_messages = true,
  can_manage_site = true,
  can_manage_clients = true,
  can_manage_schedule = true;
