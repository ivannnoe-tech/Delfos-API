# Evidence — Arquitetura

> Tipo: referência estratégica · Produto estudado: Evidence · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

Evidence organiza-se em torno de um **projeto de arquivos** em vez de um banco de metadados. As peças conceituais:

- **Sources** — pasta de definições de conexão e *source queries* (SQL de extração).
- **Pages** — arquivos `.md` (Evidence-flavored Markdown) que misturam prosa, SQL e componentes.
- **Components** — biblioteca de visualizações e inputs reutilizáveis, invocados por sintaxe declarativa nas páginas.
- **Cache** — arquivos Parquet materializados a partir das sources.
- **Build output** — o site estático gerado.

A modularização é **filesystem-driven**: a estrutura de pastas determina rotas, e a separação de responsabilidades é convenção, não imposição de um esquema. Isso favorece versionamento, mas joga a disciplina arquitetural para o time.

---

## Runtime & execution model

O modelo de execução do Evidence tem **dois tempos distintos**:

| Tempo | O que roda | Onde |
|---|---|---|
| **Build-time (sources)** | *Source queries* extraem dados das fontes e gravam Parquet | Processo de build (`npm run sources`) |
| **Query-time** | SQL das páginas roda contra o cache Parquet | Build e/ou browser (DuckDB-WASM) |

A consequência é importante: **o relatório publicado nunca consulta o warehouse de produção diretamente**. Ele consulta o cache. Interatividade (filtros, dropdowns) é resolvida no browser sobre o Parquet, sem servidor.

Para o Delfos, o paralelo conceitual é a separação entre **`query-definitions` (declaração)** e **`runtime`/`execution-preview` (execução)** — porém o Delfos prevê execução real via connectors, não materialização estática.

---

## Plugins & extensibilidade

A extensibilidade do Evidence acontece em duas frentes:

- **Connectors de source** como pacotes — cada tipo de fonte (Postgres, BigQuery, Snowflake, DuckDB, arquivos, APIs) é um plugin de extração.
- **Componentes customizados** — é possível criar componentes Svelte próprios além da biblioteca built-in.

A extensão se dá por **pacotes npm e arquivos do projeto**, não por um marketplace gerenciado. É flexível para quem domina o ecossistema JS, mas não há isolamento forte entre plugins.

---

## Connectors

Connectors do Evidence são **extratores de build-time**: pegam dados da fonte e os normalizam em Parquet no cache. Suportam:

- Bancos SQL (data warehouses, Postgres etc.).
- Arquivos planos (CSV, Parquet, `.duckdb`).
- Fontes não-SQL (APIs).

Característica-chave: o connector **não participa do query-time**. Após a extração, toda consulta fala com o cache. Isso simplifica o runtime, mas significa que dados "frescos" exigem re-execução das sources.

No Delfos, connectors (ADR-0008, ADR-0012, ADR-0015) são previstos como **executores de runtime** — fundamentalmente diferentes do modelo extrair-e-cachear do Evidence. O aprendizado útil é o **contrato claro de connector** e a possibilidade de um connector local/on-premise.

---

## Cache, filas, workers

- **Cache**: conjunto de arquivos Parquet materializados pelas sources. É o coração do modelo — funciona como camada de dados intermediária.
- **Filas / workers / scheduler**: **não existem** no modelo open-source. A "atualização" é o re-run das sources, tipicamente disparado por um pipeline de CI/CD externo.

O Delfos decidiu **não adotar cache/Redis na Fase 1** (ADR-0007). O cache Parquet do Evidence é instrutivo como conceito de *materialização*, mas não como dependência de runtime na fase atual.

---

## Semantic layer

Evidence **não possui uma semantic layer formal**. Métricas, dimensões e regras de negócio vivem espalhadas no SQL das páginas e das sources. Há reaproveitamento via *queries* nomeadas e referência entre consultas, mas não há um catálogo central de métricas com governança.

Isso é uma **lacuna deliberada**: o produto aposta na simplicidade de SQL puro. Para o Delfos, que tem `datasets` e `field-mappings`, há espaço para evoluir uma semantic layer própria — algo que o Evidence justamente não oferece.

---

## Permissions

- Open-source: **sem modelo de permissões nem autenticação**. O acesso é controlado pela infraestrutura de hospedagem.
- Pago (Evidence Cloud): adiciona autenticação e *row-level security*.

O padrão recomendado para isolar dados entre usuários no open-source é **gerar deployments separados** com variáveis de build distintas. É um anti-pattern do ponto de vista do Delfos (ver `anti-patterns.md`).

O Delfos tem modelo de papéis/permissões próprio (ADR-0017) e auth (ADR-0006, ADR-0016) — não delega segurança à infra.

---

## Tenancy

Não há multi-tenancy lógico. Isolamento = **um build/deployment por tenant**, ou *templated pages* parametrizadas (que não isolam dados, apenas reusam o molde).

Contraste direto com o Delfos: `tenantId` é **fronteira de isolamento obrigatória em runtime** (ADR-0009), nunca um filtro opcional ou um artefato de build.

---

## Scalability

A escalabilidade do Evidence é a de um **site estático**: o front escala trivialmente via CDN. O gargalo migra para:

- O **build**: quanto mais sources e páginas, mais longo o `npm run sources` e o build.
- O **tamanho do cache Parquet**: datasets grandes inflam o bundle e a memória do DuckDB-WASM no browser.

Escala bem para muitos *leitores*, mal para *volume de dados por relatório* e para *frequência de atualização*.

---

## Embedded analytics

Embedding é um caso de uso de primeira classe: o site estático pode ser **embutido em outra aplicação** (iframe ou hospedagem própria). É simples justamente por não ter servidor nem sessão. A contrapartida é a ausência de contexto de usuário/tenant no embed do open-source — o que limita personalização e segurança por consumidor.

---

## APIs

Evidence **não expõe uma API de plataforma** (não há REST/GraphQL para gerenciar relatórios programaticamente). A "API" é o **filesystem + Git**: criar/alterar relatório = commitar arquivos. Integrações de dados acontecem nas sources.

O Delfos, ao contrário, é *API-first* (`delfos-api` NestJS) — o modelo do Evidence reforça que tratar definições como dados versionáveis é valioso, mas não substitui uma API de gestão.

---

## AI integration

A camada de IA concentra-se na **autoria**, via Evidence Studio (IDE em navegador):

- Validação automática de sintaxe SQL, Markdown e de componentes.
- Sugestões de componentes, de opções de visualização e de consultas SQL.

A IA é **assistente de desenvolvimento do relatório**, não um copiloto analítico para o leitor final. Alinha-se parcialmente com o que o Delfos prevê em ADR-0025 (geração de texto analítico assistida por LLM), mas com foco diferente.

---

## Orchestration

Não há orquestrador interno. A orquestração é **externalizada**: pipelines de CI/CD (GitHub Actions etc.) disparam `npm run sources` + build + deploy em cron ou em push. Isso mantém o produto simples, ao custo de empurrar a responsabilidade de agendamento e *freshness* para fora.

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
- [../../adr/adr-0012-local-connectors-agent-and-on-premise-sources.md](../../adr/adr-0012-local-connectors-agent-and-on-premise-sources.md)
- [../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [Índice da biblioteca de referências](../README.md)
