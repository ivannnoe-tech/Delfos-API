# Catálogo de Módulos Futuros do Delfos

> Tipo: visão estratégica consolidada · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este catálogo

Este documento deriva, do estudo dos 10 produtos open-source de BI/Analytics/AI,
um conjunto de **módulos futuros candidatos** para o `delfos-api` (e, quando
aplicável, contrapartes em `delfos-web` e `delfos-connectors`).

Cada módulo é apresentado como ficha conceitual. **Nenhum está autorizado.** O
Delfos hoje tem apenas a foundation declarativa (`health`, `auth`, `audit`,
`tenants`, `users`, `connections`, `credentials`, `datasets`, `field-mappings`,
`query-definitions`, `dashboard-definitions`, `report-definitions`, `runtime`,
`execution-preview`). Qualquer módulo abaixo exige ADR aprovada e autorização
explícita antes de qualquer código.

Convenções de fase:

- **Curto prazo declarativo** — extensível na foundation atual, sem execução
  real, geralmente só novo schema/contrato.
- **Fase 2** — depende de runtime real, ingestão, cache ou dispatch
  (`adr-0021`/`adr-0022`/`adr-0024` e `phase-2-vision.md`).
- **Visão madura** — horizonte longo, depende de Fase 2 consolidada.

---

## 1. semantic-layer

| Campo | Conteúdo |
|---|---|
| Propósito | Formalizar measures, dimensions, entidades de negócio e relacionamentos como camada semântica declarativa de primeira classe, separada das `query-definitions` que a consomem. |
| Inspiração | cube (cubes/views/measures), lightdash (Explores), wren-ai (MDL), superset (datasets como semantic layer), metabase (MBQL). |
| Módulos atuais relacionados | `datasets`, `field-mappings`, `query-definitions`, `dashboard-definitions`. |
| Dependências | Modelo de `datasets`/`field-mappings` estável; modelo de versionamento de definições. |
| Fase estimada | Curto prazo declarativo (modelo); maturidade plena na Fase 2. |
| ADRs futuras | "Semantic layer declarativa", "Measure/dimension catalog"; revisão de `adr-0024`. |
| Status | Conceitual. |

## 2. ai-assistant

| Campo | Conteúdo |
|---|---|
| Propósito | Traduzir intenção em linguagem natural em uma `query-definition` declarativa válida, fundamentada na camada semântica do tenant; a IA propõe, o humano valida, a IA nunca executa. |
| Inspiração | wren-ai (GenBI grounded), vanna (RAG knowledge base), metabase (Metabot), chartbrew (AI orchestrator), cube (Copilot/Semantic SQL). |
| Módulos atuais relacionados | `query-definitions`, `field-mappings`, `datasets`, `audit`. |
| Dependências | `semantic-layer` maduro; provedor de LLM definido; `definition-versioning`. |
| Fase estimada | Fase 2+ (gated). |
| ADRs futuras | `adr-0025` (base) + "AI assistant grounding and isolation". |
| Status | Conceitual — gated por `adr-0025`. |

## 3. connector-registry

| Campo | Conteúdo |
|---|---|
| Propósito | Catálogo de connector specs declarativos versionados; o spec dirige a UI de configuração e o command envelope; protocolo versionado entre `delfos-api` e `delfos-connectors`. |
| Inspiração | airbyte (connector spec, CDK, protocolo versionado), nocobase (catálogo unificado de fontes). |
| Módulos atuais relacionados | `connections`, `credentials`, `runtime`, `execution-preview`. |
| Dependências | `delfos-connectors` skeleton; decisão de transporte de dispatch. |
| Fase estimada | Fase 2 (gated). |
| ADRs futuras | Extensão de `adr-0008`, `adr-0021`, `adr-0022`; "Connector spec registry". |
| Status | Conceitual — gated por `adr-0021`/`adr-0022`. |

## 4. definition-versioning

| Campo | Conteúdo |
|---|---|
| Propósito | Versionar definições (query, dashboard, report, semânticas) como artefatos: histórico, diff, rollback e validação de integridade nativos no produto. |
| Inspiração | evidence (BI-as-code, diff), lightdash (versionamento/rollback de definições), airbyte (protocolo versionado). |
| Módulos atuais relacionados | `query-definitions`, `dashboard-definitions`, `report-definitions`, `audit`. |
| Dependências | Modelo de identidade estável das definições. |
| Fase estimada | Curto prazo declarativo. |
| ADRs futuras | "Definition versioning and rollback". |
| Status | Conceitual. |

## 5. template-catalog

| Campo | Conteúdo |
|---|---|
| Propósito | Biblioteca de templates declarativos de `query-definitions`, dashboards e relatórios, instanciáveis por tenant com parâmetros — acelera onboarding e padroniza análises comuns. |
| Inspiração | chartbrew (templates de dashboard), wren-ai (macro functions), evidence (templated pages). |
| Módulos atuais relacionados | `query-definitions`, `dashboard-definitions`, `report-definitions`, `tenants`. |
| Dependências | Modelo de parametrização de definições; `definition-versioning`. |
| Fase estimada | Curto prazo declarativo. |
| ADRs futuras | "Definition templates and instantiation". |
| Status | Conceitual. |

## 6. embed-gateway

| Campo | Conteúdo |
|---|---|
| Propósito | Servir dashboards/relatórios embarcados com escopo verificado de tenant/actor, tokens de acesso escopados e contexto de segurança herdado. |
| Inspiração | metabase (embedding), chartbrew (embedding escopado), cube (embedded analytics + security context). |
| Módulos atuais relacionados | `auth`, `tenants`, `users`, `dashboard-definitions`, `report-definitions`. |
| Dependências | Auth real (`adr-0006` JWT, futuro); security context; `report-runtime`. |
| Fase estimada | Fase 2+. |
| ADRs futuras | "Embedded analytics gateway"; depende de `adr-0006`. |
| Status | Conceitual. |

## 7. usage-analytics

| Campo | Conteúdo |
|---|---|
| Propósito | Transformar auditoria em insight: quais definições são usadas, por quem, com que frequência; detectar definições órfãs, métricas duplicadas, gargalos. |
| Inspiração | metabase (auditoria de uso como insight), superset (catálogo + ownership). |
| Módulos atuais relacionados | `audit`, `query-definitions`, `dashboard-definitions`, `users`. |
| Dependências | `audit` consolidado; volume de eventos relevante. |
| Fase estimada | Curto prazo declarativo (leitura de `audit`); aprofundamento na Fase 2. |
| ADRs futuras | Extensão de `adr-0018`; "Usage analytics from audit". |
| Status | Conceitual. |

## 8. observability

| Campo | Conteúdo |
|---|---|
| Propósito | Observabilidade da plataforma e, no futuro, da IA: rastrear propostas de LLM, latência, custo, taxa de aceitação, validações dry-plan; métricas operacionais. |
| Inspiração | vanna (observability de LLM), wren-ai (explainability), airbyte (execução como entidade observável). |
| Módulos atuais relacionados | `audit`, `runtime`, `execution-preview`, futuro `ai-assistant`. |
| Dependências | `ai-assistant` (para observabilidade de IA); runtime real (para métricas de execução). |
| Fase estimada | Fase 2+. |
| ADRs futuras | "Platform and AI observability". |
| Status | Conceitual. |

## 9. consumption-views

| Campo | Conteúdo |
|---|---|
| Propósito | Fachadas de consumo sobre `datasets`: a view expõe só o subconjunto relevante a um caso de uso, com joins já resolvidos, escondendo a complexidade do dataset. |
| Inspiração | cube (cube vs. view), lightdash (Explores), superset (datasets). |
| Módulos atuais relacionados | `datasets`, `query-definitions`, `dashboard-definitions`. |
| Dependências | `semantic-layer`. |
| Fase estimada | Curto prazo declarativo. |
| ADRs futuras | "Consumption views sobre datasets". |
| Status | Conceitual. |

## 10. access-policy (RLAC/CLAC)

| Campo | Conteúdo |
|---|---|
| Propósito | Controle de acesso por linha e por coluna declarado na definição (dataset/field-mapping), avaliado em execução futura — governança fina dentro da fronteira de `tenantId`. |
| Inspiração | wren-ai (RLAC/CLAC), nocobase (ACL field-level), cube (queryRewrite). |
| Módulos atuais relacionados | `field-mappings`, `datasets`, `users`, `tenants`, `auth`. |
| Dependências | Modelo de roles (`adr-0017`); mascaramento (`adr-0023`). |
| Fase estimada | Curto prazo declarativo (modelo); aplicação real na Fase 2. |
| ADRs futuras | "Row/column level access control"; extensão de `adr-0017`/`adr-0023`. |
| Status | Conceitual. |

## 11. report-runtime

| Campo | Conteúdo |
|---|---|
| Propósito | Materializar `report-definitions` em saídas reais: relatórios narrativos, exports, agendamento. |
| Inspiração | evidence (relatórios narrativos, BI-as-code), chartbrew (client reporting), superset. |
| Módulos atuais relacionados | `report-definitions`, `runtime`, `dashboard-definitions`. |
| Dependências | Runtime real; fila/scheduler (Fase 2); `embed-gateway` para distribuição. |
| Fase estimada | Fase 2+. |
| ADRs futuras | "Report runtime and exports"; depende de `adr-0024`. |
| Status | Conceitual. |

## 12. knowledge-base

| Campo | Conteúdo |
|---|---|
| Propósito | Repositório por tenant de definições aprovadas e exemplos curados, base para a assistência de IA (RAG governado) — auditável e isolado por tenant. |
| Inspiração | vanna (knowledge base treinável), wren-ai (retrieval híbrido de exemplos). |
| Módulos atuais relacionados | `query-definitions`, `audit`, futuro `ai-assistant`. |
| Dependências | `ai-assistant`; decisão sobre banco vetorial (hoje vetado por `adr-0007`). |
| Fase estimada | Visão madura. |
| ADRs futuras | "Curated examples store for AI assistance". |
| Status | Conceitual. |

---

## Tabela-resumo

| Módulo | Fase estimada | Depende de | Status |
|---|---|---|---|
| semantic-layer | Curto prazo declarativo | datasets/field-mappings estáveis | Conceitual |
| definition-versioning | Curto prazo declarativo | identidade de definições | Conceitual |
| template-catalog | Curto prazo declarativo | parametrização + versioning | Conceitual |
| consumption-views | Curto prazo declarativo | semantic-layer | Conceitual |
| usage-analytics | Curto prazo declarativo | audit consolidado | Conceitual |
| access-policy | Curto prazo (modelo) / Fase 2 (aplicação) | adr-0017, adr-0023 | Conceitual |
| connector-registry | Fase 2 | delfos-connectors, dispatch | Conceitual (gated) |
| ai-assistant | Fase 2+ | semantic-layer, LLM, versioning | Conceitual (gated) |
| embed-gateway | Fase 2+ | auth real, report-runtime | Conceitual |
| report-runtime | Fase 2+ | runtime real, scheduler | Conceitual |
| observability | Fase 2+ | ai-assistant, runtime real | Conceitual |
| knowledge-base | Visão madura | ai-assistant, banco vetorial | Conceitual |

---

## Princípio de sequenciamento

Os módulos de **curto prazo declarativo** podem nascer como schema e contrato
sem violar nenhuma ADR de bloqueio — eles apenas estendem a foundation. Os
módulos de **Fase 2+** estão bloqueados por `adr-0007` (cache/Redis),
`adr-0021`/`adr-0022` (execução/dispatch) e `adr-0024` (definição de fases).

A ordem recomendada de evolução conceitual é: `semantic-layer` →
`definition-versioning` → `consumption-views`/`template-catalog` →
`usage-analytics` → (Fase 2) `connector-registry` → `report-runtime` →
`ai-assistant` → `embed-gateway`/`observability` → `knowledge-base`. A camada
semântica é a fundação de quase tudo.

---

## Relacionado

- Consolidados: [./product-differentiators.md](./product-differentiators.md) ·
  [./strategic-product-vision.md](./strategic-product-vision.md) ·
  [./semantic-layer-roadmap.md](./semantic-layer-roadmap.md) ·
  [./ai-assistant-roadmap.md](./ai-assistant-roadmap.md) ·
  [./connectors-roadmap.md](./connectors-roadmap.md) ·
  [./dashboard-builder-roadmap.md](./dashboard-builder-roadmap.md) ·
  [./embedded-analytics-roadmap.md](./embedded-analytics-roadmap.md) ·
  [./enterprise-governance-roadmap.md](./enterprise-governance-roadmap.md) ·
  [./premium-ux-roadmap.md](./premium-ux-roadmap.md)
- Produtos estudados: [../cube/ideas-for-delfos.md](../cube/ideas-for-delfos.md) ·
  [../wren-ai/ideas-for-delfos.md](../wren-ai/ideas-for-delfos.md) ·
  [../airbyte/ideas-for-delfos.md](../airbyte/ideas-for-delfos.md) ·
  [../vanna/ideas-for-delfos.md](../vanna/ideas-for-delfos.md) ·
  [../nocobase/ideas-for-delfos.md](../nocobase/ideas-for-delfos.md) ·
  [../evidence/ideas-for-delfos.md](../evidence/ideas-for-delfos.md)
- Visão e roadmap: [../../phase-2-vision.md](../../phase-2-vision.md) ·
  [../../roadmap.md](../../roadmap.md)
- ADRs: [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md) ·
  [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md) ·
  [../../adr/adr-0021-credential-decryption-in-future-execution.md](../../adr/adr-0021-credential-decryption-in-future-execution.md) ·
  [../../adr/adr-0022-connector-dispatch-transport.md](../../adr/adr-0022-connector-dispatch-transport.md) ·
  [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md) ·
  [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
