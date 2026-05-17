# WrenAI — Visão Geral

> Tipo: referência estratégica · Produto estudado: WrenAI · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

WrenAI (também grafado *Wren AI*, da empresa Canner) é uma plataforma open-source de
**GenBI** (*Generative Business Intelligence*) cujo objetivo central é permitir que
times de dados e usuários de negócio "conversem" com seus dados em linguagem natural
para gerar **SQL**, gráficos, planilhas, dashboards e relatórios. O produto se
posiciona como uma *open context layer* — uma camada de contexto governada que
fornece aos agentes de IA SQL **fundamentado (grounded)** e **governado** sobre 20+
fontes de dados.

A diferença estrutural de WrenAI frente a soluções genéricas de *text-to-SQL* é que
ele coloca a **camada semântica** (semantic layer) no centro da arquitetura, e não
como um acessório. Isso é feito por uma linguagem própria, a **MDL** (*Modeling
Definition Language*), que descreve modelos, colunas, relacionamentos, métricas,
*views*, *cubes* e regras de acesso de forma versionável.

Licença Apache 2.0, projeto ativo no GitHub (`Canner/WrenAI`). O motor semântico
(`Canner/wren-engine`) é distribuído também como projeto independente.

---

## Objetivo

- Reduzir a barreira entre pergunta de negócio e resposta analítica, eliminando a
  necessidade de escrever SQL manualmente.
- Garantir **consistência de métricas** ("total de vendas" significa sempre a mesma
  coisa) e **resiliência a mudanças de schema** via camada semântica.
- Servir tanto como produto de BI conversacional quanto como **camada de contexto**
  reutilizável por outros agentes (bots de Slack, extensões de IDE, agentes
  embarcados de analytics).

## Público-alvo

| Perfil | Uso típico |
|---|---|
| Analistas de dados / BI | Modelagem semântica, validação de métricas, geração assistida de SQL |
| Usuários de negócio | Perguntas em linguagem natural, dashboards, relatórios sem SQL |
| Engenheiros de dados / plataforma | Conexão de fontes, governança, controle de acesso por linha/coluna |
| Desenvolvedores de produto | Embedding de analytics e agentes de IA sobre a camada de contexto |

## Diferencial

- **Semantic-first**: a precisão do *text-to-SQL* deriva da MDL, não de adivinhação
  estatística sobre o schema bruto.
- **SQL rewriting**: o motor reescreve uma sintaxe lógica (WrenSQL, compatível com
  ANSI SQL) para o dialeto específico de cada fonte (PostgreSQL, BigQuery, Snowflake
  etc.).
- **Explainability**: cada resposta acompanha o SQL gerado, passos de raciocínio e
  resumos de insight — o usuário vê *como* a resposta foi obtida.
- **Privacidade por design**: o LLM recebe schema e contexto semântico, não os dados
  brutos — não é necessário fazer upload de dados para o modelo.

---

## Arquitetura geral

WrenAI organiza-se em três camadas principais:

| Componente | Papel |
|---|---|
| **Wren Engine** (Wren AI Core) | Motor semântico. Interpreta a MDL, reescreve SQL, conecta às fontes, aplica controle de acesso. Construído em Rust sobre Apache DataFusion. |
| **Wren AI Service** | Serviço de IA. Orquestra o pipeline RAG: recupera contexto semântico + exemplos, monta o prompt, gera SQL/gráfico/resumo, valida (*dry-plan*). Em Python. |
| **Wren UI** | Interface web. Modelagem visual, chat de perguntas, dashboards, gráficos gerados por IA. |

Há ainda um **Agent SDK** (`wren-langchain`, `wren-pydantic`), *bindings* WebAssembly
(`wren-core-wasm`) e camada de *skills* para agentes de codificação.

## Stack

- **Wren Engine**: Rust, Apache DataFusion; *bindings* Python (`wren-engine` no PyPI) e WASM.
- **Wren AI Service**: Python; *retrieval* híbrido com banco vetorial (LanceDB / Qdrant).
- **Wren UI**: TypeScript / JavaScript (frontend web).
- **Deploy**: Docker Compose (serviços `wren-bootstrap`, `wren-engine`,
  `wren-ai-service`, `wren-ui`, vetorial). Suporte a múltiplos provedores de LLM.

---

## Pontos fortes

- Camada semântica madura e versionável (MDL) como fonte única de verdade analítica.
- Desacoplamento entre lógica analítica e schema físico — mudanças de tabela não
  quebram perguntas.
- Suporte amplo a fontes de dados (20+) via um único motor de reescrita de SQL.
- Explicabilidade embutida: SQL + passos + resumo em cada resposta.
- Modelo de governança com controle de acesso por linha (RLAC) e por coluna (CLAC).
- Capacidade de operar como camada de contexto reutilizável, não só como BI fechado.

## Pontos fracos

- Operação self-hosted reportadamente frágil: falhas de *startup* do
  `wren-ai-service`, problemas com modelos locais (Ollama), dependência de imagens
  externas (Docker Hub).
- Dependência de banco vetorial (Qdrant) com limitações de armazenamento (sem NFS/S3)
  e *backup/disaster recovery* limitados em deploy distribuído.
- Qualidade do *text-to-SQL* depende fortemente da qualidade da modelagem MDL — sem
  curadoria semântica, o ganho cai.
- Custo e latência atrelados ao provedor de LLM; sensível a *prompt drift* entre
  versões de modelo.
- Superfície operacional grande (vários serviços) para uma equipe pequena manter.

---

## O que vale estudar

- O conceito de **camada semântica como contrato** versionável (MDL) e seu encaixe
  com `field-mappings` e `query-definitions` do Delfos.
- O padrão de **explainability** (SQL + passos + resumo) como recurso de confiança.
- A separação **lógica analítica vs. dialeto físico** e a ideia de reescrita.
- O pipeline **RAG governado**: contexto semântico em vez de dados brutos no LLM.
- A operação como **camada de contexto reutilizável** por múltiplos consumidores.

## O que NÃO reproduzir no Delfos

- **Não** adotar execução real de SQL, conexões reais a fontes ou motor de reescrita
  agora — Delfos está em fase *foundation* declarativa (ver `adr-0008`, `adr-0024`).
- **Não** introduzir banco vetorial, fila ou worker nesta fase (`adr-0007`).
- **Não** copiar a arquitetura multi-serviço pesada do WrenAI; o Delfos deve manter
  o backend declarativo enxuto.
- **Não** acoplar produto a um provedor de LLM sem ADR — qualquer IA aplicada segue
  `adr-0025` e exige autorização explícita.

---

## Relacionado

- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- ADRs: [adr-0008](../../adr/adr-0008-connectors-and-integration-execution.md) ·
  [adr-0024](../../adr/adr-0024-phase-1-and-phase-2-definition.md) ·
  [adr-0025](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Índice da biblioteca de referências](../README.md)
