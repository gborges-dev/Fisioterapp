import { apiRequest } from '../../../lib/apiClient'

export type WorkspaceListItem = {
  id: string
  name: string
  owner_user_id: string | null
  owner_name: string | null
  owner_email: string | null
}

export function listWorkspaces() {
  return apiRequest<WorkspaceListItem[]>('/admin/workspaces')
}

export function createWorkspace(body: {
  workspaceName: string
  therapist: { name: string; email: string; password: string }
}) {
  return apiRequest('/admin/workspaces', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
