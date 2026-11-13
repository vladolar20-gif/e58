/*
# Expand staff rank hierarchy to 15 ranks

1. Changes
- Replaces the 4-rank system (helper, moderator, supervisor, manager_staff) with a
  full 15-level hierarchy, ordered from lowest to highest:
  1. trial_helper        - Trial Helper
  2. helper              - Helper
  3. trial_moderator     - Trial Moderator
  4. moderator           - Moderator
  5. trial_administrator - Trial Administrator
  6. administrator       - Administrator
  7. supervisor          - Supervisor
  8. operator            - Operator
  9. manager_staff       - Manager Staff
  10. high_staff_council - Consiliul Superior High Staff
  11. community_manager  - Community Manager
  12. co_owner           - Co-owner
  13. owner              - Owner
  14. founder            - Fondator Comunitate
  15. discord_developer  - Discord Developer

2. Modified tables
- `staff_profiles`: rank column CHECK constraint now accepts the 15 new values.
  Existing rows keep their values (helper, moderator, supervisor, manager_staff are
  all still valid).
- `permission_settings`: required_rank CHECK constraint now accepts the 15 new values.

3. Security
- No changes to RLS policies or grants. Only column CHECK constraints are replaced.

4. Notes
- Old rank values remain valid so no data migration is needed.
- Default ranks for seeded permission_settings rows are unchanged.
*/

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
