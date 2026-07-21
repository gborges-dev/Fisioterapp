# Fisioterapp (front)

SPA React + TypeScript + Vite. Consome a API Nest (`Fisioterapp-api`) via JWT — **não** usa mais o client Supabase para operações de domínio.

## Setup

1. Suba a API conforme o README de `Fisioterapp-api` (migration SQL, `.env`, `seed:users`, `start:dev`).
2. Neste projeto:

```bash
cp .env.example .env
npm install
npm run dev
```

### Variáveis

| Variável | Valor típico |
|----------|----------------|
| `VITE_API_URL` | `http://localhost:3000/api` |

`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` **não são necessários** para login, pacientes, formulários, etc. O Storage continua no backend (service role).

Opcional: `VITE_DEFAULT_WORKSPACE_ID` alinhado ao workspace seed (`00000000-0000-0000-0000-000000000001`).

## Login

1. Abra o app e faça login com as credenciais seed (definidas no `.env` da API).
2. **Therapist** → entra direto no app clínico do próprio workspace.
3. **Super admin** → redireciona para **Bases** (`/admin/bases`): listar, criar e **Entrar** numa base (define `X-Workspace-Id` no client).

Formulários públicos: rota `/f/:token` (sem login).

## Ambiente DEV e CI/CD

Checklist completo (Supabase DEV, branch `dev`, secrets GitHub, workflows):

→ **[docs/DEV_ENVIRONMENT_CHECKLIST.md](docs/DEV_ENVIRONMENT_CHECKLIST.md)**

Variáveis locais de dev: copie `.env.dev.example` para `.env`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run test:run` | Testes (Vitest) |
