# Lightdash — Arquitetura

> Tipo: referência estratégica · Produto estudado: Lightdash · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

O Lightdash é um **monorepo TypeScript** organizado com `pnpm workspaces` e build orquestrado por `turbo`. A separação de pacotes é a unidade de modularização:

| Pacote | Responsabilidade |
|---|---|
| `packages/common` | Tipos, contratos e modelos compartilhados entre front e back |
| `packages/backend` | Servidor Express, compilação de queries, integração com warehouse |
| `packages/frontend` | UI React (Explores, dashboards, builders) |
| `packages/cli` | CLI npm: `preview`, `validate`, `deploy`, `download`, `upload` |
| `agent-harness` | Capacidades agênticas / orquestração de IA |

O ponto arquitetural relevante: **o contrato semântico vive fora do código da aplicação** — está no projeto dbt do cliente, em YAML. A aplicação é um *compilador/executor* sobre esse contrato, não a dona dele.

---

## Runtime & execution model

O Lightdash adota **push-down de query**:

1. O usuário monta uma exploração na UI (escolhe métricas, dimensões, filtros).
2. O backend **compila** a seleção em SQL específico do dialeto do warehouse.
3. O SQL é executado **no data warehouse do cliente** — o Lightdash não move nem armazena os dados analíticos.
4. O resultado retorna para renderização.

Consequência: o Lightdash não tem "motor de dados" próprio. Performance e escalabilidade de consulta dependem inteiramente do warehouse. O banco operacional (PostgreSQL) guarda apenas metadados, dashboards salvos, usuários e agendamentos.

> Contraste com o Delfos: o `runtime` do Delfos (`adr-0014`) é foundation declarativa de *execution requests* — registra a intenção de execução, sem executar. O Lightdash, por já ser produto maduro, executa de fato. O Delfos ainda está antes desse ponto.

---

## Plugins & extensibilidade

O Lightdash não tem um sistema de plugins de UI aberto. A extensibilidade acontece por **interfaces de acesso à camada semântica**:

- **REST API** — para aplicações próprias consumirem métricas governadas.
- **Python client** — para notebooks e ciência de dados.
- **MCP Server** — expõe a camada semântica como ferramentas para agentes de IA customizados.
- **CLI** — automação de deploy/validação em CI/CD.

A extensibilidade é "headless": o valor está em consumir o modelo semântico de fora, não em injetar código dentro do produto.

---

## Connectors

O Lightdash conecta a **data warehouses SQL**, não a APIs arbitrárias. Conectores suportados incluem warehouses como BigQuery, Snowflake, Redshift, Postgres, Databricks e ClickHouse. A "conexão" tem duas dimensões:

- Conexão ao **warehouse** (onde os dados vivem).
- Conexão ao **projeto dbt** (onde as definições vivem) — via git ou dbt Cloud.

Não existe conceito de connector de fonte via API REST/SaaS — toda fonte precisa estar materializada no warehouse. Essa é uma limitação arquitetural deliberada do modelo.

---

## Cache, filas, workers

- Há **cache de resultados de query** para acelerar dashboards repetidos.
- **Workers/agendadores** processam reports agendados e entregas (Slack/e-mail).
- Filas internas orquestram jobs de validação de conteúdo e refresh.

> Contraste com o Delfos: `adr-0007` define explicitamente **sem cache/Redis na Fase 1**. O modelo de cache/worker do Lightdash é referência conceitual para fases futuras, não para a fundação atual.

---

## Semantic layer

O coração do produto. Características:

- **Métricas e dimensões declaradas em YAML** ao lado dos modelos dbt.
- **Dimensões**: campos para segmentar (geradas automaticamente a partir das colunas dos modelos dbt).
- **Métricas**: cálculos agregados — `count`, `count_distinct`, `sum`, `average`, `min`, `max`, `number` (SQL custom).
- **Joins** definidos no modelo, permitindo explorar dados relacionados sem o usuário escrever JOIN.
- **Sistema de três camadas** que restringe quais tipos de métrica podem referenciar quais — composabilidade controlada para evitar métricas inconsistentes.
- **Conteúdo** (charts, dashboards) também pode pertencer ao mesmo modelo versionado.

A camada semântica é a fronteira de governança: nada chega ao usuário sem passar por ela.

---

## Permissions

- Controle de acesso baseado em papéis (roles), com papéis customizados nos planos Enterprise.
- Visibilidade de SQL controlável (quem pode ver/editar a query gerada).
- Auditoria de ações.
- Workflows opcionais de verificação de conteúdo.
- SSO + SAML + SCIM 2.0 nos planos Enterprise.

---

## Tenancy

O modelo padrão é **um deployment por organização** (self-hosted) ou tenant isolado na Cloud. Dentro de uma organização há *projects* e *spaces* para segmentar conteúdo e acesso. Não é um modelo multi-tenant compartilhado agressivo — a isolação tende a ser por deployment/projeto.

> Contraste com o Delfos: `tenantId` é fronteira de isolamento **obrigatória em toda query** (`adr-0009`). O Delfos é multi-tenant por design; o Lightdash trata isolamento mais por deployment.

---

## Scalability

A escalabilidade de consulta é **delegada ao warehouse**. O Lightdash escala horizontalmente seus próprios serviços (backend stateless + Postgres operacional + workers), mas o gargalo de dados nunca é dele. Deploy de produção via Helm/Kubernetes.

---

## Embedded analytics

O Lightdash oferece embedding de dashboards/charts em aplicações externas, com tokens e controle de acesso. O embedding herda a camada semântica governada — o conteúdo embarcado usa as mesmas métricas auditadas.

---

## APIs

- **REST API** documentada para todo o ciclo (projetos, charts, dashboards, queries).
- **CLI** sobre a API para automação.
- **MCP Server** para IA.
- Consumo programático é cidadão de primeira classe — a UI é só um dos clientes.

---

## AI integration

Posicionamento "Agentic BI": **AI Agents** usam dashboards salvos e a camada semântica como contexto. Características relevantes:

- Cada query do agente passa pela camada semântica governada → consistência e redução de alucinação.
- Visualizações automáticas, integração Slack, memória/aprendizado, controle de acesso.
- Múltiplos agentes por time.
- **Evaluations** para validar respostas do agente.
- Disponível apenas em planos pagos.

> Encaixe Delfos: alinhado com `adr-0025` (LLM-assisted analytics text generation). A lição-chave: a IA deve consumir um modelo semântico governado, nunca SQL livre.

---

## Orchestration

A orquestração relevante é o **fluxo de conteúdo como código**: branch → `lightdash preview` (ambiente efêmero) → `lightdash validate` (CI) → PR/review → merge → `lightdash deploy`. A orquestração de dados em si (transformação) fica no dbt/Airflow, fora do Lightdash.

---

## Relacionado

- [overview.md](./overview.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- ADR: [adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md)
- ADR: [adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- ADR: [adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- ADR: [adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- ADR: [adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
