/*
# Update signup flow for Discord Developer rank with Roblox + Discord identity

1. Changes
- Replaces the `handle_new_user()` trigger function so that it reads Roblox and Discord
  identity fields from the new user's `raw_user_meta_data` (passed by the frontend at
  signup time) and stores them in the `staff_profiles` row.
- New signups now get rank `discord_developer` instead of `helper`.
- Fields captured: roblox_name, roblox_id, discord_name, discord_id.
- If any field is missing it defaults to an empty string (same as current behavior).

2. Modified functions
- `public.handle_new_user()` — SECURITY DEFINER trigger function on auth.users.
  Now reads `raw_user_meta_data->>'roblox_name'`, `->>'roblox_id'`,
  `->>'discord_name'`, `->>'discord_id'` and inserts them into staff_profiles.
  The rank is set to `'discord_developer'`.

3. Security
- The function remains SECURITY DEFINER with search_path = public.
- EXECUTE remains revoked from PUBLIC/anon and granted to authenticated + service_role.
- No changes to RLS policies or grants on staff_profiles.
- No changes to table structure — all referenced columns already exist.

4. Notes
- Existing profiles are NOT affected. Only new auth.users rows trigger this function.
- `raw_user_meta_data` is the metadata blob passed to `supabase.auth.signUp({ data })`.
  It is user-mutable, but these fields are display-only identity info, not authorization
  data — the rank is set by the trigger, not taken from user input.
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
    'discord_developer'
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;
