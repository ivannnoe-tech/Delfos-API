# Chartbrew — Visão Geral

> Tipo: referência estratégica · Produto estudado: Chartbrew · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Chartbrew é uma plataforma open-source de *reporting* e dashboards ao vivo. Permite
conectar APIs REST, bancos SQL (MySQL, PostgreSQL, ClickHouse) e NoSQL (MongoDB,
Firestore), além de fontes como Google Analytics, transformando esses dados em
charts, tabelas e dashboards compartilháveis. O posicionamento de mercado é o de
"alternativa open-source simples ao Power BI / Tableau / Looker", com forte ênfase
em *client reporting* — agências e SaaS que precisam entregar relatórios recorrentes
para clientes.

Diferente de plataformas BI corporativas pesadas, o Chartbrew prioriza um fluxo
direto: conectar fonte → criar *dataset* reutilizável → montar chart → publicar/embedar.

---

## Objetivo

O objetivo do produto é reduzir o atrito entre "ter dados em uma API ou banco" e
"ter um dashboard ao vivo apresentável". Ele resolve três dores:

1. **Reuso de consultas** — um *dataset* é definido uma vez e reaproveitado em vários
   charts e dashboards.
2. **Entrega ao cliente** — dashboards podem ser embedados, compartilhados por link
   com acesso controlado, ou enviados como *snapshots* agendados.
3. **Acesso assistido por IA** — um *AI Orchestrator* gera datasets, charts e
   dashboards via conversa em linguagem natural.

---

## Público-alvo

| Perfil | Uso típico |
|---|---|
| Agências de marketing/dados | Relatórios recorrentes para múltiplos clientes |
| Times de produto SaaS | KPIs internos (signups, receita, uso) |
| Desenvolvedores | Embedar charts em portais e produtos próprios |
| Equipes não-técnicas | Consumir dashboards e ajustar filtros |

O perfil dominante é o de **times pequenos a médios** que querem resultado rápido
sem operar uma stack de BI completa.

---

## Diferencial

- **Dataset como unidade central reutilizável** — separa "como obter o dado" de
  "como visualizá-lo".
- **Sistema de variáveis** (`{{startDate}}`) que liga filtros de dashboard, parâmetros
  de embed e URL a consultas, sem reescrever queries.
- **AI Orchestrator** com integração nativa em Slack — perguntar dados via menção.
- **Embedding e snapshots agendados** como cidadãos de primeira classe, não add-ons.
- **Open-source self-hosted** com imagem Docker e deploy one-click.

---

## Arquitetura geral

Chartbrew é uma aplicação cliente-servidor clássica:

- **`client/`** — SPA em React 19, build com Vite, UI com HeroUI; gráficos via
  Chart.js; editores de query via Monaco.
- **`server/`** — API Node.js (Express) que orquestra conexões, datasets, execução
  de consultas e renderização de dados.
- **Banco operacional** — MySQL ou PostgreSQL guarda metadados (projetos, conexões,
  datasets, charts, usuários, times).
- **Redis** — cache de resultados de consulta, *Socket Manager* para tempo real e
  suporte ao AI Orchestrator.
- **AI Orchestrator** — serviço interno que recebe contexto (projeto, conexão,
  dataset) e produz artefatos de visualização; usa a *Responses API* da OpenAI.

O fluxo de dados: o servidor executa a consulta contra a fonte do cliente, aplica
transformações, cacheia no Redis e devolve o resultado normalizado para o chart.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite 8, HeroUI v3, Chart.js, Monaco Editor |
| Backend | Node.js v22+, Express |
| Banco operacional | MySQL 5+ ou PostgreSQL 12.5+ |
| Cache / tempo real | Redis v6+ |
| E-mail | React Email templates |
| IA | OpenAI Responses API via AI Orchestrator |
| Distribuição | Docker, deploy one-click (DigitalOcean) |

---

## Pontos fortes

- Conceito de **dataset reutilizável** bem executado — reduz duplicação.
- **Variáveis e filtros globais** integrados de forma coerente.
- **Embedding e sharing** maduros, com controle de acesso por cliente.
- **IA aplicada** de forma pragmática (gerar query/chart), não como gimmick.
- Curva de adoção curta; bom para *time-to-first-dashboard*.
- Código aberto, sem *lock-in*; self-hosting viável.

---

## Pontos fracos

- **Sem multi-tenancy real** no sentido enterprise — isolamento é por *projeto* e
  *time*, não por fronteira de tenant forte com governança.
- Modelo de execução **síncrono e acoplado** ao servidor; não há camada de connectors
  isolada nem agente para fontes on-premise.
- **Semantic layer ausente** — não há modelagem de métricas/dimensões nomeadas
  reaproveitável; o "modelo" mora dentro de cada dataset.
- Governança de credenciais simples (chave AES de 32 bytes), sem rotação ou
  política de mascaramento formal.
- Catálogo de fontes limitado frente a BIs corporativos.
- Observabilidade e auditoria não são foco do produto.

---

## O que vale estudar

- O modelo **dataset → variáveis → filtros de dashboard** como padrão de reuso.
- O fluxo de **embedding com acesso controlado** e *snapshots* agendados.
- O **AI Orchestrator com contexto explícito** (projeto/conexão/dataset).
- O **query editor multi-fonte** (SQL, Mongo, API) com assistentes específicos.
- O conceito de **templates de dashboard** para escalar relatórios de cliente.

---

## O que NÃO reproduzir no Delfos

- O **acoplamento da execução ao servidor monolítico** — o Delfos já separa
  `delfos-connectors` como executor futuro (ver `adr-0008`).
- O **isolamento fraco por projeto/time** — o Delfos tem `tenantId` como fronteira
  obrigatória (ver `adr-0009`).
- O **armazenamento de credenciais com chave única simples** — o Delfos exige
  `credentialRef` e política de criptografia/rotação (ver `adr-0019`).
- A **ausência de semantic layer** — para o Delfos vale planejar `field-mappings` e
  `query-definitions` evoluindo para um modelo semântico real.
- A **execução síncrona sem fila/worker** — o Delfos modela *runtime execution
  requests* assíncronos (ver `adr-0014`).

---

## Relacionado

- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADR: [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- ADR: [../../adr/adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- ADR: [../../adr/adr-0019-credential-encryption-and-rotation.md](../../adr/adr-0019-credential-encryption-and-rotation.md)
- [Índice da biblioteca de referências](../README.md)
