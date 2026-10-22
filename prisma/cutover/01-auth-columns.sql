-- Reemplazo de lo que vivía en auth.users (Supabase Auth). Se aplica en el Postgres del clon.
ALTER TABLE public.profile
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sign_in_at   timestamptz,
  ADD COLUMN IF NOT EXISTS cuil              text,
  ADD COLUMN IF NOT EXISTS phone             text,
  ADD COLUMN IF NOT EXISTS metadata          jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.auth_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  type       text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_tokens_profile_id_type_idx ON public.auth_tokens (profile_id, type);

-- user_table_preferences: el FK a auth.users se reemplaza (user_id == profile.id)
-- Se aplica después del restore, junto con el DROP de las FK a auth.users.
