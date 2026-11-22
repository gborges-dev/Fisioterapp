# Testes e2e (Playwright)

Requer Node 22+ (use o Node 24 pelo caminho, sem trocar o nvm global).

```sh
cd Fisioterapp/e2e
npm install
npx playwright install chromium   # só na primeira vez, se faltar o navegador
npx playwright test               # roda tudo
npx playwright show-report        # relatório HTML
```

- O front e a API precisam estar no ar antes; a config não sobe servidores.
- `BASE_URL` define o front (padrão `http://localhost:8081`).
- Credenciais de login: `E2E_EMAIL` e `E2E_PASSWORD` como variáveis de ambiente.
  Veja `.env.example`. Nunca commite o `.env`.

Obs.: `@playwright/test` está fixado em 1.64.0 porque o navegador dele (chromium-1248)
já existe na máquina e o download do navegador das versões mais novas está dando timeout.

Testes ficam em `tests/*.e2e.ts` (não `.spec.ts`, para não colidir com o vitest do front).
Os testes devem ser **somente leitura**: o banco pode ser o de produção.
