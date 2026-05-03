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

---

## Índice

| Nº | Título | Status |
|---|---|---|
| [0001](./adr-0001-phase-1-api-based-data-source.md) | Phase 1 data source: client-exposed APIs | Accepted |
| [0002](./adr-0002-no-paid-components.md) | No paid or restrictive-license components | Accepted |
| [0003](./adr-0003-chart-renderer-abstraction.md) | ChartRenderer abstraction over fl_chart + graphic | Accepted |
| [0004](./adr-0004-two-repos-strategy.md) | Two-repo strategy (delfos-api + delfos-web) | Accepted |
| [0005](./adr-0005-mongodb-as-config-store.md) | MongoDB as Delfos configuration store | Accepted |
| [0006](./adr-0006-jwt-self-managed-auth.md) | Self-managed JWT auth (no Auth0/Clerk) | Accepted |
| [0007](./adr-0007-no-cache-redis-phase-1.md) | No Redis cache in Phase 1 | Accepted |
| [0008](./adr-0008-connectors-and-integration-execution.md) | delfos-connectors and integration execution | Accepted |
| [0009](./adr-0009-deployment-isolation-and-tenant-model.md) | Deployment isolation and tenant model | Accepted |
| [0010](./adr-0010-analytics-storage-and-retention.md) | Analytics storage and retention | Accepted |
| [0011](./adr-0011-dashboard-builder-and-widget-model.md) | Dashboard builder and widget model | Accepted |
| [0012](./adr-0012-local-connectors-agent-and-on-premise-sources.md) | Local connectors agent and on-premise sources | Accepted |
| 0013 | Connectors boundary and multitenant runtime contract (vive em `delfos-connectors/docs/adr/`) | Accepted |
| [0014](./adr-0014-runtime-execution-requests-foundation.md) | Runtime execution requests foundation | Accepted |

> **Nota sobre ADR-0013**: vive no repositório `delfos-connectors`, no caminho `docs/adr/ADR-0013-connectors-boundary-and-multitenant-runtime-contract.md`. Ela complementa ADR-0008 no eixo de governança documental do `delfos-connectors` (foundation documental, contratos conceituais, fronteiras multitenant). Não supersede ADR-0008 no ponto de execução real — serviço/runtime, conectores reais, workers, filas, cache, scheduler, local agent e execução de SQL/API externa continuam fora de escopo.
