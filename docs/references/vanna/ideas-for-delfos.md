# Vanna AI — Ideias Aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: Vanna AI · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este catálogo

Cada ideia abaixo é uma destilação de um padrão do Vanna AI **reinterpretado para o modelo declarativo do Delfos**. Nenhuma autoriza implementação: várias dependem de ADRs ainda em estado *Proposed* (ADR-0025) ou de fases futuras. O Delfos não executa SQL contra o banco do cliente — onde o Vanna geraria SQL, o Delfos deve gerar/ajustar uma **`query-definition` declarativa, sugerida e auditável**, executada apenas pelo `runtime`/`connectors` futuro.

Prioridade e complexidade são estimativas estratégicas, não compromissos de roadmap.

---

### 1. Knowledge base tripartite por tenant (DDL + documentação + exemplos)

| Campo | Valor |
|---|---|
| Origem/inspiração | Modelo de treino do Vanna: schema + documentação + pares pergunta→SQL |
| Descrição | Catálogo de conhecimento por tenant que reúne metadados de datasets, glossário de negócio e exemplos de `query-definitions` validadas |
| Objetivo | Dar contexto estruturado e curado para qualquer assistente de IA futuro e para onboarding humano |
| Impacto | Alto — base de toda funcionalidade de IA e de descoberta de dados |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions`, novo módulo de knowledge/glossary |
| Dependências | Modelo de dados de glossário; decisão de armazenamento (Mongo vs. vector store futuro) |
| Viabilidade | Alta como dado declarativo; recuperação semântica é fase posterior |
| ADRs futuras possíveis | ADR de "knowledge base / business glossary"; revisão do ADR-0007 se exigir vector store |
| Encaixe | datasets, field-mappings, query-definitions, semantic layer futura, AI assistant futuro |

---

### 2. Assistente NL→query-definition (não NL→SQL)

| Campo | Valor |
|---|---|
| Origem/inspiração | `vn.ask()` — pergunta em linguagem natural vira consulta |
| Descrição | Copiloto que recebe pergunta em PT-BR e propõe uma `query-definition` declarativa preenchida, jamais SQL executado direto |
| Objetivo | Reduzir a barreira de criação de consultas para usuários de negócio |
| Impacto | Alto — diferencial de produto |
| Prioridade | Média |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, `execution-preview`, integração LLM |
| Dependências | Ideia 1 (knowledge base); ADR-0025 aprovado; provedor LLM definido |
| Viabilidade | Média — depende de gate de Fase 2 e governança de IA |
| ADRs futuras possíveis | Extensão do ADR-0025; ADR de "AI-assisted query authoring" |
| Encaixe | query-definitions, execution requests, AI assistant futuro, semantic layer futura |

---

### 3. Explainability de proveniência em sugestões de IA

| Campo | Valor |
|---|---|
| Origem/inspiração | RAG do Vanna expõe quais contextos sustentaram a resposta |
| Descrição | Toda sugestão de IA acompanha "por que" — quais datasets, field-mappings e exemplos foram usados como base |
| Objetivo | Confiança, auditabilidade e capacidade de correção humana |
| Impacto | Alto — pré-requisito de confiança em IA |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `audit`, `query-definitions`, integração LLM |
| Dependências | Ideia 2; modelo de payload de proveniência |
| Viabilidade | Alta — é metadado, não execução |
| ADRs futuras possíveis | ADR de "AI explainability and provenance" |
| Encaixe | query-definitions, semantic layer futura, AI assistant futuro |

---

### 4. Loop de validação humana que realimenta o conhecimento

| Campo | Valor |
|---|---|
| Origem/inspiração | Auto-training do Vanna: respostas validadas viram material de recuperação |
| Descrição | Quando um humano aprova/corrige uma `query-definition` sugerida, ela é marcada como exemplo confiável da knowledge base |
| Objetivo | Melhoria contínua e governada da qualidade das sugestões |
| Impacto | Médio-Alto — composto ao longo do tempo |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, knowledge base (Ideia 1), `audit` |
| Dependências | Ideias 1 e 2; fluxo de aprovação |
| Viabilidade | Média |
| ADRs futuras possíveis | ADR de "human-in-the-loop curation" |
| Encaixe | query-definitions, semantic layer futura, AI assistant futuro |

---

### 5. Semantic layer estruturado de métricas

| Campo | Valor |
|---|---|
| Origem/inspiração | Lacuna do Vanna — significado de métricas vive em prosa solta |
| Descrição | Definições de métricas/dimensões versionadas e validáveis, sobre `field-mappings`, em vez de documentação textual livre |
| Objetivo | Consistência de interpretação entre dashboards, queries e IA |
| Impacto | Alto — corrige uma fraqueza estrutural do Vanna |
| Prioridade | Média |
| Complexidade | Alta |
| Maturidade | `Research` |
| Módulos impactados | `field-mappings`, `query-definitions`, `dashboard-definitions` |
| Dependências | Modelagem de métricas; governança de versionamento |
| Viabilidade | Média — esforço de modelagem relevante |
| ADRs futuras possíveis | ADR de "semantic layer / metric definitions" |
| Encaixe | field-mappings, query-definitions, dashboard-definitions, semantic layer futura |

---

### 6. Resposta multimodal: tabela + gráfico + resumo

| Campo | Valor |
|---|---|
| Origem/inspiração | Vanna entrega resultado como tabela, gráfico Plotly e resumo NL |
| Descrição | Resultado de uma `query-definition` apresentado em três formas, com resumo NL gerado por IA |
| Objetivo | Acessibilidade para perfis técnicos e não técnicos |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `execution-preview`, `runtime`; `delfos-web` (`chart_renderer`) |
| Dependências | ADR-0025 (resumo NL); `chart_renderer` |
| Viabilidade | Alta para tabela/gráfico; resumo NL depende de gate de IA |
| ADRs futuras possíveis | Extensão do ADR-0025 |
| Encaixe | dashboard-definitions, runtime bridge, execution requests, AI assistant futuro |

---

### 7. Streaming incremental de resultados

| Campo | Valor |
|---|---|
| Origem/inspiração | Vanna 2.0 streama tabela/gráfico/resumo progressivamente |
| Descrição | Resultados de execução entregues em partes, melhorando percepção de velocidade no `DelfosLoadingState` |
| Objetivo | UX mais fluida em consultas longas |
| Impacto | Médio |
| Prioridade | Baixa |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `runtime`, `execution-preview`; `delfos-web` |
| Dependências | Modelo de transporte de execução (ADR-0015) |
| Viabilidade | Média — depende de runtime real (Fase 2) |
| ADRs futuras possíveis | ADR de "streaming execution results" |
| Encaixe | runtime bridge, execution requests |

---

### 8. Observability e cost tracking de IA

| Campo | Valor |
|---|---|
| Origem/inspiração | LLM middlewares e observability do Vanna 2.0 |
| Descrição | Camada que registra latência, custo e uso de chamadas LLM por tenant/ator antes de qualquer IA em produção |
| Objetivo | Operar IA sem surpresas de custo; visibilidade operacional |
| Impacto | Alto — pré-requisito operacional de qualquer feature de IA |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `audit`, integração LLM, novo módulo de telemetria |
| Dependências | Provedor LLM definido; ADR-0025 |
| Viabilidade | Alta |
| ADRs futuras possíveis | ADR de "AI observability and cost governance" |
| Encaixe | execution requests, AI assistant futuro |

---

### 9. Quota e rate limiting para IA via hooks

| Campo | Valor |
|---|---|
| Origem/inspiração | Lifecycle hooks do Vanna 2.0 (quota checking) |
| Descrição | Pontos de interceptação que aplicam limites de uso de IA por tenant/role |
| Objetivo | Conter custo e abuso; viabilizar planos diferenciados |
| Impacto | Médio |
| Prioridade | Baixa |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `core` (interceptors), integração LLM, `tenants` |
| Dependências | Ideia 8; modelo de planos/limites |
| Viabilidade | Média |
| ADRs futuras possíveis | ADR de "AI usage quotas" |
| Encaixe | execution requests, AI assistant futuro |

---

### 10. Drill-down conversacional com contexto

| Campo | Valor |
|---|---|
| Origem/inspiração | Perguntas de acompanhamento do Vanna herdam contexto da conversa |
| Descrição | Sobre um resultado, o usuário pede refinamentos em PT-BR e o assistente ajusta a `query-definition` mantendo o contexto |
| Objetivo | Exploração iterativa de dados sem reconstruir consultas |
| Impacto | Médio |
| Prioridade | Baixa |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, integração LLM; `delfos-web` |
| Dependências | Ideias 2 e 3; armazenamento de contexto de sessão |
| Viabilidade | Baixa-Média — depende de IA madura |
| ADRs futuras possíveis | ADR de "conversational drill-down" |
| Encaixe | query-definitions, dashboard-definitions, AI assistant futuro |

---

### 11. Sugestão de field-mappings assistida por IA

| Campo | Valor |
|---|---|
| Origem/inspiração | Vanna infere semântica de schema a partir de DDL + documentação |
| Descrição | Ao registrar um `dataset`, a IA propõe `field-mappings` iniciais (nomes amigáveis, tipos, possíveis dimensões/métricas) para revisão humana |
| Objetivo | Acelerar o onboarding de novas fontes de dados |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `datasets`, `field-mappings`, integração LLM |
| Dependências | Ideia 1; ADR-0025 |
| Viabilidade | Média |
| ADRs futuras possíveis | ADR de "AI-assisted field mapping" |
| Encaixe | datasets, field-mappings, semantic layer futura, AI assistant futuro |

---

### 12. Galeria de query-definitions validadas (templates)

| Campo | Valor |
|---|---|
| Origem/inspiração | Pares pergunta→SQL do Vanna como templates implícitos — mas curados |
| Descrição | Catálogo curado e versionado de `query-definitions` validadas, reutilizáveis como ponto de partida por tenant |
| Objetivo | Reuso, padronização e aceleração da criação de análises |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `dashboard-definitions` |
| Dependências | Modelo de versionamento e visibilidade |
| Viabilidade | Alta — é dado declarativo |
| ADRs futuras possíveis | ADR de "query template catalog" |
| Encaixe | query-definitions, dashboard-definitions, semantic layer futura |

---

## Leitura de prioridade

| Prioridade | Ideias |
|---|---|
| Alta | 1 (knowledge base), 3 (explainability), 8 (observability de IA) |
| Média | 2, 4, 5, 6, 11, 12 |
| Baixa | 7, 9, 10 |

As ideias de prioridade alta são **fundações declarativas** — viáveis sem execução real e que habilitam todo o resto. As de prioridade média/baixa dependem do gate de Fase 2 e de ADRs de IA aprovados.

---

## Ver também — roadmaps consolidados

Esta análise de Vanna é sintetizada, junto com a dos demais produtos,
nos documentos consolidados de `references/consolidated/`. Os roadmaps
temáticos abaixo agregam diretamente as ideias deste produto:

- [`../consolidated/ai-assistant-roadmap.md`](../consolidated/ai-assistant-roadmap.md) — roadmap de IA aplicada a analytics
- [`../consolidated/enterprise-governance-roadmap.md`](../consolidated/enterprise-governance-roadmap.md) — roadmap de governança enterprise

Além desses, todos os produtos alimentam os consolidados de visão e síntese:

- [`../consolidated/strategic-product-vision.md`](../consolidated/strategic-product-vision.md) — visão estratégica de produto
- [`../consolidated/product-differentiators.md`](../consolidated/product-differentiators.md) — diferenciais competitivos
- [`../consolidated/future-modules-catalog.md`](../consolidated/future-modules-catalog.md) — catálogo de módulos futuros
- [`../consolidated/priority-matrix.md`](../consolidated/priority-matrix.md) — matriz de prioridade consolidada

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0025 — LLM-assisted analytics text generation](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [ADR-0024 — Phase 1 and Phase 2 definition](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [ADR-0007 — No cache/Redis Phase 1](../../adr/adr-0007-no-cache-redis-phase-1.md)
- [ADR-0014 — Runtime execution requests foundation](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [Taxonomia de maturidade](../maturity-taxonomy.md)
