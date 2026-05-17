# Metabase — Ideias Aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: Metabase · Status: conceitual/futuro — não autoriza implementação

---

Este é o documento central da referência. Cada ideia abaixo é um candidato de evolução para o
Delfos, inspirado em conceitos do Metabase — **não** em código ou telas. Nenhuma ideia autoriza
implementação; cada uma indica ADRs futuras necessárias.

---

## Catálogo de ideias

### 1. Query IR declarativo inspirado em MBQL

| Campo | Valor |
|---|---|
| Origem/inspiração | MBQL — query como estrutura de dados, não string SQL |
| Descrição | Definir um formato declarativo e versionado para `query-definitions`, independente de dialeto e validável |
| Objetivo | Desacoplar a definição de query da execução; viabilizar drill-down e validação estática |
| Impacto | Alto — base para semantic layer e para o bridge runtime/connectors |
| Prioridade | Alta |
| Complexidade | Alta |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `datasets`, `field-mappings`, `runtime` |
| Dependências | Definição estável de catálogo de datasets e field-mappings |
| Viabilidade | Alta como contrato declarativo; execução é futura |
| ADRs futuras possíveis | ADR "Declarative Query IR"; revisão de ADR-0014/ADR-0015 |
| Encaixe com | query-definitions, runtime bridge, semantic layer futura, connectors |

---

### 2. Drill-through automático derivado da definição de query

| Campo | Valor |
|---|---|
| Origem/inspiração | Drill-through "de graça" do Metabase em charts do query builder |
| Descrição | Como a query é estruturada (item 1), o sistema conhece dimensões e métricas e oferece drill sem configuração manual |
| Objetivo | Reduzir esforço do autor de dashboard e enriquecer a exploração |
| Impacto | Alto na percepção de UX |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `query-definitions`, web (`chart_renderer`) |
| Dependências | Item 1 (Query IR declarativo) |
| Viabilidade | Média — depende do IR existir primeiro |
| ADRs futuras possíveis | Extensão da ADR-0011 (widget model) |
| Encaixe com | dashboard-definitions, query-definitions, semantic layer futura |

---

### 3. Camada semântica: "Datasets curados" + "Métricas reutilizáveis"

| Campo | Valor |
|---|---|
| Origem/inspiração | Models e Metrics do Metabase |
| Descrição | Promover `datasets` a definições curadas e introduzir "metrics" reutilizáveis (revenue, churn) sobre eles |
| Objetivo | Fonte única da verdade para cálculos de negócio; consistência entre dashboards |
| Impacto | Alto |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions` |
| Dependências | Catálogo de datasets estável |
| Viabilidade | Alta como camada declarativa |
| ADRs futuras possíveis | ADR "Semantic Layer — Metrics and Curated Datasets" |
| Encaixe com | datasets, field-mappings, query-definitions, semantic layer futura, AI assistant futuro |

---

### 4. Semantic types em field-mappings

| Campo | Valor |
|---|---|
| Origem/inspiração | Semantic types do Metabase (e-mail, moeda, latitude) |
| Descrição | Enriquecer `field-mappings` com tipo semântico além do tipo de dado bruto |
| Objetivo | Orientar formatação, visualização default e futura exploração automática |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | `field-mappings`, `datasets` |
| Dependências | Nenhuma relevante |
| Viabilidade | Alta — extensão de schema declarativo |
| ADRs futuras possíveis | ADR leve de extensão de field-mappings |
| Encaixe com | field-mappings, datasets, semantic layer futura |

---

### 5. Exploração automática (X-rays) como onboarding de dataset

| Campo | Valor |
|---|---|
| Origem/inspiração | X-rays do Metabase |
| Descrição | Gerar automaticamente um dashboard exploratório a partir de um dataset/field-mappings |
| Objetivo | Eliminar a "tela em branco"; acelerar adoção de novos usuários |
| Impacto | Alto na percepção de valor |
| Prioridade | Média |
| Complexidade | Alta (requer execução real) |
| Maturidade | `Idea` |
| Módulos impactados | `datasets`, `dashboard-definitions`, `execution-preview`, `runtime` |
| Dependências | Execução real de queries; semantic types (item 4) |
| Viabilidade | Baixa na fase atual; conceitual para Fase 2 |
| ADRs futuras possíveis | ADR "Automatic Dataset Exploration" |
| Encaixe com | datasets, field-mappings, execution requests, runtime bridge |

---

### 6. Click behavior configurável em widgets

| Campo | Valor |
|---|---|
| Origem/inspiração | Click behavior do Metabase (drill / destino custom / atualizar filtro) |
| Descrição | Permitir que a `dashboard-definition` declare a semântica do clique por widget |
| Objetivo | Dar poder de interação ao autor sem código |
| Impacto | Médio-alto |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, web (presentation) |
| Dependências | Modelo de filtros de dashboard |
| Viabilidade | Alta como definição declarativa |
| ADRs futuras possíveis | Extensão da ADR-0011 |
| Encaixe com | dashboard-definitions, query-definitions |

---

### 7. Filtros globais de dashboard com cross-filtering

| Campo | Valor |
|---|---|
| Origem/inspiração | Filtros de dashboard e cross-filtering do Metabase |
| Descrição | Definir filtros declarativos no dashboard, mapeados a múltiplos widgets, com propagação por clique |
| Objetivo | Exploração coordenada sem editar cada widget |
| Impacto | Alto |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `query-definitions` |
| Dependências | Modelo de parâmetros de query |
| Viabilidade | Alta como definição; execução é futura |
| ADRs futuras possíveis | ADR "Dashboard Filters and Parameter Binding" |
| Encaixe com | dashboard-definitions, query-definitions, runtime bridge |

---

### 8. Contrato de connector com declaração de capacidades

| Campo | Valor |
|---|---|
| Origem/inspiração | Drivers do Metabase que declaram features suportadas |
| Descrição | `delfos-connectors` declarar capacidades (agregações, joins, paginação) que o runtime consulta antes de despachar |
| Objetivo | Evitar enviar comandos não suportados; degradar com previsibilidade |
| Impacto | Médio-alto |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `delfos-connectors` (contracts), `runtime` |
| Dependências | Contratos em `src/contracts/` |
| Viabilidade | Alta como contrato declarativo |
| ADRs futuras possíveis | Extensão da ADR-0008 e ADR-0022 |
| Encaixe com | connectors, runtime bridge, execution requests |

---

### 9. Resumo de gráfico em linguagem natural ("one-click summary")

| Campo | Valor |
|---|---|
| Origem/inspiração | One-click summaries do Metabot |
| Descrição | Gerar um texto explicativo do que um widget/dashboard mostra, via LLM, sob demanda |
| Objetivo | Acessibilidade de leitura e redução de erro de interpretação |
| Impacto | Médio-alto na percepção de valor |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | web (presentation), serviço de geração de texto futuro |
| Dependências | ADR-0025; dados de resultado disponíveis |
| Viabilidade | Média — alinhado ao ADR-0025 |
| ADRs futuras possíveis | Implementação concreta sob ADR-0025 |
| Encaixe com | dashboard-definitions, AI assistant futuro |

---

### 10. Auditoria de uso transformada em insight de produto

| Campo | Valor |
|---|---|
| Origem/inspiração | Auditing tools do Metabase Enterprise |
| Descrição | Usar o módulo `audit` para expor dashboards/queries mais usados, abandonados e lentos |
| Objetivo | Governança ativa e priorização baseada em uso real |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Baixa-média |
| Maturidade | `Research` |
| Módulos impactados | `audit`, `dashboard-definitions`, `query-definitions` |
| Dependências | Trilha de auditoria já existente (ADR-0018) |
| Viabilidade | Alta — dados já são coletados |
| ADRs futuras possíveis | ADR leve "Usage Analytics over Audit Trail" |
| Encaixe com | audit, dashboard-definitions, query-definitions |

---

### 11. Subscriptions e alerts orientados a condição

| Campo | Valor |
|---|---|
| Origem/inspiração | Subscriptions (agendado) e Alerts (por condição) do Metabase |
| Descrição | Distribuição agendada de dashboards e disparo por cruzamento de meta |
| Objetivo | Levar o dado ao usuário sem login; antecipar eventos relevantes |
| Impacto | Alto |
| Prioridade | Baixa (depende de infraestrutura ausente) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `runtime`, novo módulo de scheduling, `report-definitions` |
| Dependências | Scheduler/fila/worker — inexistentes na fase atual (ver ADR-0007) |
| Viabilidade | Baixa agora; conceitual para Fase 2 |
| ADRs futuras possíveis | ADR "Scheduling, Subscriptions and Alerts" |
| Encaixe com | report-definitions, runtime bridge, execution requests |

---

### 12. Serialization — BI como código (export/import de definições)

| Campo | Valor |
|---|---|
| Origem/inspiração | Serialization do Metabase Enterprise |
| Descrição | Export/import versionável de definições (datasets, queries, dashboards) entre ambientes |
| Objetivo | Promover dashboards de staging para produção; backup; templates de tenant |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `query-definitions`, `dashboard-definitions`, `report-definitions` |
| Dependências | Definições já são declarativas — fundação favorável |
| Viabilidade | Alta — tudo já é configuração declarativa |
| ADRs futuras possíveis | ADR "Definition Serialization and Environment Promotion" |
| Encaixe com | datasets, query-definitions, dashboard-definitions, report-definitions |

---

## Priorização sugerida

| Prioridade | Ideias |
|---|---|
| Alta | 1 (Query IR), 3 (Semantic layer), 7 (Filtros globais) |
| Média | 2, 4, 5, 6, 8, 9, 10, 12 |
| Baixa | 11 (depende de infraestrutura ausente) |

As ideias 1 e 3 são pré-requisitos conceituais de várias outras — recomenda-se tratá-las
primeiro em ADRs antes de qualquer evolução de execução.

---

## Ver também — roadmaps consolidados

Esta análise de Metabase é sintetizada, junto com a dos demais produtos,
nos documentos consolidados de `references/consolidated/`. Os roadmaps
temáticos abaixo agregam diretamente as ideias deste produto:

- [`../consolidated/ai-assistant-roadmap.md`](../consolidated/ai-assistant-roadmap.md) — roadmap de IA aplicada a analytics
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
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [../maturity-taxonomy.md](../maturity-taxonomy.md) — taxonomia de maturidade aplicada às ideias
