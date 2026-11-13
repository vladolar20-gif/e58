-- Create a SECURITY DEFINER function to bootstrap an admin account
-- that creates the auth user and sets the staff profile rank in one call.
CREATE OR REPLACE FUNCTION public.create_admin_account(
  account_email text,
  account_password text,
  account_rank text DEFAULT 'discord_developer'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create the auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    account_email,
    crypt(account_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  )
  RETURNING id INTO new_user_id;

  -- The handle_new_user trigger creates a staff_profiles row with rank 'trial_helper'.
  -- Update it to the requested rank.
  UPDATE public.staff_profiles
  SET rank = account_rank
  WHERE user_id = new_user_id;

  RETURN new_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_admin_account(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_admin_account(text, text, text) TO authenticated, service_role;

-- Create the identities record needed for Supabase auth to work
CREATE OR REPLACE FUNCTION public.create_admin_account_v2(
  account_email text,
  account_password text,
  account_rank text DEFAULT 'discord_developer'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Create the auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    account_email,
    crypt(account_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  )
  RETURNING id INTO new_user_id;

  -- Create the identities record
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', account_email),
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );

  -- The handle_new_user trigger creates a staff_profiles row with rank 'trial_helper'.
  -- Update it to the requested rank.
  UPDATE public.staff_profiles
  SET rank = account_rank
  WHERE user_id = new_user_id;

  RETURN new_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_admin_account_v2(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_admin_account_v2(text, text, text) TO authenticated, service_role;