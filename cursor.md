# Fisioterapp — base de desenvolvimento

Este documento é a **referência principal** para decisões de código, testes e organização do projeto Fisioterapp. Quem desenvolve ou assiste o desenvolvimento (incluindo ferramentas de IA no Cursor) deve seguir estas regras salvo exceção explícita e documentada.

---

## Desenvolvimento orientado a testes (TDD)

- **Fluxo obrigatório:** escrever um teste que **falha** → implementar o mínimo para **passar** → **refatorar** sem quebrar os testes.
- **Não** considerar uma feature concluída sem testes; o teste deve **preceder** a implementação no fluxo de trabalho (e, no histórico de commits, o teste deve vir antes da implementação quando possível).
- **Stack de testes:** **Vitest** + **React Testing Library**, alinhados ao Vite. Se ainda não estiverem configurados no repositório, a configuração e dependências devem ser adicionadas como parte do trabalho que introduz a primeira feature testada — não adiar testes por falta de tooling.

---

## Arquitetura: feature-based e camadas

Organizar o código por **funcionalidade** (`feature`), com responsabilidades em **camadas** dentro de cada feature.

### Estrutura sugerida

```
src/components/   # UI global reutilizável (design system), baseada em MUI — ver secção dedicada abaixo
src/features/<nome-da-feature>/
  components/     # Composição específica da feature (importa de src/components/ e hooks)
  hooks/          # Estado da feature, React Query, lógica de formulário
  services/       # HTTP, DTOs, funções de API (ex.: api.ts)
```

- **Componentes (na feature):** composição e ecrãs da feature; **importam** primitivos de `src/components/` e hooks da feature ou partilhados.
- **Hooks:** orquestram dados (incluindo `useQuery` / `useMutation`), estado de UI e regras de formulário que dependem de React.
- **Serviços:** chamadas à API, serialização; **sem JSX**; preferir funções puras onde fizer sentido.

### Regras de dependência

- Direção: **UI → hooks → serviços** (de fora para dentro). Serviços **não** dependem de componentes.
- Evitar lógica de negócio pesada apenas em componentes; extrair para hooks ou serviços conforme o caso.

---

## Componentes globais e Material UI (MUI)

- **Planeamento obrigatório:** antes de implementar qualquer ecrã, campo de texto, formulário ou página, **identificar e listar** os componentes necessários (da menor peça reutilizável ao layout completo). Só depois implementar, evitando HTML cru disperso quando já existir (ou deva existir) um componente global.
- **Pasta global:** primitivos e padrões de UI **reutilizáveis** na aplicação (inputs, botões, cartões, layouts de página, shells de formulário, etc.) devem ser criados em **`src/components/`**, com acesso global ao longo do app.
- **Base visual:** esses componentes globais devem ser construídos **em cima do MUI (Material UI)** — em geral `@mui/material` e, quando fizer sentido, o ecossistema oficial (ex.: `@mui/icons-material`). Preferir **compor ou encapsular** os primitives do Material em vez de estilos ad hoc onde o MUI já cobre o caso. Quando a equipa começar a UI, as dependências MUI devem estar instaladas e configuradas no projeto (tema, `ThemeProvider` na raiz, etc., conforme a documentação atual do MUI + React).
- **Separação face às features:** em `src/features/<feature>/components/` fica apenas a **composição específica da feature**, que **importa** de `src/components/`, hooks e serviços. Não duplicar em cada feature o mesmo campo ou botão — extrair para `src/components/`.
- **TDD:** novos ficheiros em `src/components/` entram no mesmo ciclo de testes (Vitest + RTL): escrever testes antes ou em paralelo imediato à entrega do componente.

---

## TanStack React Query (cache e dados remotos)

- Usar **sempre** o TanStack React Query (`@tanstack/react-query`) para dados **remotos** (leituras e mutações expostas à UI) que possam ser reutilizados, invalidados ou observados em vários componentes.
- Definir **`queryKey` estáveis e específicos** por recurso (e por parâmetros relevantes) para **deduplicar** pedidos em voo e tirar partido do **cache**, evitando múltiplas consultas idênticas ao mesmo conteúdo.
- Configurar um **`QueryClient`** e envolver a árvore da aplicação com **`QueryClientProvider`** na raiz (por exemplo em `src/main.tsx`) quando existir integração com API real ou mocks globais de dados assíncronos.

---

## Testes unitários e de comportamento

- **Todo formulário** e **toda feature** deve incluir **testes** que cubram comportamento relevante:
  - validação e mensagens de erro;
  - submissão (fluxo feliz e erro);
  - estados de carregamento e falha, quando existirem;
  - integração com hooks **mockados** ou com MSW, quando aplicável.
- **Formulários:** priorizar testes de **comportamento** e regras de negócio; **não** substituir isso por apenas snapshots de UI.
- Falta de testes para uma nova feature ou formulário é **inaceitável** para merge entregue como completo.

---

## Convenções rápidas

- **Componentes React:** `PascalCase` (ex.: `PatientForm.tsx`).
- **Hooks:** `camelCase` com prefixo `use` (ex.: `usePatientForm.ts`).
- **TypeScript:** manter o projeto com checagem estrita; tipar props de componentes e retornos de serviços.
- **Acessibilidade:** em formulários, associar labels a controlos, mensagens de erro compreensíveis e foco/teclado quando relevante.

---

## Checklist antes de dar uma feature por terminada

- [ ] Teste escrito **antes** (ou primeiro no commit) e a suíte a verde.
- [ ] Componentes de UI necessários **definidos antes** da implementação (lista ou desenho acordado).
- [ ] Primitivos reutilizáveis em **`src/components/`**, com base **MUI**; a feature **reutiliza** essa UI global.
- [ ] Código organizado na feature com camadas **components / hooks / services** quando aplicável.
- [ ] Dados remotos via **React Query** com `queryKey` adequados.
- [ ] Formulários e fluxos da feature cobertos por testes de **comportamento**, não só snapshot.
