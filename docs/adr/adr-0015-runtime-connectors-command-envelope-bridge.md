# ADR-0015 - Runtime connectors command envelope bridge

- **Status**: Proposed
- **Data**: 2026-05-03
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Planejamento de bridge entre runtime foundation e `delfos-connectors`
- **Implementação**: não iniciada
- **Implementacao atual**: somente documentacao e foundation tests-only sob `src/modules/runtime/bridge/`; nenhuma bridge real, sem provider, sem dispatch

---

## Contexto

O `delfos-api` possui `runtime/execution-requests` foundation, dry-run readiness declarativo,
demo-execute ficticio, eventos administrativos e auditoria metadata-only. O `delfos-web` possui
Runtime Monitor Foundation e nao executa conectores. O `delfos-connectors` possui Skeleton
Foundation TypeScript com contratos, sanitizacao, validacao, fake adapter deterministico e testes,
mas continua sem conector real, servidor HTTP, worker, fila, cache, scheduler, local agent,
drivers ou client HTTP.

ADR-0008 define `delfos-connectors` como executor futuro de integracoes pesadas. ADR-0013 define
o boundary e o contrato runtime/connectors. ADR-0014 define que execution requests atuais sao
foundation administrativa/declarativa, sem executor real.

Antes de implementar qualquer bridge, e necessario planejar como uma `ExecutionRequest` podera
virar um `ConnectorExecutionCommand` seguro sem acoplar repositorios, sem expor secrets e sem
autorizar execucao real por acidente.

## Decisao proposta

Manter esta fase como planejamento/documentacao e registrar o plano em
[`docs/runtime-connectors-bridge-plan.md`](../runtime-connectors-bridge-plan.md).

A decisao proposta para uma fase futura e que o `delfos-api` monte um command envelope seguro a
partir de uma `ExecutionRequest` tenant-scoped, readiness declarativa e referencias
administrativas resolvidas. O command envelope futuro devera conter `tenantId`,
`executionRequestId`, `requestId`, `correlationId`, `capability`, `mode`, referencias
declarativas, limites explicitos e metadata sanitizada.

Nesta fase:

- nao implementar transporte;
- nao chamar `delfos-connectors`;
- nao importar o package `delfos-connectors` no `delfos-api`;
- nao criar package compartilhado;
- nao alterar endpoints, schemas, DTOs ou controllers existentes;
- exigir nova decisao para transporte real.

## Alternativas consideradas

### API chama connectors diretamente

Possivel no futuro via HTTP/gRPC/outro transporte, mas rejeitado nesta fase porque criaria
implicacao de runtime real antes de decidir autenticacao, autorizacao, retries, timeout,
observabilidade e seguranca de transporte.

### API publica em fila

Arquiteturalmente promissor para jobs longos, retries e isolamento de falha, mas rejeitado nesta
fase porque fila/worker/cache permanecem fora de escopo e exigem ADR propria.

### API mantem apenas registro e worker externo puxa

Reduz acoplamento da API ao executor, mas exige contrato de polling, locks, idempotencia e
seguranca operacional. Fica para decisao futura.

### Monorepo/shared package

Rejeitado nesta fase. Criaria acoplamento de release e dependencia direta entre repositorios. O
contrato deve permanecer documentado e testado no boundary antes de qualquer pacote compartilhado.

### Bridge documental antes da implementacao

Escolhida nesta fase. Permite alinhar contratos, source-agnostic design, limites, timeline,
seguranca e fases futuras sem introduzir execucao real.

## Consequencias

### Positivas

- Evita acoplamento prematuro entre API e connectors.
- Mantem runtime atual como foundation administrativa.
- Define campos, limites e eventos antes de dispatch real.
- Reforca que `credentialRef` e referencia, nao secret.
- Mantem web como monitor seguro.

### Trade-offs

- Adia implementacao da bridge real.
- Exige manutencao de docs entre repositorios.
- A decisao de transporte continua pendente.

## Fora de escopo

Esta ADR nao autoriza nem implementa:

- bridge real;
- endpoint novo;
- chamada ao `delfos-connectors`;
- dependencia entre repositorios;
- worker, fila, cache, scheduler ou local agent;
- conector real;
- SQL/API externa;
- descriptografia de credenciais;
- export real;
- alteracao de contratos publicos existentes.

## Relacao com ADRs existentes

- ADR-0008: define `delfos-connectors` como executor futuro; esta ADR nao implementa esse executor.
- ADR-0013: define boundary e contratos do connectors; esta ADR planeja como a API podera montar
  command envelope alinhado a esse boundary.
- ADR-0014: define execution requests atuais como foundation administrativa; esta ADR preserva
  essa decisao e nao muda comportamento atual.

## Referencias

- [`docs/runtime-connectors-bridge-plan.md`](../runtime-connectors-bridge-plan.md)
- [`docs/api-foundation-contracts.md`](../api-foundation-contracts.md)
- [`docs/operations-runbook.md`](../operations-runbook.md)
- [`docs/foundation-credentials-and-security.md`](../foundation-credentials-and-security.md)
- ADR-0008
- ADR-0013
- ADR-0014
