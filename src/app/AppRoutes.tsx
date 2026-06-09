import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '../components/AppLayout'
import { DashboardPage } from '../features/dashboard/components/DashboardPage'
import { DocumentsPage } from '../features/documents/components/DocumentsPage'
import { EvolutionPage } from '../features/evolution/components/EvolutionPage'
import { FormEditorPage } from '../features/form-builder/components/FormEditorPage'
import { FormsListPage } from '../features/form-builder/components/FormsListPage'
import { PatientComparePage } from '../features/patients/components/PatientComparePage'
import { PatientDetailPage } from '../features/patients/components/PatientDetailPage'
import { PatientFormPage } from '../features/patients/components/PatientFormPage'
import { PatientListPage } from '../features/patients/components/PatientListPage'
import { PublicFormPage } from '../features/public-form/components/PublicFormPage'
import { EvaluationFormTemplateEditorPage } from '../features/evaluation-forms/components/EvaluationFormTemplateEditorPage'
import { EvaluationFormsListPage } from '../features/evaluation-forms/components/EvaluationFormsListPage'
import { PatientEvaluationFormCreatePage } from '../features/evaluation-forms/components/PatientEvaluationFormCreatePage'
import { PatientEvaluationFormDetailPage } from '../features/evaluation-forms/components/PatientEvaluationFormDetailPage'
import { PatientEvaluationFormsPage } from '../features/evaluation-forms/components/PatientEvaluationFormsPage'
import { ReportsPage } from '../features/reports/components/ReportsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/f/:token" element={<PublicFormPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="patients">
          <Route index element={<PatientListPage />} />
          <Route path="new" element={<PatientFormPage />} />
          <Route path=":id/comparar" element={<PatientComparePage />} />
          <Route path=":id/edit" element={<PatientFormPage />} />
          <Route path=":id/evolution" element={<EvolutionPage />} />
          <Route path=":id/documents" element={<DocumentsPage />} />
          <Route path=":id/evaluation-forms">
            <Route index element={<PatientEvaluationFormsPage />} />
            <Route path="new" element={<PatientEvaluationFormCreatePage />} />
            <Route path=":formId" element={<PatientEvaluationFormDetailPage />} />
          </Route>
          <Route path=":id" element={<PatientDetailPage />} />
        </Route>
        <Route path="evaluation-forms">
          <Route index element={<EvaluationFormsListPage />} />
          <Route path="new" element={<EvaluationFormTemplateEditorPage />} />
          <Route path=":id/edit" element={<EvaluationFormTemplateEditorPage />} />
        </Route>
        <Route path="forms">
          <Route index element={<FormsListPage />} />
          <Route path="new" element={<FormEditorPage />} />
          <Route path=":id/edit" element={<FormEditorPage />} />
        </Route>
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
