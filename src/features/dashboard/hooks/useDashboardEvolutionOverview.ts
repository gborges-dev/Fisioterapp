import { useQuery } from '@tanstack/react-query'

import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
import { fetchPatientEvolutionOverview } from '../services/dashboardApi'

function isApiReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

export function useDashboardEvolutionOverview() {
  return useQuery({
    queryKey: queryKeys.dashboard.evolutionOverview,
    queryFn: async () => {
      const { data, error } = await fetchPatientEvolutionOverview()
      if (error) throw error
      return data
    },
    enabled: isApiReady(),
  })
}
