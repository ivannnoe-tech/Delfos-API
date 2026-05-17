# Vanna AI — Arquitetura

> Tipo: referência estratégica · Produto estudado: Vanna AI · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

Vanna 0.x é construído por **composição de classes abstratas**. O núcleo é `VannaBase`, que define a interface mínima. O desenvolvedor escolhe uma implementação de LLM (ex.: `OpenAI_Chat`) e uma de vector store (ex.: `ChromaDB_VectorStore`) e cria uma subclasse que herda das duas via mixin. Isso torna cada peça substituível sem tocar o resto.

Vanna 2.0 reorganiza tudo em torno de três abstrações principais:

| Abstração | Responsabilidade |
|---|---|
| `Agent` | Orquestra a conversa: chama LLM, decide tools, streama resposta |
| `LlmService` | Contrato do modelo: request não-streaming, streaming, validação de tool schema |
| `AgentMemory` | Armazena e recupera padrões de uso de tools (memória de longo prazo) |
| `Tool` / `Tool Registry` | Operações executáveis (`RunSqlTool` e subclasses customizadas) |
| `UserResolver` | Extrai identidade do request e injeta contexto em todas as camadas |

---

## Runtime & execution model

O fluxo de execução do Vanna 2.0: `User → Web Component → Server → Agent → Tools → Database`.

1. O request chega com identidade (cookie/JWT/OAuth) resolvida pelo `UserResolver`.
2. O `Agent` recebe a pergunta + contexto de usuário/workspace.
3. O Agent consulta o vector store (retrieval) e monta o prompt para o `LlmService`.
4. O LLM pode decidir invocar uma `Tool` (ex.: `RunSqlTool` executa o SQL gerado).
5. O resultado é streamado de volta como tabela, gráfico Plotly e/ou resumo NL.

No 0.x o modelo é mais simples e síncrono: `ask()` → retrieve → prompt → LLM → SQL → `run_sql()` opcional → plot opcional.

---

## Plugins & extensibilidade

A extensibilidade é o ponto mais forte da arquitetura. Para suportar um novo componente, basta implementar a classe abstrata correspondente:

- Novo LLM → implementar `LlmService` (3 métodos).
- Novo vector store → implementar a interface de retrieval.
- Nova operação → subclasse de `Tool`, registrada no `Tool Registry`.
- Memória própria → implementar `AgentMemory`.

O `Tool Registry` permite **group-based access control**: tools podem ser expostas a grupos específicos de usuários, restringindo o que cada perfil pode invocar.

---

## Connectors

Vanna não tem "connectors" no sentido amplo — tem **adapters de banco SQL**. A lista cobre Postgres, MySQL, Snowflake, BigQuery, Redshift, SQLite, Oracle, SQL Server, DuckDB, ClickHouse. Cada adapter implementa `run_sql()` e a introspecção de schema. É um modelo deliberadamente estreito: assume **bancos relacionais** e SQL como alvo.

Para o Delfos isso é uma diferença arquitetural relevante: o Delfos prevê `connectors` como serviço futuro genérico (ADR-0008, ADR-0012), incluindo APIs e fontes on-premise, não só SQL.

---

## Cache, filas, workers

Vanna 0.x não traz cache/fila/worker próprios — é uma biblioteca síncrona. Vanna 2.0 introduz **LLM Middlewares**, que envolvem chamadas ao LLM e permitem implementar **caching de prompt/resposta**, prompt engineering e rastreio de custo. Não é uma fila distribuída — é interceptação em processo. Conversation Storage persiste o histórico de conversas.

Isso é coerente com o ADR-0007 do Delfos (sem Redis/cache em Fase 1): o conceito de middleware como ponto de extensão pode inspirar uma camada futura, mas não autoriza infra de cache agora.

---

## Semantic layer

Vanna **não tem um semantic layer formal**. O "significado" das métricas vive como **documentação textual livre** ingerida via `vn.train(documentation=...)` — por exemplo, "OTIF score é o percentual de pedidos entregues no prazo e completos". Isso é flexível mas frágil: não há definição estruturada, versionada e validável de métricas. É um dos pontos fracos reconhecidos (ver `anti-patterns.md`).

Para o Delfos, isso reforça o valor de um **semantic layer estruturado futuro** apoiado em `field-mappings` e `query-definitions`, em vez de prosa solta.

---

## Permissions

Vanna 2.0 trata permissões como núcleo:

- **Row-Level Security (RLS)** — queries são filtradas automaticamente conforme as permissões do usuário.
- **Group-based access control** — acesso a tools por grupo.
- **Audit logs** — toda query é registrada por usuário, para compliance.
- A identidade flui da entrada do request até a execução da tool — "user isolation built-in, not configured".

---

## Tenancy

No 0.x não há multitenancy: uma instância = um conjunto de treino. Vanna 2.0 adiciona **workspace context** que viaja junto da identidade. Ainda assim, o isolamento por workspace é mais leve do que o `tenantId` obrigatório do Delfos — no Delfos `tenantId` é fronteira inviolável em toda query, não um contexto opcional.

---

## Scalability

Vanna escala horizontalmente porque o estado vive em sistemas externos: o vector store e o banco. A instância Python é majoritariamente stateless (exceto Conversation Storage). O gargalo prático é latência/custo de LLM e qualidade da recuperação, não o framework.

---

## Embedded analytics

Vanna 2.0 entrega um web component `<vanna-chat>` projetado para embedding em apps React, Vue ou HTML puro, autenticando via cookies/JWT existentes do host. É um modelo de **embedding leve**: a aplicação host fornece identidade, Vanna fornece a experiência conversacional.

---

## APIs

- **0.x**: API Python (`vn.train`, `vn.ask`, `vn.run_sql`, `vn.generate_plotly`) + Flask app embutido.
- **2.0**: servidor com endpoints HTTP por trás do web component; streaming de tabelas/gráficos/resumos.

---

## AI integration

A integração de IA é o coração do produto:

- **RAG-first**: o LLM nunca vê o schema inteiro — recebe só os fragmentos recuperados, o que reduz custo e alucinação.
- **LLM-agnóstico** via `LlmService`: o mesmo agente roda com Claude, GPT, Gemini, Mistral ou Ollama local.
- **LLM Middlewares**: caching, prompt engineering e cost tracking ao redor de cada chamada.
- **Lifecycle Hooks**: pontos para quota checking, logging e content filtering no ciclo do request.
- **Context Enrichers**: injetam contexto adicional no prompt dinamicamente.
- **Observability**: tracing e métricas embutidos.

---

## Orchestration

Em 2.0 o `Agent` é o orquestrador: decide quando recuperar contexto, quando chamar o LLM e quando invocar uma `Tool`. O `AgentMemory` dá memória de padrões de uso de tools. O loop agêntico (pensar → recuperar → agir → observar) é o que permite tarefas multi-passo, com suporte explícito a modelos agênticos modernos (Claude 4.5, GPT-5).

---

## Relacionado

- [overview.md](./overview.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0025 — LLM-assisted analytics text generation](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [ADR-0007 — No cache/Redis Phase 1](../../adr/adr-0007-no-cache-redis-phase-1.md)
- [ADR-0008 — Connectors and integration execution](../../adr/adr-0008-connectors-and-integration-execution.md)
- [ADR-0015 — Runtime connectors command envelope bridge](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
