-- Lançamentos financeiros básicos (entradas / saídas), opcionalmente ligados a pacientes.

CREATE TABLE IF NOT EXISTS public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients (id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  entry_date date NOT NULL DEFAULT (CURRENT_DATE),
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_entries_workspace
  ON public.finance_entries (workspace_id);

CREATE INDEX IF NOT EXISTS idx_finance_entries_entry_date
  ON public.finance_entries (workspace_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_finance_entries_patient
  ON public.finance_entries (patient_id);

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_anon_all_finance_entries" ON public.finance_entries;

CREATE POLICY "dev_anon_all_finance_entries"
  ON public.finance_entries FOR ALL TO anon USING (true) WITH CHECK (true);
