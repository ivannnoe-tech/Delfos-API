# Apache Superset — Arquitetura

> Tipo: referência estratégica · Produto estudado: Apache Superset · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

O Superset organiza o backend em torno de Flask-AppBuilder: cada domínio (charts,
dashboards, datasets, databases, SQL Lab) expõe modelos SQLAlchemy, views REST e
permissões. O frontend React é dividido por área funcional (`explore`, `dashboard`,
`SqlLab`, `views/CRUD`), com pacotes de visualização (`superset-ui`) publicados de
forma independente.

A lição estratégica é a **separação por capacidade**, não por camada técnica. No
Delfos isso já é refletido na estrutura `src/modules/<name>/` com `controllers/`,
`services/`, `repositories/`, `schemas/`, `dto/` — manter essa simetria por módulo.

---

## Runtime & execution model

O fluxo de execução do Superset é, em essência, **interação de UI → AST/JSON de
query → SQL → execução na fonte → resultado cacheado**.

| Etapa | Responsável |
|---|---|
| Captura de intenção | Explore view / SQL Lab (frontend) |
| Tradução para query object | Backend (query context) |
| Geração de SQL | SQLAlchemy + dialeto do banco |
| Execução | Síncrona (web) ou assíncrona (Celery worker) |
| Resultado | Cache (Redis) + entrega ao frontend |

Queries curtas rodam no processo web; queries longas vão para Celery. No Delfos esse
modelo é apenas conceitual: a execução real é **futura** e mediada por `runtime` +
connector bridge (ver `../../adr/adr-0014-runtime-execution-requests-foundation.md`
e `../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md`).

---

## Plugins & extensibilidade

Visualizações são plugins: cada chart é um pacote com metadata, controles e
componente de render. O `ChartPlugin` registra-se em um `ChartControlPanel`. Isso
permite adicionar tipos de gráfico sem tocar no core.

Paralelo direto com o Delfos: o `chart_renderer.dart` (ver
`../../adr/adr-0003-chart-renderer-abstraction.md`) já abstrai a biblioteca de
gráficos — features nunca importam `fl_chart`/`graphic` diretamente. A ideia do
Superset reforça tratar **tipos de visualização como catálogo extensível**, não como
código hardcoded.

---

## Connectors

O Superset conecta-se a fontes via SQLAlchemy dialects + drivers DBAPI. Cada
`Database` guarda uma connection string (com credenciais) no banco de metadados,
criptografada. Não há agente local: o web server fala diretamente com a fonte.

Diferenças críticas para o Delfos:

- Delfos **nunca** guarda connection string — usa `connectionId` (referência de
  config) e `credentialRef` (referência segura, nunca o segredo).
- A execução futura será via `delfos-connectors` (skeleton TS, sem runtime real),
  incluindo agente local para fontes on-premise
  (ver `../../adr/adr-0012-local-connectors-agent-and-on-premise-sources.md`).

---

## Cache, filas, workers

- **Cache**: Redis/Memcached para resultados de query e metadados.
- **Broker + workers**: Celery executa queries assíncronas, alertas e relatórios.
- **Scheduler**: Celery Beat dispara jobs cron (relatórios agendados).

No Delfos, **nada disso existe na fase foundation** — sem cache, fila, worker ou
scheduler (ver `../../adr/adr-0007-no-cache-redis-phase-1.md`). É material
conceitual para Fase 2, condicionado a ADR.

---

## Semantic layer

A camada semântica do Superset é **leve**: o objeto `Dataset` agrega colunas,
métricas (expressões SQL agregadas reutilizáveis) e colunas calculadas. Há um SIP
(proposta) para evoluir isso com uma interface `Explorable` e classes de conexão
para camadas semânticas externas.

Comparação:

| Aspecto | Superset | Delfos (futuro) |
|---|---|---|
| Unidade | `Dataset` | `datasets` + `field-mappings` |
| Métricas | Expressão SQL no dataset | `query-definitions` declarativas |
| Governança | Fraca (sem versão/aprovação) | A definir — oportunidade de ADR |

---

## Permissions

Autorização via Flask-AppBuilder: roles agregam permissões granulares
(`can_read on Chart`, etc.). Row-Level Security (RLS) aplica filtros por
dataset/role. A linha 6.x adicionou **grupos de usuários** para simplificar.

O Delfos tem modelo de roles próprio
(`../../adr/adr-0017-roles-and-permissions-model.md`) — não acoplar a um framework
de UI. RBAC deve ser do domínio, testável e auditável.

---

## Tenancy

Superset **não tem multi-tenancy nativo**: a prática comum é RLS manual por
dashboard/slice, ou instâncias separadas. A linha 6.x introduziu prefixo de URL
(`/analytics`) para deploys multi-tenant mais limpos, mas a isolação ainda não é
estrutural.

No Delfos, `tenantId` é fronteira de isolamento **obrigatória em toda query
multi-tenant** — nunca um filtro opcional
(ver `../../adr/adr-0009-deployment-isolation-and-tenant-model.md`).

---

## Scalability

O web server é stateless → escala horizontalmente atrás de load balancer. Workers
Celery escalam independentes. Gargalos típicos: banco de metadados único e a fonte
de dados subjacente. Cache mitiga, mas não elimina.

---

## Embedded analytics

O **Embedded SDK** permite embutir dashboards em apps externos com RBAC por
dashboard e tokens de convidado (guest token). Estado de filtro é propagado via
permalinks. É a base do produto Preset Workspaces.

Para o Delfos, embedded analytics é tema de Fase 2+ — interessante como visão de
produto, mas exige ADR de segurança (escopo de tenant no token embarcado).

---

## APIs

Superset expõe API REST documentada (OpenAPI/Swagger) para CRUD de dashboards,
charts, datasets, e execução de queries. O Delfos já segue padrão similar: NestJS
com Swagger em `/docs`, contrato de erro uniforme via `HttpExceptionFilter`.

## AI integration

Movimento recente (2025/2026): abstrações de **Model Context Protocol (MCP)** no
core do Superset, permitindo que extensões registrem tools de IA. Preset oferece
`AI Assist` (text-to-SQL). No Delfos, geração de texto assistida por LLM é tratada
em `../../adr/adr-0025-llm-assisted-analytics-text-generation.md` — conceitual.

## Orchestration

Não há orquestrador de pipelines no Superset (é consumidor, não ETL). Celery Beat
cobre apenas agendamento de relatórios/alertas. Orquestração de dados é delegada a
ferramentas externas (Airflow, dbt).

---

## Relacionado

- [overview.md](./overview.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0003 — Chart renderer abstraction](../../adr/adr-0003-chart-renderer-abstraction.md)
- [ADR-0008 — Connectors and integration execution](../../adr/adr-0008-connectors-and-integration-execution.md)
- [ADR-0014 — Runtime execution requests foundation](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [ADR-0015 — Runtime connectors command envelope bridge](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [ADR-0007 — No cache/Redis Phase 1](../../adr/adr-0007-no-cache-redis-phase-1.md)
- [ADR-0009 — Deployment isolation and tenant model](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- [ADR-0017 — Roles and permissions model](../../adr/adr-0017-roles-and-permissions-model.md)
