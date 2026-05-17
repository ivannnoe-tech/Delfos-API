# Visão Estratégica de Produto — Delfos Analytics

> Tipo: visão estratégica consolidada · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este documento

Este é o documento "topo da pirâmide" da síntese estratégica do Delfos. Ele
consolida o estudo de 10 produtos open-source de BI/Analytics/AI (metabase,
superset, chartbrew, cube, airbyte, wren-ai, vanna, lightdash, evidence,
nocobase) em uma narrativa única de produto.

Não é backlog e não autoriza implementação. O Delfos está em fase *foundation*
declarativa. Toda capacidade futura descrita aqui exige ADR aprovada e
autorização explícita. Este documento orienta **decisões de direção**, não
execução, e deve ser lido junto de `../../phase-2-vision.md` e
`../../roadmap.md`.

---

## 1. Posicionamento do Delfos

> O Delfos é uma **plataforma analítica declarativa, multi-tenant nativa e
> auditável por construção**. Ele modela análises como artefatos versionáveis,
> isola tenants como invariante de arquitetura e — no futuro — usa IA como
> propositora fundamentada, nunca como executora autônoma.

O mercado de BI open-source é maduro e povoado. O Delfos não busca paridade de
features com produtos de anos de estrada — busca uma **postura arquitetural**
que os concorrentes maduros não conseguem mais adotar sem reescrita:

- multi-tenancy nativo, não adicionado depois;
- semantic layer como núcleo, não como recurso premium;
- IA auditável, não copiloto opaco;
- connectors como spec declarativo versionado, não código acoplado;
- definições como artefatos com diff/rollback, não estado mutável.

O caráter declarativo da foundation atual — armazenar configuração, catálogos,
referências seguras de credenciais e auditoria — não é uma limitação a superar;
é o **ativo estratégico** de onde tudo decorre.

---

## 2. Os 6 temas transversais

O estudo dos 10 produtos fez emergir seis temas que se repetem como sinais de
maturidade do mercado. Eles são a espinha dorsal da estratégia do Delfos.

### 2.1 Camada semântica declarativa

A convergência mais forte do estudo: cube, lightdash, wren-ai, superset e
metabase apostam, de formas diferentes, em uma camada que dá significado de
negócio estável aos dados, independente do schema físico. É a **maior aposta
arquitetural do Delfos** — `datasets`, `field-mappings` e `query-definitions`
são os blocos de partida de uma camada semântica que será o núcleo do produto.

### 2.2 IA fundamentada e auditável

Toda a onda de IA dos produtos (Metabot, AI Assist, GenBI, RAG) traz um risco:
IA que gera e executa SQL cru. O Delfos adota a postura oposta — a IA propõe uma
`query-definition` declarativa, fundamentada na camada semântica do tenant; um
humano valida; a IA nunca executa direto. Dados brutos nunca vão ao LLM. Gated
por `adr-0025`.

### 2.3 Definições como artefatos versionáveis

Inspirado em evidence (BI-as-code) e lightdash (versionamento via dbt), mas
trazido para dentro do produto: diff, rollback, validação de integridade e
templated definitions (1 definição → N instâncias). Definição não é estado
mutável — é artefato.

### 2.4 Connectors declarativos e protocolo versionado

Inspiração principal: airbyte. O connector é um spec declarativo que dirige a
UI; a comunicação usa um command envelope versionado; a execução é entidade de
primeira classe, isolada em `delfos-connectors`. Futuro, gated por
`adr-0021`/`adr-0022`.

### 2.5 Governança nativa

`tenantId` derivado de um security context (cube), RBAC (`adr-0017`), masking
field-level (`adr-0023`, nocobase), certificação/ownership (superset) e
auditoria como insight (metabase). Sem edição paga (`adr-0002`) — governança
completa na base open-source.

### 2.6 UX premium declarativa

Filtros globais, cross-filtering, drill-down governado, click behavior, estados
ricos de tela e onboarding tipo X-rays. Tudo dirigido por definição declarativa,
não por configuração imperativa espalhada na UI. No `delfos-web`, ancorado no
Design System, no `chart_renderer` (`adr-0003`) e nos estados obrigatórios de
tela.

---

## 3. Evolução em horizontes

A estratégia do Delfos se organiza em quatro horizontes. A passagem de um para o
outro é controlada por ADRs e por validação comercial — não por entusiasmo
técnico.

### Horizonte 0 — Foundation atual (implementado)

A foundation administrativa/declarativa existe e funciona: 14 módulos
declarativos, contratos e testes, API E2E smoke com MongoDB em memória, Web
Playwright E2E smoke. Sem execução real, sem cache, sem dispatch. Auth temporária
via `x-delfos-admin-key` (`adr-0016`). Este horizonte é o **terreno** — estável
e enxuto.

### Horizonte 1 — Curto prazo declarativo

Evolução possível **sem violar ADRs de bloqueio**, pois é puramente declarativa:

- `semantic-layer` como modelo (measures/dimensions/entidades);
- `definition-versioning` (diff, rollback, integridade);
- `consumption-views` e `template-catalog`;
- `usage-analytics` lendo `audit`;
- `access-policy` como modelo declarativo (aplicação fica para depois);
- validação dry-plan reforçada em `execution-preview`.

Tudo aqui é schema e contrato — nenhuma execução real.

### Horizonte 2 — Fase 2 com execução real

Conforme `../../phase-2-vision.md`: ingestão recorrente, banco analítico próprio,
cache persistente, filas/workers, scheduler, alertas, conectores reais. Habilita
`connector-registry`, `report-runtime` e `embed-gateway`. Cada decisão exige
ADR (banco analítico, ingestão, fila, Redis, retenção, LGPD, custos). Bloqueado
hoje por `adr-0007`, `adr-0021`, `adr-0022`, `adr-0024`.

### Horizonte 3 — Visão madura

Com Fase 2 consolidada: `ai-assistant` fundamentado em produção, `knowledge-base`
por tenant (RAG governado), `observability` de plataforma e de IA, APIs públicas
do Delfos para terceiros, embedded analytics pleno. É o horizonte onde o Delfos
se torna uma plataforma analítica completa — mas ainda fiel aos princípios
declarativo, multi-tenant e auditável.

| Horizonte | Estado | Habilita | Gate |
|---|---|---|---|
| 0 — Foundation | Implementado | 14 módulos declarativos | — |
| 1 — Curto prazo declarativo | Conceitual | semantic-layer, versioning, templates, usage-analytics | só schema/contrato |
| 2 — Fase 2 | Conceitual | connectors reais, report-runtime, embed-gateway | adr-0007/21/22/24 |
| 3 — Visão madura | Conceitual | ai-assistant, knowledge-base, observability, APIs públicas | Fase 2 consolidada |

Outros documentos da biblioteca descrevem este mesmo eixo com vocabulários
diferentes — "Fase 1/2/Ambas" na [`priority-matrix.md`](./priority-matrix.md),
"Onda 0–4" nos roadmaps temáticos, "Curto prazo declarativo / Visão madura" no
[`future-modules-catalog.md`](./future-modules-catalog.md). O
[crosswalk de vocabulário de fase](../maturity-taxonomy.md#crosswalk-de-vocabulário-de-fase)
mapeia Horizonte ↔ Fase ↔ Onda ↔ Catálogo numa única tabela.

---

## 4. Princípios de produto

Os princípios abaixo são o filtro de toda decisão. Quando uma proposta os
contraria, ela é recusada ou exige ADR.

1. **Declarativo primeiro.** Toda capacidade nasce como definição inspecionável
   antes de virar execução. Definição é artefato; artefato é versionável.
2. **Tenant é fronteira, não filtro.** `tenantId` é invariante de isolamento
   obrigatória, derivado do security context — nunca escrito à mão, nunca
   opcional.
3. **Credencial é referência, nunca segredo.** `credentialRef` e `connectionId`
   são referências seguras; metadados são sanitizados (`adr-0019`, `adr-0020`).
4. **IA propõe, humano decide.** A IA nunca executa direto; é propositora
   fundamentada na camada semântica, auditável e gated por `adr-0025`.
5. **Sem antecipar Fase 2.** Cache, fila, worker, scheduler, runtime real e
   dispatch ficam bloqueados até ADR e validação comercial.
6. **Sem componentes pagos.** `adr-0002` — governança e features-chave são
   nativas da base open-source.
7. **Auditável por construção.** Todo evento relevante é auditado; auditoria é
   insight, não só log.
8. **Foco sobre paridade.** O Delfos não persegue todas as features dos
   concorrentes; investe nos diferenciais arquiteturais difíceis de copiar.

---

## 5. Como tudo se conecta

A camada semântica declarativa (tema 2.1) é o **centro de gravidade**: ela dá
vocabulário ao `ai-assistant` (tema 2.2), substância às definições versionáveis
(tema 2.3), contexto à governança (tema 2.5) e estrutura à UX premium (tema 2.6).
Os connectors (tema 2.4) alimentam o catálogo de fontes que a camada semântica
descreve.

Os horizontes encadeiam os temas: o Horizonte 1 materializa a camada semântica e
o versionamento como modelo; o Horizonte 2 liga a execução real e os connectors;
o Horizonte 3 ativa a IA fundamentada sobre tudo isso. Nada pula etapas — a IA
em produção só faz sentido sobre uma camada semântica madura, que só faz sentido
sobre uma foundation declarativa estável.

Este documento é o ápice de uma pirâmide de síntese:

- na base, os 10 estudos de produto em `docs/references/<produto>/`;
- no meio, os roadmaps temáticos consolidados (semantic-layer, ai-assistant,
  connectors, dashboard-builder, embedded-analytics, premium-ux,
  enterprise-governance);
- ainda no meio, `./product-differentiators.md` (tese competitiva) e
  `./future-modules-catalog.md` (módulos candidatos);
- no topo, este documento.

E conecta-se aos documentos de planejamento oficiais: `../../phase-2-vision.md`
(o que a Fase 2 pode trazer e o que não antecipar) e `../../roadmap.md` (estado
atual aprovado e taxonomia de status). A relação é deliberada: a visão
estratégica **propõe direção**; a `phase-2-vision` e o `roadmap` **controlam o
ritmo**; as ADRs **autorizam** cada passo.

---

## 6. Síntese

> O Delfos aposta que, num mercado de BI maduro, a vantagem não está em mais
> features — está em **melhor arquitetura**. Declarativo por construção,
> multi-tenant por invariante, auditável por princípio e com IA fundamentada
> por postura. A foundation enxuta de hoje não é um produto incompleto; é a
> escolha consciente de construir as fundações certas antes de erguer os
> andares.

Cada horizonte futuro só avança sob ADR e validação comercial. Esta visão
existe para garantir que, quando esses passos forem dados, eles sejam dados na
direção certa.

---

## Relacionado

- Consolidados: [./product-differentiators.md](./product-differentiators.md) ·
  [./future-modules-catalog.md](./future-modules-catalog.md) ·
  [./semantic-layer-roadmap.md](./semantic-layer-roadmap.md) ·
  [./ai-assistant-roadmap.md](./ai-assistant-roadmap.md) ·
  [./connectors-roadmap.md](./connectors-roadmap.md) ·
  [./builder-and-ux-roadmap.md](./builder-and-ux-roadmap.md) ·
  [./embedded-analytics-roadmap.md](./embedded-analytics-roadmap.md) ·
  [./enterprise-governance-roadmap.md](./enterprise-governance-roadmap.md)
- Produtos estudados: [../metabase/ideas-for-delfos.md](../metabase/ideas-for-delfos.md) ·
  [../cube/ideas-for-delfos.md](../cube/ideas-for-delfos.md) ·
  [../wren-ai/ideas-for-delfos.md](../wren-ai/ideas-for-delfos.md) ·
  [../lightdash/ideas-for-delfos.md](../lightdash/ideas-for-delfos.md) ·
  [../airbyte/ideas-for-delfos.md](../airbyte/ideas-for-delfos.md) ·
  [../evidence/ideas-for-delfos.md](../evidence/ideas-for-delfos.md) ·
  [../superset/ideas-for-delfos.md](../superset/ideas-for-delfos.md) ·
  [../chartbrew/ideas-for-delfos.md](../chartbrew/ideas-for-delfos.md) ·
  [../vanna/ideas-for-delfos.md](../vanna/ideas-for-delfos.md) ·
  [../nocobase/ideas-for-delfos.md](../nocobase/ideas-for-delfos.md)
- Planejamento oficial: [../../phase-2-vision.md](../../phase-2-vision.md) ·
  [../../roadmap.md](../../roadmap.md)
- ADRs: [../../adr/adr-0002-no-paid-components.md](../../adr/adr-0002-no-paid-components.md) ·
  [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md) ·
  [../../adr/adr-0016-temporary-admin-key-auth.md](../../adr/adr-0016-temporary-admin-key-auth.md) ·
  [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md) ·
  [../../adr/adr-0021-credential-decryption-in-future-execution.md](../../adr/adr-0021-credential-decryption-in-future-execution.md) ·
  [../../adr/adr-0022-connector-dispatch-transport.md](../../adr/adr-0022-connector-dispatch-transport.md) ·
  [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md) ·
  [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
