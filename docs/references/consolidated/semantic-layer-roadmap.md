# Roadmap consolidado — Camada Semântica futura do Delfos

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Propósito

Este documento sintetiza os modelos de camada semântica de **Cube, Lightdash,
WrenAI e Superset**, propondo a evolução conceitual da camada semântica do Delfos.

O Delfos hoje possui apenas as fundações declarativas — `datasets`,
`field-mappings`, `query-definitions` — sem uma camada semântica unificada e sem
runtime de agregação. Tudo descrito aqui é **conceitual/futuro** e exige
autorização explícita e ADRs novas antes de qualquer implementação.

---

## Por que uma camada semântica

As 4 análises convergem: a camada semântica é o **contrato de negócio único**
que separa "como os dados são definidos" de "como são consumidos".

| Benefício | Origem | Tradução para o Delfos |
|---|---|---|
| Measures/dimensions reutilizáveis | Cube, Lightdash | Definir uma vez, consumir em N query-definitions |
| Métrica versionada como artefato | WrenAI, Lightdash | Histórico, diff e rollback de definições de métrica |
| Security context unificado | Cube | `tenantId` derivado automaticamente, nunca passado manualmente |
| Catálogo de métricas navegável | Lightdash (Spotlight), Cube | Descoberta de métricas curadas pelo usuário de negócio |
| Grounding para IA | WrenAI | A IA raciocina sobre a semantic layer, não sobre schema cru |
| Dataset como contrato explícito | Superset, Cube | Dataset é o contrato; views de consumo apenas o usam |

---

## Camadas de definição (separação de responsabilidades)

Proposta de quatro camadas distintas, cada uma com responsabilidade única:

1. **`connections`** — referência de configuração da fonte (nunca connection string).
2. **`datasets`** — descrição da fonte de dados curada; o contrato bruto.
3. **`field-mappings`** — tradução técnica→negócio: rótulos PT-BR, tipos, semântica
   de campo, regras de mascaramento (ADR-0023).
4. **Semantic layer (futura)** — `measures` e `dimensions` reutilizáveis,
   construídas sobre datasets + field-mappings.
5. **`query-definitions`** — *consomem* measures/dimensions; não as definem.
6. **View de consumo (futura)** — recorte navegável da semantic layer exposto a
   dashboards e ao query builder (padrão Cube: *view* ≠ *cube*).

Princípio-chave (Cube/Lightdash): **a query-definition referencia measures e
dimensions; nunca redefine cálculo**. A definição do cálculo vive uma única vez
na semantic layer.

---

## Measures e dimensions reutilizáveis

Padrão Cube + Lightdash:

- **Measure** — cálculo agregável nomeado (`total_revenue`, `active_users`),
  definido declarativamente sobre um dataset.
- **Dimension** — eixo de corte nomeado (`region`, `month`, `customer_tier`).
- Ambas são entidades de primeira classe, versionadas, com `tenantId`.
- Reutilização: dezenas de `query-definitions` e widgets consomem a mesma measure;
  corrigir o cálculo num lugar propaga para todos.
- Explainability (Lightdash/Cube): cada número rastreia até a measure de origem.

---

## Métricas versionadas

Padrão WrenAI (MDL versionado) + Lightdash (versionamento sem git):

- Cada measure/dimension tem histórico de versões.
- Operações: `diff` entre versões, `rollback`, marcação de versão `certified`.
- Certificação/ownership (Superset): measures podem ser certificadas por um owner,
  sinalizando confiabilidade no catálogo.
- Mudanças auditadas via `audit`.

---

## Segments nomeados

Padrão Cube (segments):

- Um **segment** é um filtro reutilizável nomeado (`enterprise_customers`,
  `last_quarter`).
- Declarado uma vez na semantic layer, aplicável a qualquer query-definition.
- Reduz duplicação de filtros e padroniza recortes de negócio.

---

## Catálogo de métricas navegável

Padrão Lightdash (Spotlight) + Cube (catálogo navegável):

- Interface de descoberta: usuário de negócio navega measures/dimensions/segments
  disponíveis no seu tenant.
- Suporta pastas, tags e busca (padrão Superset — catálogo com tagging).
- Cada item mostra: descrição, owner, status de certificação, proveniência.
- Alimenta o query builder visual (seleção) e o grounding da IA.

---

## Security context que deriva tenantId

Padrão Cube (security context) — um dos itens mais importantes:

- A semantic layer recebe um **security context** por requisição.
- O filtro `tenantId` é **derivado automaticamente** do context, nunca passado
  como filtro manual numa query.
- Isso transforma o invariante "tenantId é fronteira obrigatória" numa garantia
  estrutural: é impossível esquecer o filtro de tenant.
- Extensão futura (WrenAI): controle de acesso por linha/coluna *dentro* do
  `tenantId`, integrado ao mascaramento (ADR-0023).

---

## Pre-aggregation como contrato declarativo

Padrão Cube (pre-aggregations) — respeitando **ADR-0007 (no cache/Redis Fase 1)**:

- Pre-aggregation é declarada como **contrato** (quais measures/dimensions, qual
  granularidade), não como mecanismo de cache ativo.
- Na fase foundation, apenas o **esquema declarativo** existe; nenhum material
  pré-agregado é construído ou armazenado.
- A materialização real é runtime e exige Fase 2 + nova ADR (ADR-0007 hoje
  proíbe cache/Redis na Fase 1).
- Definir o contrato cedo garante que measures sejam projetadas com
  pre-aggregation em mente, sem implementar o runtime.

---

## Ondas de roadmap

A coluna `Maturidade` em cada tabela segue a escala de [`maturity-taxonomy.md`](../maturity-taxonomy.md).

### Onda 1 — Curto prazo (contrato semântico declarativo)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Esquema declarativo de `measures` | Alta | Média | `Idea` | novo módulo `semantic-layer`, datasets | nova ADR (semantic layer) |
| Esquema declarativo de `dimensions` | Alta | Média | `Idea` | novo módulo `semantic-layer`, field-mappings | nova ADR (semantic layer) |
| query-definitions referenciam measures/dimensions | Alta | Média | `Idea` | query-definitions, semantic-layer | nova ADR (semantic layer) |
| Segments nomeados como entidade | Média | Baixa | `Idea` | semantic-layer | nova ADR (semantic layer) |
| Security context (derivação de tenantId) | Alta | Média | `Idea` | core, semantic-layer | ADR-0009, nova ADR |

### Onda 2 — Médio prazo (governança e descoberta)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Versionamento de measures/dimensions | Alta | Média | `Idea` | semantic-layer, audit | nova ADR (versionamento) |
| Certificação/ownership de métricas | Média | Baixa | `Idea` | semantic-layer, users | ADR-0017 |
| Catálogo de métricas navegável (Spotlight) | Alta | Média | `Idea` | semantic-layer (web) | nova ADR (semantic layer) |
| Explainability número→measure | Média | Média | `Idea` | semantic-layer, query-definitions | nova ADR (explainability) |
| Contrato declarativo de pre-aggregation | Média | Média | `Idea` | semantic-layer | ADR-0007, nova ADR |
| View de consumo (recorte navegável) | Média | Média | `Idea` | semantic-layer | nova ADR (semantic layer) |

### Onda 3 — Fase 2+ (runtime e segurança fina)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Materialização real de pre-aggregations | Média | Alta | `Idea` | runtime, semantic-layer | ADR-0007 (substituir), ADR-0024 |
| Controle de acesso linha/coluna no tenant | Alta | Alta | `Idea` | semantic-layer, datasets | ADR-0023, nova ADR |
| Resolução de measures no runtime de execução | Alta | Alta | `Idea` | runtime, connectors, semantic-layer | ADR-0008, ADR-0024 |
| Diff/rollback executável de definições | Média | Média | `Idea` | semantic-layer, audit | nova ADR (versionamento) |

---

## Invariantes a preservar

- `tenantId` derivado do security context — nunca filtro manual numa query.
- Cálculo definido **uma vez** na semantic layer; query-definitions só consomem.
- `connectionId` é referência de config; `credentialRef` nunca é o segredo.
- Pre-aggregation é contrato declarativo na fase foundation — ADR-0007 proíbe
  cache/Redis ativo na Fase 1.
- Mascaramento de campo (ADR-0023) é propriedade da semantic layer, não da UI.
- Nenhum runtime de agregação até Fase 2 autorizada (ADR-0024).

---

## Relacionado

- `../cube/ideas-for-delfos.md` · `../cube/architecture.md`
- `../lightdash/ideas-for-delfos.md` · `../lightdash/architecture.md`
- `../wren-ai/ideas-for-delfos.md` · `../wren-ai/architecture.md`
- `../superset/ideas-for-delfos.md`
- `./builder-and-ux-roadmap.md` — query builder consome a semantic layer
- `./ai-assistant-roadmap.md` — grounding da IA na semantic layer
- `../maturity-taxonomy.md` — escala de maturidade aplicada às tabelas acima
- `../../adr/adr-0007-no-cache-redis-phase-1.md`
- `../../adr/adr-0009-deployment-isolation-and-tenant-model.md`
- `../../adr/adr-0017-roles-and-permissions-model.md`
- `../../adr/adr-0023-data-masking-policy.md`
- `../../adr/adr-0024-phase-1-and-phase-2-definition.md`
