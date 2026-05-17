# Cube — Ideias aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: Cube · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este catálogo

Cada ideia abaixo é inspirada no Cube e adaptada ao Delfos. **Nenhuma autoriza implementação** — todas exigem ADR e autorização explícita antes de qualquer código. O Delfos está em fase foundation declarativa; estas ideias miram Fase 2+ e devem ser lidas como direção de produto, não como backlog.

---

### 1. Camada semântica declarativa do Delfos

| Campo | Valor |
|---|---|
| Origem/inspiração | Semantic layer do Cube (cubes, views, measures, dimensions) |
| Descrição | Formalizar uma camada semântica como entidade de primeira classe: definições reutilizáveis de measures e dimensions sobre `datasets` e `field-mappings`, separadas das `query-definitions` que as consomem |
| Objetivo | Garantir consistência de métricas — uma "receita líquida" definida uma vez, reutilizada em todo dashboard/relatório |
| Impacto | Alto — muda a forma como métricas são modeladas e governadas |
| Prioridade | Alta |
| Complexidade | Alta |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions`, `dashboard-definitions` |
| Dependências | Modelo de `datasets` e `field-mappings` estável |
| Viabilidade | Boa como modelo declarativo; nenhuma execução envolvida nesta fase |
| ADRs futuras possíveis | "Semantic layer declarativa", "Measure/dimension catalog" |
| Encaixe com | datasets, field-mappings, query-definitions, semantic layer futura |

---

### 2. Distinção dataset (cube) vs. view de consumo

| Campo | Valor |
|---|---|
| Origem/inspiração | Separação cube vs. view no Cube |
| Descrição | Introduzir `views` como fachada de consumo sobre `datasets`: o dataset modela a realidade do dado; a view expõe apenas o subconjunto relevante para um caso de uso, já com joins resolvidos |
| Objetivo | Simplificar a experiência de quem monta dashboards — expor só o que importa, esconder complexidade |
| Impacto | Médio-alto |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `dashboard-definitions`, `query-definitions` |
| Dependências | Ideia 1 (camada semântica) |
| Viabilidade | Alta — é modelagem declarativa pura |
| ADRs futuras possíveis | "Consumption views sobre datasets" |
| Encaixe com | datasets, dashboard-definitions, semantic layer futura |

---

### 3. Segments — filtros nomeados reutilizáveis

| Campo | Valor |
|---|---|
| Origem/inspiração | Segments do Cube |
| Descrição | Permitir definir filtros nomeados ("clientes ativos", "região sul") no modelo, reutilizáveis em múltiplas `query-definitions` sem reescrever condições |
| Objetivo | Reduzir duplicação de lógica de filtro e padronizar segmentações de negócio |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `field-mappings` |
| Dependências | Validação de entrada de filtros (invariante anti-concatenação) |
| Viabilidade | Alta — apenas metadados declarativos |
| ADRs futuras possíveis | "Named segments" |
| Encaixe com | query-definitions, field-mappings, dashboard-definitions |

---

### 4. Pre-aggregation contract como metadado declarativo

| Campo | Valor |
|---|---|
| Origem/inspiração | Pre-aggregations do Cube |
| Descrição | Declarar, junto da `query-definition`, um "perfil de materialização" (granularidade, dimensões, refresh esperado) como **contrato** — sem implementar cache/worker. Documenta a intenção de performance para o runtime futuro |
| Objetivo | Preparar o terreno para otimização futura sem violar `adr-0007` |
| Impacto | Médio (estratégico, baixo no curto prazo) |
| Prioridade | Baixa |
| Complexidade | Baixa (como contrato); alta (se implementado) |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `runtime` |
| Dependências | Definição de runtime real (Fase 2) |
| Viabilidade | Alta como contrato declarativo; implementação real é fora de escopo |
| ADRs futuras possíveis | "Materialization contract" — deve referenciar `adr-0007` |
| Encaixe com | query-definitions, runtime bridge, execution requests |

---

### 5. Security context unificado para isolamento e RLS

| Campo | Valor |
|---|---|
| Origem/inspiração | Security context + `queryRewrite` do Cube |
| Descrição | Formalizar um "security context" como objeto verificado (tenant, actor, role) que toda definição de query reconhece, e do qual filtros obrigatórios de tenant são derivados automaticamente |
| Objetivo | Tornar o isolamento `tenantId` impossível de esquecer — derivado do contexto, não escrito à mão |
| Impacto | Alto — reforça invariante de segurança central |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `auth`, `query-definitions`, `runtime`, `users` |
| Dependências | `request-context.interceptor`, modelo de roles |
| Viabilidade | Alta — alinhado com invariantes já existentes |
| ADRs futuras possíveis | "Security context model" — relacionar a `adr-0017` |
| Encaixe com | query-definitions, runtime bridge, execution requests |

---

### 6. Catálogo de métricas navegável

| Campo | Valor |
|---|---|
| Origem/inspiração | Semantic catalog do Cube Cloud |
| Descrição | Tela em `delfos-web` que apresenta measures e dimensions definidas como catálogo navegável, com descrições de negócio, origem e onde são usadas |
| Objetivo | Dar visibilidade do acervo analítico; reduzir retrabalho e métricas duplicadas |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions` (API); `delfos-web` (UI) |
| Dependências | Ideia 1 |
| Viabilidade | Alta — leitura de metadados existentes |
| ADRs futuras possíveis | "Metric catalog UX" |
| Encaixe com | datasets, field-mappings, query-definitions, semantic layer futura |

---

### 7. Query builder por seleção (não por digitação)

| Campo | Valor |
|---|---|
| Origem/inspiração | Playground / query builder do Cube |
| Descrição | Builder em `delfos-web` onde o usuário monta `query-definitions` escolhendo measures/dimensions de uma lista do modelo — nunca SQL livre — com preview da definição estruturada |
| Objetivo | Tornar impossível pedir algo que não existe no modelo; reforçar a invariante anti-concatenação |
| Impacto | Alto para UX de produto |
| Prioridade | Média |
| Complexidade | Média-alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, `dashboard-definitions` (API); `delfos-web` (UI) |
| Dependências | Ideias 1 e 2 |
| Viabilidade | Boa — gera apenas definições declarativas |
| ADRs futuras possíveis | "Structured query builder" — relacionar a `adr-0011` |
| Encaixe com | query-definitions, dashboard-definitions, semantic layer futura |

---

### 8. Hierarchies e drill-down governado

| Campo | Valor |
|---|---|
| Origem/inspiração | Hierarchies e `drillMembers` do Cube |
| Descrição | Permitir declarar hierarquias de dimensões (ex: país → estado → cidade) no modelo, definindo caminhos de drill-down consistentes e reutilizáveis |
| Objetivo | Tornar exploração "panorama → detalhe" previsível e governada pelo modelo |
| Impacto | Médio |
| Prioridade | Baixa |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `field-mappings`, `query-definitions`, `dashboard-definitions` |
| Dependências | Ideia 1 |
| Viabilidade | Alta como metadado declarativo |
| ADRs futuras possíveis | "Dimension hierarchies" |
| Encaixe com | field-mappings, dashboard-definitions, semantic layer futura |

---

### 9. AI assistant ancorado na camada semântica

| Campo | Valor |
|---|---|
| Origem/inspiração | Cube D3 / Copilot / Semantic SQL |
| Descrição | Assistente futuro que traduz intenção em linguagem natural para `query-definitions` válidas, restrito ao vocabulário da camada semântica — nunca gera SQL cru |
| Objetivo | Self-service confiável; reduzir alucinação ancorando o agente em métricas definidas |
| Impacto | Alto (estratégico) |
| Prioridade | Baixa (depende de fundação) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, `datasets`, novo módulo de IA |
| Dependências | Ideias 1, 5, 7; política de geração assistida |
| Viabilidade | Média — só após camada semântica madura |
| ADRs futuras possíveis | Relacionar a `adr-0025-llm-assisted-analytics-text-generation` |
| Encaixe com | semantic layer futura, AI assistant futuro, query-definitions |

---

### 10. Explainability — "como esse número foi calculado"

| Campo | Valor |
|---|---|
| Origem/inspiração | Explainability implícita do Cube (definição = documento) |
| Descrição | Cada measure carrega definição explícita e rastreável; a UI permite ver fórmula, origem (dataset/field-mapping) e dependências de qualquer número exibido |
| Objetivo | Confiança e auditabilidade — todo número é defensável |
| Impacto | Médio-alto |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `field-mappings`, `audit` |
| Dependências | Ideia 1 |
| Viabilidade | Alta — leitura de metadados; alinhado com estratégia de auditoria |
| ADRs futuras possíveis | "Metric lineage & explainability" — relacionar a `adr-0018` |
| Encaixe com | query-definitions, field-mappings, semantic layer futura, AI assistant futuro |

---

## Síntese de priorização

| Prioridade | Ideias |
|---|---|
| Alta | 1 (camada semântica declarativa), 5 (security context unificado) |
| Média | 2 (dataset vs. view de consumo), 3 (segments reutilizáveis), 6 (catálogo de métricas), 7 (query builder por seleção), 10 (explainability) |
| Baixa | 4 (pre-aggregation contract), 8 (hierarchies / drill-down), 9 (AI assistant semântico) |

As ideias de prioridade baixa dependem de runtime real, cache ou IA — itens de
Fase 2 que exigem ADR e autorização explícita.

---

## Ver também — roadmaps consolidados

Esta análise de Cube é sintetizada, junto com a dos demais produtos,
nos documentos consolidados de `references/consolidated/`. Os roadmaps
temáticos abaixo agregam diretamente as ideias deste produto:

- [`../consolidated/semantic-layer-roadmap.md`](../consolidated/semantic-layer-roadmap.md) — roadmap de camada semântica
- [`../consolidated/ai-assistant-roadmap.md`](../consolidated/ai-assistant-roadmap.md) — roadmap de IA aplicada a analytics
- [`../consolidated/builder-and-ux-roadmap.md`](../consolidated/builder-and-ux-roadmap.md) — roadmap de dashboard/query builder e UX premium
- [`../consolidated/embedded-analytics-roadmap.md`](../consolidated/embedded-analytics-roadmap.md) — roadmap de embedded analytics
- [`../consolidated/enterprise-governance-roadmap.md`](../consolidated/enterprise-governance-roadmap.md) — roadmap de governança enterprise

Além desses, todos os produtos alimentam os consolidados de visão e síntese:

- [`../consolidated/strategic-product-vision.md`](../consolidated/strategic-product-vision.md) — visão estratégica de produto
- [`../consolidated/product-differentiators.md`](../consolidated/product-differentiators.md) — diferenciais competitivos
- [`../consolidated/future-modules-catalog.md`](../consolidated/future-modules-catalog.md) — catálogo de módulos futuros
- [`../consolidated/priority-matrix.md`](../consolidated/priority-matrix.md) — matriz de prioridade consolidada

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADRs: [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md), [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md), [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md), [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md), [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Taxonomia de maturidade](../maturity-taxonomy.md) — taxonomia de maturidade aplicada às ideias
