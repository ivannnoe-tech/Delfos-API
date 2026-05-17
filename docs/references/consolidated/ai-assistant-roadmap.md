# Roadmap consolidado — IA aplicada a Analytics

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Propósito

Este documento sintetiza padrões de IA aplicada a analytics observados em
**WrenAI, Vanna, Metabot (Metabase), AI Assist (Superset) e Cube AI**, adaptando-os
à realidade *foundation* do Delfos.

Todo o conteúdo é **conceitual/futuro** e está integralmente *gated* por
**ADR-0025 (LLM-assisted analytics text generation)**. O Delfos hoje não possui
integração com LLM, nem geração de texto, nem assistente. Nenhum item abaixo
autoriza implementação: cada onda exige autorização explícita e, onde indicado,
ADR nova.

---

## Postura inviolável do Delfos perante IA

| Regra | Origem | Consequência de design |
|---|---|---|
| IA **propõe**, humano **valida**, IA **nunca executa** | Vanna, WrenAI | Saída da IA é uma `query-definition` sugerida em estado `draft` |
| LLM nunca vê dados brutos do cliente | WrenAI (grounded text-to-SQL) | Grounding usa apenas metadados: semantic layer, catálogos, glossário |
| Toda sugestão carrega proveniência | Vanna, WrenAI | Explainability obrigatória: de onde veio cada campo/métrica sugerida |
| IA é sujeito de ACL e auditoria | NocoBase | Ações do agente passam por `auth`/`audit` como qualquer ator |
| Custo e uso de LLM são observáveis | Vanna | Observability/cost tracking por tenant desde o primeiro dia |
| Grounding na camada semântica, não no schema cru | WrenAI, Cube AI | A IA raciocina sobre measures/dimensions curadas, não tabelas |

---

## NL → query-definition declarativa

Padrão central de WrenAI e Vanna: o usuário descreve em linguagem natural, a IA
**sugere** uma `query-definition` declarativa.

Fluxo conceitual:

1. Usuário escreve pergunta em PT-BR ("vendas por região no último trimestre").
2. A IA recebe **apenas metadados** do tenant: datasets curados, field-mappings,
   measures/dimensions da semantic layer, glossário e exemplos de query.
3. A IA produz uma `query-definition` candidata em estado `draft` + explicação.
4. `execution-preview` valida o plano (dry-plan) — sem executar.
5. Humano revisa, ajusta e aprova. Só então a definição sai de `draft`.
6. A definição aprovada (e correções feitas) realimenta a knowledge base.

A IA nunca emite SQL para execução direta e nunca dispara um conector.

---

## Grounding na semantic layer

Padrão WrenAI (MDL) + Cube AI (semantic layer como contexto):

- O contexto do LLM é a **camada semântica futura** do Delfos (ver
  `semantic-layer-roadmap.md`): measures, dimensions, segments, métricas
  versionadas — todos artefatos curados.
- Text-to-query é *grounded*: a IA só pode referenciar entidades que existem na
  semantic layer do tenant. Reduz alucinação e impõe contrato.
- `field-mappings` fornecem rótulos de negócio (PT-BR) que tornam a sugestão
  legível e auditável.

---

## Knowledge base por tenant

Padrão Vanna (knowledge base tripartite) + Chartbrew (contexto explícito):

A knowledge base é **por tenant**, isolada por `tenantId`, com três partes:

1. **Datasets/semantic layer** — o que pode ser consultado.
2. **Glossário de negócio** — termos do domínio do tenant em PT-BR.
3. **Exemplos de query** — pares pergunta→`query-definition` aprovados.

O loop de validação humana (Vanna) realimenta a parte 3: cada aprovação/correção
vira exemplo, melhorando sugestões futuras sem retreino de modelo.

---

## Explainability e proveniência

Padrão Vanna + WrenAI (proveniência obrigatória):

- Toda sugestão de IA expõe: quais measures/dimensions usou, de qual dataset,
  com quais filtros, e por quê.
- A proveniência é armazenada junto da `query-definition` draft e auditada.
- Sem proveniência, a sugestão não pode ser apresentada ao usuário — é um
  requisito, não um extra.

---

## Resumo de gráfico e resposta multimodal

Padrão Metabot (Metabase) + Vanna (resposta multimodal):

- Resumo textual de um gráfico/resultado gerado por LLM — escopo já previsto em
  ADR-0025 (geração de texto assistida).
- O LLM recebe **agregados/metadados do resultado**, nunca o dataset bruto.
- Resposta multimodal: tabela + gráfico + resumo narrativo intercalados.
- Relatórios narrativos (texto + dados) conectam-se ao `report-definitions`.

---

## Observability e cost tracking de LLM

Padrão Vanna (observability de custo):

- Toda chamada de LLM registra: tenant, ator, tokens, custo estimado, latência,
  modelo, resultado (aceito/rejeitado pelo humano).
- Métricas agregadas por `tenantId` para governança de custo.
- Integração com `audit` — o agente de IA é um ator auditável.

---

## Ondas de roadmap

A coluna `Maturidade` em cada tabela segue a escala de [`maturity-taxonomy.md`](../maturity-taxonomy.md).

### Onda 1 — Curto prazo (fundações de contexto, sem LLM)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Esquema da knowledge base por tenant | Alta | Média | `Idea` | datasets, field-mappings, novo módulo `ai-knowledge` | ADR-0025, nova ADR |
| Glossário de negócio por tenant | Alta | Baixa | `Idea` | novo módulo `ai-knowledge` | nova ADR (knowledge base) |
| Estado `draft` para query-definitions | Alta | Baixa | `Research` | query-definitions | ADR-0025 |
| Contrato de proveniência em definições | Alta | Média | `Research` | query-definitions, audit | ADR-0025, ADR-0018 |
| Schema de observability/cost de LLM | Média | Baixa | `Idea` | audit, novo módulo `ai-observability` | nova ADR (observability) |

### Onda 2 — Médio prazo (assistente sugestivo, gated ADR-0025)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Resumo de gráfico/resultado via LLM | Alta | Média | `Idea` | runtime, report-definitions | ADR-0025 |
| NL → query-definition draft sugerida | Alta | Alta | `Idea` | query-definitions, ai-knowledge, execution-preview | ADR-0025, nova ADR |
| Grounding na semantic layer | Alta | Alta | `Idea` | ai-knowledge, datasets, field-mappings | ADR-0025 |
| Loop de validação humana realimenta KB | Média | Média | `Idea` | ai-knowledge, audit | nova ADR (knowledge base) |
| Cost tracking ativo por tenant | Média | Média | `Idea` | ai-observability, audit | nova ADR (observability) |
| IA como sujeito de ACL auditado | Alta | Média | `Idea` | auth, audit | ADR-0017, ADR-0018 |

### Onda 3 — Fase 2+ (copiloto integrado, exige Fase 2)

| Item | Prioridade | Complexidade | Maturidade | Módulos | ADR |
|---|---|---|---|---|---|
| Copiloto de autoria de dashboards | Média | Alta | `Idea` | dashboard-definitions, ai-knowledge | ADR-0024, ADR-0025 |
| Resposta multimodal (tabela+gráfico+resumo) | Média | Alta | `Idea` | runtime, report-definitions | ADR-0024, ADR-0025 |
| Relatórios narrativos gerados | Média | Alta | `Idea` | report-definitions | ADR-0024, ADR-0025 |
| Controle de acesso linha/coluna na sugestão | Alta | Alta | `Idea` | ai-knowledge, datasets | ADR-0023, nova ADR |
| Padrão MCP para copiloto (interop) | Baixa | Alta | `Idea` | novo módulo `ai-gateway` | nova ADR (MCP) |

---

## Invariantes a preservar

- IA **propõe**, humano **valida**, IA **nunca executa** — sem exceção.
- LLM nunca recebe dados brutos do cliente — apenas metadados e agregados.
- Toda sugestão carrega proveniência auditável; sem ela, não é exibida.
- Knowledge base isolada por `tenantId`; sem vazamento entre tenants.
- O agente de IA é ator com ACL e trilha de auditoria (ADR-0017/0018).
- Mascaramento (ADR-0023) aplica-se também a qualquer dado que chegue à IA.
- Tudo *gated* por ADR-0025; nenhuma onda implementa sem autorização.

---

## Relacionado

- `../wren-ai/ideas-for-delfos.md` · `../wren-ai/architecture.md`
- `../vanna/ideas-for-delfos.md` · `../vanna/premium-features.md`
- `../metabase/ideas-for-delfos.md`
- `../superset/ideas-for-delfos.md`
- `../cube/ideas-for-delfos.md`
- `./semantic-layer-roadmap.md` — grounding da IA depende da camada semântica
- `./builder-and-ux-roadmap.md` — copiloto de autoria de dashboards
- `../maturity-taxonomy.md` — escala de maturidade aplicada às tabelas acima
- `../../adr/adr-0017-roles-and-permissions-model.md`
- `../../adr/adr-0018-secure-audit-strategy.md`
- `../../adr/adr-0023-data-masking-policy.md`
- `../../adr/adr-0024-phase-1-and-phase-2-definition.md`
- `../../adr/adr-0025-llm-assisted-analytics-text-generation.md`
- [Índice da biblioteca de referências](../README.md)
