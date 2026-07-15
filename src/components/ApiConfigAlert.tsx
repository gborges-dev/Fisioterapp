import { Alert, AlertTitle, Stack } from '@mui/material'

import { isApiConfigured } from '../lib/apiClient'

export function ApiConfigAlert() {
  if (isApiConfigured()) return null

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <AlertTitle>API não configurada</AlertTitle>
      <Stack spacing={1}>
        <span>
          Defina <code>VITE_API_URL</code> num ficheiro <code>.env</code> (ex.:{' '}
          <code>http://localhost:3000/api</code>) e reinicie o servidor de
          desenvolvimento.
        </span>
      </Stack>
    </Alert>
  )
}
