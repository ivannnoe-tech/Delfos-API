# Architecture Decision Records (ADRs)

Decisões arquiteturais relevantes do Delfos Analytics são registradas como ADRs neste diretório.

---

## O que é um ADR

Um ADR documenta **uma decisão arquitetural específica**, seu contexto, alternativas consideradas e consequências. ADRs são imutáveis: quando uma decisão é revogada, criamos um novo ADR que **superseda** o anterior, em vez de editar o original.

Use o template em [`adr-template.md`](./adr-template.md).

---

## Quando criar um ADR

Crie um ADR quando a decisão:

- altera arquitetura ou estrutura do projeto
- introduz ou substitui uma biblioteca importante
- muda a forma de autenticar, autorizar, persistir ou cachear
- afeta consumo de APIs externas (rate limit, retry, paginação, contratos)
- afeta multi-tenant, segurança ou LGPD
- adia ou antecipa uma capacidade entre as fases (Fase 1 ↔ Fase 2)

Mudanças de bug fix, refatoração local ou estilização **não** viram ADR.

---

## Convenções

- Nome do arquivo: `adr-NNNN-kebab-case-titulo.md`
- Numeração sequencial e contínua (não reaproveitar números)
- Status: `Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-XXXX`
- Datado com `YYYY-MM-DD`
- Template canônico **único**: [`adr-template.md`](./adr-template.md). O antigo
  `adr-0000-template.md` era uma cópia redundante e foi **removido** em
  2026-05-15; não há mais template duplicado.

---

## Índice

A coluna **Implementação** distingue decisão `Accepted` já construída de decisão
`Accepted` adiada ou apenas de planejamento. Valores: `implementado`, `parcial`,
`não iniciada`, `planejamento apenas`, `n/a`.

| Nº | Título | Status | Implementação |
|---|---|---|---|
| [0001](./adr-0001-phase-1-api-based-data-source.md) | Phase 1 data source: client-exposed APIs | Superseded by ADR-0032 | não iniciada |
| [0002](./adr-0002-no-paid-components.md) | No paid or restrictive-license components | Accepted | implementado |
| [0003](./adr-0003-chart-renderer-abstraction.md) | ChartRenderer abstraction over fl_chart + graphic | Accepted | implementado |
| [0004](./adr-0004-two-repos-strategy.md) | Two-repo strategy (delfos-api + delfos-web) | Accepted | implementado |
| [0005](./adr-0005-mongodb-as-config-store.md) | MongoDB as Delfos configuration store | Accepted | implementado |
| [0006](./adr-0006-jwt-self-managed-auth.md) | Self-managed JWT auth (no Auth0/Clerk) | Accepted | não iniciada |
| [0007](./adr-0007-no-cache-redis-phase-1.md) | No Redis cache in Phase 1 | Superseded by ADR-0033 | não iniciada |
| [0008](./adr-0008-connectors-and-integration-execution.md) | delfos-connectors and integration execution | Accepted | não iniciada |
| [0009](./adr-0009-deployment-isolation-and-tenant-model.md) | Deployment isolation and tenant model | Accepted | implementado |
| [0010](./adr-0010-analytics-storage-and-retention.md) | Analytics storage and retention | Accepted | parcial |
| [0011](./adr-0011-dashboard-builder-and-widget-model.md) | Dashboard builder and widget model | Accepted | parcial |
| [0012](./adr-0012-local-connectors-agent-and-on-premise-sources.md) | Local connectors agent and on-premise sources | Accepted | não iniciada |
| 0013 | Connectors boundary and multitenant runtime contract — ADR mantida em `delfos-connectors/docs/adr/` | Accepted | parcial (documentação e skeleton) |
| [0014](./adr-0014-runtime-execution-requests-foundation.md) | Runtime execution requests foundation | Accepted | parcial |
| [0015](./adr-0015-runtime-connectors-command-envelope-bridge.md) | Runtime connectors command envelope bridge | Proposed | não iniciada |
| [0016](./adr-0016-temporary-admin-key-auth.md) | Temporary admin-key authentication | Accepted | implementado |
| [0017](./adr-0017-roles-and-permissions-model.md) | Roles and permissions model | Accepted | implementado |
| [0018](./adr-0018-secure-audit-strategy.md) | Secure audit strategy | Accepted | implementado |
| [0019](./adr-0019-credential-encryption-and-rotation.md) | Credential encryption and rotation | Accepted | implementado |
| [0020](./adr-0020-metadata-sanitization-and-forbidden-fields.md) | Metadata sanitization and forbidden fields | Accepted | implementado |
| [0021](./adr-0021-credential-decryption-in-future-execution.md) | Credential decryption in future execution | Proposed | não iniciada |
| [0022](./adr-0022-connector-dispatch-transport.md) | Connector dispatch transport | Proposed | não iniciada |
| [0023](./adr-0023-data-masking-policy.md) | Data masking policy | Accepted | implementado |
| [0024](./adr-0024-phase-1-and-phase-2-definition.md) | Phase 1 and Phase 2 formal definition | Accepted | implementado |
| [0025](./adr-0025-llm-assisted-analytics-text-generation.md) | LLM-assisted analytics text generation | Accepted | planejamento apenas |
| [0026](./adr-0026-strategic-reference-library.md) | Strategic reference library (docs/references) | Accepted | implementado |
| [0027](./adr-0027-report-definitions-model.md) | Report-definitions module model | Accepted | implementado |
| [0028](./adr-0028-execution-preview-module.md) | Execution-preview module (demo) | Accepted | implementado |
| [0029](./adr-0029-field-mappings-de-para-model.md) | Field-mappings / De-Para declarative model | Accepted | implementado |
| [0030](./adr-0030-api-error-contract-and-request-context.md) | API error contract and request context | Accepted | implementado |
| [0031](./adr-0031-ci-cd-strategy.md) | CI/CD strategy | Accepted | implementado |
| [0032](./adr-0032-phase-1-data-source.md) | Phase 1 data source (supersedes ADR-0001) | Accepted | parcial |
| [0033](./adr-0033-no-cache-redis-phase-1.md) | No cache/Redis in Phase 1 (supersedes ADR-0007) | Accepted | não iniciada |
| [0034](./adr-0034-semantic-layer-foundation-declarative-model.md) | Semantic Layer Foundation (declarative model only) | Accepted | implementado |
| [0035](./adr-0035-postgresql-primary-database-and-valkey-cache.md) | PostgreSQL primary database + Valkey cache layer | Accepted | parcial (P1 em andamento) |
| [0036](./adr-0036-orm-query-layer-kysely.md) | ORM / Query Layer: Kysely (resolve subdecisão da ADR-0035) | Accepted | parcial (P1 em andamento) |

> **Nota sobre ADR-0013**: vive no repositório `delfos-connectors`, no caminho `docs/adr/ADR-0013-connectors-boundary-and-multitenant-runtime-contract.md`. Ela complementa ADR-0008 no eixo de governança documental do `delfos-connectors` (foundation documental, contratos conceituais, fronteiras multitenant). Não supersede ADR-0008 no ponto de execução real — serviço/runtime, conectores reais, workers, filas, cache, scheduler, local agent e execução de SQL/API externa continuam fora de escopo.
>
> **Eixo de runtime — ADR-0013 → ADR-0014/0015/0021/0022**: a ADR-0013 estabelece
> o contrato conceitual de fronteira e runtime multitenant dos connectors. As ADRs
> **0014** (runtime execution-requests foundation), **0015** (command envelope
> bridge), **0021** (descriptografia de credenciais em execução futura) e **0022**
> (transporte de dispatch) **estendem esse eixo de runtime** definido pela
> ADR-0013, cada uma cobrindo uma etapa do caminho até a execução real. Nenhuma
> delas autoriza execução real: 0015/0021/0022 permanecem `Proposed` e 0014 é
> apenas foundation declarativa.
>
> **Supersedências**: a ADR-0032 supersede a ADR-0001 (fonte de dados da Fase 1);
> a ADR-0033 supersede a ADR-0007 (sem cache/Redis na Fase 1). Os ADRs antigos
> são mantidos como registro histórico, com `Status: Superseded`.
>
> **ADR-0035 — banco PostgreSQL + cache Valkey**: a **ADR-0035** registra a
> decisão arquitetural de adotar **PostgreSQL** como primary database futuro e
> **Valkey** como cache layer futuro, com a deprecação gradual do
> MongoDB/Mongoose. É uma decisão `Accepted` mas com implementação `não
> iniciada` — é **docs-only** e não autoriza migração, instalação de
> dependências, schema PostgreSQL, runtime Valkey nem remoção do MongoDB. A
> ADR-0035 **não supersede a ADR-0005 de imediato**: a ADR-0005 (MongoDB como
> config store) permanece `Accepted`/`implementado` enquanto o MongoDB for o
> banco em uso e só passará a `Superseded by ADR-0035` quando a fase de remoção
> do MongoDB (P5 do plano de migração) for concluída. A ADR-0035 **não altera o
> status da ADR-0021 nem da ADR-0022**: descriptografia real e dispatch real
> continuam bloqueados, e Valkey não autoriza fila/worker/dispatch/runtime real.
> Em relação ao modelo de fases (ADR-0024): a migração ocorre na transição para
> a **Fase 2** e respeita os gates; a **Fase 1** permanece declarativa e em
> MongoDB até a migração. Plano faseado em
> `docs/postgresql-migration-plan.md`; modelo relacional em
> `docs/postgresql-data-model-draft.md`; uso futuro do cache em
> `docs/valkey-cache-plan.md`.
>
> **Decisão de ORM resolvida — ADR-0036 (Kysely)**: a escolha de **ORM / query
> layer** foi a subdecisão registrada pela ADR-0035. Foi **resolvida na fase P1**
> por spike comparativo runnable (Kysely 43, Drizzle 42, Prisma 37 em PostgreSQL
> real) e formalizada na **ADR-0036 — Kysely**. `docs/runtime-query-layer-decision.md`
> reflete o status `decidido (Kysely)`.
>
> **Lacunas conhecidas**: os módulos `tenants` e `users` não possuem ADR
> dedicada. Ambos são foundation implementada e estável; uma ADR futura pode
> formalizar decisões de modelo de tenant (single-org vs. multi-org) e de
> gestão de usuários quando houver escopo explícito.
