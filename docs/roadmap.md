# Roadmap - Delfos Analytics

> Status: planejamento vivo. Datas devem ser definidas conforme execucao real.

Nota de estado atual: a foundation administrativa/declarativa foi realinhada pelas ADR-0008,
ADR-0009, ADR-0010, ADR-0011 e ADR-0012. Itens antigos de Fase 1 que envolvem JWT/login,
conectores reais, execucao real, cache, dashboard builder ou report builder sao visao futura ou
deferida, nao implementacao atual.

Cross-reference: ver tambem `delfos-connectors/docs/roadmap.md` para o roadmap do executor futuro.

---

## Taxonomia de status

Para evitar inflar o progresso, cada item usa um destes rotulos:

- `foundation implementada`: contratos, types, testes e endpoints declarativos existem e funcionam
  no estado atual (sem execucao real).
- `parcialmente implementado`: parte do item existe; o restante e pendente ou futuro.
- `foundation-only`: apenas skeleton/types/testes; sem runtime, sem provider, sem dispatch, sem
  execucao real.
- `pendente`: previsto para a fase atual, ainda nao iniciado.
- `futuro`: depende de fase/ADR explicito; fora do escopo atual.

---

## Estado atual aprovado - foundation administrativa/declarativa

Implementado atualmente:

- setup NestJS no `delfos-api`;
- setup Flutter Web no `delfos-web`;
- MongoDB como store de configuracao/metadados;
- healthcheck;
- auth temporaria por `x-delfos-admin-key`;
- tenants e users administrativos;
- connections declarativas;
- credentials protegidas e `credentialRef`;
- datasets declarativos;
- field-mappings declarativos;
- query-definitions declarativas;
- dashboard-definitions declarativas;
- report-definitions declarativas;
- runtime execution requests `foundation implementada`, apenas contratos/estados/eventos
  administrativos, readiness dry-run e demo-execute ficticio;
- planejamento documental da futura bridge `ExecutionRequest -> ConnectorExecutionCommand`, sem
  implementacao real;
- Bridge Resolver Design documentado em
  [`docs/runtime-connectors-bridge-resolver-design.md`](./runtime-connectors-bridge-resolver-design.md),
  sem provider, endpoint, transporte ou dispatch real;
- bridge resolver (`foundation-only`) em `src/modules/runtime/bridge`: types locais, mapper,
  limits policy, safe metadata builder, validation port conceitual/local, `prepareCommand` interno
  e command preparation em memoria, com testes; ainda sem provider, endpoint, transporte, dispatch
  ou integracao real;
- reference resolver (`foundation-only`) em `src/modules/runtime/bridge`:
  `RuntimeConnectorReferenceResolver` interno, readers/ports declarativos, fakes em testes,
  politica conservadora de uma fonte principal e bundles source-agnostic; ainda sem provider,
  endpoint, decrypt, acesso externo, transporte, dispatch ou integracao real;
- BridgeResolver Internal Integration Tests (`foundation-only`) em `src/modules/runtime/tests`,
  cobrindo `RuntimeConnectorBridgeResolver.prepareCommand` com `RuntimeConnectorReferenceResolver`
  real e readers/fakes em memoria, ainda sem provider, endpoint, transporte, dispatch, Mongoose
  real ou chamada ao `delfos-connectors`;
- ReferenceResolver Real Reader Adapter Design documentado em
  [`docs/runtime-reference-reader-adapters-design.md`](./runtime-reference-reader-adapters-design.md),
  mapeando ports/readers para modulos declarativos reais futuros, ainda sem adapters `.ts`,
  provider, `RuntimeModule`, endpoint, transporte, dispatch, decrypt ou chamada ao
  `delfos-connectors`;
- adapters (`foundation-only`) em `src/modules/runtime/bridge/adapters`: adapters internos puros
  para os ports do `RuntimeConnectorReferenceResolver`, testes com fakes em memoria e happy path
  integrado com o resolver real, ainda sem provider, `RuntimeModule`, endpoint,
  services/repositories reais, transporte, dispatch, decrypt ou chamada ao `delfos-connectors`;
- Adapter Wiring Design documentado em
  [`docs/runtime-reference-reader-adapter-wiring-design.md`](./runtime-reference-reader-adapter-wiring-design.md),
  definindo alternativas de composicao futura dos adapters com services/repositories reais,
  dependency graph, gates de provider/`RuntimeModule`, politica segura de `credentialRef` e plano
  de testes, ainda sem provider, `RuntimeModule`, endpoint, dispatch, decrypt ou chamada ao
  `delfos-connectors`;
- CredentialReference Safe Lookup (`foundation-only`) em
  `src/modules/runtime/bridge/adapters/runtime-credential-reference-safe-lookup.adapter.ts`, com
  lookup seguro por `tenantId + connectionId` ou `tenantId + credentialRef`, dependency minima
  fakeavel, politica de zero/uma/multiplas credenciais ativas e testes, ainda sem
  `CredentialsService` real, provider, `RuntimeModule`, endpoint, dispatch, decrypt ou chamada ao
  `delfos-connectors`;
- audit interno;
- seed/dev local com dados ficticios;
- `execution-preview` demo em memoria;
- catalogos foundation no `delfos-web`;
- CI minimo com lint/test no `delfos-api`.

Nao implementado atualmente:

- JWT/login/OAuth real;
- conectores reais ou `delfos-connectors`;
- servico/runtime `delfos-connectors` (o repositorio `delfos-connectors` existe apenas como
  foundation documental/governanca, autorizada via ADR-0013);
- local agent;
- teste real de conexao;
- execucao real de dataset/query;
- execucao real das runtime execution requests, dry-run, demo-execute ou eventos foundation;
- bridge real entre `delfos-api` e `delfos-connectors`;
- dispatch real do Bridge Resolver ou chamada ao `delfos-connectors`;
- cache, fila, worker, scheduler, staging ou snapshot;
- dashboard builder/runtime final;
- query builder;
- report builder/runtime e exportacoes finais;
- commitlint e ampliacao do pipeline com format/build.

---

## Fase 0 - Fundacao documental e governanca

Status: concluida/inicial.

Entregas:

- `AGENTS.md`;
- `DESIGN.md`;
- ADRs iniciais e ADRs 0008-0012;
- politica de bibliotecas;
- politica de dados;
- politica de conectores conceitual/futura;
- prompts internos;
- guias de desenvolvimento.

---

## Fase 1 - Foundation administrativa/declarativa

Objetivo: consolidar contratos, seguranca, catalogos e governanca sem acessar dado real de
cliente.

Entregas atuais:

- contratos foundation;
- auth temporaria;
- catalogos declarativos;
- credentials protegidas;
- auditoria interna;
- preview demo;
- contratos foundation para solicitacoes futuras de runtime e eventos administrativos de ciclo de
  vida, readiness dry-run e demo-execute ficticio, sem execucao real;
- documentacao operacional e de desenvolvimento.

---

## Fase futura - Auth final

Planejado/futuro, nao implementado atualmente:

- auth JWT;
- refresh token;
- login/logout;
- recuperacao de senha;
- RBAC final;
- guards finais;
- auditoria de login.

Esta fase depende de tarefa explicita e deve respeitar ADR-0006 e as decisoes mais recentes de
escopo.

---

## Fase futura - Integracoes e execucao real

Planejado/futuro, nao implementado atualmente:

- implementacao da bridge `ExecutionRequest -> ConnectorExecutionCommand`, apos escopo explicito;
- implementacao do Bridge Resolver, apos o design documentado e mantendo command preparation antes
  de qualquer dispatch;
- integracao do Bridge Resolver ao runtime real somente apos nova fase explicita, com testes,
  threat model e decisao de transporte;
- proxima fase recomendada: ExecutionRequest/Readiness Reader Adapters Foundation - Tests Only ou
  ReferenceReader Adapters Real Service Wiring - Tests Only, ainda sem provider, `RuntimeModule`,
  endpoint, transporte ou dispatch real;
- servico/runtime `delfos-connectors` (foundation documental disponivel via ADR-0013 no repositorio
  `delfos-connectors`);
- local agent;
- teste real de conexao;
- sync/ingestao;
- execucao real de dataset/query;
- conectores reais;
- rate limit/retry/timeout de integracoes reais;
- erros externos operacionais.

Essa fase depende de autorizacao explicita e alinhamento com ADR-0008, ADR-0012, ADR-0013,
ADR-0014 e ADR-0015 proposta.

Gate formal de entrada da Fase 2: ADR-0021 e ADR-0022 permanecem `Proposed` por decisao
humana e constituem o gate de entrada da Fase 2 (ver ADR-0024). Nenhuma capacidade de
execucao/dispatch/descriptografia real e iniciada antes da promocao humana dessas ADRs.

---

## Fase futura - Storage analitico, cache e jobs

Planejado/futuro, nao implementado atualmente:

- snapshots;
- resultados materializados;
- ingestion batches;
- sync runs;
- cache ou staging;
- Redis quando justificado;
- filas/workers;
- scheduler;
- politica de retencao operacional.

Essa fase depende de ADR-0010 e nova decisao quando houver implementacao.

---

## Fase futura - Dashboards, query builder e relatorios

Planejado/futuro, nao implementado atualmente:

- dashboard builder;
- dashboard runtime final;
- widget builder;
- query builder guiado;
- report builder;
- exportacao CSV/XLSX;
- filtros finais;
- renderizacao real de widgets com dados reais;
- `analytics_text_generation` (geracao textual analitica assistida por LLM) — `futuro`: capability
  assistiva que monta narrativas de relatorio/dashboard, comparacoes e resumos de KPI a partir de
  dados ja agregados/sanitizados/mascarados. Nao implementada; depende de tarefa dedicada,
  revisao de seguranca e validacao de privacidade. Ver ADR-0025.

Essa fase depende de ADR-0011, dos contratos futuros e da existencia de mecanismo aprovado para
execucao real. A capability `analytics_text_generation` segue ADR-0025 e nasce desligada por
padrao.

---

## Fase futura - White label e acabamento

Planejado/futuro:

- logo por tenant ou cliente/grupo;
- cor primaria por tenant ou cliente/grupo;
- tema claro/escuro refinado;
- dominio/nome exibido;
- polish visual;
- testes de responsividade ampliados.

---

## Melhorias de qualidade (futuras, nao bloqueantes)

Itens de qualidade recomendados, registrados como melhoria futura. Nao sao bloqueantes para
a prontidao agent-ready e nao devem ser implementados sem tarefa explicita:

- **CI de Markdown / verificacao automatica de links** — `futuro`/`pendente`: lint de Markdown
  e validacao automatica de links e referencias relativas nos docs (delfos-api, delfos-web,
  delfos-connectors). Hoje a validacao de links e manual (ver `docs/agent-validation-checklist.md`).
  Melhoria recomendada de qualidade, nao bloqueante.
- **commitlint e ampliacao do pipeline** com `format:check`/`build` — ja listado acima como
  nao implementado.

---

## Observacao sobre fases antigas

Listas antigas que colocavam JWT, execucao de dataset, cache, dashboard builder ou report builder
dentro da Fase 1 devem ser interpretadas como historicas/deferidas. O estado atual aceito e a
foundation administrativa/declarativa descrita em `docs/phase-1-scope.md`.
