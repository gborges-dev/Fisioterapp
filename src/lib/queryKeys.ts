import { DEFAULT_WORKSPACE_ID } from './workspace'

export const workspaceId = DEFAULT_WORKSPACE_ID

export const queryKeys = {
  patients: {
    all: [workspaceId, 'patients'] as const,
    detail: (id: string) => [workspaceId, 'patients', id] as const,
  },
  evolution: (patientId: string) =>
    [workspaceId, 'evolution', patientId] as const,
  documents: (patientId: string) =>
    [workspaceId, 'documents', patientId] as const,
  dashboard: {
    summary: [workspaceId, 'dashboard', 'summary'] as const,
  },
  forms: {
    templates: [workspaceId, 'form-templates'] as const,
    template: (id: string) => [workspaceId, 'form-templates', id] as const,
    links: (templateId: string) =>
      [workspaceId, 'form-links', templateId] as const,
  },
  publicForm: (token: string) => ['public-form', token] as const,
}
