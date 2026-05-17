# Metabase — Arquitetura

> Tipo: referência estratégica · Produto estudado: Metabase · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

O backend Clojure é organizado por **módulos como namespaces** no padrão `metabase.<module>.core`.
Cada módulo declara uma fronteira de API explícita e suas dependências entre módulos são
**validadas estaticamente por `clj-kondo`** — um módulo só pode importar o que outro expõe.

Esse padrão é diretamente análogo ao do `delfos-api`, onde cada feature em `src/modules/<name>/`
segue a mesma estrutura interna (`controllers/`, `services/`, `repositories/`, `schemas/`, `dto/`).
A lição transferível é: **fronteiras de módulo verificadas por ferramenta**, não apenas por convenção.

| Conceito Metabase | Equivalente Delfos |
|---|---|
| Namespace `metabase.<module>.core` | Módulo `src/modules/<name>/<name>.module.ts` |
| Fronteira validada por `clj-kondo` | Fronteira validada por ESLint + estrutura de imports |
| MBQL como IR de query | Contrato de execução runtime/connectors (futuro) |

---

## Runtime & execution model

Fluxo de execução de uma query no Metabase:

1. Frontend monta a query como **MBQL** (estrutura de dados, não string SQL) via `metabase-lib`.
2. Backend recebe o MBQL, aplica permissões, sandboxing e limites.
3. O **driver** do banco-alvo traduz MBQL → SQL nativo (ou chamada à API da fonte).
4. O resultado retorna normalizado para o frontend renderizar.

O ponto-chave: a **query nunca é construída por concatenação de string na UI** — é sempre uma
estrutura de dados validável. Esse princípio é um invariante explícito do Delfos
("nunca construir requests por concatenação de string").

> No Delfos, `query-definitions` armazena definições declarativas; a execução real é **futura**
> e mediada pelo bridge runtime↔connectors (ADR-0015). MBQL é uma boa referência conceitual
> para o formato dessas definições.

---

## Plugins & extensibilidade

A extensibilidade primária do Metabase é o **sistema de drivers**: cada tipo de banco é um driver
que implementa um contrato comum. Drivers podem ser oficiais ou de terceiros, carregados como
plugins. Visualizações e algumas integrações também seguem padrões de extensão.

Lição: um **contrato de adapter estável** permite adicionar fontes sem tocar no core. É exatamente
a tese do `delfos-connectors` (skeleton TS com contratos em `src/contracts/`).

---

## Connectors

No Metabase, "connector" = driver de banco. O driver:

- Declara capacidades (features suportadas: agregações, joins, funções).
- Traduz MBQL para o dialeto nativo.
- Gerencia o pool de conexão com o banco do cliente.

| Aspecto | Metabase (driver) | Delfos (`delfos-connectors`, futuro) |
|---|---|---|
| Contrato | Interface de driver Clojure | `src/contracts/` (command/context/result/event/error) |
| Execução | SQL nativo via JDBC | `execute`/`export` retornam `not_supported` (skeleton) |
| Segurança | Permissões + sandboxing no backend | Forbidden-field detection, sanitização de metadados |
| Estado atual Delfos | — | Skeleton seguro, sem rede/DB/arquivo |

---

## Cache, filas e workers

- Metabase oferece **cache de resultados de query** configurável (por banco, por dashboard, TTL).
- Subscriptions e alerts dependem de um **scheduler** interno que dispara envios periódicos.
- Não há um sistema pesado de filas/workers distribuídos por padrão — é um monólito.

> O Delfos **não tem** cache/fila/worker/scheduler na fase atual (ADR-0007 decidiu não usar
> Redis na Fase 1). Metabase mostra o custo de adicionar isso cedo: complexidade operacional.
> A recomendação é manter a decisão do ADR-0007 e revisitar só quando houver execução real.

---

## Semantic layer

A camada semântica do Metabase é composta por:

- **Models** — "tabelas derivadas" curadas, ponto de partida para novas Questions.
- **Metrics** — cálculos/agregações reutilizáveis (revenue, churn, active users) definidos uma vez.
- **Semantic types** — tipos semânticos de coluna (e-mail, moeda, latitude) que orientam UI e X-rays.

É uma camada **leve** — não substitui ferramentas dedicadas como dbt/Cube. Mesmo assim, fornece
um "mapa compartilhado da lógica de negócio".

> Encaixe Delfos: `datasets` + `field-mappings` + `query-definitions` já são os blocos de uma
> semantic layer futura. Models ≈ datasets curados; Metrics ≈ definições de agregação reutilizáveis;
> semantic types ≈ enriquecimento de `field-mappings`.

---

## Permissions

Metabase usa **grupos de usuários** e permissões por banco/coleção. Edições pagas adicionam:

- **Row-level security** (sandboxing): filtra linhas por atributo do usuário.
- **Column-level security**: oculta colunas sensíveis.
- Integração com **SSO** para herdar atributos de identidade.

O multi-tenancy do Metabase é, na prática, **emulado por permissões + sandboxing** — não há
`tenantId` como fronteira de modelo.

---

## Tenancy

| Modelo | Metabase | Delfos |
|---|---|---|
| Isolamento | Permissões/sandboxing sobre instância compartilhada | `tenantId` obrigatório em toda query |
| Embedding multi-tenant | Via parâmetros assinados / SDK | Modelo multi-tenant nativo (ADR-0009) |
| Risco | Vazamento se permissão mal configurada | Isolamento estrutural reduz superfície de erro |

O Delfos trata tenancy como **invariante de base**. Metabase é o contra-exemplo útil: mostra
por que isolamento deve ser estrutural, não configuracional.

---

## Scalability

- Monólito JAR escala verticalmente bem; escala horizontal exige réplicas + banco de aplicação compartilhado.
- Gargalos conhecidos: fan-out de queries internas, Data Model lento em bancos grandes.
- Cache de resultados é a principal alavanca de performance.

---

## Embedded analytics

Três modos de embedding:

1. **Static embedding** — dashboards/questions via iframe com parâmetros assinados.
2. **Interactive embedding** — experiência completa white-label, multi-tenant (pago).
3. **Modular embedding SDK** — componentes React isolados (chart, dashboard, query builder, AI chat).

Ver `./premium-features.md` para detalhes de valor.

---

## APIs

Metabase expõe uma **REST API** abrangente (a mesma usada pelo frontend). É poderosa, mas algumas
rotas sofrem de fan-out (centenas de queries SQL por request). Lição para o Delfos: manter
contratos de leitura **previsíveis e paginados** — o `delfos-api` já tem DTOs de paginação compartilhados.

---

## AI integration

**Metabot** é o assistente de IA: linguagem natural → query/SQL → gráfico. Em 2025 adotou um
processo agêntico de duas etapas (QueryDesigner + QueryArchitect). Roda no Metabase AI service
ou com API key de provedor próprio. Detalhes em `./premium-features.md`.

> Encaixe Delfos: o ADR-0025 (LLM-assisted analytics text generation) é o ponto de ancoragem para
> qualquer copiloto futuro. Metabot é boa referência de UX, não de arquitetura.

---

## Orchestration

Não há orquestração distribuída nativa. Scheduler interno cuida de subscriptions/alerts/cache
refresh. Para cargas pesadas, recomenda-se otimizar no banco do cliente, não no Metabase.

---

## Relacionado

- [./overview.md](./overview.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
