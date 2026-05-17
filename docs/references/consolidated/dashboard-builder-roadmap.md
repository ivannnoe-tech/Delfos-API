# Roadmap consolidado — Dashboard Builder e Query Builder

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Propósito

Este documento sintetiza padrões de dashboard builder e query builder observados em
**Metabase, Superset, Chartbrew, Lightdash, NocoBase e Cube**, traduzindo-os para a
realidade do Delfos. O Delfos está em fase *foundation*: hoje existem apenas
definições declarativas (`dashboard-definitions`, `query-definitions`,
`report-definitions`, `datasets`, `field-mappings`) e nenhum runtime real de
execução, renderização ou agregação.

Tudo descrito aqui é **conceitual/futuro**. Itens que tocam execução real,
cross-filtering com dados, ou builder interativo dependem de autorização explícita
e, na maioria dos casos, de uma ADR nova ou da evolução de uma ADR existente.

---

## Princípios herdados das 6 análises

| Princípio | Origem | Tradução para o Delfos |
|---|---|---|
| Widget é objeto declarativo, não código | Superset, NocoBase | `dashboard-definitions` armazena widgets como configuração versionável |
| Query como IR declarativo (não SQL cru) | Metabase (MBQL), Cube | `query-definitions` permanece declarativa; conector traduz no runtime |
| Filtros nativos são objeto de config do dashboard | Superset, Lightdash | Filtro global é entidade dentro de `dashboard-definitions`, não estado de UI |
| Filtros auto-vinculados por convenção de nome | Chartbrew | Variável nomeada em `query-definitions` casa com filtro global homônimo |
| Dataset é contrato semântico reutilizável | Metabase, Superset, Cube | `datasets` + `field-mappings` são o contrato; widgets só consomem |
| Templates de dashboard entre tenants | Chartbrew, Metabase (X-rays) | Definição parametrizada gera N instâncias respeitando `tenantId` |
| Versionamento sem exigir git | Lightdash | Histórico de definições com diff/rollback nativo na API |
| Pipeline de execução por hooks | NocoBase | Runtime futuro processa widget→query→conector por etapas observáveis |

---

## Modelo de widget declarativo

O widget é o átomo do dashboard. Proposta de contrato declarativo (campos
conceituais, sujeitos a ADR-0011 estendida):

- `widgetId`, `type` (chart/table/kpi/text/filter-anchor)
- `queryDefinitionRef` — referência, nunca query embutida
- `chartSpec` — encaminhado ao `chart_renderer` (ADR-0003), nunca a `fl_chart`/`graphic`
- `layout` — grid/posição, desacoplado da lógica de dados
- `clickBehavior` — ação declarativa (ver seção abaixo)
- `filterBindings` — quais filtros globais este widget consome
- `tenantId` — herdado do dashboard, fronteira de isolamento obrigatória

Cada widget é um nó declarativo: a API valida e armazena, o runtime futuro resolve.
Nenhuma execução acontece na fase foundation.

---

## Query builder visual

Inspirado em Metabase (notebook editor), Lightdash (no-code builder) e Cube
(query builder por seleção de measures/dimensions).

- O builder produz uma `query-definition` declarativa — **nunca** SQL string.
- Construção por seleção: usuário escolhe dataset → dimensions → measures → filtros.
- Variáveis nomeadas (padrão Chartbrew) expõem parâmetros reutilizáveis.
- `execution-preview` valida o plano (dry-plan) antes de qualquer execução real.
- Explainability: cada número renderizado rastreia até a `query-definition` e o
  `dataset`/`field-mapping` de origem (padrão Lightdash/Cube).

---

## Filtros globais e cross-filtering

**Filtros globais** — entidade de configuração dentro de `dashboard-definitions`:

- Cada filtro tem `name`, `type`, `defaultValue`, `targets[]` (widgets afetados).
- Auto-vínculo por convenção de nome (Chartbrew): filtro `region` alimenta toda
  variável `region` das `query-definitions` consumidas.
- Filtros são desacoplados dos widgets (NocoBase): um componente reutilizável.

**Cross-filtering** — clicar num widget filtra os demais (Metabase, Superset):

- Declarado como `clickBehavior: { mode: 'cross-filter', emits: [...] }`.
- Na fase foundation, apenas o **contrato** do cross-filter é definido; a
  propagação real de estado é runtime e exige autorização.

**Drill-down** — navegação para granularidade maior (Cube, Evidence, Metabase):

- Declarado como rota parametrizada ou troca de dimension no widget.
- Drill-through automático (Metabase): da agregação para as linhas subjacentes,
  sempre dentro do `tenantId`.

---

## Click behavior configurável

Padrão Metabase: cada widget declara o que acontece ao clicar.

| Modo | Efeito | Fase |
|---|---|---|
| `none` | Sem ação | Curto prazo (contrato) |
| `cross-filter` | Emite valor como filtro global | Médio prazo |
| `drill-down` | Troca dimension / abre granularidade | Médio prazo |
| `navigate` | Vai para outro dashboard/rota parametrizada | Fase 2+ |
| `url` | Abre URL externa validada | Fase 2+ |

O click behavior é **declarativo** e versionado junto do widget.

---

## Templates de dashboard

Padrão Chartbrew (templates entre tenants) + Metabase (X-rays como onboarding):

- Uma `dashboard-definition` marcada como `template: true` é parametrizável.
- Instanciar template num tenant gera uma definição concreta com `tenantId`
  preenchido e refs resolvidas.
- X-ray do dataset: ao curar um novo `dataset`, gerar um dashboard inicial
  sugerido — acelera onboarding sem builder manual.

---

## Versionamento de definições

Padrão Lightdash (versionamento sem git) + Evidence (diff/rollback de artefatos):

- Toda definição (`dashboard`/`query`/`report`) tem histórico de versões.
- Operações: `diff` entre versões, `rollback` para versão anterior.
- Validação de integridade: detectar dashboards/queries quebrados quando um
  `dataset` ou `field-mapping` referenciado muda (Lightdash).
- Mudanças registradas via `audit` — rastreabilidade obrigatória.

---

## Ondas de roadmap

A coluna `Maturidade` em cada tabela segue a escala de [`maturity-taxonomy.md`](../maturity-taxonomy.md).

### Onda 1 — Curto prazo (foundation declarativa, sem runtime)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Contrato de widget declarativo completo | Alta | Média | `Research` | dashboard-definitions | ADR-0011 (estender) |
| Filtro global como entidade de config | Alta | Média | `Research` | dashboard-definitions | ADR-0011 (estender) |
| Variáveis nomeadas em query-definitions | Alta | Baixa | `Research` | query-definitions | ADR-0011 |
| Convenção de auto-vínculo filtro↔variável | Média | Baixa | `Research` | dashboard/query-definitions | ADR-0011 |
| Contrato declarativo de click behavior | Média | Baixa | `Research` | dashboard-definitions | ADR-0011 (estender) |
| Histórico/versionamento de definições | Alta | Média | `Research` | dashboard/query/report-definitions, audit | nova ADR (versionamento) |
| Validação de integridade de definições | Média | Média | `Research` | dashboard-definitions, datasets, field-mappings | nova ADR (versionamento) |

### Onda 2 — Médio prazo (builder e preview)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Query builder visual → query-definition | Alta | Alta | `Research` | query-definitions, execution-preview | ADR-0014 |
| Dry-plan de dashboard no execution-preview | Alta | Média | `Research` | execution-preview, runtime | ADR-0014 |
| Explainability número→definição | Média | Média | `Research` | dashboard-definitions, datasets | nova ADR (explainability) |
| Templates de dashboard parametrizados | Média | Média | `Research` | dashboard-definitions, tenants | nova ADR (templating) |
| Diff/rollback de definições | Média | Média | `Research` | dashboard/query/report-definitions | nova ADR (versionamento) |
| X-ray de dataset (dashboard sugerido) | Baixa | Média | `Research` | datasets, dashboard-definitions | nova ADR (templating) |

### Onda 3 — Fase 2+ (runtime real, exige Fase 2 ativada)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Cross-filtering com propagação real de estado | Alta | Alta | `Idea` | runtime, dashboard-definitions | ADR-0024, nova ADR |
| Drill-down/drill-through executável | Alta | Alta | `Idea` | runtime, query-definitions | ADR-0024, ADR-0008 |
| Renderização real via chart_renderer | Alta | Alta | `Idea` | runtime (web) | ADR-0003, ADR-0024 |
| Click behavior `navigate`/`url` | Média | Média | `Idea` | dashboard-definitions, runtime | ADR-0024 |
| Pipeline de execução por hooks (widget→query→conector) | Alta | Alta | `Research` | runtime, connectors | ADR-0015, ADR-0008 |

---

## Invariantes a preservar

- `tenantId` é fronteira de isolamento em **toda** definição, filtro e template —
  nunca um filtro opcional.
- Widgets referenciam `query-definitions` por id; nunca embutem query.
- Charts só via `chart_renderer` (ADR-0003); features nunca importam `fl_chart`/`graphic`.
- Builder produz definição declarativa; nunca SQL/string concatenada.
- Nenhuma execução real até Fase 2 explicitamente autorizada (ADR-0024).

---

## Relacionado

- `../metabase/ideas-for-delfos.md` · `../metabase/ux-patterns.md`
- `../superset/ideas-for-delfos.md` · `../superset/architecture.md`
- `../chartbrew/ideas-for-delfos.md`
- `../lightdash/ideas-for-delfos.md` · `../lightdash/architecture.md`
- `../nocobase/ideas-for-delfos.md`
- `../cube/ideas-for-delfos.md` · `../cube/architecture.md`
- `./semantic-layer-roadmap.md` — camada semântica que alimenta o builder
- `./ai-assistant-roadmap.md` — copiloto de autoria de dashboards
- `../maturity-taxonomy.md` — escala de maturidade aplicada às tabelas acima
- `../../adr/adr-0003-chart-renderer-abstraction.md`
- `../../adr/adr-0011-dashboard-builder-and-widget-model.md`
- `../../adr/adr-0014-runtime-execution-requests-foundation.md`
- `../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md`
- `../../adr/adr-0024-phase-1-and-phase-2-definition.md`
