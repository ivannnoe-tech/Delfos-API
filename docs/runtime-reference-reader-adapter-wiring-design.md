# Runtime Reference Reader Adapter Wiring Design

## Status

Design tecnico futuro, com **CredentialReference Safe Lookup Foundation** implementada
internamente em codigo puro e tests-only.

Este documento nao cria provider NestJS, nao altera `RuntimeModule`, nao cria endpoint, nao faz
dispatch, nao chama ou importa `delfos-connectors`, nao descriptografa credenciais e nao acessa
fonte externa.

> **Teto de escopo (scope ceiling):** nenhum codigo adicional de foundation de
> bridge/runtime pode ser construido alem do estado atual tests-only enquanto a
> **ADR-0015** nao estiver com status `Accepted`. Ate la, o wiring descrito aqui
> permanece apenas design e os arquivos sob `src/modules/runtime/bridge/`
> permanecem congelados no estado tests-only.

## Objetivo

Desenhar como os adapters foundation serao conectados futuramente aos services/repositories reais
do NestJS sem criar endpoint, dispatch ou execucao real.

O wiring futuro deve continuar tratando `RuntimeConnectorBridgeResolver.prepareCommand` como
preparo interno de command em memoria. A composicao deve transformar contratos administrativos
tenant-scoped em ports minimos, sem expor documentos Mongoose inteiros, secrets, connection
strings, payload bruto, SQL livre, URL livre, headers sensiveis ou dados de outro tenant.

## Estado Atual

- Adapters existem em `src/modules/runtime/bridge/adapters/` e sao testados com fakes.
- `RuntimeConnectorReferenceResolver` existe internamente e e testado.
- `RuntimeConnectorBridgeResolver.prepareCommand` existe internamente e e testado.
- Testes internos cobrem `prepareCommand` com `RuntimeConnectorReferenceResolver` real e readers
  em memoria.
- Nenhum provider operacional existe.
- Nenhum wiring no `RuntimeModule` existe para o Bridge Resolver ou adapters.
- Nenhum endpoint, controller, DTO publico, schema, dispatch ou transporte existe para o bridge.
- Nenhuma chamada ao `delfos-connectors`, decrypt, SQL/API externa, fonte de cliente, worker,
  fila, cache, scheduler ou local agent existe.
- `CredentialReference Safe Lookup Foundation` existe em
  `src/modules/runtime/bridge/adapters/runtime-credential-reference-safe-lookup.adapter.ts`,
  com dependency minima fakeavel e testes internos.
- A foundation de safe lookup ainda nao usa `CredentialsService`, repository real, provider
  NestJS ou wiring operacional.
- A connection real pode expor apenas `hasCredentialReference`; o `ConnectionReaderAdapter` nao
  inventa `credentialRef` a partir desse booleano.

## Fora de Escopo

- provider operacional;
- provider NestJS interno registrado agora;
- `RuntimeModule` real;
- endpoint;
- controller;
- DTO publico ou schema;
- dispatch;
- transporte;
- `delfos-connectors`;
- decrypt;
- fonte externa;
- worker, fila, cache, scheduler ou local agent;
- conector real;
- SQL/API externa;
- PDF, Excel, CSV ou export real;
- alteracao de comportamento runtime atual.

## Opcoes de Wiring Futuro

### Opcao A - Factory pura em tests only

Cria instancias manualmente nos testes e injeta fake services/readers. Nao registra provider, nao
altera `RuntimeModule` e nao cria composicao operacional.

Este e o padrao atual: os specs constroem adapters, reference resolver, bridge resolver, policies,
validator e clock diretamente em memoria.

Vantagens:

- menor risco de uso acidental;
- mantem o bridge fora do grafo NestJS operacional;
- permite evoluir contratos internos e seguranca com feedback rapido de testes;
- nao muda comportamento publico.

Limites:

- nao valida ainda a integracao com services/repositories reais;
- pode duplicar composicao em varios specs se crescer sem factory.

### Opcao B - Factory interna nao operacional

Criar futuramente uma funcao interna, por exemplo
`buildRuntimeConnectorBridgeResolver(deps)` ou `RuntimeBridgeCompositionRoot`, que recebe
dependencias explicitas e retorna:

- `RuntimeConnectorBridgeResolver`;
- `RuntimeConnectorReferenceResolver`;
- ReferenceReader adapters;
- `CapabilityMapper`;
- `LimitsPolicy`;
- `SafeMetadataBuilder`;
- `LocalCommandShapeValidator`;
- `Clock`.

Regras:

- sem `@Injectable`;
- sem provider NestJS;
- sem registro no `RuntimeModule`;
- sem endpoint;
- sem dispatch;
- uso inicial por testes e por wiring futuro ainda nao operacional.

Vantagens:

- reduz duplicacao dos testes de composicao;
- cria um ponto unico para revisar gates de seguranca;
- preserva o bridge fora do runtime operacional;
- permite testar services reais fakeados antes de qualquer provider.

Limites:

- ainda nao injeta services reais via Nest;
- exige disciplina para nao ser chamado por controller/service publico.

### Opcao C - Provider NestJS interno, nao exposto

Registrar providers no `RuntimeModule` e injetar services/repositories reais, ainda sem endpoint.

Vantagens:

- valida DI real do NestJS;
- reduz adaptadores manuais quando a integracao com services reais estiver aprovada;
- permite testes de modulo para lifecycle e imports.

Riscos:

- aumenta risco de uso acidental por services/controllers;
- aproxima command preparation de fluxo operacional antes da decisao explicita;
- pode ocultar dispatch futuro em dependencias se os gates nao forem rigorosos;
- torna mudancas de runtime mais sensiveis para CI e seguranca.

### Opcao D - Endpoint/dispatch real

Fora de escopo. Exige fase propria e, provavelmente, ADR especifica de transporte, threat model,
idempotencia, limites, autenticacao interna, observabilidade, retries/timeouts e politica de
credenciais.

## Recomendacao

A proxima fase deve preferir a Opcao B ou continuar com factory pura em tests only. O provider
NestJS deve vir apenas depois de:

- adapters com services reais ou fakes de services reais testados;
- safe lookup de `credentialRef` resolvido;
- command preparation com services reais testado;
- revisao explicita de threat model;
- decisao de que existe caso interno aprovado para provider.

Endpoint e dispatch devem ficar para uma fase muito posterior. Eles nao devem ser derivados
automaticamente da existencia de adapters, factory ou provider.

## Dependency Graph Futuro

```text
RuntimeConnectorBridgeResolver
  -> RuntimeExecutionRequestReaderAdapter
      -> ExecutionRequestsRepository

RuntimeConnectorBridgeResolver
  -> RuntimeReadinessEvaluatorAdapter
      -> ExecutionRequestReadinessService

RuntimeConnectorBridgeResolver
  -> RuntimeConnectorReferenceResolver
      -> QueryDefinitionReaderAdapter
          -> QueryDefinitionsService/Repository
      -> DashboardDefinitionReaderAdapter
          -> DashboardDefinitionsService/Repository
      -> ReportDefinitionReaderAdapter
          -> ReportDefinitionsService/Repository
      -> DatasetReaderAdapter
          -> DatasetsService/Repository
      -> FieldMappingReaderAdapter
          -> FieldMappingsService/Repository
      -> ConnectionReaderAdapter
          -> ConnectionsService/Repository
      -> CredentialReferenceReaderAdapter
          -> CredentialsService/Repository seguro futuro

RuntimeConnectorBridgeResolver
  -> RuntimeConnectorCapabilityMapper
  -> RuntimeConnectorLimitsPolicy
  -> RuntimeConnectorSafeMetadataBuilder
  -> RuntimeConnectorLocalCommandShapeValidator
  -> RuntimeClockPort
```

Todos esses componentes sao internos. Nenhum chama fonte externa, nenhum faz decrypt, nenhum faz
dispatch e nenhum deve importar `delfos-connectors`.

## CredentialReference Safe Lookup Foundation

Implementado internamente em
`src/modules/runtime/bridge/adapters/runtime-credential-reference-safe-lookup.adapter.ts`, com
testes em `src/modules/runtime/tests/runtime-credential-reference-safe-lookup.spec.ts`.

Esta foundation cria um port interno seguro:

- `findActiveByTenantAndConnection(tenantId, connectionId)`;
- `findByCredentialRef(tenantId, credentialRef)`.

O adapter recebe uma dependencia minima fakeavel com buscas por `tenantId + connectionId` e por
`tenantId + credentialRef`. Ele retorna somente:

- `credentialRef`;
- `tenantId`;
- `connectionId`;
- `status`;
- `provider`;
- `type`;
- `safeMetadata` sanitizada.

Ele nao retorna `protectedSecretValue`, `secretValue`, `maskedPreview`, segredo bruto, connection
string, headers, payload de auth ou token. Ele tambem nao importa nem chama
`LocalCredentialProtectorService`, nao faz decrypt e nao acessa fonte externa.

Politica para `findActiveByTenantAndConnection`:

- zero credenciais ativas retorna blocker `credential_ref_missing`;
- exatamente uma credencial ativa retorna `found=true` com shape seguro;
- multiplas credenciais ativas retornam blocker `multiple_active_credentials_not_supported`;
- apenas credenciais non-active/revoked retornam blocker `credential_ref_inactive`.

Status ativos:

- `active`;
- `Active`;
- `ACTIVE`.

Status inativos/revogados:

- `revoked`;
- `inactive`;
- `disabled`;
- `archived`;
- `draft`.

Politica para `findByCredentialRef`:

- valida `tenantId`;
- valida formato seguro de `credentialRef`;
- busca por `tenantId + credentialRef`;
- not found retorna `credential_ref_missing`;
- tenant divergente retorna `tenant_mismatch`;
- status non-active retorna `credential_ref_inactive`;
- resultado seguro retorna somente a referencia e metadados permitidos.

Esta foundation ainda nao altera `RuntimeConnectorReferenceResolver` para depender
obrigatoriamente dela e nao conecta services/repositories reais. O uso operacional deve ficar para
fase futura de wiring tests-only ou provider explicitamente aprovado.

## Adapters Faltantes

### RuntimeExecutionRequestReaderAdapter

Responsabilidade futura:

- ler `ExecutionRequest` por `tenantId + executionRequestId`;
- retornar `ExecutionRequestLike`;
- converter `NotFoundException` ou ausencia em `null`;
- garantir tenant isolation defensivo;
- retornar shape minimo.

Nao deve:

- retornar documento Mongoose inteiro;
- alterar status;
- persistir evento;
- chamar readiness;
- disparar runtime;
- chamar controller, endpoint, worker, fila ou `delfos-connectors`.

Pseudocodigo documental:

```ts
class RuntimeExecutionRequestReaderAdapter implements RuntimeExecutionRequestReaderPort {
  constructor(private readonly executionRequests: ExecutionRequestsRepository) {}

  async findByTenantAndId(
    tenantId: string,
    executionRequestId: string,
  ): Promise<ExecutionRequestLike | null> {
    const request = await this.executionRequests.findByTenantAndId(
      toObjectId(tenantId),
      executionRequestId,
    );

    if (!request || request.tenantId.toString() !== tenantId) {
      return null;
    }

    return {
      id: request._id.toString(),
      tenantId,
      requestKey: request.requestKey,
      kind: request.kind,
      mode: request.mode,
      status: request.status,
      queryDefinitionId: request.queryDefinitionId?.toString(),
      dashboardDefinitionId: request.dashboardDefinitionId?.toString(),
      reportDefinitionId: request.reportDefinitionId?.toString(),
      connectionId: request.connectionId?.toString(),
      datasetId: request.datasetId?.toString(),
    };
  }
}
```

### RuntimeReadinessEvaluatorAdapter

Responsabilidade futura:

- chamar `ExecutionRequestReadinessService.evaluate`;
- mapear `checks`, `warnings` e `blockers` para `BridgeReadinessResult`;
- sanitizar mensagens e targets conforme politica de erro seguro;
- preservar blockers que impedem command preparation.

Nao deve:

- executar runtime real;
- chamar demo execute;
- alterar status;
- registrar evento;
- persistir readiness;
- chamar fonte externa;
- fazer dispatch.

Pseudocodigo documental:

```ts
class RuntimeReadinessEvaluatorAdapter implements RuntimeReadinessEvaluatorPort {
  constructor(private readonly readiness: ExecutionRequestReadinessService) {}

  async evaluate(executionRequest: ExecutionRequestLike): Promise<BridgeReadinessResult> {
    const result = await this.readiness.evaluate(toExecutionRequestDocumentLike(executionRequest));

    return {
      checks: result.checks.map(toBridgeReadinessItem),
      warnings: result.warnings.map(toBridgeReadinessItem),
      blockers: result.blockers.map(toBridgeReadinessItem),
    };
  }
}
```

O adapter real nao deve falsificar documento Mongoose. Se `ExecutionRequestReadinessService`
exigir `ExecutionRequestDocument`, a fase futura deve escolher entre ajustar um metodo interno
seguro de readiness por shape minimo ou criar um wrapper testado que nao introduza mutation.

### RuntimeBridgeFactory ou RuntimeBridgeCompositionRoot

Responsabilidade futura:

- compor `RuntimeConnectorBridgeResolver`;
- compor `RuntimeConnectorReferenceResolver`;
- criar adapters internos;
- receber dependencias explicitamente;
- permitir testes de composicao com fakes e, depois, services reais fakeados.

Inicialmente deve ser apenas funcao/factory interna, nao provider NestJS.

Pseudocodigo documental:

```ts
function buildRuntimeConnectorBridgeResolver(deps: RuntimeBridgeFactoryDeps) {
  const safeMetadataBuilder = deps.safeMetadataBuilder ?? new RuntimeConnectorSafeMetadataBuilder();

  const referenceResolver = new RuntimeConnectorReferenceResolver({
    queryDefinitionReader: new RuntimeQueryDefinitionReaderAdapter(deps.queryDefinitions),
    dashboardDefinitionReader: new RuntimeDashboardDefinitionReaderAdapter(deps.dashboards),
    reportDefinitionReader: new RuntimeReportDefinitionReaderAdapter(deps.reports),
    datasetReader: new RuntimeDatasetReaderAdapter(deps.datasets),
    fieldMappingReader: new RuntimeFieldMappingReaderAdapter(deps.fieldMappings),
    connectionReader: new RuntimeConnectionReaderAdapter(deps.connections),
    credentialReferenceReader: new RuntimeCredentialReferenceReaderAdapter(deps.credentials),
    safeMetadataBuilder,
  });

  return new RuntimeConnectorBridgeResolver({
    executionRequestReader: new RuntimeExecutionRequestReaderAdapter(deps.executionRequests),
    readinessEvaluator: new RuntimeReadinessEvaluatorAdapter(deps.readiness),
    referenceResolver,
    capabilityMapper: new RuntimeConnectorCapabilityMapper(),
    limitsPolicy: new RuntimeConnectorLimitsPolicy(),
    safeMetadataBuilder,
    commandValidator: new RuntimeConnectorLocalCommandShapeValidator(),
    clock: deps.clock,
  });
}
```

## Politica Segura Para CredentialRef

Se a `Connection` real indicar apenas `hasCredentialReference`, o wiring futuro deve:

- nao inventar `credentialRef`;
- nao derivar `credentialRef` de booleano;
- usar `CredentialReferenceReaderAdapter` para resolver por `tenantId + connectionId` somente se
  existir API/service/repository interno seguro;
- se nao houver API segura, retornar blocker `credential_ref_missing`;
- se houver multiplas credenciais ativas para a mesma connection, retornar blocker
  `multiple_active_credentials_not_supported`;
- nunca ler `protectedSecretValue`;
- nunca usar `LocalCredentialProtectorService`;
- nunca fazer decrypt;
- nunca retornar `secretValue`;
- nunca retornar `maskedPreview` no command;
- nunca retornar connection string.

Fase propria recomendada: **CredentialReference Safe Lookup Foundation**. Esta foundation ja foi
implementada internamente como codigo puro e tests-only, ainda sem wiring real.

Essa foundation implementou:

- metodo interno seguro com dependency minima fakeavel;
- retorno somente de `credentialRef`, `tenantId`, `connectionId`, `status`, `provider`, `type` e
  `safeMetadata`;
- nunca retornar `protectedSecretValue`;
- nao usar service/repository real nem selecionar `protectedSecretValue`;
- testes de tenant isolation;
- testes de credencial revoked/inactive/disabled/archived/draft;
- testes de multiplas credenciais ativas;
- testes de ausencia de `maskedPreview`, `secretValue`, connection string e decrypt.

## Politica de Provider e RuntimeModule

Provider NestJS nao e necessario ainda. Registrar provider aumenta risco de uso acidental porque
coloca command preparation no grafo operacional do `RuntimeModule`.

Gates antes de registrar qualquer provider:

- todos os adapters com services reais ou fakes representativos testados;
- `credentialRef` safe lookup resolvido;
- command preparation com services reais testado;
- threat model revisado;
- nenhuma mutation/status/event persistida por `prepareCommand`;
- `RuntimeModule` wiring nao expoe endpoint;
- dispatch port inexistente ou noop explicitamente testado;
- nenhum controller usa o provider;
- nenhum DTO publico ou schema alterado;
- CI passando.

Mesmo quando um provider interno for criado, ele deve continuar sem endpoint, sem dispatch, sem
transporte, sem decrypt e sem chamada ao `delfos-connectors`.

## Plano de Testes Futuro

### ExecutionRequestReaderAdapter

- `tenantId + id` retorna shape minimo.
- Outro tenant retorna `null`.
- Not found retorna `null`.
- Nao retorna documento bruto.
- Nao altera status.
- Nao registra evento.

### ReadinessEvaluatorAdapter

- Mapeia `checks`, `warnings` e `blockers`.
- Blockers sao preservados e sanitizados.
- Warnings sao preservados e sanitizados.
- Nao altera status.
- Nao registra evento.
- Nao chama demo execute.

### ReferenceReader adapters com services reais

- Tenant isolation.
- `null`/not found.
- Status inactive/revoked/draft/archived preservado ou bloqueado conforme politica.
- Metadata segura.
- Sem `protectedSecretValue`.
- Sem `secretValue`.
- Sem `maskedPreview` no command.
- Sem connection string.
- Source-agnostic para SQL, REST/JSON, MongoDB e file.
- Sem chamada externa.

### Composition/factory

- Monta `RuntimeConnectorBridgeResolver` com adapters reais/fakes.
- Monta `RuntimeConnectorReferenceResolver` com adapters reais/fakes.
- `prepareCommand` query demo com readers reais fakeados.
- `prepareCommand` future_runtime apenas prepara command em memoria.
- Sem dispatch.
- Sem provider.
- Sem `RuntimeModule`.
- Sem endpoint.

### Future provider

- Provider nao e usado por controller.
- Provider nao registra endpoint.
- Provider nao despacha.
- Provider nao persiste evento/status.
- Provider nao injeta dispatch real.
- Provider nao importa `delfos-connectors`.

## Sequencia Recomendada

1. Manter esta fase como docs-only.
2. Implementar, em fase futura tests-only, `RuntimeExecutionRequestReaderAdapter` e
   `RuntimeReadinessEvaluatorAdapter`.
3. Implementar `RuntimeExecutionRequestReaderAdapter` e `RuntimeReadinessEvaluatorAdapter` em
   tests-only ou evoluir para ReferenceReader Adapters Real Service Wiring - Tests Only.
4. Criar factory interna nao operacional para reduzir duplicacao de composicao.
5. Testar adapters contra fakes que imitam services/repositories reais.
6. Avaliar provider NestJS apenas com caso interno aprovado e gates satisfeitos.
7. Deixar endpoint/dispatch/transporte para fase propria e ADR quando necessario.

## Referencias

- [`docs/runtime-reference-reader-adapters-design.md`](./runtime-reference-reader-adapters-design.md)
- [`docs/runtime-connectors-bridge-resolver-design.md`](./runtime-connectors-bridge-resolver-design.md)
- [`docs/runtime-connectors-bridge-plan.md`](./runtime-connectors-bridge-plan.md)
- [`docs/adr/adr-0015-runtime-connectors-command-envelope-bridge.md`](./adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [`docs/adr/adr-0014-runtime-execution-requests-foundation.md`](./adr/adr-0014-runtime-execution-requests-foundation.md)
- [`docs/adr/adr-0008-connectors-and-integration-execution.md`](./adr/adr-0008-connectors-and-integration-execution.md)
- [`docs/foundation-credentials-and-security.md`](./foundation-credentials-and-security.md)
- [`docs/foundation-data-catalog.md`](./foundation-data-catalog.md)
- [`docs/data-access-policy.md`](./data-access-policy.md)
- [`docs/external-source-configuration-flow.md`](./external-source-configuration-flow.md)
- [`docs/operations-runbook.md`](./operations-runbook.md)
- `delfos-connectors/docs/runtime-contracts.md`
- `delfos-connectors/docs/security-boundaries.md`
