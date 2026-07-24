#!/usr/bin/env bash
# Aplica migrations via Supabase CLI usando DATABASE_URL ou PROJECT_REF + DB_PASSWORD.
# GitHub Actions nao tem IPv6: use pooler (IPv4), nunca db.<ref>.supabase.co direto.
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
POOLER_HOST="${SUPABASE_POOLER_HOST:-aws-1-us-east-2.pooler.supabase.com}"
POOLER_PORT="${SUPABASE_POOLER_PORT:-5432}"

if [ -z "$DB_URL" ]; then
  if [ -n "$PROJECT_REF" ] && [ -n "$DB_PASSWORD" ]; then
    ENCODED_PW="$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASSWORD")"
    DB_URL="postgresql://postgres.${PROJECT_REF}:${ENCODED_PW}@${POOLER_HOST}:${POOLER_PORT}/postgres"
  else
    echo "::error::Configure SUPABASE_*_DATABASE_URL (pooler IPv4) ou SUPABASE_*_PROJECT_REF + SUPABASE_*_DB_PASSWORD nos secrets do GitHub (environment production/development)."
    exit 1
  fi
fi

case "$DB_URL" in
  postgresql://*|postgres://*) ;;
  *)
    echo "::error::DATABASE_URL invalida (deve comecar com postgresql://). Use o pooler IPv4 do Supabase (Connect > Session pooler), nao db.<ref>.supabase.co."
    exit 1
    ;;
esac

if [[ "$DB_URL" == *"@db."*".supabase.co"* ]]; then
  echo "::warning::DATABASE_URL usa conexao direta (db.*.supabase.co). GitHub Actions pode falhar sem IPv6; prefira o pooler."
fi

echo "Connecting to remote database via pooler..."
supabase db push --db-url "$DB_URL"
