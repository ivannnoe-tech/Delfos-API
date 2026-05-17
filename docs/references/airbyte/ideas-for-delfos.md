# Airbyte — Ideias Aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: Airbyte · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este catálogo

Cada ideia abaixo é uma **inspiração estratégica**, não um item de backlog. Nenhuma
autoriza implementação. Itens que tocam connectors reais, runtime real, cache/fila/worker
ou execução real exigem ADR e autorização explícita conforme o estado foundation do
projeto. As ideias estão ordenadas aproximadamente por relevância para os pilares
**connectors / runtime / orchestration**, que são o foco do estudo do Airbyte.

---

### 1. Connector Spec declarativo dirige a UI

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Airbyte `spec` + Connector Builder (UI gerada a partir do schema) |
| Descrição | Cada conector publica um `spec` declarativo (schema de configuração e credenciais); a UI de configuração é renderizada a partir dele, não codificada por fonte |
| Objetivo | Eliminar telas hard-coded por conector; novo conector = novo spec |
| Impacto | Reduz custo marginal de cada fonte; consistência de UX |
| Prioridade | Alta |
| Complexidade | Média |
| Módulos impactados | `connections`, `credentials`, `delfos-connectors`, `delfos-web` |
| Dependências | Formato de spec versionado; renderizador de formulário schema-driven no web |
| Viabilidade | Alta — é declarativo, alinhado à fase foundation |
| ADRs futuras possíveis | "Connector spec format & schema-driven config UI" |
| Encaixe | connectors, datasets, field-mappings |

---

### 2. Protocolo estável e versionado plataforma↔connector

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Airbyte Protocol (contrato de mensagens entre platform e connectors) |
| Descrição | Formalizar um contrato versionado entre `delfos-api`/`runtime` e `delfos-connectors`, com mensagens tipadas (spec, check, discover, execute) |
| Objetivo | Permitir evoluir conectores sem quebrar a plataforma |
| Impacto | Estabilidade arquitetural de longo prazo |
| Prioridade | Alta |
| Complexidade | Média |
| Módulos impactados | `runtime`, `delfos-connectors` (contracts), `execution-preview` |
| Dependências | Versionamento de contrato; testes de compatibilidade |
| Viabilidade | Alta — `delfos-connectors` já é "contratos + skeleton" |
| ADRs futuras possíveis | Extensão de `adr-0015` (command envelope) |
| Encaixe | runtime bridge, connectors, execution requests |

---

### 3. Operações `check` e `discover` para fontes

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Airbyte `check` (valida credenciais) e `discover` (descobre streams/schema) |
| Descrição | Conector expõe `check` para validar uma `connection`/`credentialRef` e `discover` para catalogar datasets/campos disponíveis na fonte |
| Objetivo | Configuração guiada e validada; catálogo gerado, não digitado |
| Impacto | Menos erro de configuração; datasets/field-mappings semiautomáticos |
| Prioridade | Alta |
| Complexidade | Média |
| Módulos impactados | `connections`, `credentials`, `datasets`, `field-mappings` |
| Dependências | Conectores reais (futuro — exige autorização); na foundation, só contrato |
| Viabilidade | Média — contrato agora, execução real depois de ADR |
| ADRs futuras possíveis | "Source check & discover operations" |
| Encaixe | datasets, field-mappings, connectors, execution-preview |

---

### 4. Execução como entidade de primeira classe (jobs/workloads)

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Modelo job/workload do Airbyte (execução com estado, logs, ciclo de vida) |
| Descrição | Toda execução de query/relatório é uma entidade observável com status, timestamps, logs e resultado — não uma chamada síncrona opaca |
| Objetivo | Observabilidade, retry, auditoria e diagnóstico de execuções |
| Impacto | Confiabilidade operacional; base para alertas |
| Prioridade | Alta |
| Complexidade | Alta |
| Módulos impactados | `runtime`, `execution-preview`, `audit` |
| Dependências | Modelo de estado de execução; futura fila/worker (fora da foundation) |
| Viabilidade | Média — desenho agora, runtime real exige `adr-0014`/autorização |
| ADRs futuras possíveis | Extensão de `adr-0014` (execution requests) |
| Encaixe | runtime bridge, execution requests |

---

### 5. Connector/Query Builder no-code com test embutido

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Connector Builder UI + stream tester ("Test" lado a lado) |
| Descrição | Builder visual de `query-definitions`/`dashboard-definitions` com preview/teste imediato do resultado ao lado da configuração |
| Objetivo | Feedback imediato; reduzir ciclo configurar→ver resultado |
| Impacto | Produtividade e confiança do usuário configurador |
| Prioridade | Alta |
| Complexidade | Média |
| Módulos impactados | `query-definitions`, `dashboard-definitions`, `execution-preview`, `delfos-web` |
| Dependências | `execution-preview`; Design System de builders |
| Viabilidade | Alta — `execution-preview` já existe na foundation |
| ADRs futuras possíveis | Extensão de `adr-0011` (dashboard builder) |
| Encaixe | query-definitions, dashboard-definitions, execution requests |

---

### 6. Modelo de erro estruturado e classificado

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Error handlers do Connector Builder (classifica por status/corpo/headers; decide continuar/repetir/falhar) |
| Descrição | Erros de execução classificados (transitório vs permanente, fonte vs config) com política explícita de retry |
| Objetivo | Diagnóstico claro; retry só do que faz sentido |
| Impacto | Menos falhas opacas; melhor `DelfosErrorState` |
| Prioridade | Média |
| Complexidade | Média |
| Módulos impactados | `runtime`, `core/filters`, `delfos-web` (error states) |
| Dependências | Taxonomia de erros; contrato de erro já existente em `core` |
| Viabilidade | Alta |
| ADRs futuras possíveis | "Execution error taxonomy & retry policy" |
| Encaixe | runtime bridge, connectors, execution requests |

---

### 7. Sync incremental por cursor / estado por definição

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Sync modes incremental + state por stream do Airbyte |
| Descrição | Execuções podem persistir um cursor/estado para reprocessar só o que mudou desde a última execução |
| Objetivo | Eficiência; evitar recomputar dados estáveis |
| Impacto | Custo de execução menor em fases futuras com runtime real |
| Prioridade | Média |
| Complexidade | Alta |
| Módulos impactados | `query-definitions`, `runtime` |
| Dependências | Execução real (fora da foundation); modelo de estado por definição |
| Viabilidade | Baixa na foundation — conceito de longo prazo |
| ADRs futuras possíveis | "Incremental execution & cursor state" |
| Encaixe | query-definitions, runtime bridge, execution requests |

---

### 8. Timeline imutável de execuções

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Connection timeline + logging imutável append-only do Airbyte |
| Descrição | Histórico auditável e imutável de cada execução por definição/tenant, navegável da visão agregada ao log detalhado |
| Objetivo | Auditoria, confiança operacional, diagnóstico |
| Impacto | Transparência; suporte a compliance LGPD |
| Prioridade | Média |
| Complexidade | Média |
| Módulos impactados | `audit`, `runtime`, `delfos-web` |
| Dependências | Estratégia de auditoria já existente (`adr-0018`) |
| Viabilidade | Alta — alinhado a `adr-0018` |
| ADRs futuras possíveis | Extensão de `adr-0018` |
| Encaixe | runtime bridge, execution requests |

---

### 9. Extensibilidade em camadas (declarativo → código)

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | CDK em camadas: YAML low-code → custom components → CDK completo |
| Descrição | Conectores Delfos cobrem o caso comum por configuração declarativa e abrem pontos de extensão por código só quando necessário |
| Objetivo | Equilíbrio entre acessibilidade e poder |
| Impacto | Catálogo de conectores cresce sem inchar a plataforma |
| Prioridade | Média |
| Complexidade | Alta |
| Módulos impactados | `delfos-connectors`, `runtime` |
| Dependências | Modelo declarativo de conector (ideia 1) maduro primeiro |
| Viabilidade | Média — direção de design para `delfos-connectors` |
| ADRs futuras possíveis | "Layered connector extensibility model" |
| Encaixe | connectors, runtime bridge |

---

### 10. Métricas e alertas de execução desde o desenho

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Métricas Prometheus + alertas de falha/latência do Airbyte |
| Descrição | O `runtime` emite métricas de execução (duração, sucesso, latência) e dispara alertas operacionais por regra |
| Objetivo | Observabilidade nativa, não retroajustada |
| Impacto | Operação confiável de fases futuras |
| Prioridade | Média |
| Complexidade | Média |
| Módulos impactados | `runtime`, `health`, `audit` |
| Dependências | Modelo de execução como entidade (ideia 4) |
| Viabilidade | Média |
| ADRs futuras possíveis | "Runtime observability & operational alerts" |
| Encaixe | runtime bridge, execution requests |

---

### 11. Catálogo curado de conectores (vs. comunidade aberta)

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Catálogo de 600+ conectores do Airbyte — e os problemas de qualidade desigual |
| Descrição | Delfos mantém um catálogo de conectores **curado e versionado**, com níveis de certificação, em vez de aceitar contribuições não revisadas |
| Objetivo | Garantir isolamento de tenant e segurança de credenciais |
| Impacto | Confiabilidade; reduz superfície de risco |
| Prioridade | Média |
| Complexidade | Baixa (processo) / Média (tooling) |
| Módulos impactados | `connections`, `delfos-connectors`, governança |
| Dependências | Modelo de spec (ideia 1) |
| Viabilidade | Alta — é decisão de governança |
| ADRs futuras possíveis | "Connector catalog curation & certification levels" |
| Encaixe | connectors, datasets |

---

### 12. Separação control plane / data plane para credenciais

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Data planes regionais do Airbyte (credenciais e logs ficam locais) |
| Descrição | Futuro: a execução que toca credenciais reais roda num plano isolado por tenant/região; o control plane só vê referências |
| Objetivo | Soberania de dados e isolamento físico de segredos |
| Impacto | Conformidade LGPD; reforço do invariante `credentialRef` |
| Prioridade | Baixa (longo prazo) |
| Complexidade | Alta |
| Módulos impactados | `credentials`, `runtime`, deployment |
| Dependências | Execução real; `adr-0021` (decryption futura) |
| Viabilidade | Baixa na foundation — visão de arquitetura futura |
| ADRs futuras possíveis | Extensão de `adr-0009`, `adr-0019`, `adr-0021` |
| Encaixe | connectors, runtime bridge, semantic layer futura |

---

## Síntese

As ideias de maior valor imediato são **declarativas e alinhadas à foundation**: spec de
conector dirigindo a UI (1), protocolo versionado (2) e builder com test embutido (5). As
demais (4, 7, 10, 12) dependem de runtime/execução real e só avançam com ADR e autorização
explícita.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
