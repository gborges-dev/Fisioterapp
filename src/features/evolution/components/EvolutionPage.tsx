import { Navigate, useParams } from 'react-router-dom'

import { patientTabPath } from '../../patients/patientTabs'

/** Rota legada — redireciona para a aba Evolução no detalhe do paciente. */
export function EvolutionPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) return <Navigate to="/patients" replace />
  return <Navigate to={patientTabPath(id, 'evolucao')} replace />
}
