-- Fichas de avaliação: modelos globais, instâncias por paciente e vínculo com evolução.

CREATE TABLE IF NOT EXISTS public.evaluation_form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_evaluation_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.evaluation_form_templates (id) ON DELETE RESTRICT,
  title text NOT NULL,
  schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  evaluation_date date NOT NULL DEFAULT (CURRENT_DATE),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patient_evaluation_forms_patient
  ON public.patient_evaluation_forms (patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_evaluation_forms_workspace
  ON public.patient_evaluation_forms (workspace_id);

CREATE INDEX IF NOT EXISTS idx_evaluation_form_templates_workspace
  ON public.evaluation_form_templates (workspace_id);

ALTER TABLE public.evolution_entries
  ADD COLUMN IF NOT EXISTS patient_evaluation_form_id uuid
  REFERENCES public.patient_evaluation_forms (id) ON DELETE RESTRICT;

-- Modelo padrão para migração de evoluções existentes
INSERT INTO public.evaluation_form_templates (id, workspace_id, title, description, schema)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Ficha padrão (migração)',
  'Modelo criado automaticamente para vincular evoluções existentes.',
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Criar ficha por paciente com evoluções sem vínculo
INSERT INTO public.patient_evaluation_forms (
  id,
  patient_id,
  workspace_id,
  template_id,
  title,
  schema,
  answers,
  evaluation_date
)
SELECT
  gen_random_uuid(),
  e.patient_id,
  e.workspace_id,
  '00000000-0000-0000-0000-000000000010',
  'Ficha padrão (migração)',
  '[]'::jsonb,
  '{}'::jsonb,
  MIN(e.entry_date)
FROM public.evolution_entries e
WHERE e.patient_evaluation_form_id IS NULL
GROUP BY e.patient_id, e.workspace_id;

-- Vincular evoluções à ficha criada para cada paciente
UPDATE public.evolution_entries e
SET patient_evaluation_form_id = pef.id
FROM public.patient_evaluation_forms pef
WHERE e.patient_evaluation_form_id IS NULL
  AND e.patient_id = pef.patient_id
  AND e.workspace_id = pef.workspace_id
  AND pef.template_id = '00000000-0000-0000-0000-000000000010';

ALTER TABLE public.evolution_entries
  ALTER COLUMN patient_evaluation_form_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evolution_entries_evaluation_form
  ON public.evolution_entries (patient_evaluation_form_id);

ALTER TABLE public.evaluation_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_evaluation_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_anon_all_evaluation_form_templates" ON public.evaluation_form_templates;
DROP POLICY IF EXISTS "dev_anon_all_patient_evaluation_forms" ON public.patient_evaluation_forms;

CREATE POLICY "dev_anon_all_evaluation_form_templates"
  ON public.evaluation_form_templates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "dev_anon_all_patient_evaluation_forms"
  ON public.patient_evaluation_forms FOR ALL TO anon USING (true) WITH CHECK (true);
