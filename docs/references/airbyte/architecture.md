# Airbyte — Arquitetura e Modelo de Execução

> Tipo: referência estratégica · Produto estudado: Airbyte · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

Airbyte divide o sistema em duas camadas conceituais:

1. **Platform** — serviços horizontais de controle, configuração e orquestração.
2. **Connectors** — módulos independentes, versionados e isolados, que falam o
   Airbyte Protocol.

Essa fronteira é o ponto arquitetural mais relevante para o Delfos: a plataforma **não
conhece a implementação** de um conector; conhece apenas o protocolo. Um conector pode ser
trocado, atualizado ou reimplementado em outra linguagem sem tocar na plataforma.

Para o Delfos, isso ecoa a separação já existente entre `delfos-api` (declarativo) e
`delfos-connectors` (contratos + skeleton): o contrato é o produto, a implementação é
substituível.

---

## Runtime & execution model

O runtime do Airbyte é centrado em **jobs** e **workloads**:

| Conceito | Descrição |
|---|---|
| Connection | Vínculo configurado entre uma fonte e um destino, com sync mode e schedule |
| Job | Uma execução de sync (ou check/discover) de uma connection |
| Workload | Unidade discreta executável submetida à Workload API |
| Worker | Processo que consome tarefas e coordena a execução |
| Launcher | Provisiona o container/pod onde o conector roda |

O ciclo: schedule dispara → Temporal cria o workflow → Worker submete workload → Launcher
sobe o conector em container isolado → conector emite mensagens → estado é persistido para
o próximo sync incremental.

**Tradução para o Delfos (futuro, conceitual):** o módulo `runtime` e os `execution
requests` (`adr-0014`) podem se inspirar nesse modelo — uma execução é uma entidade de
primeira classe, com estado, logs e ciclo de vida observável, e não uma chamada síncrona
opaca. O `runtime-connectors command envelope` (`adr-0015`) é o análogo do envelope de
workload do Airbyte.

---

## Plugins & extensibilidade

- **Connector Development Kit (CDK):** framework para criar conectores com estrutura
  padronizada. Python é o caminho principal; há CDKs para TypeScript/JavaScript e C#/.NET.
- **Low-code CDK:** conectores REST descritos em **YAML** declarativo.
- **Connector Builder UI:** interface visual sobre o YAML low-code; permite criar e testar
  um conector sem sair do workspace.
- **Custom components:** pontos de extensão para lógica que o low-code não cobre.

A lição: extensibilidade em **camadas** — declarativo (YAML) para o caso comum, código
para o caso difícil, com o mesmo modelo de execução por baixo.

---

## Connectors

Cada conector:

- É empacotado como **imagem Docker** independente.
- Adere ao **Airbyte Protocol** (mensagens padronizadas: `SPEC`, `CHECK`, `DISCOVER`,
  `READ`/`WRITE`, `STATE`, `LOG`, `TRACE`).
- Expõe um **spec** (schema de configuração) que a UI usa para renderizar formulários.
- Suporta operações: `check` (valida credenciais), `discover` (descobre streams/schema),
  `read`/`write` (move dados).

Sync modes relevantes:

| Modo | Comportamento |
|---|---|
| Full refresh | Reenvia todos os dados do stream a cada sync |
| Incremental append | Envia só dados novos desde o último cursor/state |
| Incremental append + dedup | Novos dados + deduplicação por primary key (modo mais comum) |
| CDC | Captura mudanças do log do banco de origem |

Para o Delfos, **não** se trata de mover dados em massa — mas o conceito de `spec` que
dirige a UI, `check` para validar credenciais e `discover` para catalogar fontes é
diretamente aplicável a `connections`, `credentials` e `datasets`.

---

## Cache, filas, workers

- **Filas/orquestração:** Temporal gerencia filas de tarefas e workflows duráveis com
  retry e estado persistente.
- **Workers:** consomem tarefas; escalam horizontalmente.
- **Cache:** Airbyte não expõe um "cache analítico" — o estado de sync é persistido no
  banco; buffers intermediários são efêmeros.

> Nota Delfos: a fase foundation **não tem** cache/fila/worker (`adr-0007`). Este material
> é referência para uma fase futura; não autoriza introdução de infraestrutura.

---

## Semantic layer

Airbyte **não possui** semantic layer — é EL, não BI. Transformação e modelagem semântica
ficam a cargo do warehouse (dbt, etc.). Para o Delfos, isso reforça que a futura *semantic
layer* é responsabilidade própria (em torno de `field-mappings` e `query-definitions`),
não algo a importar do Airbyte.

---

## Permissions

Na edição Enterprise, Airbyte oferece **RBAC granular** limitando ações por papel (e, em
data planes regionais, por geografia), além de logging imutável append-only e lineage de
transformações. O Delfos já tem um modelo de papéis próprio (`adr-0017`) e estratégia de
auditoria segura (`adr-0018`) — convergente em princípio.

---

## Tenancy

Airbyte organiza recursos por **workspace** (e, no Enterprise, organizations + RBAC).
Não é um modelo multi-tenant tão estrito quanto o do Delfos, onde `tenantId` é fronteira
de isolamento obrigatória (`adr-0009`). A lição é o uso de **data planes regionais** para
isolamento físico, não a estrutura de workspace.

---

## Scalability

- Workers escalam horizontalmente; conectores rodam em pods Kubernetes isolados.
- Temporal garante durabilidade — jobs sobrevivem a reinícios.
- Gargalo conhecido: o custo de subir um container por execução e o overhead de operar
  o stack completo.

---

## Embedded analytics

Airbyte não faz embedded analytics. Há **Airbyte Embedded** voltado a fornecedores que
querem oferecer ingestão de dados *dos seus clientes* dentro do próprio produto — útil
como conceito de "integração white-label de fontes", não de dashboards embarcados.

---

## APIs

- **Config API / Airbyte API:** CRUD de sources, destinations, connections, jobs.
- **Workload API:** submissão de operações discretas de execução.
- **Terraform provider** e SDKs para automação como código.

A lição: toda configuração é acessível por API — a UI é apenas um cliente. O Delfos já
segue isso (`delfos-web` consome `delfos-api`).

---

## AI integration

- **Destinos vetoriais:** conectores para Pinecone, Milvus, Weaviate, com chunking +
  geração de embeddings + indexação como operações integradas do pipeline.
- **PyAirbyte:** expõe conectores a aplicações Python de IA/LLM.
- Posicionamento "AI-ready data": entregar dados prontos para RAG.

Relevante para o Delfos como direção de longo prazo (`adr-0025` — texto analítico
assistido por LLM), mas a entrega de dados para RAG é função de ELT, não do Delfos.

---

## Orchestration

Airbyte **não é** um orquestrador completo de pipelines. Ele agenda e executa syncs, mas
para dependências entre tarefas integra-se com **Airflow, Dagster ou Prefect**. A
fronteira é deliberada: Airbyte faz o EL bem feito; a orquestração ampla fica fora.

Lição para o Delfos: definir com clareza onde termina a responsabilidade do `runtime` e
onde começa um orquestrador externo, evitando reimplementar um motor de workflow.

---

## Relacionado

- [./overview.md](./overview.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [../../adr/adr-0012-local-connectors-agent-and-on-premise-sources.md](../../adr/adr-0012-local-connectors-agent-and-on-premise-sources.md)
- [Índice da biblioteca de referências](../README.md)
