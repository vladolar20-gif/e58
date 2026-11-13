CREATE OR REPLACE FUNCTION public.create_admin_account_v2(
  account_email text,
  account_password text,
  account_rank text DEFAULT 'discord_developer'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
DECLARE
  new_user_id uuid;
BEGIN
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

  UPDATE public.staff_profiles
  SET rank = account_rank
  WHERE user_id = new_user_id;

  RETURN new_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_admin_account_v2(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_admin_account_v2(text, text, text) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.create_admin_account(text, text, text);