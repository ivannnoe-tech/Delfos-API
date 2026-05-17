# Lightdash — Ideias aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: Lightdash · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este catálogo

Cada ideia é uma subseção `###` com campos padronizados. **Nenhuma ideia aqui autoriza implementação** — são insumos para discussão de roadmap e, quando aplicável, futuras ADRs. Prioridade e complexidade são estimativas estratégicas, não compromissos.

O fio condutor extraído do Lightdash: **camada semântica governada como contrato único**, **governança via versionamento** e **IA ancorada nessa governança**.

---

### 1. Camada semântica como contrato de negócio explícito

| Campo | Valor |
|---|---|
| Origem/inspiração | Semantic layer do Lightdash (métricas/dimensões declaradas) |
| Descrição | Formalizar uma camada semântica do Delfos que unifica `datasets`, `field-mappings` e `query-definitions` num modelo de métricas e dimensões nomeadas, reutilizáveis e descritas em linguagem de negócio |
| Objetivo | Ter um vocabulário de negócio único, evitando que cada dashboard reinvente a mesma métrica |
| Impacto | Alto — base para consistência de todo o produto |
| Prioridade | Alta |
| Complexidade | Alta |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions`, `dashboard-definitions` |
| Dependências | Modelo de dados maduro dos módulos declarativos atuais |
| Viabilidade | Alta — é evolução natural da fundação declarativa |
| ADRs futuras possíveis | "Semantic layer e modelo de métricas/dimensões" |
| Encaixe | datasets · field-mappings · query-definitions · semantic layer futura |

---

### 2. Definições versionadas com histórico e rollback

| Campo | Valor |
|---|---|
| Origem/inspiração | Governança git-based / Dashboards as Code do Lightdash |
| Descrição | Cada definição (`query-definition`, `dashboard-definition`) ganha versionamento interno: histórico de mudanças, autor, diff e rollback — sem exigir que o usuário use git |
| Objetivo | Auditabilidade e recuperação de configuração sem barreira técnica |
| Impacto | Alto — confiança e governança |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `dashboard-definitions`, `report-definitions`, `audit` |
| Dependências | `audit` (já existe), schemas com campo de versão |
| Viabilidade | Alta — Mongo suporta documentos de versão; alinhado a `adr-0018` |
| ADRs futuras possíveis | "Versionamento e rollback de definições" |
| Encaixe | query-definitions · dashboard-definitions · datasets |

---

### 3. Preview de definição antes de promover (foundation declarativa)

| Campo | Valor |
|---|---|
| Origem/inspiração | `lightdash preview` — ambientes efêmeros por branch |
| Descrição | Estender `execution-preview` para validar uma `query-definition`/`dashboard-definition` em estado de rascunho e mostrar como ficaria, antes de marcá-la como publicada |
| Objetivo | Reduzir erro de configuração; separar rascunho de publicado |
| Impacto | Médio-alto |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `execution-preview`, `query-definitions`, `dashboard-definitions` |
| Dependências | Estado de ciclo de vida (draft/published) nos schemas |
| Viabilidade | Alta — `execution-preview` já existe como módulo |
| ADRs futuras possíveis | "Ciclo de vida draft/published de definições" |
| Encaixe | execution-preview · query-definitions · dashboard-definitions |

---

### 4. Validação de conteúdo (detectar definições quebradas)

| Campo | Valor |
|---|---|
| Origem/inspiração | `lightdash validate` — validação de charts/dashboards em CI |
| Descrição | Job declarativo que verifica se `dashboard-definitions` ainda referenciam `query-definitions` e `field-mappings` válidos; reporta artefatos órfãos/quebrados |
| Objetivo | Evitar dashboards apontando para definições inexistentes após mudanças |
| Impacto | Médio-alto |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions`, `query-definitions`, `field-mappings`, `datasets` |
| Dependências | Integridade referencial entre módulos |
| Viabilidade | Alta — é checagem declarativa, sem execução real |
| ADRs futuras possíveis | "Validação de integridade de definições" |
| Encaixe | dashboard-definitions · query-definitions · field-mappings |

---

### 5. Catálogo navegável de métricas (estilo Spotlight)

| Campo | Valor |
|---|---|
| Origem/inspiração | Spotlight do Lightdash — catálogo de métricas |
| Descrição | Tela/endpoint que lista todas as métricas e dimensões disponíveis por tenant, com descrição, owner e status — descoberta sem abrir cada definição |
| Objetivo | Self-service de descoberta; reduzir métricas duplicadas |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Baixa-média |
| Maturidade | `Research` |
| Módulos impactados | `datasets`, `field-mappings`, `query-definitions` |
| Dependências | Metadados descritivos nas definições (descrição, owner) |
| Viabilidade | Alta — leitura agregada sobre dados já existentes |
| ADRs futuras possíveis | Não necessariamente — pode ser feature incremental |
| Encaixe | datasets · field-mappings · semantic layer futura |

---

### 6. Builder no-code de query sobre a camada semântica

| Campo | Valor |
|---|---|
| Origem/inspiração | Explore builder do Lightdash (seleção de campos, sem SQL) |
| Descrição | UI no `delfos-web` onde o usuário monta uma `query-definition` escolhendo dimensões e métricas da camada semântica, sem digitar query |
| Objetivo | Self-service real para usuário de negócio |
| Impacto | Alto |
| Prioridade | Média |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions` (API) · `delfos-web` (UI) |
| Dependências | Ideia 1 (camada semântica), regras de UI do `delfos-web` |
| Viabilidade | Média — depende da camada semântica estar madura |
| ADRs futuras possíveis | "Query builder declarativo no frontend" |
| Encaixe | query-definitions · semantic layer futura · dashboard-definitions |

---

### 7. Filtros globais de dashboard

| Campo | Valor |
|---|---|
| Origem/inspiração | Filtros de dashboard do Lightdash que propagam para tiles |
| Descrição | Modelo declarativo de filtros de nível dashboard que se aplicam a múltiplos widgets que compartilham uma dimensão |
| Objetivo | Interação coerente em painéis multi-widget |
| Impacto | Médio |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `dashboard-definitions` |
| Dependências | `adr-0011` (widget model), camada semântica para validar dimensões |
| Viabilidade | Alta na modelagem declarativa; execução é Fase futura |
| ADRs futuras possíveis | "Modelo de filtros globais de dashboard" |
| Encaixe | dashboard-definitions · query-definitions · semantic layer futura |

---

### 8. Assistente de IA ancorado na camada semântica

| Campo | Valor |
|---|---|
| Origem/inspiração | AI Agents / Agentic BI do Lightdash |
| Descrição | Assistente que responde perguntas escolhendo métricas/dimensões da camada semântica governada — nunca gerando query livre |
| Objetivo | Self-service conversacional sem alucinação de métrica |
| Impacto | Alto |
| Prioridade | Baixa (depende de fundação) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `query-definitions`, `dashboard-definitions`, futuro módulo de IA |
| Dependências | Ideia 1, `adr-0025` |
| Viabilidade | Média — só após camada semântica e runtime maduros |
| ADRs futuras possíveis | "AI assistant sobre camada semântica" (extensão de `adr-0025`) |
| Encaixe | semantic layer futura · AI assistant futuro · query-definitions |

---

### 9. Explainability: rastrear toda métrica até sua definição

| Campo | Valor |
|---|---|
| Origem/inspiração | Visibilidade de SQL + lineage do Lightdash |
| Descrição | Todo número exibido pode ser aberto para mostrar a `query-definition`, os `field-mappings` e o `dataset` que o originaram, com autor e versão |
| Objetivo | Confiança no dado; auditabilidade ponta a ponta |
| Impacto | Médio-alto |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `field-mappings`, `datasets`, `audit` |
| Dependências | Ideia 2 (versionamento), `audit` |
| Viabilidade | Alta — dados de origem já são declarativos |
| ADRs futuras possíveis | "Lineage e explainability de definições" |
| Encaixe | datasets · field-mappings · query-definitions · runtime bridge |

---

### 10. Estado de verificação de conteúdo (selo "verificado")

| Campo | Valor |
|---|---|
| Origem/inspiração | Verification workflows do Lightdash |
| Descrição | Campo de status em definições/dashboards: `draft` / `review` / `verified`, com quem verificou e quando |
| Objetivo | Distinguir conteúdo confiável de experimental |
| Impacto | Médio |
| Prioridade | Baixa |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | `query-definitions`, `dashboard-definitions`, `report-definitions`, `audit` |
| Dependências | `adr-0017` (roles — quem pode verificar) |
| Viabilidade | Alta — é campo de estado + checagem de papel |
| ADRs futuras possíveis | Pode entrar junto da ADR de ciclo de vida (Ideia 3) |
| Encaixe | query-definitions · dashboard-definitions · report-definitions |

---

### 11. Embedded analytics governado

| Campo | Valor |
|---|---|
| Origem/inspiração | Embedded analytics do Lightdash |
| Descrição | Permitir embarcar um `dashboard-definition` em app externo, com token de escopo limitado e isolamento por `tenantId` |
| Objetivo | Distribuir analytics dentro de produtos dos clientes |
| Impacto | Médio |
| Prioridade | Baixa |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | `dashboard-definitions`, `auth`, `tenants` |
| Dependências | Auth real (`adr-0006`), runtime de execução |
| Viabilidade | Baixa no curto prazo — exige auth real e runtime |
| ADRs futuras possíveis | "Embedded analytics e tokens de escopo" |
| Encaixe | dashboard-definitions · runtime bridge · execution requests |

---

### 12. Connector de fonte como contrato plural (não só SQL)

| Campo | Valor |
|---|---|
| Origem/inspiração | Reação ao modelo único push-down SQL do Lightdash |
| Descrição | Manter o modelo de connectors do Delfos explicitamente plural — API, warehouse, on-premise — via `command envelope`, sem assumir um único transporte |
| Objetivo | Não herdar a limitação arquitetural do Lightdash |
| Impacto | Alto (estratégico) |
| Prioridade | Alta |
| Complexidade | Alta |
| Maturidade | `Research` |
| Módulos impactados | `connections`, `connectors`, `runtime` |
| Dependências | `adr-0008`, `adr-0015`, `adr-0012` |
| Viabilidade | Já é a direção do Delfos — esta ideia é reforço de princípio |
| ADRs futuras possíveis | Já coberto por `adr-0008`/`adr-0015`; manter alinhamento |
| Encaixe | connectors · execution requests · runtime bridge |

---

## Síntese de priorização

| Prioridade | Ideias |
|---|---|
| Alta | 1 (camada semântica), 2 (versionamento), 4 (validação de conteúdo), 12 (connectors plurais) |
| Média | 3 (preview de definição), 5 (catálogo), 6 (query builder), 7 (filtros globais), 9 (explainability) |
| Baixa | 8 (IA assistant), 10 (selo verificado), 11 (embedded) |

As ideias 1, 2 e 4 formam um bloco coerente de governança declarativa — boa candidata a primeiro recorte de roadmap pós-fundação, sempre via ADR.

---

## Ver também — roadmaps consolidados

Esta análise de Lightdash é sintetizada, junto com a dos demais produtos,
nos documentos consolidados de `references/consolidated/`. Os roadmaps
temáticos abaixo agregam diretamente as ideias deste produto:

- [`../consolidated/semantic-layer-roadmap.md`](../consolidated/semantic-layer-roadmap.md) — roadmap de camada semântica
- [`../consolidated/builder-and-ux-roadmap.md`](../consolidated/builder-and-ux-roadmap.md) — roadmap de dashboard/query builder e UX premium
- [`../consolidated/enterprise-governance-roadmap.md`](../consolidated/enterprise-governance-roadmap.md) — roadmap de governança enterprise

Além desses, todos os produtos alimentam os consolidados de visão e síntese:

- [`../consolidated/strategic-product-vision.md`](../consolidated/strategic-product-vision.md) — visão estratégica de produto
- [`../consolidated/product-differentiators.md`](../consolidated/product-differentiators.md) — diferenciais competitivos
- [`../consolidated/future-modules-catalog.md`](../consolidated/future-modules-catalog.md) — catálogo de módulos futuros
- [`../consolidated/priority-matrix.md`](../consolidated/priority-matrix.md) — matriz de prioridade consolidada

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [anti-patterns.md](./anti-patterns.md)
- [Taxonomia de maturidade](../maturity-taxonomy.md)
- ADR: [adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- ADR: [adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- ADR: [adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- ADR: [adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- ADR: [adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- ADR: [adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
