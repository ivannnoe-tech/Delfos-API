# Cube — Visão geral estratégica

> Tipo: referência estratégica · Produto estudado: Cube · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

**Cube** (Cube.dev, antigo Cube.js) é uma plataforma open-source de **semantic layer / headless BI**. Seu papel não é desenhar telas: é ser a camada intermediária entre as fontes de dados (bancos, data warehouses) e os consumidores (dashboards, aplicações embedded, ferramentas de BI, agentes de IA). Define-se uma vez a lógica de negócio — métricas, dimensões, relacionamentos, regras de acesso — e essa definição é reutilizada por todos os canais de consumo via APIs padronizadas.

A evolução recente do produto (2025–2026) posiciona o Cube como **agentic analytics platform**: a camada semântica deixa de ser apenas um catálogo de métricas e passa a ser o substrato de conhecimento (knowledge graph) sobre o qual agentes de IA executam consultas em linguagem natural com governança.

---

## Objetivo

Cube resolve o problema da **inconsistência de métricas**: quando cada dashboard, relatório ou planilha define "receita líquida" de um jeito diferente, a organização perde confiança nos números. A camada semântica centraliza essas definições em um único modelo versionado, evitando duplicação de lógica de negócio espalhada pelas aplicações.

Objetivos secundários igualmente fortes:

- **Performance previsível** via pre-aggregations (rollups materializados).
- **Acesso governado** — controle de quem vê o quê, com isolamento multi-tenant.
- **Desacoplamento** — o consumidor não conhece o banco; conhece apenas o modelo semântico.

---

## Público-alvo

| Perfil | Uso típico |
|---|---|
| Engenheiros de dados / analytics engineers | Modelam cubes, views, joins, pre-aggregations |
| Times de produto (embedded analytics) | Embarcam dashboards multi-tenant no próprio SaaS |
| Times de BI | Conectam Tableau/Power BI/Excel via SQL API/MDX |
| Times de IA | Conectam agentes/copilots à camada semântica como fonte confiável |

---

## Diferencial

- **Headless por design** — Cube não impõe um frontend; entrega dados via API. (Cube Cloud adicionou frontend próprio, mas o core continua headless.)
- **Camada semântica universal** — uma definição serve BI tradicional, embedded e IA simultaneamente.
- **Pre-aggregations maduras** — um dos sistemas de materialização mais sofisticados do mercado, com particionamento e roteamento de rollup.
- **APIs múltiplas** — REST, GraphQL, SQL (Postgres wire protocol), MDX, Python — o consumidor escolhe o protocolo.
- **AI-ready** — o modelo semântico funciona como contexto estruturado que melhora drasticamente a precisão de text-to-SQL.

---

## Arquitetura geral

```
Fontes de dados (warehouse/DB)
        │
   [ Cube — semantic layer ]
   ├─ Data model (cubes, views, dimensions, measures, joins)
   ├─ Access control (security context, RLS, member-level policies)
   ├─ Caching (in-memory + pre-aggregations em Cube Store)
   └─ API gateway (REST / GraphQL / SQL / MDX)
        │
Consumidores (dashboards, embedded apps, BI tools, AI agents)
```

Componentes-chave: o **API Gateway** recebe consultas, o **query orchestrator** decide se responde via cache, pre-aggregation ou banco original, e o **Cube Store** é o armazenamento dedicado de dados pré-agregados.

---

## Stack

- Core em **Node.js / TypeScript**; Cube Store escrito em **Rust** (motor de armazenamento colunar dedicado).
- Modelos de dados em **YAML** ou **JavaScript** (data modeling dinâmico).
- Deploy: self-hosted (Cube Core, open-source, Apache 2.0) ou **Cube Cloud** (gerenciado, com features enterprise).
- Conectores nativos para dezenas de warehouses/bancos (Snowflake, BigQuery, Postgres, ClickHouse, Databricks etc.).

---

## Pontos fortes

- Consistência de métricas garantida por design (single source of truth).
- Pre-aggregations entregam latência baixa mesmo sobre datasets grandes.
- Multi-tenancy de primeira classe — isolamento via security context.
- APIs múltiplas reduzem atrito de adoção.
- Modelo semântico reutilizável é um ativo estratégico de longo prazo.

---

## Pontos fracos

- Curva de aprendizado real do data modeling (joins, refresh keys, particionamento de rollups).
- Operar pre-aggregations e refresh workers em produção exige maturidade de DevOps.
- A divisão de features entre Core open-source e Cube Cloud pago cria zonas cinzentas.
- Foco em headless significa que UX/visualização ficam por conta do consumidor (não é um BI "pronto").
- Custo de manter o modelo sincronizado quando o schema do warehouse muda.

---

## O que vale estudar

- O **conceito de camada semântica** como contrato versionado entre definição e consumo.
- A separação **cubes (datasets) vs. views (fachada de consumo)**.
- **Pre-aggregations** como padrão de materialização governado.
- **Security context** como mecanismo de isolamento multi-tenant e RLS.
- A ideia de que o **modelo semântico é o contexto que torna IA confiável**.

---

## O que NÃO reproduzir no Delfos

- Não adotar Cube Store/Rust nem qualquer motor de materialização — Delfos é foundation declarativa, sem cache/worker/scheduler (ver `adr-0007-no-cache-redis-phase-1`).
- Não implementar execução real de query nem APIs SQL/GraphQL agora — runtime é futuro e contratual (`adr-0014`, `adr-0015`).
- Não copiar a fragmentação Core/Cloud — Delfos deve manter escopo único e claro.
- Não embarcar um frontend headless; Delfos já tem `delfos-web` como camada de apresentação definida.

---

## Relacionado

- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADRs: [../../adr/adr-0001-phase-1-api-based-data-source.md](../../adr/adr-0001-phase-1-api-based-data-source.md), [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md), [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [Índice da biblioteca de referências](../README.md)
