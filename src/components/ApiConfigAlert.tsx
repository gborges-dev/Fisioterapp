import { AlertTriangle } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { isApiConfigured } from '@/lib/apiClient'

export function ApiConfigAlert() {
  if (isApiConfigured()) return null

  return (
    <Alert variant="warning" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>API não configurada</AlertTitle>
      <AlertDescription>
        Defina <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">VITE_API_URL</code> num
        ficheiro <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">.env</code> (ex.:{' '}
        <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">http://localhost:3000/api</code>
        ) e reinicie o servidor de desenvolvimento.
      </AlertDescription>
    </Alert>
  )
}
