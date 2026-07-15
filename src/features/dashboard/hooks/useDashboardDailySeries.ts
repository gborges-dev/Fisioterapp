import { useQuery } from '@tanstack/react-query'

import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
import {
  fetchEvolutionDailySeries,
  fetchSubmissionsDailySeries,
} from '../services/dashboardApi'

const DAYS = 14

function isApiReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

export function useDashboardEvolutionDaily() {
  return useQuery({
    queryKey: queryKeys.dashboard.evolutionDaily(DAYS),
    queryFn: async () => {
      const { data, error } = await fetchEvolutionDailySeries(undefined, DAYS)
      if (error) throw error
      return data
    },
    enabled: isApiReady(),
  })
}

export function useDashboardSubmissionsDaily() {
  return useQuery({
    queryKey: queryKeys.dashboard.submissionsDaily(DAYS),
    queryFn: async () => {
      const { data, error } = await fetchSubmissionsDailySeries(undefined, DAYS)
      if (error) throw error
      return data
    },
    enabled: isApiReady(),
  })
}

export { DAYS as dashboardChartDays }
