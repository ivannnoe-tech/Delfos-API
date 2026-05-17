# Apache Superset — Ideias Aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: Apache Superset · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este catálogo

Cada ideia abaixo é uma **inspiração estratégica**, não uma especificação. Nada
aqui autoriza implementação: itens que tocam execução real, cache, fila, scheduler,
conectores reais ou IA exigem ADR e autorização explícita. Prioridade e
complexidade são estimativas para orientar discussão de roadmap.

---

### 1. Dataset como contrato semântico explícito

| Campo | Valor |
|---|---|
| Origem/inspiração | `Dataset` do Superset (colunas + métricas + colunas calculadas) |
| Descrição | Formalizar o dataset como contrato: dimensões, métricas reutilizáveis e colunas derivadas declaradas, não SQL solto |
| Objetivo | Reuso, consistência de números, base para builder e IA futura |
| Impacto | Alto — fundação de toda exploração |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions` |
| Dependências | Modelo atual de `datasets` e `field-mappings` |
| Viabilidade | Alta — é evolução declarativa, sem execução real |
| ADRs futuras possíveis | ADR de "semantic layer / metric definition" |
| Encaixe com | datasets, field-mappings, query-definitions, semantic layer futura |

---

### 2. Filtros nativos como objeto de configuração do dashboard

| Campo | Valor |
|---|---|
| Origem/inspiração | Native Filters do Superset (escopo, default, encadeamento) |
| Descrição | Filtros declarados em `dashboard-definitions`, com escopo explícito por widget, valores padrão e dependências entre filtros |
| Objetivo | Exploração interativa consistente sem estado efêmero frágil |
| Impacto | Alto — UX central de dashboard |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `query-definitions` |
| Dependências | Modelo de widget (ADR-0011) |
| Viabilidade | Alta — declarativo |
| ADRs futuras possíveis | Extensão do ADR-0011 (filtros de dashboard) |
| Encaixe com | dashboard-definitions, query-definitions |

---

### 3. Painel de controles contextual no builder

| Campo | Valor |
|---|---|
| Origem/inspiração | Explore view — controles que mudam conforme o tipo de viz |
| Descrição | Builder onde o formulário de configuração se adapta ao tipo de widget escolhido, mostrando só controles relevantes |
| Objetivo | Reduzir fricção e erro na criação de widgets |
| Impacto | Médio-alto — qualidade de UX do builder |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `dashboard-definitions` (delfos-web: feature builder) |
| Dependências | Catálogo de tipos de chart (ADR-0003) |
| Viabilidade | Alta — UI declarativa sobre metadados existentes |
| ADRs futuras possíveis | — |
| Encaixe com | dashboard-definitions, chart renderer |

---

### 4. Catálogo de visualizações versionável e extensível

| Campo | Valor |
|---|---|
| Origem/inspiração | Sistema de plugins de chart do Superset |
| Descrição | Tratar tipos de visualização como catálogo declarativo com schema de controles e versão, não código hardcoded |
| Objetivo | Adicionar/evoluir gráficos sem reescrever telas |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `dashboard-definitions`; delfos-web `chart_renderer` |
| Dependências | ADR-0003 (chart renderer abstraction) |
| Viabilidade | Alta — já parcialmente alinhado |
| ADRs futuras possíveis | Extensão do ADR-0003 (catálogo de viz) |
| Encaixe com | dashboard-definitions, chart renderer |

---

### 5. Certificação e ownership de ativos

| Campo | Valor |
|---|---|
| Origem/inspiração | Datasets/charts "certificados" e ownership do Superset |
| Descrição | Metadados de governança: dono, selo de fonte confiável, tags pesquisáveis em datasets/queries/dashboards |
| Objetivo | Confiança ("qual número usar?") e organização em escala |
| Impacto | Médio — alto valor percebido, baixo custo |
| Prioridade | Alta |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `query-definitions`, `dashboard-definitions` |
| Dependências | Modelo de roles (ADR-0017) para quem pode certificar |
| Viabilidade | Alta — só metadados declarativos |
| ADRs futuras possíveis | ADR leve de "asset governance metadata" |
| Encaixe com | datasets, query-definitions, dashboard-definitions |

---

### 6. Cross-filtering e drill-down com modelo de navegação explícito

| Campo | Valor |
|---|---|
| Origem/inspiração | Cross-filter e drill by/to-detail do Superset (e suas falhas de UX) |
| Descrição | Modelar interações de exploração (cross-filter, drill) como configuração declarada, não comportamento improvisado por chart |
| Objetivo | Exploração relacional previsível e consistente |
| Impacto | Alto — diferencial de UX |
| Prioridade | Média |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `dashboard-definitions`, `query-definitions` |
| Dependências | Filtros nativos (ideia 2), execução futura |
| Viabilidade | Média — parte depende de runtime real (Fase 2) |
| ADRs futuras possíveis | ADR de "interaction & drill model" |
| Encaixe com | dashboard-definitions, query-definitions, runtime bridge |

---

### 7. Permalink / estado de exploração compartilhável

| Campo | Valor |
|---|---|
| Origem/inspiração | Permalinks do Superset |
| Descrição | Serializar estado de filtros/exploração de um dashboard em referência compartilhável |
| Objetivo | Colaboração leve — compartilhar uma vista exata |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions` |
| Dependências | Filtros nativos (ideia 2) |
| Viabilidade | Alta — declarativo |
| ADRs futuras possíveis | — |
| Encaixe com | dashboard-definitions |

---

### 8. Plano assíncrono desacoplado (conceitual — Fase 2)

| Campo | Valor |
|---|---|
| Origem/inspiração | Celery workers + broker do Superset |
| Descrição | Separar execução de queries longas, relatórios e alertas em plano assíncrono dedicado |
| Objetivo | Não bloquear API; escalar execução independente |
| Impacto | Alto — quando houver execução real |
| Prioridade | Baixa (Fase 2+) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `runtime`, `execution-preview`, connectors |
| Dependências | Execução real, ADR-0007 (hoje sem cache/fila) |
| Viabilidade | Baixa na fase atual — só conceitual |
| ADRs futuras possíveis | ADR de "async execution plane" |
| Encaixe com | runtime bridge, connectors, execution requests |

---

### 9. Alertas e relatórios agendados

| Campo | Valor |
|---|---|
| Origem/inspiração | Alerts & Reports do Superset (cron, e-mail/Slack) |
| Descrição | Definições declarativas de alerta (regra sobre métrica) e relatório agendado |
| Objetivo | Entrega proativa de insight |
| Impacto | Alto — valor enterprise |
| Prioridade | Baixa (Fase 2+) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `report-definitions`, `runtime`, scheduler futuro |
| Dependências | Scheduler/worker (não existe na fase foundation) |
| Viabilidade | Baixa agora — `report-definitions` é declarativo apenas |
| ADRs futuras possíveis | ADR de "report runtime & scheduling" |
| Encaixe com | report-definitions, runtime bridge |

---

### 10. Embedded analytics com escopo de tenant no token

| Campo | Valor |
|---|---|
| Origem/inspiração | Embedded SDK + guest tokens do Superset / Preset Workspaces |
| Descrição | Embutir dashboards em produtos de cliente com token que carrega tenantId e permissões |
| Objetivo | Distribuir analytics dentro de produtos externos |
| Impacto | Alto — expansão de mercado |
| Prioridade | Baixa (Fase 2+) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `auth`, `dashboard-definitions`, `tenants` |
| Dependências | Auth real (JWT — ADR-0006), isolamento de tenant (ADR-0009) |
| Viabilidade | Baixa agora — auth atual é `x-delfos-admin-key` temporária |
| ADRs futuras possíveis | ADR de "embedded analytics & guest tokens" |
| Encaixe com | dashboard-definitions, tenants, AI assistant futuro |

---

### 11. Copiloto de analytics via tools do domínio (padrão MCP)

| Campo | Valor |
|---|---|
| Origem/inspiração | Abstrações MCP movidas para o core do Superset (2025/2026) |
| Descrição | Expor datasets, query-definitions e dashboards como ferramentas para um copiloto de IA futuro |
| Objetivo | Perguntas em linguagem natural, sugestão de gráficos, explicação de variações |
| Impacto | Alto — diferencial estratégico |
| Prioridade | Baixa (futuro) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `datasets`, `query-definitions`, `dashboard-definitions` |
| Dependências | Camada semântica (ideia 1), ADR-0025 |
| Viabilidade | Baixa agora — conceitual, requer ADR |
| ADRs futuras possíveis | ADR de "AI assistant tools / MCP surface" |
| Encaixe com | semantic layer futura, AI assistant futuro |

---

### 12. Organização de catálogo: pastas hierárquicas e tagging

| Campo | Valor |
|---|---|
| Origem/inspiração | Pastas hierárquicas de métricas (Superset 6.x) e tagging |
| Descrição | Organizar datasets, field-mappings e métricas em pastas/grupos navegáveis com busca e tags |
| Objetivo | Escalar catálogos grandes sem perder usabilidade |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions` |
| Dependências | — |
| Viabilidade | Alta — só metadados |
| ADRs futuras possíveis | — |
| Encaixe com | datasets, field-mappings, semantic layer futura |

---

## Síntese de priorização

| Prioridade | Ideias |
|---|---|
| Alta | 1 (dataset como contrato), 2 (filtros nativos), 5 (certificação e ownership) |
| Média | 3 (painel contextual), 4 (catálogo de viz), 6 (cross-filtering/drill-down), 7 (permalink), 12 (pastas e tagging) |
| Baixa | 8 (plano assíncrono), 9 (alertas agendados), 10 (embedded com tenant), 11 (copiloto MCP) |

As ideias de prioridade baixa dependem majoritariamente de runtime, scheduler,
auth real ou IA — itens de Fase 2 que exigem ADR e autorização explícita.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0011 — Dashboard builder and widget model](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [ADR-0003 — Chart renderer abstraction](../../adr/adr-0003-chart-renderer-abstraction.md)
- [ADR-0014 — Runtime execution requests foundation](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [ADR-0024 — Phase 1 and Phase 2 definition](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [ADR-0025 — LLM-assisted analytics text generation](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [ADR-0017 — Roles and permissions model](../../adr/adr-0017-roles-and-permissions-model.md)
- [Taxonomia de maturidade](../maturity-taxonomy.md) — taxonomia de maturidade aplicada às ideias
