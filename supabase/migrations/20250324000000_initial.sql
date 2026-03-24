-- Fisioterapp: esquema provisório sem Auth (desenvolvimento).
-- Aplicar no projeto Supabase (SQL Editor ou CLI). Ver README.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.workspaces (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Workspace padrão')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evolution_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  content text NOT NULL,
  entry_date date NOT NULL DEFAULT (CURRENT_DATE),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  title text NOT NULL,
  schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id uuid NOT NULL REFERENCES public.form_templates (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  public_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at timestamptz,
  patient_id uuid REFERENCES public.patients (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_link_id uuid NOT NULL REFERENCES public.form_links (id) ON DELETE CASCADE,
  form_template_id uuid NOT NULL REFERENCES public.form_templates (id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.submit_form_response(p_token uuid, p_answers jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.form_links%ROWTYPE;
  v_new_id uuid;
BEGIN
  SELECT * INTO v_link
  FROM public.form_links
  WHERE public_token = p_token
    AND (expires_at IS NULL OR expires_at > now());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  INSERT INTO public.form_submissions (form_link_id, form_template_id, answers)
  VALUES (v_link.id, v_link.form_template_id, p_answers)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_form_response(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_form_response(uuid, jsonb) TO anon, authenticated;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_anon_all_workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "dev_anon_all_patients" ON public.patients;
DROP POLICY IF EXISTS "dev_anon_all_evolution" ON public.evolution_entries;
DROP POLICY IF EXISTS "dev_anon_all_docs_meta" ON public.patient_documents;
DROP POLICY IF EXISTS "dev_anon_all_form_templates" ON public.form_templates;
DROP POLICY IF EXISTS "dev_anon_all_form_links" ON public.form_links;
DROP POLICY IF EXISTS "dev_anon_all_form_submissions" ON public.form_submissions;

CREATE POLICY "dev_anon_all_workspaces" ON public.workspaces FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "dev_anon_all_patients" ON public.patients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "dev_anon_all_evolution" ON public.evolution_entries FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "dev_anon_all_docs_meta" ON public.patient_documents FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "dev_anon_all_form_templates" ON public.form_templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "dev_anon_all_form_links" ON public.form_links FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "dev_anon_all_form_submissions" ON public.form_submissions FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "dev_anon_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "dev_anon_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "dev_anon_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "dev_anon_storage_delete" ON storage.objects;

CREATE POLICY "dev_anon_storage_select"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'patient-documents');

CREATE POLICY "dev_anon_storage_insert"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'patient-documents');

CREATE POLICY "dev_anon_storage_update"
ON storage.objects FOR UPDATE TO anon
USING (bucket_id = 'patient-documents')
WITH CHECK (bucket_id = 'patient-documents');

CREATE POLICY "dev_anon_storage_delete"
ON storage.objects FOR DELETE TO anon
USING (bucket_id = 'patient-documents');
