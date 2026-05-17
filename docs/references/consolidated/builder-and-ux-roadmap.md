# Roadmap consolidado — Builder e UX Premium

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Propósito

Este documento sintetiza, num único roadmap, os padrões de **dashboard/query
builder** e de **UX premium** observados nos produtos estudados — Metabase,
Superset, Chartbrew, Cube, Airbyte, WrenAI, Vanna, Lightdash, Evidence e
NocoBase — e os traduz para a realidade do Delfos.

Builder e UX premium foram fundidos aqui porque a sobreposição era quase total:
widgets, filtros globais, click behavior, cross-filtering, drill-down,
explainability, templates e versionamento apareciam nos dois temas. Tratá-los
como um só roadmap elimina duplicação e dá uma visão única de sequenciamento.

O Delfos está em fase *foundation*: hoje existem apenas definições declarativas
(`dashboard-definitions`, `query-definitions`, `report-definitions`, `datasets`,
`field-mappings`) e nenhum runtime real de execução, renderização ou agregação.
A UX do `delfos-web` (Flutter Web) é construída sobre o **Design System** em
`lib/shared/widgets/`, o `chart_renderer` abstrato (`adr-0003`) e o roteamento
`go_router`.

Tudo descrito aqui é **conceitual/futuro**. Itens que tocam execução real,
cross-filtering com dados, builder interativo, drill-down que re-executa query,
relatórios narrativos ou IA dependem de autorização explícita e, na maioria dos
casos, de uma ADR nova ou da evolução de uma ADR existente.

Para traduzir os termos de "Onda" usados neste roadmap para os vocabulários de
"Horizonte" / "Fase" de outros documentos, ver o
[crosswalk de vocabulário de fase](../maturity-taxonomy.md#crosswalk-de-vocabulário-de-fase).

---

## Princípios herdados das análises

### Princípios de modelagem do builder

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

### Princípios de UX

1. **Configuração por seleção, não por digitação** — builders montam artefatos
   escolhendo measures/dimensions do modelo (Cube playground); nunca SQL/texto
   livre. Torna impossível pedir o que não existe.
2. **Feedback imediato** — preview lado a lado da configuração (Airbyte Connector
   Builder, `execution-preview`); o usuário vê o resultado enquanto edita.
3. **Estados são parte do design, não exceção** — `DelfosLoadingState`,
   `DelfosEmptyState`, `DelfosErrorState`, `DelfosPermissionState` em toda tela de
   dados; o estado vazio/erro é desenhado, não improvisado.
4. **Exploração governada** — drill-down, cross-filter e filtros globais seguem
   caminhos declarados no modelo (Cube hierarchies, Superset native filters), não
   comportamento improvisado por widget.
5. **Todo número é defensável** — explainability: a UI mostra de onde o número
   vem (definição/dataset/field-mapping), inspiração Cube/Lightdash/WrenAI.
6. **Narrativa sobre tabela crua** — relatórios contam uma história (Evidence);
   resumo automático contextualiza o gráfico (Metabase).

> As regras invioláveis do `delfos-web` (cores via `tokens.dart`, charts só via
> `chart_renderer`, base UI só de `shared/widgets/`, `go_router` para navegação,
> quatro estados obrigatórios, light + dark validados) **são pré-requisito**, não
> item de roadmap.

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
- **Painel de controles contextual** — o formulário do builder se adapta ao tipo
  de widget escolhido, mostrando só controles relevantes (Superset Explore).
- **Builder com test embutido** — preview do resultado lado a lado, via
  `execution-preview` + `FakeConnectorAdapter` (Airbyte).
- `execution-preview` valida o plano (dry-plan) antes de qualquer execução real.
- Explainability: cada número renderizado rastreia até a `query-definition` e o
  `dataset`/`field-mapping` de origem (padrão Lightdash/Cube).

---

## Filtros globais e cross-filtering

**Filtros globais** — entidade de configuração dentro de `dashboard-definitions`,
componente desacoplado dos widgets:

- Cada filtro tem `name`, `type`, `defaultValue`, `targets[]` (widgets afetados).
- Auto-vínculo por convenção de nome (Chartbrew): filtro `region` alimenta toda
  variável `region` das `query-definitions` consumidas — sem fiação manual.
- Filtros são desacoplados dos widgets (NocoBase filter blocks): o filtro publica
  critérios, os widgets consomem.

**Cross-filtering** — clicar num widget filtra os demais (Metabase, Superset):

- Declarado como `clickBehavior: { mode: 'cross-filter', emits: [...] }`.
- Na fase foundation, apenas o **contrato** do cross-filter é definido; a
  propagação real de estado é runtime e exige autorização (`adr-0014`).

**Drill-down** — navegação para granularidade maior (Cube, Evidence, Metabase):

- Declarado como rota parametrizada (`go_router`) ou troca de dimension no widget.
- Caminhos de hierarquia (país→estado→cidade) declarados no modelo (Cube
  hierarchies), não improvisados por widget.
- Drill-through automático (Metabase): da agregação para as linhas subjacentes,
  sempre dentro do `tenantId`.

---

## Click behavior configurável

Padrão Metabase: cada widget declara o que acontece ao clicar.

| Modo | Efeito | Onda (ver [crosswalk](../maturity-taxonomy.md#crosswalk-de-vocabulário-de-fase)) |
|---|---|---|
| `none` | Sem ação | Onda 1 (contrato declarativo) |
| `cross-filter` | Emite valor como filtro global | Onda 2–3 |
| `drill-down` | Troca dimension / abre granularidade | Onda 2–3 |
| `navigate` | Vai para outro dashboard/rota parametrizada | Onda 4 (Fase 2) |
| `url` | Abre URL externa validada | Onda 4 (Fase 2) |

O click behavior é **declarativo** e versionado junto do widget.

---

## Catálogo de métricas, permalink e exploração

- **Catálogo de métricas navegável** — tela que lista measures/dimensions com
  descrição de negócio, origem e onde são usadas (Cube semantic catalog,
  Lightdash Spotlight); com pastas e tagging (Superset).
- **Permalink / estado de exploração compartilhável** — serializar filtros de um
  dashboard em referência compartilhável (Superset permalinks).
- **Explainability na UI** — clicar num número revela fórmula, dataset de origem
  e dependências (Cube/Lightdash/WrenAI/Vanna proveniência).
- **Contextual actions** — ações relevantes ao item em foco (certificar,
  duplicar, ver linhagem) expostas no contexto, não em menus distantes.
- **Modo configuração vs. modo uso** — alternar entre ver e editar um dashboard
  sem trocar de tela (NocoBase one-click).
- **Responsividade** — layout de dashboard adapta-se a desktop/tablet; o embed e
  o shell respeitam breakpoints.

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

## Relatórios narrativos e resumo automático (Fase 2)

- **Relatórios narrativos** — `report-definitions` que contam uma história com
  texto + gráficos (Evidence); depende de report runtime.
- **Resumo automático de gráfico** — texto que contextualiza o que o gráfico
  mostra (Metabase + LLM); gated por `adr-0025`.
- **Copiloto de autoria** — assistente que propõe `query`/`dashboard-definitions`
  como rascunho declarativo, com preview na conversa (Chartbrew/Evidence/WrenAI);
  gated por `adr-0025`.

---

## Ondas do roadmap

A coluna `Maturidade` em cada tabela segue a escala de
[`maturity-taxonomy.md`](../maturity-taxonomy.md).

### Onda 0 — Fundação já entregue

- Design System em `lib/shared/widgets/`; `chart_renderer` abstrato.
- Shell reestruturado (Phase B), `go_router`, temas light/dark.
- Definições declarativas (`dashboard`/`query`/`report-definitions`) e
  `execution-preview` disponível como ponto de encaixe de preview.

### Onda 1 — Builders, estados e contrato de widget (foundation declarativa)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Contrato de widget declarativo completo | Alta | Média | `Research` | dashboard-definitions | ADR-0011 (estender) |
| Query builder visual por seleção | Alta | Média-alta | `Research` | query-definitions, delfos-web, execution-preview | ADR-0011 |
| Variáveis nomeadas em query-definitions | Alta | Baixa | `Research` | query-definitions | ADR-0011 |
| Painel de controles contextual | Média | Média | `Research` | dashboard-definitions, delfos-web | ADR-0003 |
| Builder com test embutido (preview lado a lado) | Alta | Média | `Research` | execution-preview, delfos-web | ADR-0011 |
| Quatro estados em telas de dados | Alta | Baixa | `Research` | delfos-web | — |
| Modo configuração vs. modo uso | Média | Média | `Research` | dashboard-definitions, delfos-web | ADR-0011 |
| Histórico/versionamento de definições | Alta | Média | `Research` | dashboard/query/report-definitions, audit | nova ADR (versionamento) |
| Validação de integridade de definições | Média | Média | `Research` | dashboard-definitions, datasets, field-mappings | nova ADR (versionamento) |
| Contrato declarativo de click behavior | Média | Baixa | `Research` | dashboard-definitions | ADR-0011 (estender) |

### Onda 2 — Filtros, catálogo e navegação (foundation declarativa)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Filtro global como entidade de config desacoplada | Alta | Média | `Research` | dashboard-definitions, query-definitions | nova ADR (global filters) |
| Convenção de auto-vínculo filtro↔variável | Média | Baixa | `Research` | dashboard/query-definitions | ADR-0011 / nova (filter binding) |
| Catálogo de métricas navegável | Média | Média | `Research` | datasets, field-mappings, delfos-web | nova ADR (metric catalog) |
| Permalink / estado de exploração | Média | Média | `Research` | dashboard-definitions | — |
| Explainability número→definição na UI | Média | Média | `Research` | query-definitions, datasets, field-mappings, audit | nova ADR (explainability) |
| Dry-plan de dashboard no execution-preview | Alta | Média | `Research` | execution-preview, runtime | ADR-0014 |

### Onda 3 — Exploração rica, templates e onboarding (declarativo + UI)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Drill-down governado por hierarquia | Média | Média | `Research` | field-mappings, dashboard-definitions | nova ADR (hierarchies) |
| Templates de dashboard parametrizados | Média | Média | `Research` | dashboard-definitions, tenants | nova ADR (templating) |
| Diff/rollback de definições | Média | Média | `Research` | dashboard/query/report-definitions | nova ADR (versionamento) |
| X-ray de dataset (dashboard sugerido) | Baixa | Média | `Research` | datasets, dashboard-definitions | nova ADR (templating) |
| Contextual actions | Média | Baixa | `Research` | delfos-web | — |
| Responsividade de dashboard | Média | Média | `Research` | delfos-web | — |

### Onda 4 — Runtime real e narrativa (Fase 2 — gated por ADR)

**Nada aqui é autorizado.** Cada item depende de runtime real ou IA.

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Cross-filtering com propagação real de estado | Alta | Alta | `Idea` | dashboard-definitions, runtime | ADR-0024, ADR-0014 |
| Drill-down/drill-through executável | Alta | Alta | `Idea` | runtime, query-definitions | ADR-0024, ADR-0008 |
| Renderização real via chart_renderer | Alta | Alta | `Idea` | runtime (web) | ADR-0003, ADR-0024 |
| Click behavior `navigate`/`url` | Média | Média | `Idea` | dashboard-definitions, runtime | ADR-0024 |
| Pipeline de execução por hooks (widget→query→conector) | Alta | Alta | `Research` | runtime, connectors | ADR-0015, ADR-0008 |
| X-rays / exploração automática de dataset | Baixa | Alta | `Idea` | datasets, dashboard-definitions | nova ADR (auto-exploration) |
| Relatórios narrativos | Média | Alta | `Idea` | report-definitions, runtime | nova ADR (report runtime) |
| Resumo automático de gráfico | Baixa | Alta | `Idea` | dashboard-definitions, IA futura | **adr-0025** |
| Copiloto de autoria | Média | Alta | `Idea` | query-definitions, dashboard-definitions, IA | **adr-0025** |

---

## Invariantes e guard-rails a preservar

- `tenantId` é fronteira de isolamento em **toda** definição, filtro e template —
  nunca um filtro opcional.
- Widgets referenciam `query-definitions` por id; nunca embutem query.
- **As regras invioláveis do `delfos-web` precedem qualquer feature de UX.** Cores
  só via `tokens.dart`; charts só via `chart_renderer` (ADR-0003); base UI só de
  `shared/widgets/`; `go_router` para navegação; light + dark validados.
- Builders geram só definições declarativas; nunca SQL/texto livre — reforça a
  invariante anti-concatenação.
- **Não improvisar interação.** Cross-filter e drill seguem modelo declarado;
  exploração improvisada por widget foi anti-padrão observado no Superset.
- **Os quatro estados não são opcionais** — toda tela de dados implementa
  loading/empty/error/permission; `DelfosPermissionState` reflete RBAC.
- Nenhuma execução real até Fase 2 explicitamente autorizada (ADR-0024).
- **Onda 4 depende de runtime/IA** — relatórios narrativos exigem report runtime;
  resumo e copiloto exigem `adr-0025`. Sem isso, ficam como mockups.
- **Arquivos web > 300 linhas** pedem revisão; não misturar UI, lógica e dados.

---

## Relacionado

- [../metabase/ideas-for-delfos.md](../metabase/ideas-for-delfos.md) ·
  [../metabase/ux-patterns.md](../metabase/ux-patterns.md)
- [../superset/ideas-for-delfos.md](../superset/ideas-for-delfos.md) ·
  [../superset/ux-patterns.md](../superset/ux-patterns.md) ·
  [../superset/architecture.md](../superset/architecture.md)
- [../chartbrew/ideas-for-delfos.md](../chartbrew/ideas-for-delfos.md) ·
  [../chartbrew/ux-patterns.md](../chartbrew/ux-patterns.md)
- [../lightdash/ideas-for-delfos.md](../lightdash/ideas-for-delfos.md) ·
  [../lightdash/ux-patterns.md](../lightdash/ux-patterns.md) ·
  [../lightdash/architecture.md](../lightdash/architecture.md)
- [../nocobase/ideas-for-delfos.md](../nocobase/ideas-for-delfos.md) ·
  [../nocobase/ux-patterns.md](../nocobase/ux-patterns.md)
- [../cube/ideas-for-delfos.md](../cube/ideas-for-delfos.md) ·
  [../cube/ux-patterns.md](../cube/ux-patterns.md) ·
  [../cube/architecture.md](../cube/architecture.md)
- [../evidence/ux-patterns.md](../evidence/ux-patterns.md)
- [../airbyte/ux-patterns.md](../airbyte/ux-patterns.md)
- [../wren-ai/ux-patterns.md](../wren-ai/ux-patterns.md)
- [../vanna/ux-patterns.md](../vanna/ux-patterns.md)
- [./semantic-layer-roadmap.md](./semantic-layer-roadmap.md) — camada semântica que alimenta o builder
- [./ai-assistant-roadmap.md](./ai-assistant-roadmap.md) — copiloto de autoria de dashboards
- [./connectors-roadmap.md](./connectors-roadmap.md)
- [./embedded-analytics-roadmap.md](./embedded-analytics-roadmap.md)
- [./enterprise-governance-roadmap.md](./enterprise-governance-roadmap.md)
- [../maturity-taxonomy.md](../maturity-taxonomy.md) — escala de maturidade e crosswalk de fase
- [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Índice da biblioteca de referências](../README.md)
