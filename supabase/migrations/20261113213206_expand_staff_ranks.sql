ALTER TABLE staff_profiles
  DROP CONSTRAINT IF EXISTS staff_profiles_rank_check;

ALTER TABLE staff_profiles
  ADD CONSTRAINT staff_profiles_rank_check CHECK (rank IN (
    'trial_helper',
    'helper',
    'trial_moderator',
    'moderator',
    'trial_administrator',
    'administrator',
    'supervisor',
    'operator',
    'manager_staff',
    'high_staff_council',
    'community_manager',
    'co_owner',
    'owner',
    'founder',
    'discord_developer'
  ));

ALTER TABLE permission_settings
  DROP CONSTRAINT IF EXISTS permission_settings_required_rank_check;

ALTER TABLE permission_settings
  ADD CONSTRAINT permission_settings_required_rank_check CHECK (required_rank IN (
    'trial_helper',
    'helper',
    'trial_moderator',
    'moderator',
    'trial_administrator',
    'administrator',
    'supervisor',
    'operator',
    'manager_staff',
    'high_staff_council',
    'community_manager',
    'co_owner',
    'owner',
    'founder',
    'discord_developer'
  ));