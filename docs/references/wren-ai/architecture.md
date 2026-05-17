# WrenAI — Arquitetura

> Tipo: referência estratégica · Produto estudado: WrenAI · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

WrenAI separa responsabilidades em três serviços de fronteira clara, cada um com
papel único, comunicando-se por API interna:

| Camada | Responsabilidade | Tecnologia |
|---|---|---|
| Wren Engine (Core) | Semantic engine: parse de MDL, reescrita de SQL, conexão a fontes, controle de acesso | Rust + Apache DataFusion |
| Wren AI Service | Orquestração de IA: RAG, geração de SQL/gráfico/resumo, validação | Python |
| Wren UI | Interface: modelagem, chat, dashboards | TypeScript/JS |

Essa modularização é relevante por isolar o *componente determinístico* (motor SQL)
do *componente probabilístico* (IA). O Delfos já pratica separação análoga entre
`delfos-api` (declarativo), `delfos-connectors` (execução futura) e `delfos-web`
(UI) — o aprendizado é manter a IA como camada **opcional e isolável**.

---

## Runtime & execution model

- A pergunta em linguagem natural entra pelo Wren AI Service.
- O serviço monta o contexto (RAG) e gera **WrenSQL** — uma sintaxe lógica compatível
  com ANSI SQL que referencia modelos semânticos, não tabelas físicas.
- O Wren Engine **reescreve** WrenSQL para o dialeto da fonte alvo, injetando
  *joins*, campos calculados e regras de acesso.
- Antes de executar, há **dry-plan validation** — o plano é validado para detectar
  erros sem rodar a query inteira.
- O resultado retorna acompanhado de SQL final, passos e resumo.

> No Delfos, `runtime` e `execution-preview` hoje são **declarativos**. O modelo
> "monta envelope de comando → valida → (futuro) executa" está descrito em
> `adr-0014` e `adr-0015`. WrenAI é referência conceitual de *como* seria o estágio
> de execução, **não autorização** para construí-lo.

## Plugins & extensibilidade

- **Agent SDK**: integração via `wren-langchain` (LangChain/LangGraph) e
  `wren-pydantic` (saídas estruturadas).
- *Bindings* multiplataforma: Python (`wren-engine`) e WebAssembly (`wren-core-wasm`).
- Camada de **skills** para agentes de codificação (onboarding, enriquecimento de
  contexto) — extensibilidade voltada a *workflows* de agentes de IA.
- O Wren Engine é projeto independente, podendo alimentar bots de Slack, extensões
  de IDE e agentes embarcados.

## Connectors

- Conexão a 20+ fontes: PostgreSQL, BigQuery, Snowflake, DuckDB, MySQL, SQL Server,
  Oracle, Databricks etc.
- A "conexão" no WrenAI combina credenciais + metadados; o motor abstrai o dialeto.
- Inclui *value profiling* (perfilamento de valores) para enriquecer contexto.

> Mapeamento Delfos: `connections` (referência de config) + `credentials`
> (`credentialRef`, nunca o segredo) + `datasets`. O Delfos **não** executa conexões
> reais hoje (`adr-0001`, `adr-0012` para fontes on-premise). O aprendizado é o
> **catálogo de fontes desacoplado** do executor.

## Cache, filas, workers

- WrenAI usa um banco vetorial (LanceDB/Qdrant) como memória de *retrieval* de
  exemplos e queries passadas.
- Anúncios recentes do produto incluem **dashboard caching** para evitar re-query.

> Delfos **não** adota cache/fila/worker na fase atual (`adr-0007`). Esta seção é
> puramente informativa.

---

## Semantic layer

O coração do WrenAI. A **MDL** (*Modeling Definition Language*) é um JSON estruturado
e legível que descreve:

- **Models / columns**: entidades de negócio mapeadas a estruturas físicas, com nomes
  e descrições semânticas.
- **Relationships**: 1-1, 1-N, N-1, N-N, com condições de *join* declaradas.
- **Calculated fields**: fórmulas e métricas reutilizáveis, inclusive agregações
  sobre modelos relacionados.
- **Views, cubes, metrics**: agregações e recortes padronizados.
- **Macro functions**: *templates* reutilizáveis (estilo Jinja) para conceitos
  universais.
- **Access control**: regras de acesso por linha e por coluna.

A MDL é versionável e *git-friendly* — funciona como contrato entre humanos e
agentes de IA.

> Encaixe Delfos: a futura camada semântica conversaria com `field-mappings`
> (mapeamento campo↔significado), `datasets` (catálogo) e `query-definitions`
> (definições reutilizáveis). Hoje é **conceitual**.

## Permissions

- Controle de acesso **por linha (RLAC)** e **por coluna (CLAC)** declarado na MDL.
- A reescrita de SQL aplica as regras automaticamente conforme a *persona* do
  usuário.

> Delfos: ver `adr-0017` (papéis e permissões) e `adr-0023` (mascaramento de dados).
> O conceito de aplicar política na **definição**, não no consumo, é alinhado ao
> modelo declarativo do Delfos.

## Tenancy

WrenAI não é primariamente multi-tenant na mesma camada; o isolamento tende a
ocorrer por instância/deployment.

> Delfos diverge fortemente aqui: `tenantId` é **fronteira de isolamento
> obrigatória** em toda query (`adr-0009`). Qualquer ideia importada do WrenAI
> precisa ser re-escopada para multi-tenancy nativa.

## Scalability

- Motor em Rust/DataFusion favorece desempenho de reescrita e *planning*.
- Deploy distribuído possível, mas com limitações operacionais do banco vetorial
  (sem NFS/S3, *backup* limitado).
- Superfície multi-serviço aumenta o custo de escalar horizontalmente.

## Embedded analytics

WrenAI posiciona o Wren Engine como camada de contexto reutilizável — pode alimentar
agentes embarcados e analytics voltados ao cliente final, além da UI própria.

## APIs

- API interna entre os três serviços.
- Agent SDK como API pública para integração programática.
- Skills/CLI para automação por agentes de codificação.

## AI integration

- Pipeline **RAG**: indexa MDL + exemplos + queries passadas em banco vetorial;
  recupera contexto híbrido (semântico + embeddings) por pergunta.
- Suporte a múltiplos provedores de LLM, configurável.
- O LLM recebe **contexto semântico**, nunca dados brutos.
- *Structured error handling*: erros retornam com *hints* corretivos para o agente.

## Orchestration

O Wren AI Service orquestra o ciclo: recuperar contexto → gerar WrenSQL → validar
*dry-plan* → reescrever → executar → resumir. Integração com LangGraph permite
*workflows* de agente com múltiplos passos.

> Delfos: orquestração de execução é futura (`adr-0008`, `adr-0014`, `adr-0015`).
> Manter a IA como passo **isolável e auditável** dentro do envelope de comando.

---

## Relacionado

- [overview.md](./overview.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- ADRs: [adr-0001](../../adr/adr-0001-phase-1-api-based-data-source.md) ·
  [adr-0014](../../adr/adr-0014-runtime-execution-requests-foundation.md) ·
  [adr-0015](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md) ·
  [adr-0017](../../adr/adr-0017-roles-and-permissions-model.md)
