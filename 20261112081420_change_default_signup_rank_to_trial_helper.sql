/*
# Change default signup rank to Trial Helper

1. Changes
- Updates `handle_new_user()` so new signups get rank `trial_helper` instead of `discord_developer`.
- Roblox/Discord identity fields are still captured from raw_user_meta_data as before.

2. Modified functions
- `public.handle_new_user()` — rank value changed from 'discord_developer' to 'trial_helper'.

3. Security
- No changes to RLS, grants, or EXECUTE permissions.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.staff_profiles (user_id, roblox_name, roblox_id, discord_name, discord_id, rank)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'roblox_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'roblox_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'discord_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'discord_id', ''),
    'trial_helper'
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
