export const PATIENT_TABS = ['dados', 'fichas', 'evolucao', 'documentos'] as const

export type PatientTab = (typeof PATIENT_TABS)[number]

const TAB_SET = new Set<string>(PATIENT_TABS)

export function isPatientTab(value: string | null | undefined): value is PatientTab {
  return Boolean(value && TAB_SET.has(value))
}

export function parsePatientTab(
  search: string | URLSearchParams | null | undefined,
): PatientTab {
  const params =
    typeof search === 'string'
      ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      : (search ?? new URLSearchParams())
  const tab = params.get('tab')
  return isPatientTab(tab) ? tab : 'dados'
}

export function patientTabPath(patientId: string, tab: PatientTab = 'dados'): string {
  if (tab === 'dados') return `/patients/${patientId}`
  return `/patients/${patientId}?tab=${tab}`
}
