-- Ficha de avaliação: dados do paciente, histórico e cirurgia (1:1).
-- Executar após 20250324000000_initial.sql

ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IS NULL OR sex IN ('F', 'M', 'O')),
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS consultation_reason text;

CREATE TABLE IF NOT EXISTS public.patient_history (
  patient_id uuid PRIMARY KEY REFERENCES public.patients (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  profession text,
  smoker_status text CHECK (
    smoker_status IS NULL OR smoker_status IN ('never', 'ex', 'current')
  ),
  smoking_duration text,
  smoking_quit_duration text,
  practices_exercise boolean,
  consumes_alcohol boolean,
  comorbidity text,
  keloid_scar text,
  observation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_surgery (
  patient_id uuid PRIMARY KEY REFERENCES public.patients (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  surgery_type text,
  surgeon_name text,
  surgeon_contact_phone text,
  post_op_duration_notes text,
  uses_compression_garment boolean,
  garment_type text,
  uses_compression_plate boolean,
  plate_type text,
  doctor_guidance text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_surgery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_anon_all_patient_history" ON public.patient_history;
DROP POLICY IF EXISTS "dev_anon_all_patient_surgery" ON public.patient_surgery;

CREATE POLICY "dev_anon_all_patient_history"
  ON public.patient_history FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "dev_anon_all_patient_surgery"
  ON public.patient_surgery FOR ALL TO anon
  USING (true) WITH CHECK (true);
