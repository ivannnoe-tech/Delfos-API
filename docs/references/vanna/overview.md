# Vanna AI — Visão Geral

> Tipo: referência estratégica · Produto estudado: Vanna AI · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Vanna AI é um framework open-source (licença MIT) escrito em Python para **text-to-SQL**: traduz perguntas em linguagem natural em consultas SQL executáveis. Sua proposta central é usar **RAG (Retrieval-Augmented Generation)** em vez de fine-tuning: em vez de treinar um modelo dedicado, Vanna indexa contexto sobre o banco do cliente (DDL, documentação de negócio, pares pergunta→SQL) num vector store e, a cada pergunta, recupera os fragmentos mais relevantes para montar o prompt do LLM.

É importante entender o que Vanna **não** é: não é um produto BI completo, não é um dashboard builder e não é um data warehouse. É uma **biblioteca/framework** que outras aplicações embarcam. A versão 2.0 (o repositório foi arquivado em 29/03/2026) reposicionou o projeto como um **framework de agentes** para text-to-SQL multiusuário em produção, adicionando identidade, permissões e observabilidade.

---

## Objetivo

Reduzir a barreira entre o usuário de negócio e o dado. O usuário pergunta "qual foi a receita por região no último trimestre?" e recebe SQL correto, resultado tabular e, opcionalmente, um gráfico e um resumo em texto. O diferencial é a **precisão crescente**: quanto mais o sistema é treinado/corrigido, melhor fica, porque cada par pergunta→SQL validado vira material de recuperação.

---

## Público-alvo

| Perfil | Uso |
|---|---|
| Desenvolvedores / engenheiros de dados | Embarcam Vanna em apps internos, notebooks ou agentes |
| Equipes de produto BI | Usam Vanna como motor de NL→SQL dentro de uma plataforma maior |
| Analistas | Consomem via web component / Flask app, exploram dados sem escrever SQL |
| Times enterprise | Vanna 2.0: multiusuário, RLS, audit logs, quota |

---

## Diferencial

- **RAG em vez de fine-tuning** — barato, incremental, não exige retrain. O conhecimento vive no vector store, não nos pesos do modelo.
- **Agnóstico de LLM** — OpenAI, Anthropic Claude, Gemini, Bedrock, Mistral, Ollama, Azure.
- **Agnóstico de vector store** — ChromaDB (default), Qdrant, Milvus, pgvector, e hospedado.
- **Agnóstico de banco** — Postgres, MySQL, Snowflake, BigQuery, Redshift, SQLite, Oracle, SQL Server, DuckDB, ClickHouse.
- **Auto-aprendizado** — perguntas respondidas com sucesso podem realimentar o conjunto de treino.
- **Extensível por classes abstratas** — `VannaBase`, `LlmService`, `AgentMemory` permitem plugar componentes próprios.

---

## Arquitetura geral

Vanna 0.x organiza-se em torno da classe abstrata `VannaBase`, combinada por composição: o usuário escolhe uma implementação de LLM e uma de vector store e as mistura numa subclasse. O fluxo é:

1. **Training** — `vn.train()` ingere DDL, documentação e SQL de exemplo; tudo é embeddado e gravado no vector store.
2. **Ask** — `vn.ask()` recebe a pergunta, gera embedding, faz busca vetorial pelos contextos mais próximos, monta o prompt e chama o LLM.
3. **Run** — o SQL gerado é executado contra o banco; o resultado pode ser plotado (Plotly) e resumido em texto.

Vanna 2.0 introduz um modelo **agent-based**: `User → Web Component → Server → Agent → Tools → Database`. Um `Agent` coordena `LlmService` e um `Tool Registry` (ex.: `RunSqlTool`), com `UserResolver` injetando identidade em todas as camadas.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | Python |
| Recuperação | Vector stores plugáveis (ChromaDB, Qdrant, Milvus, pgvector) |
| Geração | LLMs plugáveis via `LlmService` |
| Frontend | Flask app embutido (0.x) · web component `<vanna-chat>` (2.0) |
| Visualização | Plotly (gráficos), tabelas streamadas |
| Extensibilidade | Classes abstratas `VannaBase`, `Tool`, `AgentMemory` |

---

## Pontos fortes

- Abordagem RAG madura e bem documentada para text-to-SQL — barata e incremental.
- Forte desacoplamento: trocar LLM, vector store ou banco é configuração, não reescrita.
- Curva de adoção curta: funciona em notebook com poucas linhas.
- Vanna 2.0 trata multitenancy/identidade como cidadão de primeira classe (RLS, audit, quota).
- Explainability natural: a recuperação expõe **quais** contextos sustentaram a resposta.

---

## Pontos fracos

- É framework, não produto: exige engenharia para virar uma plataforma utilizável.
- Precisão depende fortemente da curadoria do treino — sem governança de pares pergunta→SQL, degrada.
- LLM pode alucinar SQL inválido ou semanticamente errado; não há lógica de negócio formal.
- Sem semantic layer real: interpretações de métricas ficam dispersas em documentação textual.
- Repositório arquivado (read-only desde 03/2026) — sem manutenção upstream futura.
- Acoplado ao paradigma SQL: assume bancos relacionais, não APIs declarativas.

---

## O que vale estudar

- O **modelo de treino tripartite** (DDL + documentação + exemplos) como forma de governança de conhecimento.
- O **ciclo de auto-aprendizado**: validação humana de respostas vira material de recuperação.
- A **explainability via recuperação** — mostrar a proveniência do que sustentou a sugestão.
- A separação **agnóstica** de LLM/vector store/banco como princípio de arquitetura.
- Vanna 2.0: lifecycle hooks, LLM middlewares e observabilidade como pontos de extensão.

---

## O que NÃO reproduzir no Delfos

- **Não** copiar o paradigma SQL-first: o Delfos opera sobre `query-definitions` e `connections` declarativas, não DDL bruto.
- **Não** dar ao LLM acesso direto a executar SQL contra o banco do cliente — viola ADR-0008 e o modelo de execução do `runtime`/`connectors`.
- **Não** embarcar um app Flask como UI — o frontend é `delfos-web` (Flutter).
- **Não** assumir vector store como dependência de Fase 1 — contraria ADR-0007.
- **Não** tratar credenciais ou connection strings como contexto de prompt — `credentialRef`/`connectionId` são referências seguras.

---

## Relacionado

- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0025 — LLM-assisted analytics text generation](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [ADR-0001 — Phase 1 API-based data source](../../adr/adr-0001-phase-1-api-based-data-source.md)
- [ADR-0008 — Connectors and integration execution](../../adr/adr-0008-connectors-and-integration-execution.md)
