# Cube — Arquitetura

> Tipo: referência estratégica · Produto estudado: Cube · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

Cube separa responsabilidades em camadas bem delimitadas, cada uma com um papel único:

| Camada | Responsabilidade |
|---|---|
| Data model | Define cubes, views, dimensions, measures, joins, segments, hierarchies |
| Query orchestrator | Decide a origem da resposta (cache, pre-aggregation, banco) |
| Caching layer | Cache em memória + pre-aggregations em Cube Store |
| Access control | Security context, row-level security, políticas por membro |
| API gateway | Expõe REST, GraphQL, SQL e MDX |

A força dessa modularização é que **a lógica de negócio vive no data model**, não nas aplicações nem na camada de transporte. Trocar de API não muda a semântica; trocar de banco não muda as métricas.

---

## Runtime & execution model

Uma consulta no Cube nunca é SQL cru do consumidor: é uma **query estruturada** (lista de measures, dimensions, filtros, time dimensions, ordenação). O orchestrator:

1. Resolve o security context (claims do JWT) e injeta filtros obrigatórios.
2. Verifica se há pre-aggregation que cobre a query (rollup matching).
3. Se sim, responde do Cube Store; se não, gera SQL e consulta o banco.
4. Aplica cache em memória para queries repetidas.

O modelo é **declarativo de ponta a ponta**: o consumidor descreve o que quer, o Cube decide como obter.

---

## Plugins & extensibilidade

- **Data modeling dinâmico** em JavaScript — cubes/measures gerados programaticamente em tempo de compilação.
- **`queryRewrite`** — hook que reescreve toda query antes da execução (usado para RLS e filtros de tenant obrigatórios).
- **`COMPILE_CONTEXT`** — permite gerar um modelo de dados diferente por tenant.
- **Drivers de banco** plugáveis, com interface comum.
- **`extends`** no data model — cubes herdam de outros cubes, reduzindo duplicação.

---

## Connectors

Cube usa **drivers** por fonte de dados. Cada driver traduz a query estruturada para o dialeto SQL específico (BigQuery, Snowflake, Postgres, ClickHouse etc.). O consumidor nunca sabe qual banco está por trás — o driver é detalhe de infraestrutura. A fonte é configurada por conexão, e o data model referencia tabelas/queries dessa fonte.

---

## Cache, filas, workers

Sistema de caching em **dois níveis**:

1. **Cache em memória** — ativo por padrão; buffer para queries concorrentes idênticas.
2. **Pre-aggregations** — rollups materializados, opt-in, armazenados em **Cube Store**.

Orquestração: um **Refresh Worker** roda como processo separado, reconstruindo pre-aggregations em background segundo **refresh keys** (baseadas em tempo ou em SQL como `MAX(updated_at)`). Isso evita que a materialização aconteça no caminho crítico da query do usuário. Pre-aggregations suportam **particionamento** (por intervalo de tempo) para refresh incremental.

> Nota Delfos: este modelo é explicitamente fora de escopo na fase foundation (`adr-0007-no-cache-redis-phase-1`).

---

## Semantic layer

O coração do Cube. Conceitos centrais:

- **Cube** — representa um dataset; aponta para uma tabela ou SQL; contém os membros.
- **View** — fachada sobre o grafo de cubes; não tem membros próprios, referencia cubes via caminhos de join; é o que o consumidor vê.
- **Dimension** — atributo de um ponto de dado (status, data, id), tipos string/number/time/boolean.
- **Measure** — agregação (count, sum, avg, max), incluindo calculated measures.
- **Join** — relacionamento entre cubes (one-to-one, one-to-many, many-to-one).
- **Segment** — filtro pré-definido reutilizável.
- **Hierarchy** — agrupamento de dimensões em níveis para drill-down.

A separação **cube vs. view** é estratégica: cubes modelam a realidade do dado; views modelam a experiência de consumo, expondo só o que é relevante para cada caso de uso.

---

## Permissions

Controle de acesso em camadas:

- **Security context** — conjunto verificado de claims sobre o usuário (extraído do JWT). É a base de toda decisão de acesso.
- **Row-level security** — via `queryRewrite`, injeta filtros obrigatórios (ex: `tenant_id = X`) em toda query.
- **Member-level access policies** — controla visibilidade de cubes/measures/dimensions por papel.
- **Data masking** — políticas para ofuscar valores sensíveis.

---

## Tenancy

Dois padrões oficiais de multi-tenancy:

| Padrão | Quando usar |
|---|---|
| `queryRewrite` | Mesmo banco, isolamento por filtro (`tenant_id`) |
| `COMPILE_CONTEXT` | Bancos/schemas diferentes por tenant; modelo de dados distinto |

O tenant é identificado pelo security context. O Delfos já trata `tenantId` como fronteira de isolamento obrigatória — o paralelo é direto e validante.

---

## Scalability

- Cube Store escala horizontalmente como cluster colunar dedicado.
- Refresh Workers escalam separadamente da API.
- Pre-aggregations particionadas permitem refresh incremental sem recomputar tudo.
- API stateless — instâncias atrás de load balancer.

---

## Embedded analytics

Caso de uso central do Cube. Em SaaS multi-tenant, cada cliente vê apenas seus dados: o `queryTransformer`/`queryRewrite` adiciona filtros tenant-aware obrigatórios a **toda** query, de forma que o frontend embarcado nunca precisa (nem pode) controlar isolamento. A camada semântica garante que regras de acesso sejam aplicadas no servidor, não no cliente.

---

## APIs

| API | Uso |
|---|---|
| REST | Aplicações web/mobile |
| GraphQL | Frontends que preferem schema tipado |
| SQL (Postgres wire) | Ferramentas de BI tradicionais (Tableau, Power BI) |
| MDX | Excel e ferramentas OLAP |
| Python | Notebooks, ciência de dados |

Todas consultam **a mesma camada semântica** — consistência garantida independente do protocolo.

---

## AI integration

A camada semântica funciona como **knowledge graph**: nomes de negócio, descrições, relacionamentos e hierarquias dão ao agente de IA o contexto para gerar consultas corretas. Cube D3 expõe agentes (AI Data Analyst, AI Data Engineer) e o Copilot, todos ancorados no modelo semântico — o que reduz alucinação porque o agente consulta métricas definidas, não inventa SQL.

---

## Orchestration

O query orchestrator coordena: roteamento de rollup, fallback para banco, invalidação de cache, agendamento de refresh. É a peça que torna o Cube performático sem que o consumidor precise pensar em performance.

---

## Relacionado

- [./overview.md](./overview.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADRs: [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md), [../../adr/adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md), [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md), [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md)
- [Índice da biblioteca de referências](../README.md)
