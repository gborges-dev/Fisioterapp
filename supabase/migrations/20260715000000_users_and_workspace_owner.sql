CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'therapist')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.users (id);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_user_id
  ON public.workspaces (owner_user_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Dev policies (API uses service/connection string; keep consistent with existing pattern):
DROP POLICY IF EXISTS "dev_anon_all_users" ON public.users;
CREATE POLICY "dev_anon_all_users" ON public.users FOR ALL TO anon USING (true) WITH CHECK (true);
