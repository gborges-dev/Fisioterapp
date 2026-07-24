# Checklist: ambiente DEV + branch `dev` + CI/CD

Guia passo a passo para criar um ambiente de desenvolvimento isolado (Supabase + API Nest + front) e automatizar deploy via GitHub Actions na branch **`dev`**.

---

## Visão geral do fluxo

```mermaid
flowchart LR
  subgraph local [Local]
    FE[Front Vite]
    API[API Nest]
  end
  subgraph supabase [Supabase]
    DEV[(Projeto DEV)]
    PROD[(Projeto PROD)]
  end
  subgraph git [Git / GitHub]
    DEVBR[branch dev]
    MAIN[branch main]
  end
  FE -->|VITE_API_URL| API
  API -->|DATABASE_URL| DEV
  DEVBR -->|push| CICD[GitHub Actions]
  CICD -->|db push| DEV
  MAIN -->|push| CICD2[GitHub Actions]
  CICD2 -->|db push| PROD
```

| Branch | Supabase | Front build | Quando usar |
|--------|----------|-------------|-------------|
| `dev` | Projeto **DEV** | `VITE_API_URL_DEV` | Desenvolvimento, testes, staging |
| `main` | Projeto **PROD** | `VITE_API_URL_PROD` | Produção |

---

## Fase 1 — Supabase DEV

- [ ] **1.1** Criar projeto no [Supabase Dashboard](https://supabase.com/dashboard) (ex.: `fisioterapp-dev`)
- [ ] **1.2** Anotar **Project ref** (Settings → General → Reference ID)
- [ ] **1.3** Anotar **Database password** (definida na criação)
- [ ] **1.4** Aplicar migrations localmente (validação antes do CI):

  ```bash
  npx supabase login
  npx supabase link --project-ref <DEV_PROJECT_REF>
  npx supabase db push
  ```

- [ ] **1.5** Criar buckets de Storage no projeto DEV (mesmos nomes do PROD, se a API usar Storage)
- [ ] **1.6** *(Opcional)* Copiar dados de PROD → DEV via [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project) (plano pago; cuidado com LGPD)

> Migrations versionadas em `supabase/migrations/`. O projeto PROD atual pode ser renomeado para `fisioterapp-prod` no dashboard para clareza.

---

## Fase 2 — API Nest (`Fisioterapp-api`)

Repositório separado; mesma estratégia de branch `dev` recomendada.

- [ ] **2.1** Criar `.env` apontando ao Supabase **DEV**:

  | Variável | Exemplo |
  |----------|---------|
  | `DATABASE_URL` | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres` |
  | `SUPABASE_URL` | `https://[ref].supabase.co` |
  | `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role (DEV) |
  | `JWT_SECRET` | Segredo próprio do ambiente DEV |
  | `PORT` | `3000` |

- [ ] **2.2** Rodar seed de usuários: `npm run seed:users` (conforme README da API)
- [ ] **2.3** Subir API: `npm run start:dev` e testar `GET /api/health` (ou endpoint equivalente)
- [ ] **2.4** Hospedar API DEV (Render, Railway, Fly.io, VPS, etc.) e anotar URL pública (ex.: `https://fisioterapp-api-dev.onrender.com/api`)

---

## Fase 3 — Front (este repositório)

- [ ] **3.1** Copiar variáveis de dev:

  ```bash
  cp .env.dev.example .env
  ```

- [ ] **3.2** Definir `VITE_API_URL` com a URL da API DEV
- [ ] **3.3** Remover ou ignorar `VITE_SUPABASE_*` do `.env` local (não usados pelo front)
- [ ] **3.4** Validar localmente:

  ```bash
  npm install
  npm run dev
  ```

- [ ] **3.5** Login com credenciais seed da API DEV
- [ ] **3.6** Testar fluxos críticos: pacientes, formulários, upload de documentos, admin/bases

---

## Fase 4 — Branch Git `dev`

- [ ] **4.1** Garantir que `main` está atualizada e pushed
- [ ] **4.2** Criar branch `dev` a partir de `main`:

  ```bash
  git checkout main
  git pull origin main
  git checkout -b dev
  git push -u origin dev
  ```

- [ ] **4.3** Definir **branch protection** (GitHub → Settings → Branches):
  - `main`: exigir PR, CI verde, opcionalmente aprovação
  - `dev`: exigir CI verde (PRs opcionais)

- [ ] **4.4** Fluxo de trabalho diário:

  ```
  feature/xxx  →  PR  →  dev  →  PR  →  main
  ```

---

## Fase 5 — Secrets e variables no GitHub

Repositório: `gborges-dev/Fisioterapp` → **Settings → Secrets and variables → Actions**

### Secrets (Repository secrets)

| Secret | Descrição |
|--------|-----------|
| `SUPABASE_ACCESS_TOKEN` | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_DEV_PROJECT_REF` | Reference ID do projeto DEV |
| `SUPABASE_DEV_DB_PASSWORD` | Senha do Postgres DEV |
| `SUPABASE_PROD_PROJECT_REF` | Reference ID do projeto PROD |
| `SUPABASE_PROD_DB_PASSWORD` | Senha do Postgres PROD |

### Variables (Repository variables)

| Variable | Exemplo |
|----------|---------|
| `VITE_API_URL_DEV` | `https://fisioterapp-api-dev.onrender.com/api` |
| `VITE_API_URL_PROD` | `https://api.fisioterapp.com/api` |
| `VITE_DEFAULT_WORKSPACE_ID` | `00000000-0000-0000-0000-000000000001` |

### Environments (recomendado)

Criar em **Settings → Environments**:

| Environment | Branch | Proteção |
|-------------|--------|----------|
| `development` | `dev` | Nenhuma ou reviewers opcionais |
| `production` | `main` | Required reviewers antes de migrations PROD |

---

## Fase 6 — CI/CD (workflows incluídos)

Arquivos em `.github/workflows/`:

| Workflow | Trigger | O que faz |
|----------|---------|-----------|
| `ci.yml` | Push/PR em `dev` e `main` | `npm ci` → lint → test → build → artefacto `dist/` |
| `deploy-dev.yml` | Push em `dev` | `supabase db push` no DEV → build front com `VITE_API_URL_DEV` |
| `deploy-prod.yml` | Push em `main` | `supabase db push` no PROD → build front com `VITE_API_URL_PROD` |

### Checklist de ativação CI/CD

- [ ] **6.1** Commitar workflows + `supabase/config.toml` na branch `dev`
- [ ] **6.2** Configurar todos os secrets e variables da Fase 5
- [ ] **6.3** Criar environments `development` e `production`
- [ ] **6.4** Push para `dev` e verificar Actions → workflow **Deploy Dev** verde
- [ ] **6.5** Abrir PR `dev` → `main` e verificar **CI** no PR
- [ ] **6.6** Merge em `main` e confirmar **Deploy Production** (com approval se configurado)

### Deploy do front (hosting)

Os workflows geram o artefacto `dist/`. Escolha uma opção:

| Opção | Passos |
|-------|--------|
| **Vercel** | Conectar repo; Production Branch = `main`; Preview = `dev`. Descomentar job `deploy-vercel` em `deploy-dev.yml` e adicionar `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. |
| **Netlify** | Branch deploys: `dev` → preview, `main` → production. Build: `npm run build`, publish: `dist`. |
| **Manual** | Baixar artefacto da Action e publicar no hosting estático. |

Variáveis de build no host:

- DEV: `VITE_API_URL` = URL da API DEV  
- PROD: `VITE_API_URL` = URL da API PROD  

---

## Fase 7 — API Nest CI/CD (repositório separado)

Espelhar no repo `Fisioterapp-api`:

- [ ] **7.1** Branch `dev` + `main`
- [ ] **7.2** CI: lint, test, build
- [ ] **7.3** Deploy automático da API DEV no push em `dev`
- [ ] **7.4** Deploy PROD no push em `main` (com approval)
- [ ] **7.5** Secrets DEV/PROD separados (`DATABASE_URL`, `JWT_SECRET`, etc.)

> Front e API devem apontar para o **mesmo** projeto Supabase por ambiente (DEV com DEV, PROD com PROD).

---

## Fase 8 — Validação final

- [ ] **8.1** Push em `dev` aplica migrations no Supabase DEV sem erro
- [ ] **8.2** Front DEV carrega e faz login contra API DEV
- [ ] **8.3** Nenhuma credencial PROD no `.env` local de dev
- [ ] **8.4** PR de `dev` → `main` passa CI
- [ ] **8.5** Documentação atualizada (README aponta para este checklist)

---

## Comandos úteis

```bash
# Criar branch dev
git checkout -b dev && git push -u origin dev

# Testar CI localmente (mesmos passos do workflow)
npm ci && npm run lint && npm run test:run && npm run build

# Migrations manuais no DEV
npx supabase link --project-ref <DEV_REF>
npx supabase db push

# Ver diferença de schema (local vs remoto)
npx supabase db diff
```

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| "API não configurada" no front | Definir `VITE_API_URL` e reiniciar `npm run dev` |
| CI build falha | Configurar `vars.VITE_API_URL_DEV` no GitHub |
| `supabase db push` falha no CI | Verificar `SUPABASE_DEV_PROJECT_REF`, password e se migrations já foram aplicadas manualmente com conflito |
| Login 401 | API DEV com seed diferente; rodar `seed:users` na API |
| CORS | Configurar origem do front DEV na API Nest |

---

## Referências

- [Supabase — Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [Supabase — Branching](https://supabase.com/docs/guides/deployment/branching/working-with-branches)
- README deste repo (`VITE_API_URL`, login, admin/bases)
