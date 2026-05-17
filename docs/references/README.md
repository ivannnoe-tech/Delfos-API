# Referências Estratégicas — Delfos Analytics

> Tipo: índice de referências estratégicas · Status: conceitual/futuro — não autoriza implementação

Camada de inteligência de produto do Delfos Analytics. Reúne estudo aprofundado de
**10 aplicações open-source** de BI / Analytics / AI, usadas como **inspiração estratégica**
para a evolução futura do produto.

---

## Propósito e limites

Este material é **documentação estratégica**, não especificação de implementação.

- **NÃO** copia código, **NÃO** clona telas, **NÃO** replica arquitetura dos produtos estudados.
- Estuda ideias de UX, conceitos, padrões enterprise, funcionalidades premium, arquitetura
  modular, fluxos de usuário, governança, IA aplicada, semantic layer, embedded analytics,
  dashboard/query builders, connectors, runtime e AI copilots.
- Todo arquivo carrega o status `conceitual/futuro` — **nenhum documento aqui autoriza
  implementação**. Implementação de qualquer item exige escopo explícito e, quando aplicável,
  uma ADR aprovada.

Consistente com `CLAUDE.md`, `AGENTS.md`, `docs/` e as ADRs em `docs/adr/`.

A governança desta camada — objetivo, proibição de copiar código, uso conceitual,
como usar/evoluir os docs e como novas referências entram — é definida por
[`ADR-0026`](../adr/adr-0026-strategic-reference-library.md).

Cada ideia, módulo futuro e item de roadmap é rotulado com um estágio da
[`taxonomia de maturidade`](./maturity-taxonomy.md) (`Idea` → `Research` → … →
`Production`) — eixo independente de prioridade e de fase.

---

## Como navegar

- **Quero estudar um produto** → abra a pasta do produto e comece por `overview.md`.
- **Quero ideias aplicáveis ao Delfos** → leia os `ideas-for-delfos.md` (parte mais importante
  de cada produto) ou os roadmaps em `consolidated/`.
- **Quero a visão de produto de alto nível** → `consolidated/strategic-product-vision.md`.
- **Quero saber o que evitar** → os `anti-patterns.md` de cada produto.

---

## Produtos estudados

| # | Produto | Categoria | Foco principal do estudo | Pasta |
|---|---|---|---|---|
| 1 | Metabase | BI self-service | Query IR declarativo, drill-through, X-rays, embedding | [`metabase/`](./metabase/overview.md) |
| 2 | Apache Superset | BI / exploração | Datasets como semantic layer leve, filtros nativos, viz | [`superset/`](./superset/overview.md) |
| 3 | Chartbrew | BI / client reporting | Variáveis, filtros auto-vinculados, templates | [`chartbrew/`](./chartbrew/overview.md) |
| 4 | Cube | Headless BI / semantic layer | Camada semântica declarativa, embedded analytics | [`cube/`](./cube/overview.md) |
| 5 | Airbyte | Integração de dados (ELT) | Connectors declarativos, protocolo versionado, execução | [`airbyte/`](./airbyte/overview.md) |
| 6 | WrenAI | GenBI / text-to-SQL | AI copilot fundamentado, semantic layer MDL, explainability | [`wren-ai/`](./wren-ai/overview.md) |
| 7 | Vanna AI | Framework text-to-SQL (RAG) | Knowledge base treinável, NL→query auditável | [`vanna/`](./vanna/overview.md) |
| 8 | Lightdash | BI sobre dbt | Semantic layer versionada, validação de integridade | [`lightdash/`](./lightdash/overview.md) |
| 9 | Evidence | BI-as-code | Definições versionáveis, templated definitions, narrativa | [`evidence/`](./evidence/overview.md) |
| 10 | NocoBase | Plataforma no-code/low-code | Arquitetura de plugins, blocks, ACL field-level | [`nocobase/`](./nocobase/overview.md) |

---

## Estrutura por produto

Cada pasta de produto contém 6 arquivos com seções padronizadas — mesma estrutura nos 10
produtos, para leitura comparável e navegável por agentes.

| Arquivo | Conteúdo |
|---|---|
| `overview.md` | Resumo, objetivo, público-alvo, diferencial, stack, fortes/fracos, o que (não) estudar |
| `architecture.md` | Modularização, runtime, plugins, connectors, semantic layer, tenancy, IA, orquestração |
| `ux-patterns.md` | Dashboard/builder UX, filtros, drill-down, navegação, estados, interação |
| `premium-features.md` | Features premium/enterprise, IA, colaboração, observability, alerts, sharing |
| `ideas-for-delfos.md` | **Catálogo de ideias aplicáveis ao Delfos** — a parte mais importante |
| `anti-patterns.md` | Problemas, UX ruim, complexidade excessiva, decisões a não reproduzir |

### Atalhos diretos por produto

| Produto | overview | architecture | ux-patterns | premium-features | ideas-for-delfos | anti-patterns |
|---|---|---|---|---|---|---|
| Metabase | [↗](./metabase/overview.md) | [↗](./metabase/architecture.md) | [↗](./metabase/ux-patterns.md) | [↗](./metabase/premium-features.md) | [↗](./metabase/ideas-for-delfos.md) | [↗](./metabase/anti-patterns.md) |
| Superset | [↗](./superset/overview.md) | [↗](./superset/architecture.md) | [↗](./superset/ux-patterns.md) | [↗](./superset/premium-features.md) | [↗](./superset/ideas-for-delfos.md) | [↗](./superset/anti-patterns.md) |
| Chartbrew | [↗](./chartbrew/overview.md) | [↗](./chartbrew/architecture.md) | [↗](./chartbrew/ux-patterns.md) | [↗](./chartbrew/premium-features.md) | [↗](./chartbrew/ideas-for-delfos.md) | [↗](./chartbrew/anti-patterns.md) |
| Cube | [↗](./cube/overview.md) | [↗](./cube/architecture.md) | [↗](./cube/ux-patterns.md) | [↗](./cube/premium-features.md) | [↗](./cube/ideas-for-delfos.md) | [↗](./cube/anti-patterns.md) |
| Airbyte | [↗](./airbyte/overview.md) | [↗](./airbyte/architecture.md) | [↗](./airbyte/ux-patterns.md) | [↗](./airbyte/premium-features.md) | [↗](./airbyte/ideas-for-delfos.md) | [↗](./airbyte/anti-patterns.md) |
| WrenAI | [↗](./wren-ai/overview.md) | [↗](./wren-ai/architecture.md) | [↗](./wren-ai/ux-patterns.md) | [↗](./wren-ai/premium-features.md) | [↗](./wren-ai/ideas-for-delfos.md) | [↗](./wren-ai/anti-patterns.md) |
| Vanna AI | [↗](./vanna/overview.md) | [↗](./vanna/architecture.md) | [↗](./vanna/ux-patterns.md) | [↗](./vanna/premium-features.md) | [↗](./vanna/ideas-for-delfos.md) | [↗](./vanna/anti-patterns.md) |
| Lightdash | [↗](./lightdash/overview.md) | [↗](./lightdash/architecture.md) | [↗](./lightdash/ux-patterns.md) | [↗](./lightdash/premium-features.md) | [↗](./lightdash/ideas-for-delfos.md) | [↗](./lightdash/anti-patterns.md) |
| Evidence | [↗](./evidence/overview.md) | [↗](./evidence/architecture.md) | [↗](./evidence/ux-patterns.md) | [↗](./evidence/premium-features.md) | [↗](./evidence/ideas-for-delfos.md) | [↗](./evidence/anti-patterns.md) |
| NocoBase | [↗](./nocobase/overview.md) | [↗](./nocobase/architecture.md) | [↗](./nocobase/ux-patterns.md) | [↗](./nocobase/premium-features.md) | [↗](./nocobase/ideas-for-delfos.md) | [↗](./nocobase/anti-patterns.md) |

---

## Documentos consolidados

A pasta [`consolidated/`](./consolidated/) sintetiza as 60 análises de produto em roadmaps
temáticos e visão de produto. É a leitura recomendada para decisão estratégica.

| Documento | Conteúdo |
|---|---|
| [`strategic-product-vision.md`](./consolidated/strategic-product-vision.md) | **Topo da pirâmide** — posicionamento, temas transversais, horizontes de evolução |
| [`priority-matrix.md`](./consolidated/priority-matrix.md) | **Matriz de prioridade consolidada** — features × impacto/fase/gate/viabilidade |
| [`product-differentiators.md`](./consolidated/product-differentiators.md) | Diferenciais competitivos do Delfos × lacunas dos concorrentes |
| [`future-modules-catalog.md`](./consolidated/future-modules-catalog.md) | Catálogo de possíveis módulos futuros derivados do estudo |
| [`semantic-layer-roadmap.md`](./consolidated/semantic-layer-roadmap.md) | Roadmap da camada semântica futura |
| [`ai-assistant-roadmap.md`](./consolidated/ai-assistant-roadmap.md) | Roadmap de IA aplicada a analytics (gated por ADR-0025) |
| [`dashboard-builder-roadmap.md`](./consolidated/dashboard-builder-roadmap.md) | Roadmap de dashboard e query builder |
| [`connectors-roadmap.md`](./consolidated/connectors-roadmap.md) | Roadmap de connectors e execução |
| [`embedded-analytics-roadmap.md`](./consolidated/embedded-analytics-roadmap.md) | Roadmap de embedded analytics |
| [`premium-ux-roadmap.md`](./consolidated/premium-ux-roadmap.md) | Roadmap de UX premium |
| [`enterprise-governance-roadmap.md`](./consolidated/enterprise-governance-roadmap.md) | Roadmap de governança enterprise |

---

## Temas transversais

O estudo revelou seis temas convergentes entre os 10 produtos, que formam a espinha dorsal
dos documentos consolidados:

1. **Camada semântica declarativa** — convergência mais forte (Cube, Lightdash, WrenAI,
   Superset, Metabase). Maior aposta arquitetural candidata do Delfos.
2. **IA fundamentada e auditável** — a IA propõe `query-definition` declarativa, o humano
   valida, a IA nunca executa direto; sempre *grounded* na semantic layer. Gated por ADR-0025.
3. **Definições como artefatos versionáveis** — diff, rollback, validação de integridade,
   templated definitions.
4. **Connectors declarativos com protocolo versionado** — o connector spec dirige a UI;
   command envelope; execução como entidade de primeira classe. Futuro, gated por ADR-0021/0022.
5. **Governança nativa** — `tenantId` derivado por security context, RBAC, field-level
   masking, certificação/ownership, auditoria como insight.
6. **UX premium declarativa** — filtros globais, cross-filtering, drill-down, click behavior,
   estados ricos, onboarding guiado.

---

## Relacionado

- [`../roadmap.md`](../roadmap.md) — roadmap vivo do Delfos
- [`../phase-2-vision.md`](../phase-2-vision.md) — visão da Fase 2
- [`../delfos-prd.md`](../delfos-prd.md) — PRD do produto
- [`../architecture.md`](../architecture.md) — arquitetura atual do `delfos-api`
- [`maturity-taxonomy.md`](./maturity-taxonomy.md) — taxonomia de maturidade aplicada na camada
- [`source-register.md`](./source-register.md) — registro de fontes e licenças (auditoria)
- [`consolidated/priority-matrix.md`](./consolidated/priority-matrix.md) — matriz de prioridade consolidada
- [`../adr/`](../adr/) — Architecture Decision Records
- [`../adr/adr-0026-strategic-reference-library.md`](../adr/adr-0026-strategic-reference-library.md) — governança desta camada
