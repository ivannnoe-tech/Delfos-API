# Apache Superset — Visão Geral Estratégica

> Tipo: referência estratégica · Produto estudado: Apache Superset · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Apache Superset é uma plataforma de Business Intelligence e exploração de dados
open-source, mantida pela Apache Software Foundation (originada no Airbnb em 2015,
graduada como projeto de topo da ASF em 2021). É frequentemente posicionada como
alternativa open-source a Tableau, Looker e Power BI.

A versão atual da linha 6.x (lançada em ciclo 2025/2026) trouxe uma reformulação
visual completa sobre Ant Design v5, dark mode nativo, sistema hierárquico de pastas
para datasets/métricas e controle de acesso baseado em grupos de usuários — sinais de
maturação enterprise de um produto historicamente focado em poder analítico bruto.

O modelo de negócio orbital é relevante para o Delfos: a empresa **Preset** oferece
um SaaS gerenciado sobre o Superset (com `Workspaces` multi-tenant, certificações de
segurança e `AI Assist` text-to-SQL), demonstrando onde está a fronteira entre o
núcleo open-source e a camada premium comercial.

---

## Objetivo do produto

Permitir que organizações conectem fontes de dados existentes (data warehouses,
bancos relacionais, engines OLAP) e construam, sem mover os dados, exploração visual
e dashboards interativos. O princípio central é **não ter camada de ingestão própria**:
o Superset traduz interações de UI em SQL executado diretamente na fonte.

## Público-alvo

| Perfil | Uso típico |
|---|---|
| Analista de dados / engenheiro de BI | SQL Lab, criação de datasets, métricas |
| Usuário de negócio | Consumo de dashboards, filtros nativos, drill-down |
| Administrador de plataforma | RBAC, gestão de conexões, deploy e tuning |
| Time de produto (via Preset/embedded) | Embutir analytics em produtos SaaS |

---

## Diferencial

- **Sem camada de ingestão**: consulta a fonte ao vivo, reduzindo duplicação de dados.
- **Catálogo amplo de visualizações**: 40–50+ tipos de gráficos prontos.
- **SQL Lab**: editor SQL de primeira classe integrado à exploração visual.
- **Extensibilidade por plugins**: gráficos e integrações como pacotes independentes.
- **Cloud-native e horizontalmente escalável**: web stateless + workers Celery.
- **Camada semântica leve**: métricas e colunas calculadas reutilizáveis por dataset.

---

## Arquitetura geral

Superset separa claramente quatro planos:

1. **Plano de aplicação** — backend Flask (Python) + API REST + frontend React.
2. **Plano de metadados** — PostgreSQL/MySQL armazena dashboards, datasets,
   métricas, conexões, permissões. **Não** armazena os dados analíticos do cliente.
3. **Plano assíncrono** — Celery workers + broker (Redis) executam queries longas,
   alertas e relatórios agendados; Celery Beat dispara cron jobs.
4. **Plano de cache** — Redis/Memcached cacheiam resultados de queries e
   metadados para acelerar dashboards.

As fontes de dados são externas e acessadas via SQLAlchemy + drivers DBAPI.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Python, Flask, Flask-AppBuilder, SQLAlchemy |
| Frontend | React, TypeScript, Webpack, Ant Design v5 |
| Metadados | PostgreSQL ou MySQL |
| Assíncrono | Celery, Celery Beat |
| Cache / broker | Redis ou Memcached |
| Conectividade | SQLAlchemy dialects + drivers DBAPI |
| Visualização | ECharts, plugins de chart próprios |

---

## Pontos fortes

- Maturidade e comunidade ativa (governança ASF, releases frequentes).
- Exploração visual poderosa sem precisar mover dados.
- SQL Lab cobre o usuário avançado sem ferramenta externa.
- Arquitetura desacoplada (web stateless) facilita escala horizontal.
- Camada semântica leve evita reescrever SQL repetidamente.
- Custo de licença zero; modelo de extensão por plugins.

## Pontos fracos

- **Multi-tenancy não é nativo** — exige RLS manual por dashboard/slice e não
  suporta múltiplos bancos de metadados por instância (ver `./anti-patterns.md`).
- Gestão de permissões via Flask-AppBuilder é difícil de auditar e visualizar.
- Curva de aprendizado alta; muitas tarefas exigem SQL.
- Sem ETL/preparação de dados — não limpa nem faz join amigável de tabelas.
- Operação em produção (Celery, Redis, tuning) tem custo real apesar de licença grátis.
- Camada semântica é "fina": sem governança forte de métricas como o LookML faz.

---

## O que vale estudar

- Separação rígida entre **metadados** e **dados do cliente**.
- Modelo de **dataset como contrato semântico** (métricas + colunas calculadas).
- **Plano assíncrono** desacoplado para queries longas, relatórios e alertas.
- **Filtros nativos e cross-filtering** como padrão de UX de dashboard.
- **Embedded SDK** com RBAC por dashboard para analytics embarcado.
- Estratégia de **plugins de visualização** versionáveis e independentes.
- Reposicionamento recente em torno de **AI/MCP** (text-to-SQL, tools de IA).

## O que NÃO reproduzir no Delfos

- Multi-tenancy por convenção/RLS — no Delfos `tenantId` já é fronteira de
  isolamento obrigatória e isso deve permanecer estrutural, não opcional.
- Acoplamento da autorização ao Flask-AppBuilder — manter o modelo de roles
  próprio do Delfos (ver `../../adr/adr-0017-roles-and-permissions-model.md`).
- Execução de SQL gerado por interação direto na fonte sem camada de validação —
  o Delfos usa `runtime`/`execution-preview` declarativos e connector bridge.
- Construção de queries por concatenação de string (invariante de segurança Delfos).
- Misturar exploração ad-hoc (SQL Lab) com a fundação declarativa antes de ADR.

---

## Relacionado

- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0001 — Phase 1 API-based data source](../../adr/adr-0001-phase-1-api-based-data-source.md)
- [ADR-0024 — Phase 1 and Phase 2 definition](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [ADR-0011 — Dashboard builder and widget model](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [Índice da biblioteca de referências](../README.md)
