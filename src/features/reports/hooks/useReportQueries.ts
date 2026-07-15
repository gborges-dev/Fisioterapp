import { useQuery } from '@tanstack/react-query'

import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
import {
  fetchClinicPeriodSummary,
  fetchEvolutionDailyInRange,
  fetchFormSubmissionsReport,
  listEvolutionInDateRange,
} from '../services/reportsApi'

function isApiReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

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
      isApiReady(),
  })
}

export function useClinicSummary(fromYmd: string, toYmd: string) {
  return useQuery({
    queryKey: queryKeys.reports.clinicSummary(fromYmd, toYmd),
    queryFn: async () => {
      const { data, error } = await fetchClinicPeriodSummary(
        undefined,
        fromYmd,
        toYmd,
      )
      if (error) throw error
      return data
    },
    enabled:
      Boolean(fromYmd) &&
      Boolean(toYmd) &&
      fromYmd <= toYmd &&
      isApiReady(),
  })
}

export function useClinicEvolutionDaily(fromYmd: string, toYmd: string) {
  return useQuery({
    queryKey: queryKeys.reports.clinicEvolutionDaily(fromYmd, toYmd),
    queryFn: async () => {
      const { data, error } = await fetchEvolutionDailyInRange(
        undefined,
        fromYmd,
        toYmd,
      )
      if (error) throw error
      return data
    },
    enabled:
      Boolean(fromYmd) &&
      Boolean(toYmd) &&
      fromYmd <= toYmd &&
      isApiReady(),
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
    queryFn: async () => {
      const { data, error } = await fetchFormSubmissionsReport(templateId!, {
        patientId: patientId || undefined,
        fromYmd: hasFullPeriod ? fromYmd : undefined,
        toYmd: hasFullPeriod ? toYmd : undefined,
      })
      if (error) throw error
      return data
    },
    enabled:
      Boolean(templateId) &&
      !partialPeriod &&
      !invalidRange &&
      (!hasFrom || hasFullPeriod) &&
      isApiReady(),
  })
}
