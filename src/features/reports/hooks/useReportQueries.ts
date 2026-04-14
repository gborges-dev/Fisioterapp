import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import {
  fetchClinicPeriodSummary,
  fetchEvolutionDailyInRange,
  fetchFormSubmissionsReport,
  listEvolutionInDateRange,
} from '../services/reportsApi'

export function usePatientEvolutionReport(
  patientId: string | null,
  fromYmd: string,
  toYmd: string,
) {
  return useQuery({
    queryKey: queryKeys.reports.patientEvolution(
      patientId ?? '',
      fromYmd,
      toYmd,
    ),
    queryFn: async () => {
      const { data, error } = await listEvolutionInDateRange(
        patientId!,
        fromYmd,
        toYmd,
      )
      if (error) throw error
      return data
    },
    enabled:
      Boolean(patientId) &&
      Boolean(fromYmd) &&
      Boolean(toYmd) &&
      fromYmd <= toYmd &&
      isSupabaseConfigured(),
  })
}

export function useClinicSummary(fromYmd: string, toYmd: string) {
  return useQuery({
    queryKey: queryKeys.reports.clinicSummary(fromYmd, toYmd),
    queryFn: () =>
      fetchClinicPeriodSummary(DEFAULT_WORKSPACE_ID, fromYmd, toYmd),
    enabled:
      Boolean(fromYmd) &&
      Boolean(toYmd) &&
      fromYmd <= toYmd &&
      isSupabaseConfigured(),
  })
}

export function useClinicEvolutionDaily(fromYmd: string, toYmd: string) {
  return useQuery({
    queryKey: queryKeys.reports.clinicEvolutionDaily(fromYmd, toYmd),
    queryFn: () =>
      fetchEvolutionDailyInRange(DEFAULT_WORKSPACE_ID, fromYmd, toYmd),
    enabled:
      Boolean(fromYmd) &&
      Boolean(toYmd) &&
      fromYmd <= toYmd &&
      isSupabaseConfigured(),
  })
}

export function useFormSubmissionsReport(
  templateId: string | null,
  patientId: string | null,
  fromYmd: string,
  toYmd: string,
) {
  const hasFrom = Boolean(fromYmd.trim())
  const hasTo = Boolean(toYmd.trim())
  const partialPeriod = hasFrom !== hasTo
  const invalidRange = hasFrom && hasTo && fromYmd > toYmd
  const hasFullPeriod = hasFrom && hasTo && fromYmd <= toYmd
  const patientKey = patientId ?? ''
  const fromKey = hasFullPeriod ? fromYmd : ''
  const toKey = hasFullPeriod ? toYmd : ''

  return useQuery({
    queryKey: queryKeys.reports.formSubmissions(
      templateId ?? '',
      patientKey,
      fromKey,
      toKey,
    ),
    queryFn: () =>
      fetchFormSubmissionsReport(templateId!, {
        patientId: patientId || undefined,
        fromYmd: hasFullPeriod ? fromYmd : undefined,
        toYmd: hasFullPeriod ? toYmd : undefined,
      }),
    enabled:
      Boolean(templateId) &&
      !partialPeriod &&
      !invalidRange &&
      (!hasFrom || hasFullPeriod) &&
      isSupabaseConfigured(),
  })
}
