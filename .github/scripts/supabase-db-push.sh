#!/usr/bin/env bash
# Aplica migrations via Supabase CLI usando DATABASE_URL ou PROJECT_REF + DB_PASSWORD.
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

if [ -z "$DB_URL" ]; then
  if [ -n "$PROJECT_REF" ] && [ -n "$DB_PASSWORD" ]; then
    ENCODED_PW="$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASSWORD")"
    DB_URL="postgresql://postgres:${ENCODED_PW}@db.${PROJECT_REF}.supabase.co:5432/postgres"
  else
    echo "::error::Configure SUPABASE_*_DATABASE_URL ou SUPABASE_*_PROJECT_REF + SUPABASE_*_DB_PASSWORD nos secrets do GitHub (environment production/development)."
    exit 1
  fi
fi

case "$DB_URL" in
  postgresql://*|postgres://*) ;;
  *)
    echo "::error::DATABASE_URL invalida (deve comecar com postgresql://). Se a senha contem @, use SUPABASE_*_DB_PASSWORD separado ou encode @ como %40."
    exit 1
    ;;
esac

echo "Connecting to remote database..."
supabase db push --db-url "$DB_URL"
