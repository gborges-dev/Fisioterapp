import { apiRequest } from '../../../lib/apiClient'

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

export async function fetchEvolutionDailySeries(
  _workspaceId: string | undefined,
  days: number,
) {
  const qs = new URLSearchParams({ days: String(days) })
  return apiRequest<DailyCountPoint[]>(`/dashboard/evolution-daily?${qs}`)
}

export async function fetchSubmissionsDailySeries(
  _workspaceId: string | undefined,
  days: number,
) {
  const qs = new URLSearchParams({ days: String(days) })
  return apiRequest<DailyCountPoint[]>(`/dashboard/submissions-daily?${qs}`)
}

export async function fetchDashboardSummary(_workspaceId?: string) {
  return apiRequest<DashboardSummary>('/dashboard/summary')
}

export async function fetchPatientEvolutionOverview(_workspaceId?: string) {
  return apiRequest<PatientEvolutionOverview>(
    '/dashboard/patient-evolution-overview',
  )
}
