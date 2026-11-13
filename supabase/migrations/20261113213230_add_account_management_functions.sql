CREATE OR REPLACE FUNCTION public.get_all_accounts()
RETURNS TABLE (
  profile_id uuid,
  user_id uuid,
  email text,
  roblox_name text,
  roblox_id text,
  discord_name text,
  discord_id text,
  rank text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  caller_rank text;
BEGIN
  SELECT sp.rank INTO caller_rank
  FROM public.staff_profiles sp
  WHERE sp.user_id = auth.uid();

  IF caller_rank IS NULL THEN
    RETURN;
  END IF;

  IF caller_rank NOT IN ('community_manager','co_owner','owner','founder','discord_developer') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    sp.id,
    sp.user_id,
    au.email::text,
    sp.roblox_name,
    sp.roblox_id,
    sp.discord_name,
    sp.discord_id,
    sp.rank,
    sp.is_active,
    sp.created_at
  FROM public.staff_profiles sp
  JOIN auth.users au ON au.id = sp.user_id
  ORDER BY sp.created_at ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_all_accounts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_all_accounts() TO authenticated;


CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_uuid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  caller_rank text;
BEGIN
  SELECT sp.rank INTO caller_rank
  FROM public.staff_profiles sp
  WHERE sp.user_id = auth.uid();

  IF caller_rank IS NULL THEN
    RAISE EXCEPTION 'Nu ai profil de staff.';
  END IF;

  IF caller_rank NOT IN ('community_manager','co_owner','owner','founder','discord_developer') THEN
    RAISE EXCEPTION 'Nu ai permisiunea sa stergi conturi.';
  END IF;

  IF target_user_uuid = auth.uid() THEN
    RAISE EXCEPTION 'Nu iti poti sterge propriul cont.';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_uuid;

  RETURN target_user_uuid;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO authenticated;