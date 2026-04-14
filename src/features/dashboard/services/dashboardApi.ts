import { supabase } from '../../../lib/supabaseClient'

export interface PatientEvolutionOverviewItem {
  patientId: string
  fullName: string
  consultationReason: string | null
  firstEvolutionDate: string | null
  lastEvolutionDate: string | null
  lastEvolutionPreview: string | null
  evolutionCount: number
}

export interface PatientEvolutionOverview {
  rows: PatientEvolutionOverviewItem[]
  withEvolutionLast7Days: number
  withoutEvolution: number
}

export interface DashboardSummary {
  patientCount: number
  evolutionLast7Days: number
  submissionsLast7Days: number
  formTemplateCount: number
}

export interface DailyCountPoint {
  /** YYYY-MM-DD */
  date: string
  count: number
}

function lastNDates(days: number): string[] {
  const out: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    out.push(d.toLocaleDateString('sv-SE'))
  }
  return out
}

function dayFromCreatedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('sv-SE')
}

/** Contagem por dia (últimos `days`) com base em entry_date. */
export async function fetchEvolutionDailySeries(
  workspaceId: string,
  days: number,
): Promise<DailyCountPoint[]> {
  const labels = lastNDates(days)
  const start = labels[0]!
  const { data, error } = await supabase
    .from('evolution_entries')
    .select('entry_date')
    .eq('workspace_id', workspaceId)
    .gte('entry_date', start)

  if (error) throw error

  const counts = new Map<string, number>()
  for (const day of labels) counts.set(day, 0)
  for (const row of data ?? []) {
    const ymd = row.entry_date as string
    if (counts.has(ymd)) counts.set(ymd, (counts.get(ymd) ?? 0) + 1)
  }

  return labels.map((date) => ({ date, count: counts.get(date) ?? 0 }))
}

/** Contagem por dia (últimos `days`) com base em created_at das submissões do workspace. */
export async function fetchSubmissionsDailySeries(
  workspaceId: string,
  days: number,
): Promise<DailyCountPoint[]> {
  const labels = lastNDates(days)
  const start = new Date(labels[0]!)
  start.setHours(0, 0, 0, 0)
  const sinceIso = start.toISOString()

  const { data: templates, error: te } = await supabase
    .from('form_templates')
    .select('id')
    .eq('workspace_id', workspaceId)
  if (te) throw te
  const templateIds = (templates ?? []).map((t) => t.id as string)
  if (templateIds.length === 0) {
    return labels.map((date) => ({ date, count: 0 }))
  }

  const { data, error } = await supabase
    .from('form_submissions')
    .select('created_at')
    .in('form_template_id', templateIds)
    .gte('created_at', sinceIso)
  if (error) throw error

  const counts = new Map<string, number>()
  for (const day of labels) counts.set(day, 0)
  for (const row of data ?? []) {
    const ymd = dayFromCreatedAt(row.created_at as string)
    if (counts.has(ymd)) counts.set(ymd, (counts.get(ymd) ?? 0) + 1)
  }

  return labels.map((date) => ({ date, count: counts.get(date) ?? 0 }))
}

export async function fetchDashboardSummary(
  workspaceId: string,
): Promise<DashboardSummary> {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceIso = since.toISOString()

  const [patients, evolutions, submissions, templates] = await Promise.all([
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
    supabase
      .from('evolution_entries')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceIso),
    supabase
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso),
    supabase
      .from('form_templates')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
  ])

  if (patients.error) throw patients.error
  if (evolutions.error) throw evolutions.error
  if (submissions.error) throw submissions.error
  if (templates.error) throw templates.error

  return {
    patientCount: patients.count ?? 0,
    evolutionLast7Days: evolutions.count ?? 0,
    submissionsLast7Days: submissions.count ?? 0,
    formTemplateCount: templates.count ?? 0,
  }
}

export async function fetchPatientEvolutionOverview(
  workspaceId: string,
): Promise<PatientEvolutionOverview> {
  const [{ data: patientRows, error: pe }, { data: evoRows, error: ee }] =
    await Promise.all([
      supabase
        .from('patients')
        .select('id, full_name, consultation_reason, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
      supabase
        .from('evolution_entries')
        .select('patient_id, entry_date, content')
        .eq('workspace_id', workspaceId),
    ])

  if (pe) throw pe
  if (ee) throw ee

  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceYmd = since.toISOString().slice(0, 10)

  type Agg = { dates: string[]; byDateContent: Map<string, string> }
  const byPatient = new Map<string, Agg>()

  for (const row of evoRows ?? []) {
    const pid = row.patient_id as string
    if (!byPatient.has(pid)) {
      byPatient.set(pid, { dates: [], byDateContent: new Map() })
    }
    const g = byPatient.get(pid)!
    g.dates.push(row.entry_date as string)
    g.byDateContent.set(row.entry_date as string, row.content as string)
  }

  let withEvolutionLast7Days = 0
  let withoutEvolution = 0

  const rows: PatientEvolutionOverviewItem[] = (patientRows ?? []).map((p) => {
    const g = byPatient.get(p.id)
    const dates = g ? [...new Set(g.dates)].sort() : []
    const first = dates[0] ?? null
    const last = dates[dates.length - 1] ?? null
    const lastContent = last && g ? g.byDateContent.get(last) ?? null : null
    const preview =
      lastContent && lastContent.length > 120
        ? `${lastContent.slice(0, 120)}…`
        : lastContent

    if (dates.length === 0) {
      withoutEvolution += 1
    } else if (last && last >= sinceYmd) {
      withEvolutionLast7Days += 1
    }

    return {
      patientId: p.id,
      fullName: p.full_name as string,
      consultationReason: (p as { consultation_reason?: string | null })
        .consultation_reason ?? null,
      firstEvolutionDate: first,
      lastEvolutionDate: last,
      lastEvolutionPreview: preview,
      evolutionCount: dates.length,
    }
  })

  return { rows, withEvolutionLast7Days, withoutEvolution }
}
