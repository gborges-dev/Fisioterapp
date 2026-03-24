import { Alert, AlertTitle, Link, Stack } from '@mui/material'

import { isSupabaseConfigured } from '../lib/supabaseClient'

export function SupabaseConfigAlert() {
  if (isSupabaseConfigured()) return null

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <AlertTitle>Supabase não configurado</AlertTitle>
      <Stack spacing={1}>
        <span>
          Defina <code>VITE_SUPABASE_URL</code> e{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> num ficheiro <code>.env</code> e
          aplique a migração em <code>supabase/migrations/</code> no painel
          Supabase.
        </span>
        <Link href="https://supabase.com/docs/guides/getting-started" target="_blank" rel="noreferrer">
          Documentação Supabase
        </Link>
      </Stack>
    </Alert>
  )
}
