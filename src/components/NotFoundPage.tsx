import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/AppShell'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço que abriu não existe ou foi movido. Verifique o link ou volte ao painel."
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link to="/">Ir para o painel</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/patients">Ver pacientes</Link>
          </Button>
        </div>
      }
    />
  )
}
