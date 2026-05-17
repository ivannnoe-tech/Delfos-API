# Matriz de Prioridade Consolidada

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Propósito

Este documento consolida, numa única visão navegável e priorizada, as ideias
espalhadas pelos 10 catálogos `references/<produto>/ideas-for-delfos.md`, pelos 7
roadmaps temáticos de `references/consolidated/` e pelo
[`future-modules-catalog.md`](./future-modules-catalog.md).

Muitas ideias se repetem entre produtos — camada semântica aparece em Cube,
Lightdash, WrenAI e Superset; filtros globais em Metabase, Superset, Chartbrew,
Lightdash e NocoBase; versionamento em Lightdash e Evidence. Cada **feature
consolidada** abaixo agrupa todas as ideias equivalentes numa só linha. Não há
uma linha por ideia crua: são ~38 capacidades sintetizadas.

Por força da [`ADR-0026`](../../adr/adr-0026-strategic-reference-library.md),
**nenhuma ideia desta biblioteca está aprovada**. Esta matriz é orientadora —
não autoriza implementação. Qualquer feature exige escopo explícito e, quando
indicado, uma ADR aprovada.

### Como ler as colunas

- **Feature** — nome curto da capacidade consolidada.
- **Inspiração** — produtos de referência que a inspiraram.
- **Impacto** — `Alto` / `Médio` / `Baixo`: valor estratégico estimado.
- **Complexidade** — `Alta` / `Média` / `Baixa`: esforço/risco de modelagem.
- **Fase** — `Fase 1` (foundation declarativa), `Fase 2` (execução real,
  runtime, cache) ou `Ambas` (modelo na Fase 1, aplicação real na Fase 2);
  referência: [`ADR-0024`](../../adr/adr-0024-phase-1-and-phase-2-definition.md).
- **Gate ADR** — ADR que precisa existir/ser aprovada antes da feature; `—`
  quando nenhuma ADR arquitetural é exigida.
- **Pode fazer agora?** — `Sim` / `Parcial` / `Não`.
- **Depende de execução real?** — `Sim` / `Não` (execução real = runtime real,
  query real, connectors reais, cache/fila/worker/scheduler).

### Critério de "Pode fazer agora?"

- **`Sim`** — extensão puramente declarativa de um módulo de foundation já
  existente, sem execução real e sem nova ADR arquitetural obrigatória.
- **`Parcial`** — o contrato/modelo declarativo é viável na foundation, mas o
  valor pleno depende de execução real e/ou de ADR nova; ou apenas parte da
  feature é declarativa.
- **`Não`** — depende de execução real, auth real, IA, cache/fila/worker ou de
  ADR ainda em `Proposed`; inviável na foundation atual.

---

## Matriz consolidada

| Feature | Inspiração | Impacto | Complexidade | Fase | Gate ADR | Pode fazer agora? | Depende de execução real? |
|---|---|---|---|---|---|---|---|
| Semantic types em field-mappings | Metabase | Alto | Baixa | Fase 1 | — | Sim | Não |
| Validação de integridade de definições | Lightdash, Evidence, WrenAI | Alto | Média | Fase 1 | — | Sim | Não |
| Datasets curados como contrato reutilizável | Chartbrew, Superset, Cube, NocoBase | Alto | Baixa | Fase 1 | — | Sim | Não |
| Certificação e ownership de ativos | Superset, Lightdash | Médio | Baixa | Fase 1 | — | Sim | Não |
| Catálogo navegável com pastas e tagging | Superset, Lightdash, Cube, NocoBase | Médio | Baixa | Fase 1 | — | Sim | Não |
| Data Source Manager unificado (catálogo) | NocoBase, Airbyte | Médio | Média | Fase 1 | — | Sim | Não |
| Selo de verificação (draft/review/verified) | Lightdash | Médio | Baixa | Fase 1 | — | Sim | Não |
| Erros estruturados com hints corretivos | Airbyte, WrenAI | Médio | Baixa | Fase 1 | — | Sim | Não |
| Painel de controles contextual no builder | Superset, Airbyte | Médio | Média | Fase 1 | — | Sim | Não |
| Variáveis nomeadas em query-definitions | Chartbrew | Alto | Média | Fase 1 | ADR nova | Parcial | Não |
| Filtros globais de dashboard desacoplados | Superset, Metabase, Lightdash, NocoBase | Alto | Média | Fase 1 | ADR nova | Parcial | Não |
| Auto-vínculo filtro↔variável por convenção | Chartbrew | Alto | Média | Fase 1 | ADR nova | Parcial | Não |
| Camada semântica declarativa (measures/dimensions) | Cube, Lightdash, WrenAI, Superset | Alto | Alta | Ambas | ADR nova | Parcial | Não |
| Métricas reutilizáveis e versionadas | WrenAI, Cube, Lightdash, Metabase | Alto | Média | Ambas | ADR nova | Parcial | Não |
| Versionamento de definições (diff/rollback) | Lightdash, Evidence | Alto | Média | Fase 1 | ADR nova | Parcial | Não |
| Security context que deriva tenantId | Cube | Alto | Média | Ambas | ADR nova | Parcial | Não |
| Templated definitions / templates de dashboard | Evidence, Chartbrew, NocoBase, WrenAI | Alto | Média | Fase 1 | ADR nova | Parcial | Não |
| Query IR declarativo (não SQL cru) | Metabase, Cube | Alto | Alta | Ambas | ADR nova | Parcial | Não |
| Relatórios narrativos (texto + dados) | Evidence | Alto | Média | Ambas | ADR nova | Parcial | Não |
| Connector spec declarativo dirige a UI | Airbyte, NocoBase | Alto | Média | Ambas | ADR nova | Parcial | Não |
| Protocolo versionado plataforma↔connector | Airbyte | Alto | Média | Ambas | adr-0015 | Parcial | Não |
| Contrato de capabilities de connector | Metabase, NocoBase, Airbyte | Médio | Média | Ambas | adr-0008 | Parcial | Não |
| Dry-plan: validação de definição pré-execução | WrenAI, Lightdash | Alto | Média | Fase 1 | adr-0014 | Parcial | Não |
| Contrato declarativo de click behavior | Metabase | Médio | Baixa | Ambas | adr-0011 | Parcial | Não |
| Explainability / linhagem de número→definição | Cube, Lightdash, WrenAI, Evidence, Vanna | Médio | Média | Fase 1 | ADR nova | Parcial | Não |
| Views de consumo sobre datasets | Cube, Lightdash, Superset | Médio | Média | Fase 1 | ADR nova | Parcial | Não |
| Segments / filtros nomeados reutilizáveis | Cube, WrenAI | Médio | Baixa | Fase 1 | ADR nova | Parcial | Não |
| Hierarquias de dimensão e drill-down governado | Cube, Metabase, Evidence | Médio | Média | Fase 1 | adr-0011 | Parcial | Não |
| Catálogo de métricas navegável (Spotlight) | Lightdash, Cube | Médio | Média | Fase 1 | ADR nova | Parcial | Não |
| Seleção automática de tipo de gráfico | WrenAI, Superset | Médio | Média | Fase 1 | adr-0011 | Parcial | Não |
| Permalink / estado de exploração compartilhável | Superset | Médio | Média | Ambas | — | Parcial | Não |
| Modo configuração vs. modo uso no dashboard | NocoBase | Médio | Média | Fase 1 | adr-0011 | Parcial | Não |
| Knowledge base por tenant (glossário + exemplos) | Vanna, WrenAI, Chartbrew | Alto | Média | Ambas | adr-0025 | Parcial | Não |
| RLS/CLS — controle de acesso linha/coluna | WrenAI, NocoBase, Cube | Alto | Alta | Ambas | adr-0017 | Parcial | Não |
| Permissões granulares field-level | NocoBase | Alto | Alta | Ambas | adr-0017 | Parcial | Não |
| Query builder visual por seleção | Cube, Lightdash, Metabase, Airbyte | Alto | Alta | Ambas | adr-0011 | Parcial | Não |
| Observability e cost tracking de LLM | Vanna | Alto | Média | Fase 2 | adr-0025 | Não | Não |
| IA como sujeito de ACL auditado | NocoBase | Alto | Média | Fase 2 | adr-0025 | Não | Não |
| Builder com test embutido (preview lado a lado) | Airbyte | Alto | Média | Fase 2 | adr-0014 | Não | Sim |
| Pre-aggregation / materialização como contrato | Cube, Evidence | Médio | Alta | Fase 2 | adr-0007 | Não | Sim |
| Execução como entidade observável (jobs) | Airbyte, NocoBase | Alto | Alta | Fase 2 | adr-0014 | Não | Sim |
| Timeline imutável de execuções | Airbyte | Médio | Média | Fase 2 | adr-0018 | Não | Sim |
| AI assistant NL→query-definition fundamentado | WrenAI, Vanna, Cube, Lightdash, Chartbrew | Alto | Alta | Fase 2 | adr-0025 | Não | Sim |
| Copiloto de autoria de dashboards/queries | Chartbrew, Evidence, NocoBase, WrenAI | Alto | Alta | Fase 2 | adr-0025 | Não | Sim |
| Resumo de gráfico em linguagem natural | Metabase, Vanna | Médio | Média | Fase 2 | adr-0025 | Não | Sim |
| Cross-filtering com propagação real de estado | Metabase, Superset | Alto | Alta | Fase 2 | adr-0024 | Não | Sim |
| Embedded analytics com token escopado por tenant | Cube, Superset, Metabase, Chartbrew, Lightdash, Evidence | Alto | Alta | Fase 2 | adr-0006 | Não | Sim |
| Subscriptions, alerts e snapshots agendados | Metabase, Superset, Chartbrew | Alto | Alta | Fase 2 | adr-0007 | Não | Sim |
| Connector dispatch real e check/discover | Airbyte | Alto | Alta | Fase 2 | adr-0022 | Não | Sim |
| Plano de execução assíncrono (worker/fila) | Superset, NocoBase | Alto | Alta | Fase 2 | adr-0007 | Não | Sim |
| Report runtime: exports e materialização | Evidence, Chartbrew, Superset | Alto | Alta | Fase 2 | adr-0024 | Não | Sim |
| X-rays / exploração automática de dataset | Metabase | Médio | Alta | Fase 2 | ADR nova | Não | Sim |
| Sync incremental por cursor / estado | Airbyte | Médio | Alta | Fase 2 | ADR nova | Não | Sim |
| Control plane / data plane para credenciais | Airbyte | Médio | Alta | Fase 2 | adr-0021 | Não | Sim |
| Orquestração de execução como grafo de nós | NocoBase | Médio | Alta | Fase 2 | ADR nova | Não | Sim |

---

## Leitura da matriz

São **54 features consolidadas** sintetizadas a partir de mais de 120 ideias
cruas dos 10 catálogos de produto, dos 7 roadmaps e do catálogo de módulos
futuros.

### Distribuição por "Pode fazer agora?"

| Valor | Contagem | Leitura |
|---|---|---|
| `Sim` | 9 | Extensões puramente declarativas de módulos de foundation; sem execução real, sem ADR arquitetural obrigatória. |
| `Parcial` | 26 | Contrato/modelo viável na foundation, mas valor pleno depende de ADR nova e/ou de execução real futura. |
| `Não` | 19 | Dependem de execução real, IA, auth real, cache/fila/worker ou de ADR em `Proposed`. |

### Distribuição por Fase

| Fase | Contagem |
|---|---|
| `Fase 1` | 17 |
| `Ambas` | 14 |
| `Fase 2` | 23 |

A camada semântica declarativa é a fundação conceitual de quase tudo: alimenta o
catálogo de métricas, o query builder, a explainability e o grounding da IA. O
bloco de governança declarativa (versionamento, validação de integridade,
certificação) é o de maior retorno e menor risco na foundation atual. As
features `Não` permanecem mockups/contratos até a Fase 2 ser explicitamente
autorizada.

---

## Relacionado

- [`./semantic-layer-roadmap.md`](./semantic-layer-roadmap.md)
- [`./ai-assistant-roadmap.md`](./ai-assistant-roadmap.md)
- [`./dashboard-builder-roadmap.md`](./dashboard-builder-roadmap.md)
- [`./connectors-roadmap.md`](./connectors-roadmap.md)
- [`./embedded-analytics-roadmap.md`](./embedded-analytics-roadmap.md)
- [`./enterprise-governance-roadmap.md`](./enterprise-governance-roadmap.md)
- [`./premium-ux-roadmap.md`](./premium-ux-roadmap.md)
- [`./future-modules-catalog.md`](./future-modules-catalog.md)
- [`../maturity-taxonomy.md`](../maturity-taxonomy.md)
- [`../README.md`](../README.md)
- [`../../adr/adr-0024-phase-1-and-phase-2-definition.md`](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [`../../adr/adr-0026-strategic-reference-library.md`](../../adr/adr-0026-strategic-reference-library.md)
</content>
</invoke>
