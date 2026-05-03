# Roadmap - Delfos Analytics

> Status: planejamento vivo. Datas devem ser definidas conforme execucao real.

Nota de estado atual: a foundation administrativa/declarativa foi realinhada pelas ADR-0008,
ADR-0009, ADR-0010, ADR-0011 e ADR-0012. Itens antigos de Fase 1 que envolvem JWT/login,
conectores reais, execucao real, cache, dashboard builder ou report builder sao visao futura ou
deferida, nao implementacao atual.

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
- runtime execution requests foundation, apenas contratos/estados/eventos administrativos,
  readiness dry-run e demo-execute ficticio;
- planejamento documental da futura bridge `ExecutionRequest -> ConnectorExecutionCommand`, sem
  implementacao real;
- audit interno;
- seed/dev local com dados ficticios;
- `execution-preview` demo em memoria;
- catalogos foundation no `delfos-web`;
- CI minimo com lint/test no `delfos-api`.

Nao implementado atualmente:

- JWT/login/OAuth real;
- conectores reais ou `data-connectors`;
- servico/runtime `delfos-connectors` (o repositorio `delfos-connectors` existe apenas como
  foundation documental/governanca, autorizada via ADR-0013);
- local agent;
- teste real de conexao;
- execucao real de dataset/query;
- execucao real das runtime execution requests, dry-run, demo-execute ou eventos foundation;
- bridge real entre `delfos-api` e `delfos-connectors`;
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
- renderizacao real de widgets com dados reais.

Essa fase depende de ADR-0011, dos contratos futuros e da existencia de mecanismo aprovado para
execucao real.

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

## Observacao sobre fases antigas

Listas antigas que colocavam JWT, execucao de dataset, cache, dashboard builder ou report builder
dentro da Fase 1 devem ser interpretadas como historicas/deferidas. O estado atual aceito e a
foundation administrativa/declarativa descrita em `docs/phase-1-scope.md`.
