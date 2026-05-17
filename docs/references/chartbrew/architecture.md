# Chartbrew — Arquitetura

> Tipo: referência estratégica · Produto estudado: Chartbrew · Status: conceitual/futuro — não autoriza implementação

---

## Visão geral

A arquitetura do Chartbrew é cliente-servidor monolítica: uma SPA React consome uma
API Express em Node.js, que persiste metadados em MySQL/PostgreSQL e usa Redis para
cache e tempo real. A execução de consultas contra fontes externas acontece **dentro
do mesmo processo servidor**. Esta seção destrina cada subsistema e contrasta com a
direção do Delfos.

---

## Modularização

O repositório separa `client/` (frontend) e `server/` (backend) como dois projetos
npm. Dentro do servidor, as responsabilidades giram em torno de entidades de
domínio: *projects*, *connections*, *datasets*, *charts*, *dashboards*, *teams*,
*users*. Cada entidade tem rotas, controllers e modelos correspondentes.

A modularização é **orientada a entidade**, não a *bounded context*. Não há camada
de infraestrutura compartilhada formalizada como no Delfos (`src/core/` com filtros,
interceptors, pipes). Para o Delfos, o ponto de estudo é a **clareza das entidades**,
não a estrutura de pastas.

---

## Runtime & execution model

- A execução é **síncrona e acoplada**: o request HTTP do frontend dispara a
  consulta à fonte, espera o resultado, transforma e devolve.
- Resultados são cacheados no Redis com TTL; *refreshes* agendados regravam o cache.
- Não há fila, worker dedicado ou *execution request* como entidade persistida.

O Delfos diverge deliberadamente: `adr-0014` modela *runtime execution requests*
como entidade de primeira classe (foundation declarativa), e `adr-0007` decidiu
**não** usar cache/Redis na Fase 1. O modelo síncrono do Chartbrew é simples mas não
escala para fontes lentas nem para isolamento de tenant.

---

## Plugins & extensibilidade

Chartbrew **não** tem um sistema de plugins formal. Novas fontes de dados são
adicionadas ao núcleo via código (cada conector é um módulo no servidor). A
extensibilidade externa se dá pela **API de reporting** e por **webhooks**, não por
um SDK de plugin.

Para o Delfos, isso reforça o valor de `delfos-connectors` como pacote separado com
contratos explícitos (`src/contracts/`) — uma fronteira de extensão que o Chartbrew
não possui.

---

## Connectors

| Aspecto | Chartbrew | Direção Delfos |
|---|---|---|
| Localização | Embutidos no servidor | Pacote separado `delfos-connectors` |
| Isolamento | Mesmo processo | Skeleton isolado, sem rede/DB ainda |
| Fontes | SQL, NoSQL, REST, GA, Firestore | API-first na Fase 1 (`adr-0001`) |
| On-premise | Não há agente dedicado | Agente local previsto (`adr-0012`) |
| Contrato | Implícito no código | Command/Context/Result/Event (`adr-0015`) |

Conectores do Chartbrew tratam autenticação, paginação e transformação inline. O
Delfos separa o **envelope de comando** do transporte (`adr-0022`), permitindo
execução remota e auditável.

---

## Cache, filas, workers

- **Cache**: Redis guarda resultados de consulta; *snapshots* agendados aquecem o
  cache.
- **Tempo real**: um *Socket Manager* baseado em Redis distribui eventos para o AI
  Orchestrator e atualizações de UI.
- **Filas/workers**: o agendamento de refreshes e snapshots roda no servidor; não há
  uma camada de worker isolada documentada.

O Delfos decidiu adiar cache/Redis (`adr-0007`) e fila/worker para fora da Fase 1.
O *Socket Manager* é uma ideia interessante para tempo real futuro, mas não é
prioridade de foundation.

---

## Semantic layer

Chartbrew **não tem semantic layer**. A "modelagem" mora dentro de cada dataset:
a query bruta, as transformações e o mapeamento de campos são definidos por dataset.
Não há catálogo central de métricas/dimensões nomeadas reutilizáveis entre datasets.

Esse é o **maior gap arquitetural** frente a BIs corporativos. O Delfos tem
oportunidade de planejar `field-mappings` + `query-definitions` evoluindo para um
semantic layer real — métricas nomeadas, governadas e versionadas.

---

## Permissions

O modelo é baseado em **times e papéis de projeto**. Há papéis (owner, admin,
membros) e *client accounts* com acesso restrito a dashboards específicos. As
políticas de compartilhamento foram endurecidas na v5.

É funcional para o caso *client reporting*, mas não é um RBAC enterprise granular. O
Delfos formaliza papéis e permissões em `adr-0017`, com escopo de tenant.

---

## Tenancy

**Não há multi-tenancy forte.** O isolamento é por *projeto* e *time* dentro de uma
mesma instância. Para isolar clientes de verdade, o padrão é separar instâncias ou
projetos. Não existe um `tenantId` como fronteira obrigatória em toda consulta.

O Delfos parte do princípio oposto: `tenantId` é fronteira de isolamento obrigatória
em **toda** query multi-tenant (`adr-0009`). Esta é uma divergência fundamental e
intencional.

---

## Scalability

A escalabilidade vertical é limitada pelo modelo síncrono: consultas pesadas
prendem o processo servidor. O Redis ajuda com cache, mas não há descarregamento de
execução para workers. Escalar horizontalmente exige cuidado com estado de socket.

O Delfos, ao modelar execução assíncrona via *execution requests* e connectors
separados, projeta um caminho de escala mais limpo.

---

## Embedded analytics

Embedding é maduro: dashboards e charts individuais podem ser embedados via iframe,
com parâmetros de URL alimentando variáveis e filtros. *Client accounts* dão acesso
controlado. Snapshots agendados complementam o embed para entrega passiva.

Este é um dos pontos **mais fortes** do produto e vale estudo direto para o futuro
do Delfos (ver `ideas-for-delfos.md`).

---

## APIs

Chartbrew expõe uma **Reporting API** para automação (criar/ler datasets, disparar
refreshes) e **webhooks** para notificações. A API é documentada e serve tanto a
integrações quanto ao próprio cliente React.

O Delfos já é API-first por natureza (`delfos-api` NestJS com Swagger em `/docs`),
então a lição é menos sobre existir e mais sobre **cobertura de automação**.

---

## AI integration

O **AI Orchestrator** é um serviço interno que:

- Recebe **contexto explícito**: projeto, conexão, dataset selecionados.
- Gera datasets, charts e dashboards a partir de linguagem natural.
- Usa a **Responses API** da OpenAI (migrou de chat completions na v5).
- Tem **guardas** ("extra guards") para limitar saídas inválidas.
- Distribui eventos via *Socket Manager* (Redis) para preview em tempo real.
- Expõe uma **integração Slack nativa** — perguntas via menção em canais/threads.

A arquitetura de "contexto explícito + guardas + preview" é um bom modelo de
referência para um futuro AI assistant do Delfos (`adr-0025`).

---

## Orchestration

Não há um orquestrador de pipelines de dados (tipo Airflow). A "orquestração" do
Chartbrew se resume a: agendador de refreshes/snapshots + AI Orchestrator para
geração assistida. Pipelines de transformação complexos não são o foco.

---

## Relacionado

- [./overview.md](./overview.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADR: [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md)
- ADR: [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- ADR: [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- ADR: [../../adr/adr-0022-connector-dispatch-transport.md](../../adr/adr-0022-connector-dispatch-transport.md)
- ADR: [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
