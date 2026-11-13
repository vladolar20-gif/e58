-- ============================================================================
-- staff_profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  roblox_name text NOT NULL DEFAULT '',
  roblox_id text NOT NULL DEFAULT '',
  discord_name text,
  discord_id text,
  rank text NOT NULL DEFAULT 'helper' CHECK (rank IN ('helper', 'moderator', 'supervisor', 'manager_staff')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON staff_profiles TO authenticated, service_role;

DROP POLICY IF EXISTS "select_staff_profiles" ON staff_profiles;
CREATE POLICY "select_staff_profiles" ON staff_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_staff_profile" ON staff_profiles;
CREATE POLICY "insert_own_staff_profile" ON staff_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_staff_profile" ON staff_profiles;
CREATE POLICY "update_own_staff_profile" ON staff_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_staff_profile" ON staff_profiles;
CREATE POLICY "delete_own_staff_profile" ON staff_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-create staff profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_profiles (user_id, roblox_name, roblox_id)
  VALUES (NEW.id, '', '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;

-- ============================================================================
-- shifts
-- ============================================================================
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clock_in timestamptz NOT NULL DEFAULT now(),
  clock_out timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON shifts TO authenticated, service_role;

DROP POLICY IF EXISTS "select_shifts" ON shifts;
CREATE POLICY "select_shifts" ON shifts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_shift" ON shifts;
CREATE POLICY "insert_own_shift" ON shifts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_shift" ON shifts;
CREATE POLICY "update_own_shift" ON shifts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_shift" ON shifts;
CREATE POLICY "delete_own_shift" ON shifts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_clock_in ON shifts(clock_in DESC);

-- ============================================================================
-- sanctions
-- ============================================================================
CREATE TABLE IF NOT EXISTS sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roblox_name text NOT NULL,
  roblox_id text,
  sanction_type text NOT NULL CHECK (sanction_type IN ('kick', 'temp_ban', 'permanent_ban', 'warning', 'mute', 'ban')),
  reason text NOT NULL,
  duration text,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sanctions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON sanctions TO authenticated, service_role;

DROP POLICY IF EXISTS "select_sanctions" ON sanctions;
CREATE POLICY "select_sanctions" ON sanctions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_sanctions" ON sanctions;
CREATE POLICY "insert_sanctions" ON sanctions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = issued_by);

DROP POLICY IF EXISTS "update_sanctions" ON sanctions;
CREATE POLICY "update_sanctions" ON sanctions FOR UPDATE
  TO authenticated USING (auth.uid() = issued_by) WITH CHECK (auth.uid() = issued_by);

DROP POLICY IF EXISTS "delete_sanctions" ON sanctions;
CREATE POLICY "delete_sanctions" ON sanctions FOR DELETE
  TO authenticated USING (auth.uid() = issued_by);

CREATE INDEX IF NOT EXISTS idx_sanctions_created_at ON sanctions(created_at DESC);

-- ============================================================================
-- warnings
-- ============================================================================
CREATE TABLE IF NOT EXISTS warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roblox_name text NOT NULL,
  roblox_id text,
  reason text NOT NULL,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON warnings TO authenticated, service_role;

DROP POLICY IF EXISTS "select_warnings" ON warnings;
CREATE POLICY "select_warnings" ON warnings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_warnings" ON warnings;
CREATE POLICY "insert_warnings" ON warnings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = issued_by);

DROP POLICY IF EXISTS "update_warnings" ON warnings;
CREATE POLICY "update_warnings" ON warnings FOR UPDATE
  TO authenticated USING (auth.uid() = issued_by) WITH CHECK (auth.uid() = issued_by);

DROP POLICY IF EXISTS "delete_warnings" ON warnings;
CREATE POLICY "delete_warnings" ON warnings FOR DELETE
  TO authenticated USING (auth.uid() = issued_by);

CREATE INDEX IF NOT EXISTS idx_warnings_created_at ON warnings(created_at DESC);

-- ============================================================================
-- regulations
-- ============================================================================
CREATE TABLE IF NOT EXISTS regulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON regulations TO authenticated, service_role;

DROP POLICY IF EXISTS "select_regulations" ON regulations;
CREATE POLICY "select_regulations" ON regulations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_regulations" ON regulations;
CREATE POLICY "insert_regulations" ON regulations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_regulations" ON regulations;
CREATE POLICY "update_regulations" ON regulations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_regulations" ON regulations;
CREATE POLICY "delete_regulations" ON regulations FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL,
  roblox_name text,
  staff_name text,
  staff_rank text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON logs TO authenticated, service_role;

DROP POLICY IF EXISTS "select_logs" ON logs;
CREATE POLICY "select_logs" ON logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_logs" ON logs;
CREATE POLICY "insert_logs" ON logs FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_logs" ON logs;
CREATE POLICY "update_logs" ON logs FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_logs" ON logs;
CREATE POLICY "delete_logs" ON logs FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

-- ============================================================================
-- announcements
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON announcements TO authenticated, service_role;

DROP POLICY IF EXISTS "select_announcements" ON announcements;
CREATE POLICY "select_announcements" ON announcements FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_announcements" ON announcements;
CREATE POLICY "insert_announcements" ON announcements FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_announcements" ON announcements;
CREATE POLICY "update_announcements" ON announcements FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_announcements" ON announcements;
CREATE POLICY "delete_announcements" ON announcements FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- ============================================================================
-- invoiri (time-off requests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoiri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_name text NOT NULL DEFAULT '',
  reason text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  manager_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoiri ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON invoiri TO authenticated, service_role;

DROP POLICY IF EXISTS "select_invoiri" ON invoiri;
CREATE POLICY "select_invoiri" ON invoiri FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_invoiri" ON invoiri;
CREATE POLICY "insert_own_invoiri" ON invoiri FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_invoiri" ON invoiri;
CREATE POLICY "update_invoiri" ON invoiri FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_invoiri" ON invoiri;
CREATE POLICY "delete_own_invoiri" ON invoiri FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_invoiri_created_at ON invoiri(created_at DESC);

-- ============================================================================
-- staff_sanctions
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name text NOT NULL,
  staff_rank text,
  sanction_type text NOT NULL,
  reason text NOT NULL,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE staff_sanctions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON staff_sanctions TO authenticated, service_role;

DROP POLICY IF EXISTS "select_staff_sanctions" ON staff_sanctions;
CREATE POLICY "select_staff_sanctions" ON staff_sanctions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_staff_sanctions" ON staff_sanctions;
CREATE POLICY "insert_staff_sanctions" ON staff_sanctions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_staff_sanctions" ON staff_sanctions;
CREATE POLICY "update_staff_sanctions" ON staff_sanctions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_staff_sanctions" ON staff_sanctions;
CREATE POLICY "delete_staff_sanctions" ON staff_sanctions FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_staff_sanctions_created_at ON staff_sanctions(created_at DESC);

-- ============================================================================
-- sanction_guidelines
-- ============================================================================
CREATE TABLE IF NOT EXISTS sanction_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  do_action text NOT NULL DEFAULT '',
  dont_action text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sanction_guidelines ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON sanction_guidelines TO authenticated, service_role;

DROP POLICY IF EXISTS "select_sanction_guidelines" ON sanction_guidelines;
CREATE POLICY "select_sanction_guidelines" ON sanction_guidelines FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_sanction_guidelines" ON sanction_guidelines;
CREATE POLICY "insert_sanction_guidelines" ON sanction_guidelines FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_sanction_guidelines" ON sanction_guidelines;
CREATE POLICY "update_sanction_guidelines" ON sanction_guidelines FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_sanction_guidelines" ON sanction_guidelines;
CREATE POLICY "delete_sanction_guidelines" ON sanction_guidelines FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- permission_settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS permission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key text NOT NULL UNIQUE,
  required_rank text NOT NULL DEFAULT 'helper' CHECK (required_rank IN ('helper', 'moderator', 'supervisor', 'manager_staff')),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE permission_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON permission_settings TO authenticated, service_role;

DROP POLICY IF EXISTS "select_permission_settings" ON permission_settings;
CREATE POLICY "select_permission_settings" ON permission_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_permission_settings" ON permission_settings;
CREATE POLICY "update_permission_settings" ON permission_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "insert_permission_settings" ON permission_settings;
CREATE POLICY "insert_permission_settings" ON permission_settings FOR INSERT
  TO authenticated WITH CHECK (true);

INSERT INTO permission_settings (action_key, required_rank) VALUES
  ('add_sanction', 'helper'),
  ('delete_sanction', 'supervisor'),
  ('add_warn', 'helper'),
  ('delete_warn', 'supervisor'),
  ('manage_members', 'manager_staff'),
  ('manage_announcements', 'supervisor'),
  ('edit_regulations', 'manager_staff'),
  ('review_invoiri', 'supervisor'),
  ('view_all_shifts', 'supervisor')
ON CONFLICT (action_key) DO NOTHING;

-- ============================================================================
-- api_keys
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  issuer_profile_id uuid REFERENCES staff_profiles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated, service_role;

DROP POLICY IF EXISTS "select_api_keys" ON api_keys;
CREATE POLICY "select_api_keys" ON api_keys FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_api_keys" ON api_keys;
CREATE POLICY "insert_api_keys" ON api_keys FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_api_keys" ON api_keys;
CREATE POLICY "update_api_keys" ON api_keys FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_api_keys" ON api_keys;
CREATE POLICY "delete_api_keys" ON api_keys FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- notification_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text,
  content text,
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON notification_logs TO authenticated, service_role;

DROP POLICY IF EXISTS "select_notification_logs" ON notification_logs;
CREATE POLICY "select_notification_logs" ON notification_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_notification_logs" ON notification_logs;
CREATE POLICY "insert_notification_logs" ON notification_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_staff_profiles_updated_at ON staff_profiles;
CREATE TRIGGER update_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_regulations_updated_at ON regulations;
CREATE TRIGGER update_regulations_updated_at
  BEFORE UPDATE ON regulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_sanction_guidelines_updated_at ON sanction_guidelines;
CREATE TRIGGER update_sanction_guidelines_updated_at
  BEFORE UPDATE ON sanction_guidelines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();