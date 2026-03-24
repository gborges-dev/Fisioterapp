import { useQuery } from '@tanstack/react-query'

import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { queryKeys } from '../../../lib/queryKeys'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import { fetchDashboardSummary } from '../services/dashboardApi'

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: () => fetchDashboardSummary(DEFAULT_WORKSPACE_ID),
    enabled: isSupabaseConfigured(),
  })
}
