# ADR-0014 - Runtime execution requests foundation

- **Status**: Accepted
- **Data**: 2026-05-03
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Foundation administrativa/declarativa e fases futuras de runtime
- **Implementação**: parcial — foundation declarativa de execution-requests implementada (contratos, estados, eventos, dry-run, demo-execute); runtime real não iniciado

---

## Contexto

O `delfos-api` ja possui contratos foundation para catalogos declarativos, preview demo em
memoria e runtime/execution-requests. Esses contratos registram solicitacoes futuras, estados,
eventos administrativos, dry-run de readiness e demo-execute ficticio.

ADR-0008 definiu o servico/runtime futuro `delfos-connectors` como fronteira de execucao pesada.
ADR-0011 definiu que dashboards e widgets dependem de query definitions e datasets. ADR-0013,
mantida no repositorio `delfos-connectors`, reforcou a foundation documental, contratos
conceituais e fronteiras multitenant do futuro runtime/connectors.

Era necessario registrar explicitamente por que existe foundation de runtime/execution-requests
sem executor real, para evitar que contratos administrativos sejam interpretados como autorizacao
para conector, worker, fila, cache, scheduler ou acesso a fonte de cliente.

## Decisao

Manter `runtime/execution-requests` no `delfos-api` como foundation administrativa/declarativa.

O escopo atual cobre apenas:

- contratos HTTP administrativos;
- estados foundation de solicitacao;
- eventos administrativos seguros;
- readiness dry-run sobre contratos declarativos ja persistidos;
- demo-execute ficticio e limitado;
- auditoria metadata-only;
- mensagens explicitas de que nenhuma execucao real foi iniciada.

`dry-run` e `demo-execute` podem ler tenants, datasets, query definitions, dashboard definitions,
report definitions e field mappings ja persistidos no Mongo administrativo do Delfos. Eles nao
acessam fonte externa, nao descriptografam credenciais e nao executam runtime real.

## Alternativas consideradas

- **Aguardar o executor real para criar contratos** - rejeitada porque a UI e a API precisam de
  estados administrativos e readiness segura antes da execucao real.
- **Executar diretamente pelo `delfos-api`** - rejeitada porque contraria ADR-0008 e aumenta risco
  operacional na API principal.
- **Criar conector, worker ou fila nesta fase** - rejeitada porque a fase atual e foundation
  declarativa, sem acesso a dados reais de cliente.

## Consequencias

### Positivas

- Permite governar solicitacoes futuras sem iniciar trabalho real.
- Cria trilha administrativa e auditavel antes da fase de execucao.
- Mantem API, Web e Connectors alinhados com ADR-0008, ADR-0011 e ADR-0013.
- Reduz ambiguidade sobre dry-run e demo-execute.

### Negativas / trade-offs aceitos

- Usuarios e operadores precisam entender que os estados atuais sao administrativos.
- A implementacao futura devera mapear esses contratos para comandos reais com nova revisao.

### Neutras

- Esta ADR nao altera contratos NestJS existentes.
- Esta ADR nao muda comportamento da API ou Web.
- Esta ADR nao cria dependencia, worker, fila, cache ou scheduler.

## Impacto na Fase 1

- Documentar que runtime/execution-requests e foundation administrativa.
- Preservar mensagens, auditoria e exemplos sem segredo real ou payload operacional.
- Manter dry-run e demo-execute como fluxos ficticios/declarativos.

## Impacto futuro / Fase 2

- A fase futura de runtime devera converter solicitacoes aprovadas em command envelope seguro.
- Qualquer execucao real exigira alinhamento com ADR-0008 e ADR-0013.
- Conectores, local agent, filas, cache, workers e scheduler exigem escopo explicito antes de
  implementacao.

## Fora de escopo

- Execucao real;
- conector real;
- servico/runtime `delfos-connectors`;
- worker;
- fila;
- cache;
- scheduler;
- local agent;
- acesso a fonte de cliente;
- descriptografia real de credenciais;
- alteracao de contratos NestJS, Flutter ou comportamento publico.

## Referencias

- `docs/api-foundation-contracts.md`
- `docs/operations-runbook.md`
- `docs/foundation-data-catalog.md`
- `docs/foundation-credentials-and-security.md`
- ADR-0008
- ADR-0011
- ADR-0013
