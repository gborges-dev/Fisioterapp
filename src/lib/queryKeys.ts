import { DEFAULT_WORKSPACE_ID } from './workspace'

export const workspaceId = DEFAULT_WORKSPACE_ID

export const queryKeys = {
  patients: {
    all: [workspaceId, 'patients'] as const,
    detail: (id: string) => [workspaceId, 'patients', id] as const,
    history: (id: string) => [workspaceId, 'patients', id, 'history'] as const,
    surgery: (id: string) => [workspaceId, 'patients', id, 'surgery'] as const,
  },
  dashboard: {
    summary: [workspaceId, 'dashboard', 'summary'] as const,
    evolutionOverview: [workspaceId, 'dashboard', 'evolution-overview'] as const,
    evolutionDaily: (days: number) =>
      [workspaceId, 'dashboard', 'evolution-daily', days] as const,
    submissionsDaily: (days: number) =>
      [workspaceId, 'dashboard', 'submissions-daily', days] as const,
  },
  evolution: (patientId: string) =>
    [workspaceId, 'evolution', patientId] as const,
  documents: (patientId: string) =>
    [workspaceId, 'documents', patientId] as const,
  forms: {
    templates: [workspaceId, 'form-templates'] as const,
    template: (id: string) => [workspaceId, 'form-templates', id] as const,
    links: (templateId: string) =>
      [workspaceId, 'form-links', templateId] as const,
  },
  publicForm: (token: string) => ['public-form', token] as const,
  reports: {
    patientEvolution: (patientId: string, from: string, to: string) =>
      [workspaceId, 'reports', 'patient-evolution', patientId, from, to] as const,
    clinicSummary: (from: string, to: string) =>
      [workspaceId, 'reports', 'clinic-summary', from, to] as const,
    clinicEvolutionDaily: (from: string, to: string) =>
      [workspaceId, 'reports', 'clinic-evolution-daily', from, to] as const,
    formSubmissions: (
      templateId: string,
      patientId: string,
      from: string,
      to: string,
    ) =>
      [
        workspaceId,
        'reports',
        'form-submissions',
        templateId,
        patientId,
        from,
        to,
      ] as const,
  },
}
