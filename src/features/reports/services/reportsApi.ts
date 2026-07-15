import { apiRequest } from '../../../lib/apiClient'
import type { Database } from '../../../types/database.types'
import type { PatientEvolutionOverviewItem } from '../../dashboard/services/dashboardApi'

export type EvolutionRow =
  Database['public']['Tables']['evolution_entries']['Row']

export async function listEvolutionInDateRange(
  patientId: string,
  fromYmd: string,
  toYmd: string,
) {
  const qs = new URLSearchParams({ from: fromYmd, to: toYmd })
  return apiRequest<EvolutionRow[]>(
    `/reports/patients/${patientId}/evolutions?${qs}`,
  )
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
  _workspaceId: string | undefined,
  fromYmd: string,
  toYmd: string,
) {
  const qs = new URLSearchParams({ from: fromYmd, to: toYmd })
  return apiRequest<ClinicPeriodSummary>(`/reports/clinic-summary?${qs}`)
}

/** Contagem de evoluções por dia no intervalo (para gráfico do resumo). */
export async function fetchEvolutionDailyInRange(
  _workspaceId: string | undefined,
  fromYmd: string,
  toYmd: string,
) {
  const qs = new URLSearchParams({ from: fromYmd, to: toYmd })
  return apiRequest<DailyCountPoint[]>(`/reports/evolution-daily?${qs}`)
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
) {
  const qs = new URLSearchParams()
  if (options?.patientId) qs.set('patientId', options.patientId)
  if (options?.fromYmd) qs.set('from', options.fromYmd)
  if (options?.toYmd) qs.set('to', options.toYmd)
  const q = qs.toString()
  return apiRequest<FormSubmissionReportRow[]>(
    `/reports/form-templates/${templateId}/submissions${q ? `?${q}` : ''}`,
  )
}
