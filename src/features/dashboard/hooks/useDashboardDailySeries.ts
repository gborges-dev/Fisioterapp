import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import {
  fetchEvolutionDailySeries,
  fetchSubmissionsDailySeries,
} from '../services/dashboardApi'

const DAYS = 14

export function useDashboardEvolutionDaily() {
  return useQuery({
    queryKey: queryKeys.dashboard.evolutionDaily(DAYS),
    queryFn: () => fetchEvolutionDailySeries(DEFAULT_WORKSPACE_ID, DAYS),
    enabled: isSupabaseConfigured(),
  })
}

export function useDashboardSubmissionsDaily() {
  return useQuery({
    queryKey: queryKeys.dashboard.submissionsDaily(DAYS),
    queryFn: () => fetchSubmissionsDailySeries(DEFAULT_WORKSPACE_ID, DAYS),
    enabled: isSupabaseConfigured(),
  })
}

export { DAYS as dashboardChartDays }
