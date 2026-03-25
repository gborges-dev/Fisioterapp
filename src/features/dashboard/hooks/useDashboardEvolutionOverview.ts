import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '../../../lib/queryKeys'
import { DEFAULT_WORKSPACE_ID } from '../../../lib/workspace'
import { isSupabaseConfigured } from '../../../lib/supabaseClient'
import { fetchPatientEvolutionOverview } from '../services/dashboardApi'

export function useDashboardEvolutionOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.evolutionOverview,
    queryFn: () => fetchPatientEvolutionOverview(DEFAULT_WORKSPACE_ID),
    enabled: isSupabaseConfigured(),
  })
}
