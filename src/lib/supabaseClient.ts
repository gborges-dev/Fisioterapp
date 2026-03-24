import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/** Placeholder só para satisfazer o SDK em testes/CI sem .env; pedidos falham até haver URL real. */
const clientUrl =
  rawUrl || 'https://placeholder.supabase.co'
const clientKey =
  rawKey ||
  'eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIn0.placeholder'

export const supabase = createClient(clientUrl, clientKey)

export function isSupabaseConfigured(): boolean {
  return Boolean(rawUrl && rawKey)
}
