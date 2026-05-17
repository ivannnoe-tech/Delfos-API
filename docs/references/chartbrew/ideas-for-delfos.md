# Chartbrew — Ideias Aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: Chartbrew · Status: conceitual/futuro — não autoriza implementação

---

## Visão geral

Catálogo de ideias destiladas do estudo do Chartbrew, traduzidas para o contexto e
as invariantes do Delfos (multi-tenant, foundation declarativa, connectors
separados, `tenantId` obrigatório, `credentialRef` seguro). **Nenhuma ideia abaixo
autoriza implementação** — cada uma é um insumo para discussão de roadmap e,
quando indicado, para futuras ADRs.

---

### 1. Sistema de variáveis nomeadas em query-definitions

| Campo | Valor |
|---|---|
| Origem/inspiração | Variáveis `{{startDate}}` do Chartbrew |
| Descrição | Placeholders nomeados em `query-definitions`, resolvidos por valor padrão, filtro de dashboard, parâmetro de execução ou contexto |
| Objetivo | Reuso de uma mesma query em vários contextos sem reescrita |
| Impacto | Alto — base para filtros globais e parametrização |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `dashboard-definitions`, `runtime`, `execution-preview` |
| Dependências | Validação estrita de input (invariante de segurança) |
| Viabilidade | Alta na foundation — é metadado declarativo |
| ADRs futuras possíveis | ADR "query-definition variable contract" |
| Encaixe | query-definitions (núcleo), dashboard-definitions (filtros), runtime bridge (resolução) |

---

### 2. Ligação automática filtro de dashboard ↔ variável por convenção de nome

| Campo | Valor |
|---|---|
| Origem/inspiração | Filtros de dashboard auto-vinculados a variáveis no Chartbrew |
| Descrição | Um filtro de `dashboard-definition` com o mesmo nome de uma variável de query liga-se automaticamente, propagando o valor a todos os widgets |
| Objetivo | Filtros globais sem fiação manual |
| Impacto | Alto — UX de exploração |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `query-definitions` |
| Dependências | Ideia 1 (variáveis) |
| Viabilidade | Alta — resolução declarativa de vínculo |
| ADRs futuras possíveis | ADR "global dashboard filters binding" |
| Encaixe | dashboard-definitions, query-definitions, semantic layer futura |

---

### 3. Dataset reutilizável como contrato entre fonte e visualização

| Campo | Valor |
|---|---|
| Origem/inspiração | Conceito de *dataset* central do Chartbrew |
| Descrição | Reforçar `datasets` como unidade reutilizável: definido uma vez, consumido por vários `dashboard-definitions` e `query-definitions` |
| Objetivo | Reduzir duplicação e centralizar governança de dados |
| Impacto | Alto |
| Prioridade | Alta |
| Complexidade | Baixa (conceito já existe) |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions` |
| Dependências | Nenhuma — consolidação do que já existe |
| Viabilidade | Alta |
| ADRs futuras possíveis | Revisão de ADR de modelo de datasets |
| Encaixe | datasets (núcleo), field-mappings, query-definitions |

---

### 4. Templates de dashboard para escalar relatórios multi-tenant

| Campo | Valor |
|---|---|
| Origem/inspiração | Dashboard templates do Chartbrew |
| Descrição | Empacotar uma `dashboard-definition` como template; instanciar por tenant conectando aos `datasets` daquele tenant |
| Objetivo | Escalar relatórios padronizados entre tenants |
| Impacto | Alto — produtividade de onboarding de tenant |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `tenants`, `datasets` |
| Dependências | Ideia 3; respeito a `tenantId` na instanciação |
| Viabilidade | Alta — metadado declarativo |
| ADRs futuras possíveis | ADR "dashboard template instantiation model" |
| Encaixe | dashboard-definitions, datasets |

---

### 5. Snapshots agendados de dashboard

| Campo | Valor |
|---|---|
| Origem/inspiração | Snapshots agendados (Slack/e-mail/webhook) do Chartbrew |
| Descrição | Captura periódica do estado de um dashboard, entregue por canal configurável |
| Objetivo | Entrega passiva de relatórios sem o usuário abrir o app |
| Impacto | Médio-alto — percepção de valor |
| Prioridade | Baixa (depende de runtime real) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `dashboard-definitions`, `runtime`, futura camada de scheduler |
| Dependências | Runtime de execução real, scheduler (ambos futuros — `adr-0014`) |
| Viabilidade | Baixa na foundation; planejável para Fase 2 |
| ADRs futuras possíveis | ADR "scheduled snapshots and delivery channels" |
| Encaixe | runtime bridge, execution requests |

---

### 6. Alertas inteligentes por limiar e anomalia

| Campo | Valor |
|---|---|
| Origem/inspiração | Data alerts do Chartbrew |
| Descrição | Regras sobre métricas de `query-definitions` que disparam notificação ao cruzar limiar ou detectar anomalia |
| Objetivo | Monitoramento proativo de KPIs |
| Impacto | Médio-alto |
| Prioridade | Baixa |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, `runtime`, scheduler futuro |
| Dependências | Runtime real, execução periódica |
| Viabilidade | Baixa na foundation; Fase 2 |
| ADRs futuras possíveis | ADR "smart alerts and anomaly thresholds" |
| Encaixe | query-definitions, runtime bridge, execution requests |

---

### 7. AI assistant com contexto explícito de tenant/connection/dataset

| Campo | Valor |
|---|---|
| Origem/inspiração | AI Orchestrator com contexto de projeto/conexão/dataset |
| Descrição | Assistant que recebe contexto explícito (tenant, connection, dataset) e propõe `query-definitions`/`dashboard-definitions` como rascunho declarativo |
| Objetivo | Reduzir barreira técnica de criação de artefatos |
| Impacto | Alto — diferencial competitivo |
| Prioridade | Média |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, `dashboard-definitions`, `datasets`, módulo de IA futuro |
| Dependências | `adr-0025`; guardas de validação; respeito a `tenantId` |
| Viabilidade | Média — pode começar gerando rascunhos declarativos sem execução |
| ADRs futuras possíveis | Extensão de `adr-0025` para geração de artefatos |
| Encaixe | AI assistant futuro, query-definitions, dashboard-definitions, datasets |

---

### 8. Assistente de query especializado por tipo de connector

| Campo | Valor |
|---|---|
| Origem/inspiração | SQL Assistant e MongoDB Query Assistant do Chartbrew |
| Descrição | Assistentes de IA específicos por tipo de fonte, gerando/corrigindo a query dentro do contrato de `delfos-connectors` |
| Objetivo | Acelerar autoria de `query-definitions` por fonte |
| Impacto | Médio |
| Prioridade | Baixa |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, `connections`, módulo de IA futuro |
| Dependências | Ideia 7; catálogo de connectors |
| Viabilidade | Média |
| ADRs futuras possíveis | ADR "connector-specific query assistants" |
| Encaixe | connectors, query-definitions, AI assistant futuro |

---

### 9. Preview de artefato gerado pela IA dentro da conversa

| Campo | Valor |
|---|---|
| Origem/inspiração | Preview de chart na conversa do AI Orchestrator |
| Descrição | Mostrar no `delfos-web` um preview do `dashboard-definition`/`query-definition` proposto pela IA antes de persistir |
| Objetivo | Feedback imediato e confiança antes de salvar |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `execution-preview`, `delfos-web`, módulo de IA futuro |
| Dependências | `execution-preview` já existe; Ideia 7 |
| Viabilidade | Média — `execution-preview` é um ponto de encaixe natural |
| ADRs futuras possíveis | ADR "AI artifact preview flow" |
| Encaixe | execution-preview, AI assistant futuro, dashboard-definitions |

---

### 10. Catálogo de tipos de visualização desacoplado do renderer

| Campo | Valor |
|---|---|
| Origem/inspiração | Tipos de chart do Chartbrew (acoplados a Chart.js) — fazer melhor |
| Descrição | Catálogo declarativo de tipos de visualização em `dashboard-definitions`, consumido pelo `chart_renderer` abstrato do `delfos-web` |
| Objetivo | Adicionar visualizações sem acoplar a uma lib |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Baixa (decisão já tomada em `adr-0003`) |
| Maturidade | `Idea` |
| Módulos impactados | `dashboard-definitions`, `delfos-web` shared/charts |
| Dependências | `adr-0003` (chart renderer abstraction) |
| Viabilidade | Alta |
| ADRs futuras possíveis | Extensão de `adr-0003` |
| Encaixe | dashboard-definitions, semantic layer futura |

---

### 11. Embedding de dashboard com acesso controlado por tenant

| Campo | Valor |
|---|---|
| Origem/inspiração | Embedding + client accounts do Chartbrew |
| Descrição | Tokens de embed que carregam contexto de tenant e escopo de dashboard, com variáveis por parâmetro |
| Objetivo | Permitir clientes consumirem dashboards embedados em produtos externos |
| Impacto | Alto — abre caso de uso *embedded analytics* |
| Prioridade | Baixa |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `dashboard-definitions`, `auth`, `tenants` |
| Dependências | Auth real (futuro — `adr-0006`); `tenantId` no token |
| Viabilidade | Baixa na foundation; Fase 2 |
| ADRs futuras possíveis | ADR "embedded dashboards and scoped tokens" |
| Encaixe | dashboard-definitions, tenants, runtime bridge |

---

### 12. Semantic layer com métricas/dimensões nomeadas

| Campo | Valor |
|---|---|
| Origem/inspiração | Gap do Chartbrew — ausência de semantic layer |
| Descrição | Evoluir `field-mappings` + `query-definitions` para um catálogo de métricas e dimensões nomeadas, governadas e versionadas, reutilizáveis entre datasets |
| Objetivo | Consistência semântica e governança de dados |
| Impacto | Alto — diferencial enterprise sobre o Chartbrew |
| Prioridade | Média |
| Complexidade | Alta |
| Maturidade | `Research` |
| Módulos impactados | `field-mappings`, `query-definitions`, `datasets` |
| Dependências | Consolidação de `field-mappings`; decisão arquitetural ampla |
| Viabilidade | Média — começa declarativo, cresce por fase |
| ADRs futuras possíveis | ADR "semantic layer: metrics and dimensions catalog" |
| Encaixe | field-mappings, query-definitions, datasets, semantic layer futura, AI assistant futuro |

---

## Priorização sugerida

| Prioridade | Ideias |
|---|---|
| Alta | 1 (variáveis), 3 (dataset reutilizável) |
| Média | 2 (filtros auto-vinculados), 4 (templates), 7 (AI contextual), 9 (preview IA), 10 (catálogo de viz), 12 (semantic layer) |
| Baixa | 5 (snapshots), 6 (alertas), 8 (query assistants), 11 (embedding) |

Ideias de prioridade baixa dependem majoritariamente de runtime real, scheduler ou
auth real — todos itens de Fase 2 que exigem ADR e autorização explícita.

---

## Ver também — roadmaps consolidados

Esta análise de Chartbrew é sintetizada, junto com a dos demais produtos,
nos documentos consolidados de `references/consolidated/`. Os roadmaps
temáticos abaixo agregam diretamente as ideias deste produto:

- [`../consolidated/connectors-roadmap.md`](../consolidated/connectors-roadmap.md) — roadmap de connectors e execução
- [`../consolidated/builder-and-ux-roadmap.md`](../consolidated/builder-and-ux-roadmap.md) — roadmap de dashboard/query builder e UX premium
- [`../consolidated/embedded-analytics-roadmap.md`](../consolidated/embedded-analytics-roadmap.md) — roadmap de embedded analytics

Além desses, todos os produtos alimentam os consolidados de visão e síntese:

- [`../consolidated/strategic-product-vision.md`](../consolidated/strategic-product-vision.md) — visão estratégica de produto
- [`../consolidated/product-differentiators.md`](../consolidated/product-differentiators.md) — diferenciais competitivos
- [`../consolidated/future-modules-catalog.md`](../consolidated/future-modules-catalog.md) — catálogo de módulos futuros
- [`../consolidated/priority-matrix.md`](../consolidated/priority-matrix.md) — matriz de prioridade consolidada

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADR: [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- ADR: [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- ADR: [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- ADR: [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- ADR: [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Taxonomia de maturidade](../maturity-taxonomy.md) — taxonomia de maturidade aplicada às ideias
- [Índice da biblioteca de referências](../README.md)
