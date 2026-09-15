-- Alivia o compute Nano: índices nas FKs/filtros mais usados e fecha a Data API
-- anônima (a API Nest usa a connection string postgres e não depende dessas policies).

CREATE INDEX IF NOT EXISTS idx_patients_workspace
  ON public.patients (workspace_id);

CREATE INDEX IF NOT EXISTS idx_patients_workspace_created
  ON public.patients (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evolution_entries_workspace
  ON public.evolution_entries (workspace_id);

CREATE INDEX IF NOT EXISTS idx_evolution_entries_patient
  ON public.evolution_entries (patient_id);

CREATE INDEX IF NOT EXISTS idx_evolution_entries_workspace_date
  ON public.evolution_entries (workspace_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_evolution_entries_patient_date
  ON public.evolution_entries (patient_id, entry_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evolution_entries_workspace_created
  ON public.evolution_entries (workspace_id, created_at);

CREATE INDEX IF NOT EXISTS idx_patient_documents_patient
  ON public.patient_documents (patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_documents_workspace
  ON public.patient_documents (workspace_id);

CREATE INDEX IF NOT EXISTS idx_form_templates_workspace
  ON public.form_templates (workspace_id);

CREATE INDEX IF NOT EXISTS idx_form_links_workspace
  ON public.form_links (workspace_id);

CREATE INDEX IF NOT EXISTS idx_form_links_template
  ON public.form_links (form_template_id);

CREATE INDEX IF NOT EXISTS idx_form_links_patient
  ON public.form_links (patient_id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_template
  ON public.form_submissions (form_template_id);

CREATE INDEX IF NOT EXISTS idx_form_submissions_template_created
  ON public.form_submissions (form_template_id, created_at);

CREATE INDEX IF NOT EXISTS idx_form_submissions_link
  ON public.form_submissions (form_link_id);

CREATE INDEX IF NOT EXISTS idx_patient_history_workspace
  ON public.patient_history (workspace_id);

CREATE INDEX IF NOT EXISTS idx_patient_surgery_workspace
  ON public.patient_surgery (workspace_id);

-- Policies abertas a anon permitem scrape via PostgREST e geram carga no Nano.
DROP POLICY IF EXISTS "dev_anon_all_workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "dev_anon_all_patients" ON public.patients;
DROP POLICY IF EXISTS "dev_anon_all_evolution" ON public.evolution_entries;
DROP POLICY IF EXISTS "dev_anon_all_docs_meta" ON public.patient_documents;
DROP POLICY IF EXISTS "dev_anon_all_form_templates" ON public.form_templates;
DROP POLICY IF EXISTS "dev_anon_all_form_links" ON public.form_links;
DROP POLICY IF EXISTS "dev_anon_all_form_submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "dev_anon_all_users" ON public.users;
DROP POLICY IF EXISTS "dev_anon_all_finance_entries" ON public.finance_entries;
DROP POLICY IF EXISTS "dev_anon_all_evaluation_form_templates" ON public.evaluation_form_templates;
DROP POLICY IF EXISTS "dev_anon_all_patient_evaluation_forms" ON public.patient_evaluation_forms;
DROP POLICY IF EXISTS "dev_anon_all_patient_history" ON public.patient_history;
DROP POLICY IF EXISTS "dev_anon_all_patient_surgery" ON public.patient_surgery;

DROP POLICY IF EXISTS "dev_anon_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "dev_anon_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "dev_anon_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "dev_anon_storage_delete" ON storage.objects;

DO $$
BEGIN
  REVOKE EXECUTE ON FUNCTION public.submit_form_response(uuid, jsonb)
    FROM PUBLIC, anon, authenticated;
EXCEPTION
  WHEN undefined_function THEN
    NULL;
END $$;
