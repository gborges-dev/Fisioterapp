import type { Database } from '../../types/database.types'

export type EvaluationFormTemplateRow =
  Database['public']['Tables']['evaluation_form_templates']['Row']

export type PatientEvaluationFormRow =
  Database['public']['Tables']['patient_evaluation_forms']['Row']
