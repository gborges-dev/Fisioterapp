import { supabase } from '../../../lib/supabaseClient'
import type { Json } from '../../../types/database.types'
import type { PatientEvolutionOverviewItem } from '../../dashboard/services/dashboardApi'

export async function listEvolutionInDateRange(
  patientId: string,
  fromYmd: string,
  toYmd: string,
) {
  return supabase
    .from('evolution_entries')
    .select('*')
    .eq('patient_id', patientId)
    .gte('entry_date', fromYmd)
    .lte('entry_date', toYmd)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
}

export type { PatientEvolutionOverviewItem }

export interface ClinicPeriodSummary {
  fromYmd: string
  toYmd: string
  newPatients: number
  evolutionEntries: number
  formSubmissions: number
}

export interface DailyCountPoint {
  date: string
  count: number
}

export async function fetchClinicPeriodSummary(
  workspaceId: string,
  fromYmd: string,
  toYmd: string,
): Promise<ClinicPeriodSummary> {
  const fromIso = `${fromYmd}T00:00:00.000Z`
  const toEnd = new Date(`${toYmd}T12:00:00`)
  toEnd.setHours(23, 59, 59, 999)
  const toIso = toEnd.toISOString()

  const [patients, evolutions, templates] = await Promise.all([
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('evolution_entries')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('entry_date', fromYmd)
      .lte('entry_date', toYmd),
    supabase.from('form_templates').select('id').eq('workspace_id', workspaceId),
  ])

  if (patients.error) throw patients.error
  if (evolutions.error) throw evolutions.error
  if (templates.error) throw templates.error

  const templateIds = (templates.data ?? []).map((t) => t.id as string)
  let submissionsCount = 0
  if (templateIds.length > 0) {
    const sub = await supabase
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .in('form_template_id', templateIds)
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
    if (sub.error) throw sub.error
    submissionsCount = sub.count ?? 0
  }

  return {
    fromYmd,
    toYmd,
    newPatients: patients.count ?? 0,
    evolutionEntries: evolutions.count ?? 0,
    formSubmissions: submissionsCount,
  }
}

/** Contagem de evoluções por dia no intervalo (para gráfico do resumo). */
export async function fetchEvolutionDailyInRange(
  workspaceId: string,
  fromYmd: string,
  toYmd: string,
): Promise<DailyCountPoint[]> {
  const { data, error } = await supabase
    .from('evolution_entries')
    .select('entry_date')
    .eq('workspace_id', workspaceId)
    .gte('entry_date', fromYmd)
    .lte('entry_date', toYmd)

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const d = row.entry_date as string
    counts.set(d, (counts.get(d) ?? 0) + 1)
  }

  const points: DailyCountPoint[] = []
  const cur = new Date(`${fromYmd}T12:00:00`)
  const end = new Date(`${toYmd}T12:00:00`)
  while (cur <= end) {
    const ymd = cur.toLocaleDateString('sv-SE')
    points.push({ date: ymd, count: counts.get(ymd) ?? 0 })
    cur.setDate(cur.getDate() + 1)
  }
  return points
}

export interface FormSubmissionReportRow {
  id: string
  created_at: string
  answers: Record<string, unknown>
  patientId: string | null
  patientName: string | null
}

/**
 * Respostas a um modelo de formulário.
 * @param patientId - se definido, só submissões feitas via link associado a esse paciente
 * @param fromYmd / toYmd - se ambos definidos, filtra por created_at (inclusive)
 */
export async function fetchFormSubmissionsReport(
  templateId: string,
  options?: {
    patientId?: string | null
    fromYmd?: string | null
    toYmd?: string | null
  },
): Promise<FormSubmissionReportRow[]> {
  let linkIds: string[] | undefined
  if (options?.patientId) {
    const { data: links, error: le } = await supabase
      .from('form_links')
      .select('id')
      .eq('form_template_id', templateId)
      .eq('patient_id', options.patientId)
    if (le) throw le
    linkIds = (links ?? []).map((l) => l.id as string)
    if (linkIds.length === 0) return []
  }

  let query = supabase
    .from('form_submissions')
    .select(
      `
      id,
      created_at,
      answers,
      form_link_id,
      form_links (
        patient_id,
        patients ( id, full_name )
      )
    `,
    )
    .eq('form_template_id', templateId)
    .order('created_at', { ascending: false })

  if (linkIds) {
    query = query.in('form_link_id', linkIds)
  }

  if (options?.fromYmd && options?.toYmd) {
    const fromIso = `${options.fromYmd}T00:00:00.000Z`
    const toEnd = new Date(`${options.toYmd}T12:00:00`)
    toEnd.setHours(23, 59, 59, 999)
    query = query
      .gte('created_at', fromIso)
      .lte('created_at', toEnd.toISOString())
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => {
    const flRaw = row.form_links as unknown
    const flSingle = Array.isArray(flRaw) ? flRaw[0] : flRaw
    const fl = flSingle as {
      patient_id: string | null
      patients:
        | { id: string; full_name: string }
        | { id: string; full_name: string }[]
        | null
    } | null
    const patRaw = fl?.patients
    const pat = Array.isArray(patRaw) ? patRaw[0] : patRaw
    const raw = row.answers as Json
    const answers =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {}
    return {
      id: row.id as string,
      created_at: row.created_at as string,
      answers,
      patientId: fl?.patient_id ?? null,
      patientName: pat?.full_name ?? null,
    }
  })
}
