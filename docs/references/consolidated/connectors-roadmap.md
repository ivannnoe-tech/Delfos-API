# Roadmap consolidado — Connectors e Execução

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Escopo e premissas

Este roadmap consolida as ideias de **connectors, integração e execução** destiladas
de quatro estudos: **Airbyte** (referência principal — protocolo, builder, jobs),
**NocoBase** (Data Source Manager, contrato de plugin de fonte), **Chartbrew**
(datasets reutilizáveis, variáveis de query) e o estado atual de `delfos-connectors`
(skeleton de contratos seguros, sem runtime real).

O Delfos está em **fase foundation declarativa**. A regra que organiza todo este
documento é a fronteira entre:

- **Foundation declarativa** — modelar contratos, specs, catálogos e metadados.
  Nenhuma chamada externa, nenhuma credencial decifrada, nenhuma query executada.
  Viável agora, sem autorização adicional além de ADR de modelagem quando indicado.
- **Futuro gated** — qualquer execução real, dispatch a connector real, decifração
  de credencial ou tráfego de dados de cliente. **Bloqueado** até `adr-0021`
  (credential decryption in future execution) e `adr-0022` (connector dispatch
  transport) saírem de *Proposed* e haver autorização explícita.

`delfos-connectors` permanece um skeleton: `execute` e `export` retornam
`not_supported` por desenho. Avançar isso é decisão de Fase 2, não de roadmap.

---

## Princípios arquiteturais

1. **Catálogo separado de execução** — inspiração NocoBase Data Source Manager.
   "O que existe" (connections, datasets, field-mappings) é um catálogo navegável,
   distinto de "o que roda". A foundation só constrói o catálogo.
2. **Spec declarativo dirige a UI** — inspiração Airbyte Connector Builder. Cada
   tipo de connector publica um `spec` (schema de config e credenciais); a tela de
   configuração é renderizada a partir do schema, nunca codificada por fonte.
3. **Protocolo versionado plataforma↔connector** — contrato de mensagens tipadas
   (`spec`, `check`, `discover`, `execute`) entre `delfos-api`/`runtime` e
   `delfos-connectors`, evoluível sem quebrar a plataforma. Estende o command
   envelope de `adr-0015`.
4. **Execução é entidade de primeira classe** — inspiração jobs/workloads do
   Airbyte. Toda execução tem identidade, estado, timestamps, logs e resultado;
   nunca uma chamada síncrona opaca.
5. **`credentialRef` nunca vira segredo no control plane** — a decifração só
   ocorre no plano de execução isolado, e só sob `adr-0021`.

---

## Ondas do roadmap

### Onda 0 — Estado atual (foundation já entregue)

Base sobre a qual tudo se apoia. Sem ação nova:

- `connections`, `credentials`, `datasets`, `field-mappings` declarativos e
  tenant-scoped.
- `runtime` e `execution-preview` modelam pedidos de execução sem executar
  (`adr-0014`).
- `delfos-connectors` com `src/contracts/`, `src/security/`, `validate-execution-command.ts`
  e `FakeConnectorAdapter` determinístico.
- Command envelope plataforma↔connector definido em `adr-0015`.

### Onda 1 — Catálogo e spec declarativo (foundation, viável agora)

Evolução puramente declarativa. Alvo de ADRs de modelagem, não de execução.

- **Connector spec format** — schema versionado de configuração/credenciais por
  tipo de connector, catalogado em `delfos-connectors` e exposto por `connections`.
- **Schema-driven config UI** — `delfos-web` renderiza o formulário de connection
  a partir do spec; novo connector = novo spec, zero tela nova.
- **Data Source Manager unificado** — visão de catálogo sobre `connections` +
  `datasets` + `field-mappings`, navegável, separada de execução.
- **Datasets reutilizáveis como contrato** — reforçar `datasets` como unidade
  consumida por vários artefatos (Chartbrew); reduz duplicação.
- **Catálogo de tipos de connector** — contrato de capabilities/modos suportados
  por tipo, distinto do executor (NocoBase); base de curadoria.

### Onda 2 — Protocolo e contrato de operações (foundation de contrato)

Define os contratos de `check`/`discover`/`execute` **como tipos versionados**,
sem implementá-los contra fontes reais.

- **Protocolo versionado** — formalizar mensagens tipadas e versão de contrato;
  testes de compatibilidade entre `delfos-api` e `delfos-connectors`.
- **Contrato de `check` e `discover`** — definir os formatos de comando/resultado.
  `check` valida uma `connection`/`credentialRef`; `discover` cataloga
  datasets/campos. Apenas o contrato — execução real é Onda 4.
- **Catálogo curado e certificação de connectors** — níveis de certificação,
  versionamento; decisão de governança, não de runtime.
- **Variáveis nomeadas em query-definitions** — placeholders resolvidos por
  default/filtro/parâmetro/contexto (Chartbrew); base declarativa do dispatch.

### Onda 3 — Execução como entidade observável (desenho, runtime gated)

Modela o ciclo de vida da execução; o runtime real só liga sob autorização.

- **Modelo de job/execução** — estado, timestamps, logs, resultado e taxonomia de
  erro (transitório vs permanente, fonte vs config) com política de retry.
- **Timeline imutável de execuções** — histórico append-only por definição/tenant,
  alinhado a `adr-0018`.
- **Pipeline de execução por etapas** — runtime modelado como pipeline isolável
  (validação → resolução de fonte → dispatch → coleta), inspiração hooks NocoBase.
- **Builder com test embutido** — preview lado a lado em `execution-preview`;
  usa o `FakeConnectorAdapter` enquanto não há runtime real.

### Onda 4 — Execução real e on-premise (Fase 2 — gated por ADR)

**Nada aqui é autorizado.** Cada item exige ADR saindo de *Proposed* e aprovação.

- **Connector dispatch real** — sob `adr-0022`; transporte de comando a connector
  real.
- **Decifração de credencial em execução** — sob `adr-0021`; só no plano isolado.
- **Operações `check`/`discover` reais** — validação e descoberta contra fontes.
- **Sync incremental por cursor** — estado por definição para reprocessar só o
  que mudou (Airbyte incremental).
- **Control plane / data plane** — execução que toca credenciais roda em plano
  isolado por tenant/região; control plane só vê referências (`adr-0009`/`adr-0019`).
- **On-premise connectors agent** — agente local para fontes on-premise (`adr-0012`).
- **Métricas e alertas de execução** — observabilidade nativa do `runtime`.
- **Extensibilidade em camadas** — declarativo → custom → código pleno no connector.

---

## Tabela de roadmap

A coluna `Maturidade` segue a escala de [`maturity-taxonomy.md`](../maturity-taxonomy.md).

| Item | Onda | Prioridade | Complexidade | Maturidade | Módulos | Foundation vs futuro | ADRs |
|---|---|---|---|---|---|---|---|
| Connector spec format | 1 | Alta | Média | `Research` | `connections`, `credentials`, `delfos-connectors` | Foundation declarativa | nova (spec format) |
| Schema-driven config UI | 1 | Alta | Média | `Research` | `connections`, `delfos-web` | Foundation declarativa | nova (spec format) |
| Data Source Manager unificado | 1 | Alta | Média | `Research` | `connections`, `datasets`, `field-mappings` | Foundation declarativa | adr-0001 (ref.) |
| Datasets reutilizáveis | 1 | Alta | Baixa | `Research` | `datasets`, `field-mappings` | Foundation declarativa | — |
| Catálogo de tipos de connector | 1 | Média | Média | `Research` | `connections`, `delfos-connectors` | Foundation declarativa | adr-0008, adr-0022 |
| Protocolo versionado | 2 | Alta | Média | `Research` | `runtime`, `delfos-connectors` | Foundation de contrato | adr-0015 (extensão) |
| Contrato `check`/`discover` | 2 | Alta | Média | `Research` | `connections`, `datasets`, `field-mappings` | Contrato agora · execução Onda 4 | nova (check/discover) |
| Catálogo curado + certificação | 2 | Média | Baixa | `Research` | `connections`, `delfos-connectors` | Foundation declarativa (governança) | nova (curadoria) |
| Variáveis nomeadas de query | 2 | Alta | Média | `Research` | `query-definitions`, `runtime` | Foundation declarativa | nova (variable contract) |
| Modelo de job/execução + erro | 3 | Alta | Alta | `Research` | `runtime`, `execution-preview`, `audit` | Desenho agora · runtime gated | adr-0014 (extensão) |
| Timeline imutável | 3 | Média | Média | `Research` | `audit`, `runtime` | Foundation declarativa | adr-0018 (extensão) |
| Pipeline de execução por etapas | 3 | Média | Alta | `Research` | `runtime`, `delfos-connectors` | Desenho agora · execução gated | adr-0014, adr-0015 |
| Builder com test embutido | 3 | Alta | Média | `Research` | `execution-preview`, `delfos-web` | Foundation (Fake adapter) | adr-0011 (extensão) |
| Connector dispatch real | 4 | Alta | Alta | `Research` | `runtime`, `delfos-connectors` | Futuro gated | **adr-0022** |
| Decifração de credencial | 4 | Alta | Alta | `Research` | `credentials`, `runtime` | Futuro gated | **adr-0021**, adr-0019 |
| `check`/`discover` reais | 4 | Alta | Média | `Research` | `connections`, `datasets` | Futuro gated | adr-0021, adr-0022 |
| Sync incremental por cursor | 4 | Média | Alta | `Idea` | `query-definitions`, `runtime` | Futuro gated | nova (incremental) |
| Control plane / data plane | 4 | Baixa | Alta | `Research` | `credentials`, `runtime`, deployment | Futuro gated | adr-0009, adr-0019, adr-0021 |
| On-premise connectors agent | 4 | Média | Alta | `Idea` | `runtime`, `connections` | Futuro gated | **adr-0012** |
| Métricas e alertas de execução | 4 | Média | Média | `Idea` | `runtime`, `health`, `audit` | Futuro gated | nova (observability) |
| Extensibilidade em camadas | 4 | Média | Alta | `Idea` | `delfos-connectors`, `runtime` | Futuro gated | nova (layered model) |

---

## Riscos e guard-rails

- **Não antecipar runtime real.** Itens das Ondas 3–4 que tocam execução exigem
  `adr-0021`/`adr-0022` aprovadas. Modelar contrato ≠ implementar dispatch.
- **`credentialRef` é invariante.** Nenhuma onda permite o segredo chegar ao
  control plane; `connectionId` nunca é connection string.
- **Sem cache/fila/worker/scheduler** na foundation (`adr-0007`); o "modelo de
  job" é metadado declarativo, não infraestrutura assíncrona.
- **Curadoria sobre abertura** — catálogo curado e versionado evita o problema de
  qualidade desigual de catálogos comunitários (lição do Airbyte).
- **Validação antes da URL/header/body** — nenhuma request por concatenação;
  variáveis de query sempre validadas.

---

## Relacionado

- [../airbyte/architecture.md](../airbyte/architecture.md)
- [../airbyte/ideas-for-delfos.md](../airbyte/ideas-for-delfos.md)
- [../nocobase/ideas-for-delfos.md](../nocobase/ideas-for-delfos.md)
- [../chartbrew/ideas-for-delfos.md](../chartbrew/ideas-for-delfos.md)
- [./embedded-analytics-roadmap.md](./embedded-analytics-roadmap.md)
- [./enterprise-governance-roadmap.md](./enterprise-governance-roadmap.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0012-local-connectors-agent-and-on-premise-sources.md](../../adr/adr-0012-local-connectors-agent-and-on-premise-sources.md)
- [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [../../adr/adr-0021-credential-decryption-in-future-execution.md](../../adr/adr-0021-credential-decryption-in-future-execution.md)
- [../../adr/adr-0022-connector-dispatch-transport.md](../../adr/adr-0022-connector-dispatch-transport.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [../maturity-taxonomy.md](../maturity-taxonomy.md) — escala de maturidade aplicada à tabela de roadmap
