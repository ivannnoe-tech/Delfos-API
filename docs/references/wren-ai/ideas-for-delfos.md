# WrenAI — Ideias Aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: WrenAI · Status: conceitual/futuro — não autoriza implementação

---

Catálogo de ideias inspiradas no estudo do WrenAI, re-escopadas para a realidade do
Delfos (multi-tenant, fase *foundation* declarativa). Nenhuma destas ideias está
autorizada — cada uma exigiria ADR e aprovação explícita antes de qualquer
implementação. Prioridade e complexidade são estimativas para *roadmap*.

---

## Catálogo de ideias

### 1. Camada semântica declarativa (MDL-like) sobre field-mappings

| Campo | Valor |
|---|---|
| Origem/inspiração | MDL (Modeling Definition Language) do Wren Engine |
| Descrição | Formalizar uma camada semântica versionável que descreva entidades de negócio, métricas, relacionamentos e descrições, construída a partir de `field-mappings` e `datasets`. |
| Objetivo | Dar significado de negócio estável aos dados, independente do schema físico. |
| Impacto | Alto — base para text-to-SQL futuro, consistência de métricas e governança. |
| Prioridade | Alta |
| Complexidade | Alta |
| Módulos impactados | `field-mappings`, `datasets`, `query-definitions` |
| Dependências | Modelo de versionamento de definições; decisão de formato (JSON declarativo). |
| Viabilidade | Alta na fase foundation — é declarativo, não exige execução. |
| ADRs futuras possíveis | "Semantic layer foundation"; revisão de `adr-0024`. |
| Encaixe | datasets · field-mappings · query-definitions · semantic layer futura |

---

### 2. Métricas reutilizáveis e versionadas (metric definitions)

| Campo | Valor |
|---|---|
| Origem/inspiração | Métricas pré-construídas e `calculated fields` da MDL |
| Descrição | Catálogo declarativo de métricas nomeadas ("receita líquida", "ticket médio") com fórmula lógica e descrição, reutilizáveis por queries e dashboards. |
| Objetivo | Garantir que cada métrica signifique sempre a mesma coisa em todo o tenant. |
| Impacto | Alto — elimina divergência de números entre dashboards. |
| Prioridade | Alta |
| Complexidade | Média |
| Módulos impactados | `query-definitions`, `dashboard-definitions`, `field-mappings` |
| Dependências | Camada semântica (ideia 1) como base preferencial. |
| Viabilidade | Alta — puramente declarativo. |
| ADRs futuras possíveis | "Metric catalog and definitions". |
| Encaixe | query-definitions · dashboard-definitions · semantic layer futura |

---

### 3. Explainability / proveniência de resultado

| Campo | Valor |
|---|---|
| Origem/inspiração | Explainability do WrenAI (SQL + passos + resumo) |
| Descrição | Toda definição executável carrega metadados de proveniência: qual definição, quais mapeamentos e qual versão semântica a originaram, exibíveis na UI. |
| Objetivo | Confiança e auditabilidade — o usuário vê de onde vem cada número. |
| Impacto | Alto — diferencial de confiança; reforça auditoria. |
| Prioridade | Alta |
| Complexidade | Média |
| Módulos impactados | `query-definitions`, `runtime`, `execution-preview`, `audit` |
| Dependências | Modelo de versionamento; integração com `audit`. |
| Viabilidade | Alta — metadados declarativos, sem execução real. |
| ADRs futuras possíveis | Extensão de `adr-0018`; "result provenance metadata". |
| Encaixe | query-definitions · runtime bridge · execution requests |

---

### 4. Validação de definição estilo "dry-plan"

| Campo | Valor |
|---|---|
| Origem/inspiração | `dry-plan validation` do Wren Engine |
| Descrição | `execution-preview` evolui para validar uma definição contra o catálogo (campos existem, tipos coerentes, mapeamentos resolvidos) antes de qualquer execução futura. |
| Objetivo | Detectar erros de definição cedo, sem custo de execução. |
| Impacto | Médio-alto — qualidade e segurança das definições. |
| Prioridade | Alta |
| Complexidade | Média |
| Módulos impactados | `execution-preview`, `query-definitions`, `datasets` |
| Dependências | Catálogo de datasets/field-mappings consistente. |
| Viabilidade | Alta — alinhado ao escopo declarativo atual de `execution-preview`. |
| ADRs futuras possíveis | Extensão de `adr-0014`. |
| Encaixe | execution requests · runtime bridge · datasets |

---

### 5. Seleção automática de tipo de gráfico

| Campo | Valor |
|---|---|
| Origem/inspiração | Charting engine do WrenAI (gráfico a partir do shape do resultado) |
| Descrição | Heurística declarativa que, dado o shape de uma `query-definition` (dimensões × medidas × tempo), sugere o tipo de visualização adequado. |
| Objetivo | Reduzir fricção na criação de dashboards. |
| Impacto | Médio — melhora UX de criação. |
| Prioridade | Média |
| Complexidade | Média |
| Módulos impactados | `dashboard-definitions`, `query-definitions`, `delfos-web` charts |
| Dependências | `chart_renderer` (`adr-0003`); metadados de shape nas definições. |
| Viabilidade | Média — heurística pode ser declarativa, sem IA. |
| ADRs futuras possíveis | Extensão de `adr-0011`. |
| Encaixe | dashboard-definitions · query-definitions |

---

### 6. Dashboard como coleção de definições com intenção

| Campo | Valor |
|---|---|
| Origem/inspiração | "Pin to dashboard" e dashboard caching do WrenAI |
| Descrição | `dashboard-definitions` referencia `query-definitions` e guarda a *intenção* original (pergunta/objetivo) de cada widget, não só layout. |
| Objetivo | Dashboards autoexplicáveis e reaproveitáveis. |
| Impacto | Médio — clareza e manutenção. |
| Prioridade | Média |
| Complexidade | Baixa |
| Módulos impactados | `dashboard-definitions`, `query-definitions` |
| Dependências | Nenhuma crítica. |
| Viabilidade | Alta — extensão declarativa de schema. |
| ADRs futuras possíveis | Extensão de `adr-0011`. |
| Encaixe | dashboard-definitions · query-definitions |

---

### 7. Controle de acesso por linha/coluna na definição

| Campo | Valor |
|---|---|
| Origem/inspiração | RLAC/CLAC do Wren Engine |
| Descrição | Estender o modelo de permissões para regras de acesso por linha e por coluna declaradas na definição (dataset/field-mapping), avaliadas em execução futura. |
| Objetivo | Governança de dados fina, dentro da fronteira de `tenantId`. |
| Impacto | Alto — requisito enterprise. |
| Prioridade | Média |
| Complexidade | Alta |
| Módulos impactados | `field-mappings`, `datasets`, `users`, `tenants` |
| Dependências | `adr-0017` (papéis); `adr-0023` (mascaramento). |
| Viabilidade | Média — declarável agora; aplicação real é futura. |
| ADRs futuras possíveis | "Row/column level access control"; extensão de `adr-0017`/`adr-0023`. |
| Encaixe | field-mappings · datasets · semantic layer futura |

---

### 8. Catálogo de templates de definições

| Campo | Valor |
|---|---|
| Origem/inspiração | Macro functions e métricas pré-construídas do WrenAI |
| Descrição | Biblioteca de *templates* declarativos de `query-definitions` e dashboards, instanciáveis por tenant com parâmetros. |
| Objetivo | Acelerar *onboarding* e padronizar análises comuns. |
| Impacto | Médio — *time-to-value*. |
| Prioridade | Média |
| Complexidade | Média |
| Módulos impactados | `query-definitions`, `dashboard-definitions`, `tenants` |
| Dependências | Modelo de parametrização de definições. |
| Viabilidade | Alta — declarativo. |
| ADRs futuras possíveis | "Definition templates and instantiation". |
| Encaixe | query-definitions · dashboard-definitions |

---

### 9. Filtros globais como definições versionadas

| Campo | Valor |
|---|---|
| Origem/inspiração | Filtros/transformações de negócio padronizados na MDL |
| Descrição | Recortes ("último trimestre", "por região") como definições nomeadas e versionadas, aplicáveis a múltiplas queries/dashboards. |
| Objetivo | Consistência de recortes e menos estado volátil de UI. |
| Impacto | Médio. |
| Prioridade | Média |
| Complexidade | Baixa |
| Módulos impactados | `query-definitions`, `dashboard-definitions` |
| Dependências | Camada semântica (ideia 1) para vocabulário de campos. |
| Viabilidade | Alta — declarativo. |
| ADRs futuras possíveis | Extensão de `adr-0011`. |
| Encaixe | query-definitions · dashboard-definitions · semantic layer futura |

---

### 10. AI assistant de analytics fundamentado (futuro, gated)

| Campo | Valor |
|---|---|
| Origem/inspiração | Copiloto GenBI / text-to-SQL do WrenAI |
| Descrição | Assistente que, a partir de pergunta em linguagem natural, propõe uma `query-definition` **fundamentada na camada semântica** do tenant — sem nunca enviar dados brutos ao LLM. |
| Objetivo | Reduzir barreira de criação de análises. |
| Impacto | Alto — diferencial estratégico. |
| Prioridade | Baixa (somente após foundation + semantic layer) |
| Complexidade | Alta |
| Módulos impactados | novo módulo de IA, `query-definitions`, `field-mappings`, `audit` |
| Dependências | Ideias 1 e 2; `adr-0025`; provedor de LLM definido. |
| Viabilidade | Baixa no curto prazo — exige semantic layer madura e ADR dedicada. |
| ADRs futuras possíveis | `adr-0025` (base) + "AI assistant grounding and isolation". |
| Encaixe | semantic layer futura · AI assistant futuro · query-definitions |

---

### 11. Memória de exemplos para assistência (RAG governado)

| Campo | Valor |
|---|---|
| Origem/inspiração | *Retrieval* híbrido de exemplos/queries passadas do WrenAI |
| Descrição | Repositório de definições aprovadas como exemplos curados para futura assistência de IA, mantido por tenant e auditável. |
| Objetivo | Aumentar qualidade e consistência da assistência futura. |
| Impacto | Médio. |
| Prioridade | Baixa |
| Complexidade | Alta |
| Módulos impactados | `query-definitions`, novo módulo de IA, `audit` |
| Dependências | Ideia 10; decisão sobre banco vetorial (hoje vetado por `adr-0007`). |
| Viabilidade | Baixa — depende de infraestrutura futura. |
| ADRs futuras possíveis | "Curated examples store for AI assistance". |
| Encaixe | AI assistant futuro · query-definitions |

---

### 12. Erros estruturados com hints corretivos

| Campo | Valor |
|---|---|
| Origem/inspiração | *Structured error handling* do Wren AI Service |
| Descrição | Padronizar erros de validação de definição com *hint* acionável ("campo X não existe; campos próximos: Y, Z"). |
| Objetivo | Acelerar correção pelo usuário e por agentes. |
| Impacto | Médio — UX e produtividade. |
| Prioridade | Média |
| Complexidade | Baixa |
| Módulos impactados | `core/filters`, `execution-preview`, `query-definitions` |
| Dependências | Contrato de erro uniforme já existente em `core/filters`. |
| Viabilidade | Alta — extensão do contrato de erro atual. |
| ADRs futuras possíveis | Nenhuma obrigatória; decisão de design. |
| Encaixe | execution requests · query-definitions |

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [anti-patterns.md](./anti-patterns.md)
- ADRs: [adr-0011](../../adr/adr-0011-dashboard-builder-and-widget-model.md) ·
  [adr-0014](../../adr/adr-0014-runtime-execution-requests-foundation.md) ·
  [adr-0017](../../adr/adr-0017-roles-and-permissions-model.md) ·
  [adr-0024](../../adr/adr-0024-phase-1-and-phase-2-definition.md) ·
  [adr-0025](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
