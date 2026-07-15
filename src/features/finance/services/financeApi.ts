import { apiRequest } from '../../../lib/apiClient'
import type { Database } from '../../../types/database.types'
import { getActiveWorkspaceId } from '../../auth/authStorage'

export type FinanceEntryRow = Database['public']['Tables']['finance_entries']['Row']
export type FinanceEntryInsert =
  Database['public']['Tables']['finance_entries']['Insert']
export type FinanceEntryUpdate =
  Database['public']['Tables']['finance_entries']['Update']

export type FinanceEntryType = FinanceEntryRow['type']

export type FinanceEntryWithPatient = FinanceEntryRow & {
  patients: { full_name: string } | null
}

export type ListFinanceFilters = {
  workspaceId?: string
  from: string
  to: string
  patientId?: string | null
  type?: FinanceEntryType | null
}

export function listFinanceEntries(filters: ListFinanceFilters) {
  const qs = new URLSearchParams({
    from: filters.from,
    to: filters.to,
  })
  if (filters.patientId) qs.set('patientId', filters.patientId)
  if (filters.type) qs.set('type', filters.type)

  return apiRequest<FinanceEntryWithPatient[]>(`/finance-entries?${qs}`, {
    workspaceId: filters.workspaceId ?? getActiveWorkspaceId(),
  })
}

export function createFinanceEntry(
  payload: Omit<FinanceEntryInsert, 'workspace_id'> & { workspace_id?: string },
) {
  const { workspace_id, ...body } = payload
  return apiRequest<FinanceEntryRow>('/finance-entries', {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      amount:
        typeof body.amount === 'string' ? Number(body.amount) : body.amount,
      workspace_id,
    }),
    workspaceId: workspace_id ?? getActiveWorkspaceId(),
  })
}

export function updateFinanceEntry(id: string, payload: FinanceEntryUpdate) {
  const body = {
    ...payload,
    amount:
      payload.amount === undefined
        ? undefined
        : typeof payload.amount === 'string'
          ? Number(payload.amount)
          : payload.amount,
  }
  return apiRequest<FinanceEntryRow>(`/finance-entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteFinanceEntry(id: string) {
  return apiRequest<{ ok: boolean }>(`/finance-entries/${id}`, {
    method: 'DELETE',
  })
}
