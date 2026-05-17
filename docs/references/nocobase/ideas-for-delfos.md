# NocoBase — Ideias Aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: NocoBase · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este catálogo

Este é o documento mais importante da pasta. Cada ideia abaixo é uma **inspiração estratégica**
extraída do estudo de NocoBase, traduzida para o contexto do Delfos. **Nada aqui autoriza
implementação** — toda ideia que toque execução real, IA, cache/fila ou auth real exige ADR e
autorização explícita. As prioridades são sugestões para discussão de roadmap.

Legenda: Prioridade e Complexidade em {alta · média · baixa}.

---

### 1. Contrato de extensão para tipos de widget

| Campo | Valor |
|---|---|
| Origem/inspiração | Block model e plugins de block de NocoBase |
| Descrição | Definir um contrato declarativo estável para tipos de widget de dashboard (chart, table, KPI, texto) que novos tipos possam implementar sem alterar o core |
| Objetivo | Tornar o catálogo de widgets extensível sem inchar `dashboard-definitions` |
| Impacto | Alto — destrava evolução de visualizações |
| Prioridade | média |
| Complexidade | média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `delfos-web` shared/charts |
| Dependências | `chart_renderer` (ADR-0003) já abstraído |
| Viabilidade | Alta — é evolução de contrato declarativo, sem execução real |
| ADRs futuras possíveis | Extensão da ADR-0011 (widget model) |
| Encaixe | dashboard-definitions, semantic layer futura |

---

### 2. Data Source Manager unificado como catálogo

| Campo | Valor |
|---|---|
| Origem/inspiração | Data Source Manager de NocoBase (catálogo separado do acesso) |
| Descrição | Consolidar a visão de `connections` + `datasets` + `field-mappings` em uma camada de catálogo navegável, mantendo catálogo e execução separados |
| Objetivo | Visão única de "o que existe" antes de qualquer execução |
| Impacto | Alto — base para self-service de analytics |
| Prioridade | alta |
| Complexidade | média |
| Maturidade | `Research` |
| Módulos impactados | `connections`, `datasets`, `field-mappings` |
| Dependências | Modelos declarativos já existentes |
| Viabilidade | Alta — é organização declarativa, sem chamadas externas |
| ADRs futuras possíveis | ADR de "catalog layer" referenciando ADR-0001 |
| Encaixe | datasets, field-mappings, connectors |

---

### 3. Permissões granulares a nível de campo

| Campo | Valor |
|---|---|
| Origem/inspiração | ACL field-level de NocoBase (read/write por campo, por papel) |
| Descrição | Permitir que papéis tenham visibilidade/uso restrito por campo de dataset, integrando com a política de mascaramento |
| Objetivo | Governança fina de dados sensíveis por tenant e papel |
| Impacto | Alto — requisito de compliance |
| Prioridade | alta |
| Complexidade | alta |
| Maturidade | `Research` |
| Módulos impactados | `users`, `datasets`, `field-mappings`, `audit` |
| Dependências | Modelo de papéis (ADR-0017), mascaramento (ADR-0023) |
| Viabilidade | Média — exige extensão cuidadosa do ACL atual |
| ADRs futuras possíveis | Extensão da ADR-0017 + ADR-0023 |
| Encaixe | field-mappings, datasets, AI assistant futuro (filtro de contexto) |

---

### 4. Modo configuração vs. modo uso no dashboard

| Campo | Valor |
|---|---|
| Origem/inspiração | Alternância one-click de NocoBase entre operar e editar a app |
| Descrição | No `delfos-web`, alternar entre visualizar um dashboard e editá-lo (arrastar widgets, ajustar filtros) sem trocar de tela |
| Objetivo | Reduzir atrito de autoria de dashboards |
| Impacto | Médio — qualidade de UX percebida |
| Prioridade | média |
| Complexidade | média |
| Maturidade | `Idea` |
| Módulos impactados | `delfos-web` features/dashboard, `dashboard-definitions` |
| Dependências | Builder de dashboard declarativo (ADR-0011) |
| Viabilidade | Alta — é UX sobre definição declarativa |
| ADRs futuras possíveis | Nota de UX anexa à ADR-0011 |
| Encaixe | dashboard-definitions |

---

### 5. Filtros globais como componente desacoplado

| Campo | Valor |
|---|---|
| Origem/inspiração | Filter blocks de NocoBase (filtro publica, blocks consomem) |
| Descrição | Modelar filtros de dashboard como entidade própria que publica critérios consumidos por múltiplos widgets |
| Objetivo | Filtros globais consistentes sem acoplar lógica a cada widget |
| Impacto | Alto — coerência de exploração |
| Prioridade | alta |
| Complexidade | média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `query-definitions`, `delfos-web` |
| Dependências | `query-definitions` declarativo |
| Viabilidade | Alta — extensão de modelo declarativo |
| ADRs futuras possíveis | ADR de "global filters / dashboard scope" |
| Encaixe | dashboard-definitions, query-definitions |

---

### 6. Templates de dashboard reutilizáveis

| Campo | Valor |
|---|---|
| Origem/inspiração | Collection templates de NocoBase |
| Descrição | Permitir salvar uma `dashboard-definition` como template, instanciável por outro tenant ou segmento |
| Objetivo | Acelerar onboarding e padronizar boas práticas de BI |
| Impacto | Médio-alto — time-to-value para novos tenants |
| Prioridade | média |
| Complexidade | média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `tenants` |
| Dependências | Definições declarativas estáveis; isolamento por `tenantId` |
| Viabilidade | Alta — é clonagem de definição declarativa |
| ADRs futuras possíveis | ADR de "definition templates" |
| Encaixe | dashboard-definitions, query-definitions |

---

### 7. Pipeline de execução por hooks/middlewares

| Campo | Valor |
|---|---|
| Origem/inspiração | Ciclo de middlewares/hooks do runtime de NocoBase |
| Descrição | Quando houver execução real, modelar o runtime como pipeline de etapas isoláveis (validação → resolução de fonte → dispatch → coleta) |
| Objetivo | Execução observável, testável e extensível por etapa |
| Impacto | Alto — base de toda a Fase 2 |
| Prioridade | média (futuro) |
| Complexidade | alta |
| Maturidade | `Idea` |
| Módulos impactados | `runtime`, `execution-preview`, `delfos-connectors` |
| Dependências | Command envelope (ADR-0015), definição Fase 2 (ADR-0024) |
| Viabilidade | Baixa agora — exige autorização de execução real |
| ADRs futuras possíveis | Extensão da ADR-0014 / ADR-0015 |
| Encaixe | runtime bridge, connectors, execution requests |

---

### 8. Orquestração de execução como grafo de nós

| Campo | Valor |
|---|---|
| Origem/inspiração | Workflow/BPM de NocoBase (gatilhos + nós extensíveis) |
| Descrição | Representar fluxos de execução de analytics (ex.: encadear queries, condicionar passos) como grafo declarativo de nós |
| Objetivo | Automação de pipelines de dados sem código imperativo |
| Impacto | Alto — capacidade enterprise |
| Prioridade | baixa (futuro distante) |
| Complexidade | alta |
| Maturidade | `Idea` |
| Módulos impactados | `runtime`, novo módulo de orquestração |
| Dependências | Execução real, scheduler (fora de escopo hoje, ADR-0007) |
| Viabilidade | Baixa agora — múltiplas pré-condições não atendidas |
| ADRs futuras possíveis | Nova ADR de "execution orchestration" |
| Encaixe | runtime bridge, execution requests, connectors |

---

### 9. Agente de IA como sujeito de ACL auditado

| Campo | Valor |
|---|---|
| Origem/inspiração | AI Employees de NocoBase (cada agente tem papel próprio, é auditado) |
| Descrição | Modelar o futuro AI assistant do Delfos como um ator com papel próprio, permissões e trilha de auditoria — não um bypass de governança |
| Objetivo | IA sob a mesma governança que usuários humanos |
| Impacto | Alto — confiança e compliance |
| Prioridade | média (futuro) |
| Complexidade | média |
| Maturidade | `Idea` |
| Módulos impactados | `users`, `auth`, `audit`, AI assistant futuro |
| Dependências | Modelo de papéis (ADR-0017), auditoria (ADR-0018), ADR-0025 |
| Viabilidade | Média — princípio aplicável quando IA for autorizada |
| ADRs futuras possíveis | Extensão da ADR-0025 |
| Encaixe | AI assistant futuro, execution requests |

---

### 10. Copilot de analytics especializado

| Campo | Valor |
|---|---|
| Origem/inspiração | Agentes de Q&A/análise de NocoBase — generalizados; oportunidade de especializar |
| Descrição | Copilot focado em analytics: interpretar resultados de query, sugerir visualizações, narrar tendências sobre dados já carregados |
| Objetivo | Diferenciação de BI que NocoBase não entrega |
| Impacto | Alto — valor percebido premium |
| Prioridade | média (futuro) |
| Complexidade | alta |
| Maturidade | `Idea` |
| Módulos impactados | AI assistant futuro, `query-definitions`, `dashboard-definitions` |
| Dependências | LLM text-generation (ADR-0025), explainability |
| Viabilidade | Baixa agora — depende de IA autorizada |
| ADRs futuras possíveis | Extensão da ADR-0025 |
| Encaixe | AI assistant futuro, query-definitions, semantic layer futura |

---

### 11. Semantic layer própria de BI

| Campo | Valor |
|---|---|
| Origem/inspiração | Ausência de semantic layer dedicada em NocoBase — lacuna a explorar |
| Descrição | Camada de métricas/dimensões/medidas governadas, reutilizáveis entre queries e dashboards |
| Objetivo | Consistência semântica e diferenciação frente a no-code genérico |
| Impacto | Alto — pilar de produto de BI |
| Prioridade | média (futuro) |
| Complexidade | alta |
| Maturidade | `Research` |
| Módulos impactados | `field-mappings`, `query-definitions`, `datasets` |
| Dependências | Catálogo unificado (ideia 2) maduro |
| Viabilidade | Média — começa declarativa, evolui na Fase 2 |
| ADRs futuras possíveis | Nova ADR de "semantic layer" |
| Encaixe | field-mappings, query-definitions, semantic layer futura |

---

### 12. Catálogo de tipos de connector com contrato estável

| Campo | Valor |
|---|---|
| Origem/inspiração | Separação data source plugin ↔ Data Source Manager em NocoBase |
| Descrição | Definir um contrato de tipo de connector (capabilities, parâmetros, modos suportados) catalogado declarativamente, distinto do executor |
| Objetivo | Adicionar connectors sem alterar o core; catálogo previsível |
| Impacto | Alto — base de integração |
| Prioridade | média (futuro) |
| Complexidade | média |
| Maturidade | `Research` |
| Módulos impactados | `connections`, `delfos-connectors` |
| Dependências | ADR-0008, ADR-0015 (command envelope) |
| Viabilidade | Média — contrato pode ser declarado antes da execução real |
| ADRs futuras possíveis | Extensão da ADR-0008 / ADR-0022 |
| Encaixe | connectors, runtime bridge, execution requests |

---

## Priorização sugerida

| Prioridade | Ideias |
|---|---|
| Alta | 2 (catálogo unificado), 3 (ACL field-level), 5 (filtros globais) |
| Média | 1, 4, 6, 7, 9, 10, 11, 12 |
| Baixa | 8 (orquestração em grafo) |

As ideias de alta prioridade são as **mais viáveis na fase foundation**, pois evoluem modelos
declarativos sem tocar execução real, IA ou infraestrutura assíncrona.

---

## Ver também — roadmaps consolidados

Esta análise de NocoBase é sintetizada, junto com a dos demais produtos,
nos documentos consolidados de `references/consolidated/`. Os roadmaps
temáticos abaixo agregam diretamente as ideias deste produto:

- [`../consolidated/connectors-roadmap.md`](../consolidated/connectors-roadmap.md) — roadmap de connectors e execução
- [`../consolidated/builder-and-ux-roadmap.md`](../consolidated/builder-and-ux-roadmap.md) — roadmap de dashboard/query builder e UX premium
- [`../consolidated/enterprise-governance-roadmap.md`](../consolidated/enterprise-governance-roadmap.md) — roadmap de governança enterprise

Além desses, todos os produtos alimentam os consolidados de visão e síntese:

- [`../consolidated/strategic-product-vision.md`](../consolidated/strategic-product-vision.md) — visão estratégica de produto
- [`../consolidated/product-differentiators.md`](../consolidated/product-differentiators.md) — diferenciais competitivos
- [`../consolidated/future-modules-catalog.md`](../consolidated/future-modules-catalog.md) — catálogo de módulos futuros
- [`../consolidated/priority-matrix.md`](../consolidated/priority-matrix.md) — matriz de prioridade consolidada

---

## Relacionado

- [`./overview.md`](./overview.md)
- [`./architecture.md`](./architecture.md)
- [`./ux-patterns.md`](./ux-patterns.md)
- [`./premium-features.md`](./premium-features.md)
- [`./anti-patterns.md`](./anti-patterns.md)
- [Taxonomia de maturidade](../maturity-taxonomy.md)
- ADR: [`../../adr/adr-0001-phase-1-api-based-data-source.md`](../../adr/adr-0001-phase-1-api-based-data-source.md)
- ADR: [`../../adr/adr-0011-dashboard-builder-and-widget-model.md`](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- ADR: [`../../adr/adr-0017-roles-and-permissions-model.md`](../../adr/adr-0017-roles-and-permissions-model.md)
- ADR: [`../../adr/adr-0024-phase-1-and-phase-2-definition.md`](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- ADR: [`../../adr/adr-0025-llm-assisted-analytics-text-generation.md`](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Índice da biblioteca de referências](../README.md)
