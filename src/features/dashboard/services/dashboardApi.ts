import { supabase } from '../../../lib/supabaseClient'

export interface DashboardSummary {
  patientCount: number
  evolutionLast7Days: number
  submissionsLast7Days: number
  formTemplateCount: number
}

export async function fetchDashboardSummary(
  workspaceId: string,
): Promise<DashboardSummary> {
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceIso = since.toISOString()

  const [patients, evolutions, submissions, templates] = await Promise.all([
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
    supabase
      .from('evolution_entries')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', sinceIso),
    supabase
      .from('form_submissions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceIso),
    supabase
      .from('form_templates')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
  ])

  if (patients.error) throw patients.error
  if (evolutions.error) throw evolutions.error
  if (submissions.error) throw submissions.error
  if (templates.error) throw templates.error

  return {
    patientCount: patients.count ?? 0,
    evolutionLast7Days: evolutions.count ?? 0,
    submissionsLast7Days: submissions.count ?? 0,
    formTemplateCount: templates.count ?? 0,
  }
}
