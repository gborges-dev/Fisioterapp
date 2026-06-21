# Plano de melhorias — Fisioterapp

Documento consolidado com diagnóstico, fases de implementação, ordem de execução e checklists.

**Stack:** React 19 · TypeScript · Vite · MUI v7 · TanStack Query · Supabase  
**Data:** Junho/2025

---

## Sumário

1. [Diagnóstico atual](#diagnóstico-atual)
2. [Fase 1 — Exclusão individual em todos os módulos](#fase-1--exclusão-individual-em-todos-os-módulos)
3. [Fase 2 — Contraste dos cards nas listagens](#fase-2--contraste-dos-cards-nas-listagens)
4. [Fase 3 — Remover contagem de campos no card de Cadastro de ficha](#fase-3--remover-contagem-de-campos-no-card-de-cadastro-de-ficha)
5. [Fase 4 — Editor de texto rico no Registro de evolução](#fase-4--editor-de-texto-rico-no-registro-de-evolução)
6. [Fase 5 — Responsividade geral](#fase-5--responsividade-geral)
7. [Fase 6 — Re-render e layout shift (CLS)](#fase-6--re-render-e-layout-shift-cls)
8. [Fase 7 — Campo Múltipla escolha no cadastro de Fichas de avaliação](#fase-7--campo-múltipla-escolha-no-cadastro-de-fichas-de-avaliação)
9. [Ordem de implementação](#ordem-de-implementação)
10. [Estimativa de esforço](#estimativa-de-esforço)
11. [Decisões pendentes](#decisões-pendentes)

---

## Diagnóstico atual

| Área | Estado atual |
|------|--------------|
| **Delete individual** | Existe em Pacientes, Modelos de ficha, Formulários públicos e Documentos. **Falta** em Fichas do paciente e Evolução |
| **Contraste dos cards** | Borda sutil (`alpha 0.12`), sem sombra global; hover só em alguns módulos |
| **Contagem de campos** | Aparece em `EvaluationFormsListPage` e `PatientEvaluationFormsPage` |
| **Tipos de campo (ficha)** | `text`, `textarea`, `number`, `date`, `select` (escolha única). **Não existe** tipo de múltipla escolha |
| **Registro de evolução** | `TextField` multiline simples; exibição com `whiteSpace: 'pre-wrap'` — sem negrito, listas ou formatação |
| **Responsividade** | MUI Grid funciona, mas há inconsistências (breakpoints, bottom nav, ações nos cards) |
| **Re-render / layout shift** | `CircularProgress` sem altura reservada; `parseEvaluationSchema` no `.map()`; sem Skeletons |

### Estrutura relevante

```
src/
├── app/AppRoutes.tsx
├── components/          # Layout, breadcrumbs, toast
├── features/
│   ├── patients/        # PatientListPage, PatientDetailPage…
│   ├── evaluation-forms/
│   ├── form-builder/
│   ├── evolution/       # EvolutionPage
│   ├── documents/
│   ├── reports/
│   └── dashboard/
├── hooks/useTableFilterSort.ts
├── theme/appTheme.ts
└── lib/queryKeys.ts
```

### Módulos e listagens

| Módulo | Rota | Componente | Delete hoje? |
|--------|------|------------|--------------|
| Painel | `/` | `DashboardPage` | N/A (métricas) |
| Pacientes | `/patients` | `PatientListPage` | Sim |
| Modelos de ficha | `/evaluation-forms` | `EvaluationFormsListPage` | Sim |
| Fichas do paciente | `/patients/:id/evaluation-forms` | `PatientEvaluationFormsPage` | **Não** |
| Formulários públicos | `/forms` | `FormsListPage` | Sim |
| Documentos | `/patients/:id/documents` | `DocumentsPage` | Sim |
| Evolução | `/patients/:id/evolution` | `EvolutionPage` | **Não** |
| Relatórios | `/reports` | `ReportsPage` | N/A (somente leitura) |

---

## Fase 1 — Exclusão individual em todos os módulos

### 1.1 Padronizar o padrão de delete existente

Extrair componente reutilizável `ConfirmDeleteDialog` (`src/components/ConfirmDeleteDialog.tsx`) unificando o que se repete em:

- `src/features/patients/components/PatientListPage.tsx`
- `src/features/evaluation-forms/components/EvaluationFormsListPage.tsx`
- `src/features/form-builder/components/FormsListPage.tsx`
- `src/features/documents/components/DocumentsPage.tsx`

**Contrato sugerido:**

```tsx
<ConfirmDeleteDialog
  open={Boolean(itemToDelete)}
  title="Excluir paciente"
  message={<>Confirma a exclusão de <strong>{name}</strong>?</>}
  confirmLabel="Excluir"
  loading={remove.isPending}
  onCancel={() => setItemToDelete(null)}
  onConfirm={handleConfirmDelete}
/>
```

**Melhorias no padrão:**

- Toast de sucesso/erro em **todos** os módulos (hoje pacientes e modelos de ficha engolem erros no `catch`)
- `aria-label="Excluir"` nos `IconButton`
- Botão de confirmação desabilitado com `isPending`
- Ícone `DeleteOutlineIcon` com `color="error"`

### 1.2 Implementar delete onde falta

#### Fichas do paciente (`patient_evaluation_forms`)

| Arquivo | Alteração |
|---------|-----------|
| `src/features/evaluation-forms/services/evaluationFormsApi.ts` | `deletePatientEvaluationForm(id)` |
| `src/features/evaluation-forms/hooks/usePatientEvaluationForms.ts` | `useDeletePatientEvaluationForm(patientId)` |
| `src/features/evaluation-forms/components/PatientEvaluationFormsPage.tsx` | Botão excluir + dialog |

**Restrição de banco:** `evolution_entries.patient_evaluation_form_id` referencia `patient_evaluation_forms` com `ON DELETE RESTRICT`. Excluir ficha com evoluções vinculadas falha no Supabase.

**Comportamento recomendado (Opção A):** Dialog informa quantos registos de evolução existem e pergunta se deseja excluir ficha **e** evoluções vinculadas. Fluxo:

1. Consultar contagem de evoluções da ficha (query ou RPC)
2. Se count > 0 → mensagem: *"Esta ficha tem N registos de evolução. Deseja excluir tudo?"*
3. Excluir evoluções primeiro, depois a ficha (ou transação via Edge Function)

#### Evolução (`evolution_entries`)

| Arquivo | Alteração |
|---------|-----------|
| `src/features/evolution/services/evolutionApi.ts` | `deleteEvolutionEntry(id)` |
| `src/features/evolution/hooks/useEvolution.ts` | `useDeleteEvolutionEntry(patientId)` |
| `src/features/evolution/components/EvolutionPage.tsx` | Botão excluir em cada card + dialog |

RLS já permite `FOR ALL` em `evolution_entries` — sem migration necessária.

### 1.3 Módulos que não precisam de delete

- **Dashboard** — métricas agregadas
- **Relatórios** — visualização; dados pertencem a outras entidades
- **Formulário público** — fluxo de submissão externa

### Checklist — Fase 1

- [ ] `ConfirmDeleteDialog` criado e adotado nos 4 módulos existentes
- [ ] Toasts padronizados (`useToast`) em todos os deletes
- [ ] `deletePatientEvaluationForm` + mutation + invalidação de queries
- [ ] `deleteEvolutionEntry` + mutation + invalidação de queries
- [ ] UI de delete em `PatientEvaluationFormsPage`
- [ ] UI de delete em `EvolutionPage`
- [ ] Tratamento de FK ao excluir ficha com evoluções
- [ ] Testes manuais: excluir ficha sem evolução, ficha com evolução, registro de evolução isolado

---

## Fase 2 — Contraste dos cards nas listagens

### 2.1 Ajuste global no tema

Arquivo: `src/theme/appTheme.ts`

Alterações em `MuiCard`:

| Propriedade | Atual | Proposto |
|-------------|-------|----------|
| Borda (light) | `alpha(primary, 0.12)` | `alpha(primary, 0.22)` |
| Borda (dark) | `alpha(primary, 0.22)` | `alpha(primary, 0.35)` |
| Sombra | `none` | Sombra leve no light mode (similar a `elevation1`) |
| `text.secondary` (light) | `#5c534a` | `#4a433c` |

### 2.2 Componente `ListCard` compartilhado

Criar `src/components/ListCard.tsx`:

- `variant="outlined"`
- Borda mais visível (herda tema + override local se necessário)
- Hover: `borderColor: primary.light` + `boxShadow: theme.shadows[2]`
- `height: '100%'` para alinhar cards na grid
- `CardActions` com padding consistente (`px: 2, pb: 2`)
- Props: `children`, `actions?`, `onClick?` (opcional)

**Adotar em:**

- `PatientListPage`
- `EvaluationFormsListPage`
- `FormsListPage`
- `PatientEvaluationFormsPage`
- `DocumentsPage`
- `EvolutionPage`
- `ReportsPage` (cards de listagem; não gráficos)

### Checklist — Fase 2

- [ ] Tema global atualizado
- [ ] `ListCard` criado
- [ ] Todos os módulos de listagem migrados para `ListCard`
- [ ] Hover consistente em light e dark mode
- [ ] Verificação visual de contraste (WCAG AA desejável para texto secundário)

---

## Fase 3 — Remover contagem de campos no card de Cadastro de ficha

"Cadastro de ficha" = listagem de **modelos** em `/evaluation-forms` (`EvaluationFormsListPage`).

### Alteração principal

Arquivo: `src/features/evaluation-forms/components/EvaluationFormsListPage.tsx`

**Remover:**

```tsx
const fieldCount = parseEvaluationSchema(t.schema).length
// ...
{fieldCount} campo{fieldCount !== 1 ? 's' : ''} · Atualizado {formatDate(t.updated_at)}
```

**Substituir por:**

```tsx
<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
  Atualizado {formatDate(t.updated_at)}
</Typography>
```

Remover import de `parseEvaluationSchema` se não for mais usado neste arquivo.

### Opcional

Remover contagem também em `PatientEvaluationFormsPage.tsx` (linhas com `{fieldCount} campo(s)`) para consistência visual entre listagens de ficha.

### Checklist — Fase 3

- [ ] Contagem removida de `EvaluationFormsListPage`
- [ ] `parseEvaluationSchema` removido do `.map()` da listagem de modelos
- [ ] Decidir e aplicar remoção em `PatientEvaluationFormsPage` (se desejado)

---

## Fase 4 — Editor de texto rico no Registro de evolução

### Situação atual

Em `EvolutionPage.tsx`, o campo **Registo de evolução** é um `TextField` multiline simples:

```tsx
<TextField
  label="Registo de evolução"
  value={content}
  onChange={(e) => setContent(e.target.value)}
  multiline
  minRows={4}
/>
```

A listagem exibe `{row.content}` com `whiteSpace: 'pre-wrap'` — texto puro, sem formatação.

Coluna no banco: `evolution_entries.content` → tipo `text` (sem migration obrigatória).

### Objetivo

Permitir formatação básica no registro clínico:

- **Negrito**
- *Itálico*
- Listas ordenadas e não ordenadas
- (Opcional) sublinhado, títulos H3, links

### Abordagem recomendada

#### Biblioteca: TipTap

| Critério | TipTap |
|----------|--------|
| Integração React 19 | Boa (`@tiptap/react`) |
| Toolbar customizável | Sim (negrito, listas, etc.) |
| Peso | Moderado |
| Armazenamento | HTML serializado |

**Dependências a adicionar:**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm dompurify
npm install -D @types/dompurify
```

Alternativa mais leve: editor Markdown com preview — menos WYSIWYG, mais simples de sanitizar.

#### Formato de armazenamento: HTML no campo `text`

- Sem migration de schema
- Registos antigos (texto puro) continuam válidos
- Renderer detecta HTML vs texto puro e exibe adequadamente

#### Componentes novos

| Componente | Caminho | Responsabilidade |
|------------|---------|------------------|
| `RichTextEditor` | `src/components/RichTextEditor.tsx` | Editor TipTap + toolbar MUI |
| `RichTextContent` | `src/components/RichTextContent.tsx` | Renderização segura do conteúdo |

**`RichTextEditor` — toolbar mínima:**

```
[B] [I] [• lista] [1. lista] [↩ desfazer] [↪ refazer]
```

Estilização alinhada ao tema MUI (`OutlinedInput`-like border, `borderRadius: 8`).

**`RichTextContent` — renderização:**

```tsx
// Sanitizar HTML com DOMPurify antes de dangerouslySetInnerHTML
// Fallback: se não contém tags HTML, usar whiteSpace: 'pre-wrap' (legado)
```

Tags permitidas (whitelist DOMPurify): `p`, `br`, `strong`, `b`, `em`, `i`, `u`, `ul`, `ol`, `li`, `h3`, `a[href]`.

#### Arquivos a alterar

| Arquivo | Alteração |
|---------|-----------|
| `EvolutionPage.tsx` | Substituir `TextField` por `RichTextEditor`; cards usam `RichTextContent` |
| `PatientComparePage.tsx` | Renderizar `row.content` com `RichTextContent` |
| `ReportsPage.tsx` | Renderizar conteúdo de evolução com `RichTextContent` |
| `dashboardApi.ts` / relatórios | Avaliar se agregações de texto precisam strip HTML para resumos |

#### Validação no submit

```tsx
// Considerar vazio se só tags vazias: <p></p>, <p><br></p>
const isEmpty = !stripHtml(content).trim()
```

#### Acessibilidade

- Toolbar com `aria-label` em cada botão
- Editor com `role="textbox"` e `aria-multiline="true"`
- Foco visível nos botões da toolbar

#### Testes

- [ ] Criar registro com negrito e lista → salvar → recarregar → formatação preservada
- [ ] Registro antigo (texto puro) → exibição correta
- [ ] Tentativa de XSS (`<script>`, `onerror=`) → bloqueada pelo DOMPurify
- [ ] Mobile: toolbar responsiva (wrap ou scroll horizontal)

### Checklist — Fase 4

- [ ] Dependências TipTap + DOMPurify instaladas
- [ ] `RichTextEditor` criado com toolbar (negrito, itálico, listas)
- [ ] `RichTextContent` criado com sanitização
- [ ] `EvolutionPage` migrado (form + listagem)
- [ ] `PatientComparePage` atualizado
- [ ] `ReportsPage` atualizado
- [ ] Helper `stripHtml` / `isRichTextEmpty` em `src/lib/richText.ts`
- [ ] Testes unitários para sanitização e detecção de vazio

---

## Fase 5 — Responsividade geral

### 5.1 Layout principal

Arquivo: `src/components/AppLayout.tsx`

- Bottom nav com 5 itens: em telas < 360px, considerar só ícones (ocultar labels)
- Garantir `paddingBottom` com `env(safe-area-inset-bottom)` em páginas com conteúdo scrollável

### 5.2 Grids — padronizar breakpoints

Padrão sugerido para **todas** as listagens:

```tsx
<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} />
```

Hoje `PatientEvaluationFormsPage` usa `md: 4` enquanto outras usam `lg: 4` — unificar.

### 5.3 Headers e toolbars

```tsx
<Stack
  direction={{ xs: 'column', sm: 'row' }}
  justifyContent="space-between"
  alignItems={{ xs: 'stretch', sm: 'center' }}
  spacing={2}
>
```

- Campo de busca: `fullWidth` em mobile, `maxWidth: 480` em desktop
- Chips de ordenação: `flexWrap: 'wrap'`

### 5.4 CardActions densos

`FormsListPage` (4 ícones) e futuros cards com delete:

```tsx
<CardActions sx={{ flexWrap: 'wrap', gap: 0.5, justifyContent: 'flex-end' }}>
```

### 5.5 Páginas de formulário

- `PatientFormPage`, editores de ficha/formulário: `maxWidth: { xs: '100%', sm: 720 }`, `px: { xs: 2, sm: 0 }`

### 5.6 Gráficos

`DashboardPage`, `ReportsPage`:

```tsx
<Box sx={{ width: '100%', overflowX: 'auto' }}>
  <LineChart sx={{ minWidth: { xs: 320, sm: '100%' } }} height={280} />
</Box>
```

### 5.7 PatientDetailPage

Botões de ação: em `xs` usar grid 2×2 ou menu `MoreVert` para reduzir altura vertical.

### 5.8 RichTextEditor em mobile

- Toolbar com `flexWrap: 'wrap'` ou scroll horizontal
- Altura mínima do editor: `minHeight: 120` em mobile

### Checklist — Fase 5

- [ ] Breakpoints de grid unificados
- [ ] Headers responsivos em todas as listagens
- [ ] Bottom nav testado em 320px–768px
- [ ] Gráficos com scroll horizontal em mobile
- [ ] `PatientDetailPage` otimizado
- [ ] `RichTextEditor` utilizável em telas pequenas

---

## Fase 6 — Re-render e layout shift (CLS)

### 6.1 Substituir spinners por Skeletons

Criar `src/components/ListPageSkeleton.tsx`:

```tsx
// Grid com 6 cards skeleton
// Skeleton variant="rectangular" height={140}
// Container com minHeight: 400
```

Aplicar em todas as listagens e no dashboard (cards de métricas).

### 6.2 Evitar layout shift no loading

| Problema | Solução |
|----------|---------|
| Spinner 40px → grid grande | Skeleton com altura fixa |
| Breadcrumbs com nome do paciente | Skeleton `width: 120` no label dinâmico |
| `FormsListPage` stats com `0` durante load | Não renderizar stats até `!isLoading` ou Skeleton |
| `SupabaseConfigAlert` empurra conteúdo | Reservar espaço ou posição fixa no topo |

### 6.3 Otimizações de re-render

| Local | Problema | Solução |
|-------|----------|---------|
| `EvaluationFormsListPage` | `parseEvaluationSchema` no `.map()` | Removido na Fase 3 |
| `PatientEvaluationFormsPage` | Idem (se contagem removida) | Remover parse do map |
| `EvolutionPage` | `new Map()` a cada render | `useMemo(() => new Map(...), [evaluationForms])` |
| Cards na grid | Re-render ao digitar filtro | `ListCard` com `React.memo` |
| `FormsListPage` stats | `Date.now()` no `useMemo` | Constante ou `useRef` |
| `RichTextEditor` | Re-render do TipTap a cada keystroke pai | Estado local no editor; `onChange` debounced ou onBlur |

### 6.4 React Query

- `staleTime: 30_000` nas listagens principais
- `placeholderData: keepPreviousData` ao filtrar/ordenar (evita flash vazio)

### 6.5 EvolutionPage — estados mutuamente exclusivos

Corrigir render simultâneo de grid vazio + spinner + "Sem registos":

```tsx
if (isLoading) return <ListPageSkeleton />
if (isError) return <Alert />
if (!data?.length) return <EmptyState />
return <Grid>...</Grid>
```

### Checklist — Fase 6

- [ ] `ListPageSkeleton` criado e usado em todas as listagens
- [ ] Estados loading / error / empty mutuamente exclusivos
- [ ] `useMemo` em `EvolutionPage` (`formTitleById`)
- [ ] Cards memoizados via `ListCard`
- [ ] Breadcrumbs com placeholder durante load
- [ ] RichTextEditor isolado para evitar re-render da página inteira
- [ ] Verificação CLS no DevTools (Performance → Layout Shift)

---

## Fase 7 — Campo Múltipla escolha no cadastro de Fichas de avaliação

### Situação atual

O schema de campos (`FormFieldSchema`) é partilhado entre fichas de avaliação e formulários públicos. Tipos disponíveis hoje em `src/types/database.types.ts`:

```ts
export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select'
```

No editor de modelos (`EvaluationFormTemplateEditorPage.tsx`), o tipo **Escolha** (`select`) renderiza um `TextField select` de **seleção única**. Não há forma de marcar várias opções.

Respostas são guardadas em `answers` (jsonb) como `Record<string, string>` — um valor string por campo.

### Objetivo

Adicionar tipo **`multiselect`** (rótulo na UI: **Múltipla escolha**) no cadastro de modelos de ficha, permitindo ao utilizador selecionar **mais de uma opção** ao preencher a ficha do paciente.

Distinção clara na UI do editor:

| Tipo interno | Rótulo no editor | Comportamento |
|--------------|------------------|---------------|
| `select` | Escolha | Uma opção |
| `multiselect` | Múltipla escolha | Várias opções |

### Abordagem recomendada

#### 1. Extensão do schema (sem migration de banco)

O schema já é `jsonb` em `evaluation_form_templates.schema` e `patient_evaluation_forms.schema`. Basta aceitar o novo valor `multiselect` no parser — **não é necessária migration SQL**.

Alterar `FormFieldType`:

```ts
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
```

#### 2. Formato de armazenamento das respostas

Manter `answers` como mapa string → string, serializando seleções múltiplas como **JSON array**:

```json
{
  "campo-sintomas": "[\"Dor\",\"Edema\",\"Rigidez\"]"
}
```

Criar helpers em `src/lib/formAnswers.ts` (ou `evaluationFormsApi.ts`):

| Função | Responsabilidade |
|--------|------------------|
| `parseMultiselectAnswer(raw: string): string[]` | Desserializa; tolera string vazia e valores legados |
| `serializeMultiselectAnswer(values: string[]): string` | `JSON.stringify(values)` |
| `formatMultiselectDisplay(raw: string): string` | Exibição legível: `"Dor, Edema, Rigidez"` |

**Retrocompatibilidade:** fichas existentes sem campos `multiselect` não são afetadas.

#### 3. Editor de modelo (cadastro de ficha)

Arquivo: `src/features/evaluation-forms/components/EvaluationFormTemplateEditorPage.tsx`

- Adicionar `<MenuItem value="multiselect">Múltipla escolha</MenuItem>` no select de tipo
- Habilitar campo **Opções (separadas por vírgula)** quando `type === 'select' || type === 'multiselect'`
- Validar ao guardar: campos `select` / `multiselect` devem ter pelo menos **2 opções** não vazias

#### 4. Renderização ao preencher ficha

Arquivo: `src/features/evaluation-forms/components/EvaluationFormFieldsRenderer.tsx`

Para `multiselect`, usar grupo de checkboxes MUI:

```tsx
<FormControl required={field.required} fullWidth>
  <FormLabel>{field.label}</FormLabel>
  <FormGroup>
    {(field.options ?? []).map((opt) => (
      <FormControlLabel
        key={opt}
        control={<Checkbox checked={selected.includes(opt)} … />}
        label={opt}
      />
    ))}
  </FormGroup>
</FormControl>
```

Alternativa equivalente: `Select multiple` com `renderValue` — checkboxes são mais claros para o utilizador clínico.

**Modo `readOnly`:** exibir opções selecionadas como chips ou texto separado por vírgula.

#### 5. Validação de obrigatoriedade

Arquivos: `PatientEvaluationFormCreatePage.tsx`, `PatientEvaluationFormDetailPage.tsx`

- Campo `required` + `multiselect`: exige **pelo menos 1 opção** selecionada
- Mensagem: *"Selecione pelo menos uma opção em «{label}»."*

#### 6. Parser do schema

Arquivo: `src/features/form-builder/services/formsApi.ts` — função `parseFormSchema`

Incluir `'multiselect'` na validação de `type` (o parser é partilhado por fichas e formulários públicos).

#### 7. Consistência em outros pontos (recomendado)

Como `FormFieldSchema` é global, atualizar também:

| Arquivo | Alteração |
|---------|-----------|
| `PublicFormPage.tsx` | Renderizar `multiselect` (se modelos públicos usarem o tipo no futuro) |
| `FormEditorPage.tsx` | Adicionar tipo no editor de formulários públicos (paridade) |
| `FormsListPage.tsx` | `fieldTypeLabel`: `multiselect: 'Múltipla escolha'` |
| `formatSubmissionAnswers.ts` | Desserializar JSON array em resumo legível |

> **Escopo mínimo:** Fase 7 exige, no mínimo, editor de modelo + renderer de ficha + parser + helpers. Formulários públicos podem ficar para um sub-item opcional.

#### 8. Testes

- [ ] Criar modelo com campo multiselect (3 opções) → guardar → reabrir editor → opções preservadas
- [ ] Preencher ficha do paciente selecionando 2 opções → guardar → reabrir → seleção correta
- [ ] Campo obrigatório sem seleção → bloqueia submit
- [ ] Modo readOnly exibe valores corretamente
- [ ] `parseFormSchema` ignora tipo desconhecido antigo; aceita `multiselect`
- [ ] Resumo em relatórios exibe `"Opção A, Opção B"` (se aplicável)

### Checklist — Fase 7

- [ ] `FormFieldType` estendido com `multiselect`
- [ ] `parseFormSchema` atualizado
- [ ] Helpers `parseMultiselectAnswer` / `serializeMultiselectAnswer` / `formatMultiselectDisplay`
- [ ] `EvaluationFormTemplateEditorPage` — novo tipo + validação de opções
- [ ] `EvaluationFormFieldsRenderer` — UI de checkboxes + readOnly
- [ ] Validação em create/detail da ficha do paciente
- [ ] (Opcional) `FormEditorPage` + `PublicFormPage` + relatórios
- [ ] Testes unitários dos helpers de serialização

---

## Ordem de implementação

```
Fase 3 (contagem) ──► Fase 7 (multiselect) ──► Fase 2 (ListCard + tema)
                                                        │
                                                        ▼
                                              Fase 6.1 (Skeletons)
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        ▼                               ▼                               ▼
                   Fase 1                          Fase 4                          Fase 5
                  (delete)                     (rich text)                  (responsividade)
                        │                               │                               │
                        └───────────────────────────────┴───────────────────────────────┘
                                                        │
                                                        ▼
                                              Fase 6.3–6.5 (memo / CLS final)
```

**Justificativa:**

1. **Fase 3** — rápida; remove código e parse desnecessário
2. **Fase 7** — alteração de schema/renderizador; convém fazer cedo, antes de refactors visuais (`ListCard`) que também tocam nos cards de ficha
3. **Fase 2 + Skeletons** — base visual estável para todo o resto
4. **Fase 1 e 4** — podem correr em paralelo (módulos diferentes)
5. **Fase 5** — com componentes (`ListCard`, `RichTextEditor`) já definidos
6. **Fase 6 final** — polish de performance após features estáveis

---

## Estimativa de esforço

| Fase | Descrição | Esforço | Arquivos (~) |
|------|-----------|---------|--------------|
| 1 | Delete completo + dialog padronizado | 4–6 h | 8–10 |
| 2 | Contraste + `ListCard` | 2–3 h | 8 |
| 3 | Remover contagem de campos | 15 min | 1–2 |
| 4 | Editor rich text (TipTap) | 4–6 h | 6–8 |
| 5 | Responsividade | 3–4 h | 10–12 |
| 6 | CLS + re-render | 3–4 h | 10–12 |
| 7 | Campo Múltipla escolha (`multiselect`) | 3–4 h | 6–8 |
| **Total** | | **~20–27 h** | **~35 arquivos** |

---

## Decisões pendentes

Antes de implementar a **Fase 1**, definir comportamento ao excluir ficha do paciente com evoluções vinculadas:

| Opção | Comportamento |
|-------|---------------|
| **A (recomendada)** | Dialog pergunta se deseja excluir ficha **e** N evoluções; exclui evoluções primeiro |
| **B** | Bloqueia exclusão e informa quantos registos impedem |
| **C** | Migration alterando FK para `ON DELETE CASCADE` |

Antes da **Fase 3**, confirmar se a contagem de campos deve sair **apenas** do cadastro de modelos ou também das fichas do paciente.

Antes da **Fase 4**, confirmar toolbar desejada:

- Mínima: negrito, itálico, listas
- Estendida: sublinhado, títulos, links

Antes da **Fase 7**, confirmar:

- UI de seleção: **checkboxes** (recomendado) vs `Select multiple`
- Escopo: apenas fichas de avaliação ou também formulários públicos (`FormEditorPage`)
- Renomear rótulo do `select` existente para **Escolha única** (opcional, para distinguir de Múltipla escolha)

---

## Referência rápida de arquivos

| Área | Caminhos |
|------|----------|
| Rotas | `src/app/AppRoutes.tsx` |
| Layout | `src/components/AppLayout.tsx` |
| Tema | `src/theme/appTheme.ts` |
| Listagens | `src/features/*/components/*ListPage.tsx`, `EvolutionPage.tsx`, `DocumentsPage.tsx` |
| Evolução | `src/features/evolution/` |
| Fichas | `src/features/evaluation-forms/` |
| Schema de campos | `src/types/database.types.ts`, `formsApi.parseFormSchema` |
| Renderer de campos | `src/features/evaluation-forms/components/EvaluationFormFieldsRenderer.tsx` |
| Editor de modelo | `src/features/evaluation-forms/components/EvaluationFormTemplateEditorPage.tsx` |
| Query keys | `src/lib/queryKeys.ts` |
| Migrations | `supabase/migrations/` |
