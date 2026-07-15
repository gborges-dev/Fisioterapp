import { useQuery } from '@tanstack/react-query'

import { getActiveWorkspaceId, getToken } from '../../auth/authStorage'
import { isApiConfigured } from '../../../lib/apiClient'
import { queryKeys } from '../../../lib/queryKeys'
import { fetchDashboardSummary } from '../services/dashboardApi'

function isApiReady() {
  return (
    isApiConfigured() &&
    Boolean(getToken()) &&
    Boolean(getActiveWorkspaceId())
  )
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: async () => {
      const { data, error } = await fetchDashboardSummary()
      if (error) throw error
      return data
    },
    enabled: isApiReady(),
  })
}
