# Roadmap consolidado — UX Premium

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Escopo e premissas

Este roadmap consolida os **padrões de UX premium** observados nos dez produtos
estudados (Metabase, Superset, Chartbrew, Cube, Airbyte, Wren AI, Vanna,
Lightdash, Evidence, NocoBase) e os traduz para o contexto do `delfos-web`
(Flutter Web) e da API declarativa do `delfos-api`.

Premissas que governam o documento:

- A UX do Delfos é construída sobre o **Design System** em `lib/shared/widgets/`,
  o `chart_renderer` abstrato (`adr-0003`) e o roteamento `go_router`. As regras
  invioláveis do `delfos-web` (cores via `tokens.dart`, charts só via
  `chart_renderer`, base UI só de `shared/widgets/`, quatro estados obrigatórios,
  light + dark validados) **são pré-requisito**, não item de roadmap.
- A maior parte da UX premium é **viável na foundation** — é interface sobre
  modelos declarativos. Itens que dependem de **runtime real** (drill-down que
  re-executa query, relatórios narrativos com dados, IA) são **Fase 2+, gated**.
- Nada aqui autoriza implementação; itens são insumo de roadmap.

---

## Princípios de UX

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
   vem (definição/dataset/field-mapping), inspiração Cube/Lightdash/Wren.
6. **Narrativa sobre tabela crua** — relatórios contam uma história (Evidence);
   resumo automático contextualiza o gráfico (Metabase).

---

## Ondas do roadmap

### Onda 0 — Fundação de UX já entregue

- Design System em `lib/shared/widgets/`; `chart_renderer` abstrato.
- Shell reestruturado (Phase B), `go_router`, temas light/dark.
- `execution-preview` disponível como ponto de encaixe de preview.

### Onda 1 — Builders e estados (foundation, viável agora)

Interface sobre modelos declarativos existentes.

- **Query builder por seleção** — montar `query-definitions` escolhendo
  measures/dimensions (Cube); preview da definição estruturada.
- **Painel de controles contextual** — o formulário do builder se adapta ao tipo
  de widget escolhido, mostrando só controles relevantes (Superset Explore).
- **Builder com test embutido** — preview do resultado lado a lado, via
  `execution-preview` + `FakeConnectorAdapter` (Airbyte).
- **Quatro estados em toda tela de dados** — consolidar
  loading/empty/error/permission como padrão verificado em review.
- **Modo configuração vs. modo uso** — alternar entre ver e editar um dashboard
  sem trocar de tela (NocoBase one-click).

### Onda 2 — Filtros, navegação e catálogo (foundation declarativa)

- **Filtros globais como componente desacoplado** — filtro publica critérios,
  widgets consomem (NocoBase filter blocks; Superset native filters como objeto
  de config).
- **Variáveis auto-vinculadas por convenção** — filtro de dashboard liga-se à
  variável de query de mesmo nome (Chartbrew); filtros globais sem fiação manual.
- **Catálogo de métricas navegável** — tela que lista measures/dimensions com
  descrição de negócio, origem e onde são usadas (Cube semantic catalog,
  Lightdash Spotlight); pastas e tagging (Superset).
- **Permalink / estado de exploração compartilhável** — serializar filtros de um
  dashboard em referência compartilhável (Superset permalinks).
- **Explainability na UI** — clicar num número revela fórmula, dataset de origem
  e dependências (Cube/Lightdash/Wren/Vanna proveniência).

### Onda 3 — Exploração rica e onboarding (declarativo + UI)

- **Drill-down governado por hierarquia** — caminhos país→estado→cidade declarados
  no modelo (Cube hierarchies); drill por rota `go_router` (Evidence).
- **Click behavior configurável** — ação de clique de um widget declarada
  (navegar, filtrar, abrir detalhe) — inspiração Metabase click behavior.
- **Contextual actions** — ações relevantes ao item em foco (certificar, duplicar,
  ver linhagem) expostas no contexto, não em menus distantes.
- **Templates de dashboard** — instanciar um dashboard padrão para um novo tenant
  (Chartbrew/NocoBase templates); acelera onboarding.
- **Responsividade** — layout de dashboard adapta-se a desktop/tablet; o embed e o
  shell respeitam breakpoints.

### Onda 4 — Exploração com runtime e narrativa (Fase 2 — gated por ADR)

**Nada aqui é autorizado.** Cada item depende de runtime real ou IA.

- **Cross-filtering interativo** — clicar num widget filtra os demais; depende de
  re-execução de query (`adr-0014`).
- **X-rays / exploração automática** — gerar uma vista inicial a partir de um
  dataset (Metabase X-rays); onboarding instantâneo.
- **Relatórios narrativos** — `report-definitions` que contam uma história com
  texto + gráficos (Evidence); depende de report runtime.
- **Resumo automático de gráfico** — texto que contextualiza o que o gráfico
  mostra (Metabase + LLM); gated por `adr-0025`.
- **Copiloto de autoria** — assistente que propõe `query`/`dashboard-definitions`
  como rascunho declarativo, com preview na conversa (Chartbrew/Evidence/Wren);
  gated por `adr-0025`.

---

## Tabela de roadmap

| Item | Onda | Prioridade | Complexidade | Maturidade | Módulos | Foundation vs futuro | ADRs |
|---|---|---|---|---|---|---|---|
| Query builder por seleção | 1 | Alta | Média-alta | `Research` | `query-definitions`, `delfos-web` | Foundation declarativa | adr-0011 |
| Painel de controles contextual | 1 | Média | Média | `Research` | `dashboard-definitions`, `delfos-web` | Foundation (UI) | adr-0003 |
| Builder com test embutido | 1 | Alta | Média | `Research` | `execution-preview`, `delfos-web` | Foundation (Fake adapter) | adr-0011 |
| Quatro estados em telas de dados | 1 | Alta | Baixa | `Research` | `delfos-web` | Foundation (UI) | — |
| Modo configuração vs. uso | 1 | Média | Média | `Research` | `dashboard-definitions`, `delfos-web` | Foundation (UI) | adr-0011 |
| Filtros globais desacoplados | 2 | Alta | Média | `Research` | `dashboard-definitions`, `query-definitions` | Foundation declarativa | nova (global filters) |
| Variáveis auto-vinculadas | 2 | Média | Média | `Research` | `dashboard-definitions`, `query-definitions` | Foundation declarativa | nova (filter binding) |
| Catálogo de métricas navegável | 2 | Média | Média | `Research` | `datasets`, `field-mappings`, `delfos-web` | Foundation declarativa | nova (metric catalog) |
| Permalink de exploração | 2 | Média | Média | `Research` | `dashboard-definitions` | Foundation declarativa | — |
| Explainability na UI | 2 | Média | Média | `Research` | `query-definitions`, `field-mappings`, `audit` | Foundation declarativa | adr-0018 (ref.) |
| Drill-down por hierarquia | 3 | Média | Média | `Research` | `field-mappings`, `dashboard-definitions` | Foundation declarativa | nova (hierarchies) |
| Click behavior configurável | 3 | Média | Média | `Research` | `dashboard-definitions`, `delfos-web` | Foundation declarativa | adr-0011 (extensão) |
| Contextual actions | 3 | Média | Baixa | `Research` | `delfos-web` | Foundation (UI) | — |
| Templates de dashboard | 3 | Média | Média | `Research` | `dashboard-definitions`, `tenants` | Foundation declarativa | nova (def templates) |
| Responsividade | 3 | Média | Média | `Research` | `delfos-web` | Foundation (UI) | — |
| Cross-filtering interativo | 4 | Média | Alta | `Idea` | `dashboard-definitions`, `runtime` | Futuro gated | adr-0014 |
| X-rays / exploração automática | 4 | Baixa | Alta | `Idea` | `datasets`, `dashboard-definitions` | Futuro gated | nova (auto-exploration) |
| Relatórios narrativos | 4 | Média | Alta | `Idea` | `report-definitions`, `runtime` | Futuro gated | nova (report runtime) |
| Resumo automático de gráfico | 4 | Baixa | Alta | `Idea` | `dashboard-definitions`, IA futura | Futuro gated | **adr-0025** |
| Copiloto de autoria | 4 | Média | Alta | `Idea` | `query-definitions`, `dashboard-definitions`, IA | Futuro gated | **adr-0025** |

---

## Riscos e guard-rails

- **As regras invioláveis do `delfos-web` precedem qualquer feature de UX.** Cores
  só via `tokens.dart`; charts só via `chart_renderer`; base UI só de
  `shared/widgets/`; `go_router` para navegação; light + dark validados.
- **Não improvisar interação.** Cross-filter e drill seguem modelo declarado;
  exploração improvisada por widget foi anti-padrão observado no Superset.
- **Os quatro estados não são opcionais** — toda tela de dados implementa
  loading/empty/error/permission; `DelfosPermissionState` reflete RBAC.
- **Builders geram só definições declarativas** — nunca SQL/texto livre; reforça a
  invariante anti-concatenação.
- **Onda 4 depende de runtime/IA** — relatórios narrativos exigem report runtime;
  resumo e copiloto exigem `adr-0025`. Sem isso, ficam como mockups.
- **Arquivos web > 300 linhas** pedem revisão; não misturar UI, lógica e dados.

---

## Relacionado

- [../metabase/ux-patterns.md](../metabase/ux-patterns.md)
- [../superset/ux-patterns.md](../superset/ux-patterns.md)
- [../cube/ux-patterns.md](../cube/ux-patterns.md)
- [../evidence/ux-patterns.md](../evidence/ux-patterns.md)
- [../lightdash/ux-patterns.md](../lightdash/ux-patterns.md)
- [../chartbrew/ux-patterns.md](../chartbrew/ux-patterns.md)
- [../airbyte/ux-patterns.md](../airbyte/ux-patterns.md)
- [../nocobase/ux-patterns.md](../nocobase/ux-patterns.md)
- [../wren-ai/ux-patterns.md](../wren-ai/ux-patterns.md)
- [../vanna/ux-patterns.md](../vanna/ux-patterns.md)
- [./connectors-roadmap.md](./connectors-roadmap.md)
- [./embedded-analytics-roadmap.md](./embedded-analytics-roadmap.md)
- [./enterprise-governance-roadmap.md](./enterprise-governance-roadmap.md)
- [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [../maturity-taxonomy.md](../maturity-taxonomy.md)
