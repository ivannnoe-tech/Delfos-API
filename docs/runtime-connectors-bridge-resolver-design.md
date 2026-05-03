# Runtime Connectors Bridge Resolver Design

## Status

Design tecnico futuro. Foundation de interfaces/types, mappers, policies, builder seguro,
validation port, `prepareCommand` em memoria, `ReferenceResolver` declarativo e testes unitarios
criada. Ainda sem bridge real operacional.

Este documento nao cria provider/service NestJS operacional, controller, endpoint, transporte,
dispatch, worker, fila, cache, scheduler, local agent, conector real, SQL/API externa,
descriptografia de credenciais ou alteracao de schema/DTO. Ele descreve como uma fase futura
podera transformar uma `ExecutionRequest` em um `ConnectorExecutionCommandShape` seguro.

## Foundation Atual

A fase **BridgeResolver Foundation - Tests & Interfaces Only** criou arquivos internos e puros em
`src/modules/runtime/bridge/`, sem plugar nada em controller, service runtime operacional,
endpoint ou modulo NestJS.

Arquivos criados:

- `src/modules/runtime/bridge/connector-command-shape.ts`;
- `src/modules/runtime/bridge/bridge-types.ts`;
- `src/modules/runtime/bridge/runtime-connector-capability-mapper.ts`;
- `src/modules/runtime/bridge/runtime-connector-limits-policy.ts`;
- `src/modules/runtime/bridge/runtime-connector-safe-metadata-builder.ts`;
- `src/modules/runtime/bridge/runtime-connector-command-validation.port.ts`;
- `src/modules/runtime/bridge/runtime-connector-reference.types.ts`;
- `src/modules/runtime/bridge/runtime-connector-reference-resolver.ts`;
- `src/modules/runtime/bridge/runtime-connector-security.ts`;
- `src/modules/runtime/bridge/index.ts`.

Testes unitarios criados em `src/modules/runtime/tests/` cobrem mapper, limits policy,
safe metadata builder, command shape/local validator e source-agnostic reference types.

Esta foundation:

- cria `RuntimeConnectorBridgeResolver.prepareCommand` apenas como classe interna testavel;
- nao faz dispatch;
- nao chama `delfos-connectors`;
- nao importa `delfos-connectors`;
- nao altera controller, schema, DTO publico, endpoint ou comportamento runtime atual;
- nao executa SQL/API externa;
- nao descriptografa credenciais;
- nao acessa fonte de cliente.

## PrepareCommand Foundation Atual

A fase **BridgeResolver PrepareCommand Foundation** adicionou
`src/modules/runtime/bridge/runtime-connector-bridge-resolver.ts`.

O resolver:

- recebe dependencias por ports/interfaces no constructor;
- usa `RuntimeExecutionRequestReaderPort` para ler uma `ExecutionRequestLike` por
  `tenantId + executionRequestId`;
- usa `RuntimeReadinessEvaluatorPort` para readiness declarativo;
- usa `RuntimeReferenceResolverPort` para referencias declarativas source-agnostic;
- usa `RuntimeClockPort` para `requestedAt` deterministico em testes;
- usa `RuntimeConnectorCapabilityMapper`, `RuntimeConnectorLimitsPolicy`,
  `RuntimeConnectorSafeMetadataBuilder` e `RuntimeConnectorCommandValidationPort`;
- monta um `ConnectorExecutionCommandShape` em memoria;
- retorna eventos conceituais `command_prepared`, `command_blocked`,
  `command_not_supported` ou `command_validation_failed` apenas no resultado;
- nao persiste eventos;
- nao registra provider NestJS;
- nao altera `RuntimeModule`;
- nao faz dispatch, transporte ou chamada externa.

Ports e tipos adicionados/expandidos em `src/modules/runtime/bridge/bridge-types.ts`:

- `PrepareRuntimeConnectorCommandInput`;
- `PrepareRuntimeConnectorCommandResult`;
- `RuntimeExecutionRequestReaderPort`;
- `RuntimeReadinessEvaluatorPort`;
- `RuntimeReferenceResolverPort`;
- `RuntimeClockPort`;
- `ExecutionRequestLike`;
- `BridgeReadinessResult`;
- `RuntimeConnectorReferenceBundleResult`;
- `RuntimeConnectorBridgeSafeError`;
- `RuntimeConnectorBridgeEventShape`.

Testes em `src/modules/runtime/tests/runtime-connector-bridge-resolver.spec.ts` usam fakes para
reader, readiness evaluator, reference resolver e clock. Eles cobrem happy paths, tenant
isolation, readiness blockers, reference blockers, capability unsupported, command validation
failure, sanitizacao, source-agnostic references e determinismo.

## ReferenceResolver Foundation Atual

A fase **Runtime ReferenceResolver Foundation** adicionou
`src/modules/runtime/bridge/runtime-connector-reference-resolver.ts`.

O resolver:

- recebe readers declarativos por ports no constructor;
- resolve `query`, `dashboard` e `report` a partir de `ExecutionRequestLike`;
- resolve a cadeia `QueryDefinition / DashboardDefinition / ReportDefinition -> Dataset ->
  FieldMappings -> Connection -> credentialRef/sourceType`;
- retorna `RuntimeConnectorReferenceBundle` source-agnostic;
- usa `sourceObject` e `sourceFieldPath`, sem exigir `table` ou `column`;
- sanitiza `safeMetadata` de dataset, connection, mapping e source descriptor;
- bloqueia referencias de outro tenant;
- bloqueia dataset sem `datasetKey`, dataset sem mappings, connection ausente, `credentialRef`
  ausente quando a fonte exige credencial e `sourceType` ausente;
- bloqueia `credentialRef` ou `connectionId` com aparencia de secret/connection string;
- usa politica conservadora de uma fonte principal por command.

Ports/readers criados:

- `RuntimeQueryDefinitionReaderPort`;
- `RuntimeDashboardDefinitionReaderPort`;
- `RuntimeReportDefinitionReaderPort`;
- `RuntimeDatasetReaderPort`;
- `RuntimeFieldMappingReaderPort`;
- `RuntimeConnectionReaderPort`;
- `RuntimeCredentialReferenceReaderPort`.

Shapes minimos criados:

- `RuntimeQueryDefinitionLike`;
- `RuntimeDashboardDefinitionLike`;
- `RuntimeReportDefinitionLike`;
- `RuntimeDatasetLike`;
- `RuntimeFieldMappingLike`;
- `RuntimeConnectionLike`;
- `RuntimeCredentialReferenceLike`.

Testes em `src/modules/runtime/tests/runtime-connector-reference-resolver.spec.ts` usam fakes em
memoria e cobrem query, dashboard, report, blockers, seguranca, source-agnostic mappings e
determinismo.

Limite conservador desta foundation:

- uma `ExecutionRequest` preparada para command aponta para uma fonte principal;
- dashboards/reports com widgets/blocos que resolvem para fontes diferentes retornam
  `multiple_sources_not_supported`;
- fase futura pode decompor dashboards/reports em multiplos commands por fonte/capability, com
  ADR ou design proprio.

Esta foundation ainda:

- nao registra provider NestJS;
- nao altera `RuntimeModule`;
- nao chama services/repositories reais;
- nao descriptografa credenciais;
- nao acessa fonte externa;
- nao faz dispatch;
- nao persiste eventos.

## Objetivo

Desenhar interfaces internas futuras para transformar uma `ExecutionRequest` em um
`ConnectorExecutionCommandShape` seguro, tenant-scoped, source-agnostic, validavel e pronto para
uma decisao posterior de transporte.

O resultado desta fase e apenas documental:

- responsabilidades internas;
- pseudocodigo TypeScript em Markdown;
- fluxo de preparo;
- shape local futuro sem import de `delfos-connectors`;
- matriz de testes esperados;
- estrategia source-agnostic;
- riscos e mitigacoes.

## Fora de escopo

- execucao real;
- chamada ao `delfos-connectors`;
- transporte HTTP, fila, outbox ou pull worker;
- worker;
- cache;
- scheduler;
- local agent;
- SQL/API externa;
- discovery real de schema;
- teste real de conexao;
- descriptografia de secrets;
- resolucao de Vault/KMS/Secrets Manager;
- alteracao de endpoint, controller, schema ou DTO;
- provider/service NestJS operacional;
- import direto de package connectors;
- package compartilhado ou monorepo;
- PDF, Excel ou CSV real.

## Principios

- `tenantId` e boundary obrigatorio, nao filtro opcional.
- `credentialRef` nao e secret.
- `connectionId` nao e connection string.
- O design deve ser source-agnostic.
- Logs, eventos e auditoria devem ser metadata-only.
- Erros devem ser sanitizados.
- Limites devem ser explicitos.
- Nenhuma query string livre deve atravessar o command.
- Nenhuma URL livre deve atravessar sem allowlist futura.
- Nenhuma variavel global de tenant deve existir.
- Nao deve haver dependencia direta API -> package connectors nesta fase.
- O command preparado nao significa dispatch.
- `future_runtime` na API e intencao administrativa, nao execucao real.
- `execute` e `export` reais permanecem bloqueados ate fase futura explicita.

## Interfaces Conceituais

As interfaces abaixo sao pseudocodigo documental. Nao criar arquivos `.ts` nesta fase.

```ts
interface RuntimeConnectorBridgeResolver {
  prepareCommand(
    input: PrepareRuntimeConnectorCommandInput,
  ): Promise<PrepareRuntimeConnectorCommandResult>;
}

interface RuntimeConnectorCommandBuilder {
  buildCommand(input: RuntimeConnectorCommandBuilderInput): ConnectorExecutionCommandShape;
}

interface RuntimeConnectorReferenceResolver {
  resolveReferences(input: RuntimeConnectorReferenceResolverInput): Promise<ResolvedRuntimeReferences>;
}

interface RuntimeConnectorCapabilityMapper {
  mapCapability(input: RuntimeConnectorCapabilityMapperInput): RuntimeConnectorCapabilityMappingResult;
}

interface RuntimeConnectorLimitsPolicy {
  resolveLimits(input: RuntimeConnectorLimitsPolicyInput): RuntimeConnectorLimits;
}

interface RuntimeConnectorSafeMetadataBuilder {
  build(input: RuntimeConnectorSafeMetadataBuilderInput): RuntimeConnectorSafeMetadataBuildResult;
}

interface RuntimeConnectorCommandValidationPort {
  validate(command: ConnectorExecutionCommandShape): Promise<RuntimeConnectorCommandValidationResult>;
}

interface RuntimeConnectorDispatchPort {
  dispatch(command: ConnectorExecutionCommandShape): Promise<RuntimeConnectorDispatchResult>;
}

interface RuntimeConnectorEventRecorder {
  record(event: BridgeEventShape): Promise<void>;
}
```

### Input e Result

```ts
interface PrepareRuntimeConnectorCommandInput {
  executionRequestId: string;
  tenantId: string;
  actorId?: string;
  actorRole?: string;
  requestId: string;
  correlationId: string;
}

type PrepareRuntimeConnectorCommandResult =
  | {
      prepared: true;
      command: ConnectorExecutionCommandShape;
      blockers: [];
      events: BridgeEventShape[];
    }
  | {
      prepared: false;
      blockers: ReadinessBlockerShape[];
      safeError: SafeBridgeErrorShape;
      events: BridgeEventShape[];
    };

interface ReadinessBlockerShape {
  code: string;
  message: string;
  target?: string;
}

interface SafeBridgeErrorShape {
  code: string;
  safeMessage: string;
  category: "validation" | "security" | "not_supported" | "readiness";
  retryable: false;
  safeMetadata: Record<string, SafeMetadataValue>;
}

interface BridgeEventShape {
  tenantId: string;
  executionRequestId: string;
  eventType: "command_prepared" | "command_blocked" | "command_validation_failed";
  requestId: string;
  correlationId: string;
  occurredAt: string;
  safeMessage: string;
  safeMetadata: Record<string, SafeMetadataValue>;
}
```

### Component Inputs

```ts
interface RuntimeConnectorReferenceResolverInput {
  tenantId: string;
  executionRequest: ExecutionRequestShape;
}

interface RuntimeConnectorCapabilityMapperInput {
  kind: "query" | "dashboard" | "report";
  apiMode: "demo" | "dry_run" | "future_runtime";
  resolvedReferences: ResolvedRuntimeReferences;
}

interface RuntimeConnectorLimitsPolicyInput {
  tenantId: string;
  sourceType?: string;
  capability: ConnectorCapabilityShape;
  mode: ConnectorExecutionModeShape;
  requestedLimits?: Record<string, unknown>;
}

interface RuntimeConnectorSafeMetadataBuilderInput {
  executionRequest: ExecutionRequestShape;
  resolvedReferences: ResolvedRuntimeReferences;
  mapping: RuntimeConnectorCapabilityMappingResult;
  limits: RuntimeConnectorLimits;
}

interface RuntimeConnectorCommandBuilderInput {
  executionRequest: ExecutionRequestShape;
  input: PrepareRuntimeConnectorCommandInput;
  resolvedReferences: ResolvedRuntimeReferences;
  mapping: RuntimeConnectorCapabilityMappingResult;
  limits: RuntimeConnectorLimits;
  safeParameters: Record<string, SafeMetadataValue>;
  metadata: Record<string, SafeMetadataValue>;
  requestedAt: string;
}
```

## ConnectorExecutionCommandShape Local Futuro

Como o `delfos-api` nao deve importar `delfos-connectors` nesta fase, a API devera documentar e,
em implementacao futura, manter um shape local equivalente ao contrato do connectors.

```ts
type ConnectorCapabilityShape =
  | "test_connection"
  | "inspect_schema"
  | "preview_dataset"
  | "execute_query_preview"
  | "generate_report_preview"
  | "export_report"
  | "refresh_dashboard_data"
  | "validate_mapping"
  | "estimate_query_cost";

type ConnectorExecutionModeShape = "dry_run" | "demo" | "preview" | "execute" | "export";

type SafeMetadataValue =
  | string
  | number
  | boolean
  | null
  | SafeMetadataValue[]
  | { readonly [key: string]: SafeMetadataValue };

interface ConnectorExecutionCommandShape {
  executionRequestId: string;
  tenantId: string;
  actorId?: string;
  actorRole?: string;
  connectionId?: string;
  credentialRef?: string;
  datasetId?: string;
  fieldMappingId?: string;
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  reportDefinitionId?: string;
  sourceType?: string;
  capability: ConnectorCapabilityShape;
  mode: ConnectorExecutionModeShape;
  requestedAt: string;
  requestId: string;
  correlationId: string;
  safeParameters: Record<string, SafeMetadataValue>;
  schemaMappingVersion?: string;
  maxRows?: number;
  timeoutMs?: number;
  previewLimit?: number;
  metadata: Record<string, SafeMetadataValue>;
}
```

Regras:

- o shape local deve espelhar o contrato conceitual do `delfos-connectors`;
- a validacao futura deve manter compatibilidade de campos, tipos, capabilities, modos, limites e
  sanitizacao;
- nao existe dependencia direta nesta fase;
- se no futuro houver pacote compartilhado, isso exige ADR propria;
- unknown fields devem ser bloqueados pelo validation port;
- forbidden fields devem ser removidos ou bloquear preparo conforme politica;
- `safeParameters` e `metadata` devem ser sanitizados por allowlist, nao por confianca no input.

Campos que nunca entram no command:

- `secretValue`;
- `protectedSecretValue`;
- `password`;
- `token`;
- `accessToken`;
- `refreshToken`;
- `secret`;
- `clientSecret`;
- `privateKey`;
- API key bruta;
- connection string;
- authorization header;
- cookies;
- stack trace;
- erro bruto;
- SQL livre;
- URL livre sem allowlist futura;
- payload bruto;
- filters livres sem validacao;
- dados de outro tenant.

## Responsabilidades

### BridgeResolver

O `RuntimeConnectorBridgeResolver` sera o orquestrador de preparo, sem executar dispatch.

Responsabilidades futuras:

- receber `executionRequestId`, `tenantId`, actor, `requestId` e `correlationId`;
- buscar a `ExecutionRequest` por `tenantId`;
- validar status, kind e mode permitidos para preparo;
- chamar readiness declarativa existente;
- se houver blockers, retornar `prepared=false` com erro seguro e evento conceitual;
- chamar o `ReferenceResolver`;
- chamar o `CapabilityMapper`;
- chamar a `LimitsPolicy`;
- chamar o `SafeMetadataBuilder`;
- chamar o `CommandBuilder`;
- chamar o `CommandValidationPort`;
- retornar command preparado ou erro seguro;
- nunca chamar fonte externa;
- nunca descriptografar credential;
- nunca fazer dispatch.

### ReferenceResolver

Responsabilidades futuras:

- resolver `queryDefinition`, `dashboardDefinition` ou `reportDefinition`;
- resolver `dataset`;
- resolver field mappings;
- resolver `connectionId`;
- resolver `credentialRef`;
- resolver `sourceType`;
- resolver `schemaMappingVersion` quando existir;
- confirmar que todos os recursos pertencem ao mesmo `tenantId`;
- representar fontes via descritores logicos e source-agnostic.

Proibicoes:

- nao descriptografar secret;
- nao montar connection string;
- nao chamar fonte externa;
- nao inferir tenant por estado global;
- nao buscar recurso apenas por ID sem `tenantId`;
- nao montar SQL/API URL real.

### CapabilityMapper

Responsabilidades futuras:

- traduzir `kind` e `mode` da API para `capability` e `mode` do connectors;
- aplicar a tabela conceitual do bridge plan;
- bloquear combinacoes nao suportadas;
- manter `execute` e `export` reais como `not_supported` ate fase explicita;
- garantir que `future_runtime` da API vire, no maximo, capability/mode de preview futuro quando
  readiness e politica permitirem.

Tabela inicial:

| API kind | API mode | Capability futura | Connector mode | Resultado nesta fase futura inicial |
| --- | --- | --- | --- | --- |
| `query` | `future_runtime` | `execute_query_preview` | `preview` | Preparavel, sem dispatch. |
| `query` | `dry_run` | `validate_mapping` ou `estimate_query_cost` | `dry_run` | Preparavel apenas como validacao/custo futuro. |
| `dashboard` | `future_runtime` | `refresh_dashboard_data` | `preview` | Preparavel, sem dispatch. |
| `report` | `future_runtime` | `generate_report_preview` | `preview` | Preparavel, sem export real. |
| `report` | export futuro | `export_report` | `export` | Bloqueado como `not_supported` ate politica propria. |
| qualquer | `demo` | n/a | `demo` | Permanece no fluxo demo atual da API, sem connectors. |

### LimitsPolicy

Responsabilidades futuras:

- definir `timeoutMs`;
- definir `maxRows`;
- definir `previewLimit`;
- definir `maxMetadataLength`;
- aplicar limites por capability, mode e `sourceType` futuramente;
- clamp de qualquer valor solicitado por usuario ou configuracao administrativa;
- bloquear valores livres que excedam limites de politica;
- evitar retorno de dataset completo.

Defaults conceituais iniciais:

| Limite | Default | Regra |
| --- | ---: | --- |
| `timeoutMs` | `5000` | Obrigatorio quando houver operacao externa futura. |
| `maxRows` | `100` | Nunca dataset completo. |
| `previewLimit` | `20` | Preview pequeno e limitado. |
| `maxMetadataLength` | `256` | Strings truncadas ou descartadas. |
| `maxBlockers` | `50` | Excesso vira contador truncado. |
| `maxWarnings` | `50` | Excesso vira contador truncado. |

### SafeMetadataBuilder

Responsabilidades futuras:

- incluir apenas metadata segura;
- montar `safeParameters` a partir de referencias declarativas, nao de payload bruto;
- remover ou bloquear parametros suspeitos;
- limitar strings e arrays;
- preservar contadores, flags, capability, mode, `sourceType`, limites e versoes de mapping;
- nao incluir payload bruto;
- nao incluir filters livres sem validacao;
- nao incluir headers, tokens, URL livre, SQL livre ou stack trace.

### CommandValidationPort

Responsabilidades futuras:

- validar o command contra regras equivalentes ao `delfos-connectors`;
- exigir campos obrigatorios;
- rejeitar capability/mode desconhecidos;
- rejeitar unknown fields;
- rejeitar forbidden fields;
- sanitizar `safeParameters` e `metadata`;
- validar `requestedAt` como ISO;
- validar limites positivos;
- validar que `credentialRef` nao parece secret;
- validar que `connectionId` nao parece connection string;
- retornar erro seguro.

Este port existe para evitar acoplamento direto ao package connectors. A implementacao inicial pode
ser local e conceitualmente equivalente ao contrato do connectors.

### DispatchPort

Responsabilidade futura:

- representar o boundary de envio para transporte real quando uma ADR decidir o mecanismo.

Possibilidades futuras:

- HTTP interno;
- fila;
- outbox;
- pull worker;
- outro transporte aprovado.

Regras:

- nao decidido nesta fase;
- nao usado pelo `BridgeResolver` docs-only;
- antes de implementacao real exige ADR de transporte, threat model, idempotencia, retries,
  timeouts, autenticacao interna e observabilidade.

### EventRecorder

Responsabilidades futuras:

- registrar `command_prepared`;
- registrar `command_blocked`;
- registrar `command_validation_failed`;
- manter eventos metadata-only;
- preservar `tenantId`, `executionRequestId`, `requestId` e `correlationId`;
- nunca registrar secrets, SQL, URL livre, payload bruto ou erro bruto.

## Fluxo de Preparo

Sequencia futura:

1. Receber input com `executionRequestId`, `tenantId`, actor, `requestId` e `correlationId`.
2. Buscar `ExecutionRequest` por `tenantId` e `_id`.
3. Validar que a request pertence ao tenant informado.
4. Validar status, kind e mode permitidos para preparo.
5. Executar readiness declarativo existente.
6. Se houver blockers, retornar `prepared=false` com `safeError`, blockers e evento conceitual
   `command_blocked`.
7. Resolver cadeia declarativa por `ReferenceResolver`.
8. Confirmar tenant scope em cada recurso resolvido.
9. Mapear capability/mode por `CapabilityMapper`.
10. Se a combinacao for `execute` ou `export` real nao aprovada, retornar `prepared=false` com
    `not_supported`.
11. Aplicar `LimitsPolicy`.
12. Montar `safeParameters` e `metadata`.
13. Montar `ConnectorExecutionCommandShape`.
14. Validar command via `CommandValidationPort`.
15. Se a validacao falhar, retornar `prepared=false` com erro seguro e evento conceitual.
16. Retornar `prepared=true` com command e evento conceitual `command_prepared`.
17. Nao fazer dispatch.

Pseudocodigo:

```ts
async function prepareCommand(input: PrepareRuntimeConnectorCommandInput) {
  requireTenant(input.tenantId);

  const executionRequest = await executionRequests.findOneByTenant(
    input.tenantId,
    input.executionRequestId,
  );

  assertPreparationStatus(executionRequest.status);
  assertKindAndMode(executionRequest.kind, executionRequest.mode);

  const readiness = await readinessService.evaluate(executionRequest);
  if (readiness.blockers.length > 0) {
    return blocked("READINESS_BLOCKED", readiness.blockers);
  }

  const references = await referenceResolver.resolveReferences({
    tenantId: input.tenantId,
    executionRequest,
  });

  const mapping = capabilityMapper.mapCapability({
    kind: executionRequest.kind,
    apiMode: executionRequest.mode,
    resolvedReferences: references,
  });

  if (!mapping.supported) {
    return notSupported(mapping.reasonCode);
  }

  const limits = limitsPolicy.resolveLimits({
    tenantId: input.tenantId,
    sourceType: references.sourceType,
    capability: mapping.capability,
    mode: mapping.mode,
  });

  const safeMetadata = safeMetadataBuilder.build({
    executionRequest,
    resolvedReferences: references,
    mapping,
    limits,
  });

  const command = commandBuilder.buildCommand({
    input,
    executionRequest,
    resolvedReferences: references,
    mapping,
    limits,
    safeParameters: safeMetadata.safeParameters,
    metadata: safeMetadata.metadata,
    requestedAt: new Date().toISOString(),
  });

  const validation = await commandValidationPort.validate(command);
  if (!validation.valid) {
    return blocked("COMMAND_VALIDATION_FAILED", [], validation.error);
  }

  return prepared(command);
}
```

## Source-Agnostic Resolver

O resolver futuro deve suportar SQL, REST/JSON, MongoDB e arquivos/fontes futuras sem assumir que
dashboard, report ou query definition conhecem nomes fisicos de tabela/coluna.

```ts
interface SourceDescriptor {
  sourceType: "sql" | "rest_json" | "mongodb" | "file" | string;
  sourceObject?: string;
  connectionId: string;
  credentialRef: string;
  schemaMappingVersion?: string;
  metadata: Record<string, SafeMetadataValue>;
}

interface SourceFieldDescriptor {
  sourceObject?: string;
  sourceFieldPath: string;
  sourceFieldType?: string;
  required?: boolean;
}

interface LogicalFieldDescriptor {
  logicalField: string;
  logicalType?: string;
  semanticRole?: "metric" | "dimension" | "time" | "identifier" | string;
}

interface FieldMappingDescriptor {
  fieldMappingId: string;
  datasetId: string;
  datasetKey: string;
  source: SourceFieldDescriptor;
  logical: LogicalFieldDescriptor;
  transform?: string;
  status: "active" | "inactive" | string;
}

interface ResolvedRuntimeReferences {
  tenantId: string;
  connectionId?: string;
  credentialRef?: string;
  datasetId?: string;
  fieldMappingIds: string[];
  queryDefinitionId?: string;
  dashboardDefinitionId?: string;
  reportDefinitionId?: string;
  sourceType?: string;
  source?: SourceDescriptor;
  fieldMappings: FieldMappingDescriptor[];
  schemaMappingVersion?: string;
}
```

Exemplos ficticios:

| Fonte | `sourceObject` | `sourceFieldPath` | `logicalField` |
| --- | --- | --- | --- |
| SQL | `Pedidos` | `ValorTotal` | `sales.totalAmount` |
| REST/JSON | `$.items[*]` | `amount` | `sales.totalAmount` |
| MongoDB | `orders` | `items.amount` | `sales.totalAmount` |
| Arquivos | `sheet:Vendas` | `Valor Total` | `sales.totalAmount` |

Regras por familia:

- SQL usa tabela/campo de origem como metadata segura, sem SQL livre.
- REST/JSON usa paths declarativos e allowlist futura de fonte, sem URL livre.
- MongoDB usa document paths declarativos, sem pipeline livre.
- Arquivos usam objeto/aba/coluna declarativos, sem leitura real nesta fase.

## Matriz de Testes Futuros

| Caso | Esperado |
| --- | --- |
| Query execution request pronta | Vira `execute_query_preview` com mode `preview`. |
| Dashboard request pronta | Vira `refresh_dashboard_data` com mode `preview`. |
| Report request pronta | Vira `generate_report_preview` com mode `preview`. |
| Export real | Permanece `not_supported`/futuro. |
| Request sem `tenantId` | Bloqueia. |
| Request de outro tenant | Nao resolve. |
| Readiness com blockers | Nao prepara command. |
| Dataset sem mapping | Bloqueia. |
| Connection sem `credentialRef` | Bloqueia ou retorna `safeError` conforme politica. |
| `credentialRef` | Nunca contem secret. |
| `protectedSecretValue` | Nunca entra no command. |
| Connection string | Nunca entra no command. |
| `safeParameters` com forbidden fields | Remove ou bloqueia conforme politica. |
| `metadata` com forbidden fields | Remove ou bloqueia conforme politica. |
| `requestId` | Preservado no command. |
| `correlationId` | Preservado no command. |
| `requestedAt` | Obrigatorio e ISO. |
| `sourceType` | Obrigatorio quando capability exigir fonte. |
| REST/JSON source | Usa field paths, nao exige tabela/coluna SQL. |
| SQL source | Usa source field/table como metadata segura, sem SQL livre. |
| MongoDB source | Usa document paths, sem pipeline livre. |
| `execute` real | Permanece bloqueado. |
| `export` real | Permanece bloqueado. |
| Command invalido | Validation port rejeita com erro seguro. |
| Eventos futuros | Nao contem secrets. |
| Actor ausente quando politica exigir | Bloqueia ou retorna erro seguro. |
| Unknown command field | Validation port rejeita. |
| Limites negativos ou zero | Validation port rejeita. |
| Limites acima da politica | Limits policy faz clamp ou bloqueia. |
| URL livre em parametros | Remove ou bloqueia ate allowlist futura. |
| SQL livre em parametros | Remove ou bloqueia. |
| Payload bruto em metadata | Remove ou bloqueia. |
| `connectionId` com padrao de connection string | Rejeita. |
| `credentialRef` com padrao de token/senha | Rejeita. |
| Dashboard sem widgets resolviveis | Readiness bloqueia. |
| Report sem referencia resolvivel | Readiness bloqueia. |
| Field mapping inativo | Warning ou blocker conforme politica futura. |
| Cross-tenant reference chain | Bloqueia. |

## Riscos e Mitigacoes

| Risco | Mitigacao |
| --- | --- |
| Bridge virar executor real por acidente | Resolver prepara command e nao recebe dispatch ativo; testes garantem que nenhum transport e chamado. |
| Payload bruto vazar | Allowlist de command, sanitizacao e forbidden fields. |
| SQL livre atravessar command | `safeParameters` declarativos, testes e validation port. |
| URL livre/SSRF futuro | Source allowlist futura antes de REST real; URL livre bloqueada. |
| `credentialRef` confundido com secret | Nome e testes reforcam que e referencia; padroes suspeitos rejeitados. |
| `connectionId` confundido com connection string | Padroes de connection string rejeitados. |
| `tenantId` como filtro opcional | Busca por tenant obrigatoria; testes cross-tenant. |
| Cache/fila futura sem tenant scope | ADR de transporte/cache/fila antes de implementacao; envelope carrega `tenantId`. |
| Drift entre contrato local API e contrato connectors | Validation port, matriz de compatibilidade e revisao conjunta de docs. |
| Drift entre docs e codigo | Checklist de implementacao futura e testes obrigatorios. |
| Eventos com segredo | Event recorder metadata-only e testes de forbidden fields. |
| Limites livres vindos do usuario | Limits policy com clamp e defaults. |
| Acoplamento direto API -> connectors | Sem import direto; package compartilhado exige ADR propria. |

## Checklist de Implementacao Futura

- [ ] Criar ADR de transporte antes de dispatch real.
- [ ] Revisar threat model antes de execucao real.
- [ ] Criar `RuntimeConnectorBridgeResolver` apenas como command preparation.
- [ ] Criar `RuntimeConnectorReferenceResolver` tenant-scoped.
- [ ] Criar `RuntimeConnectorCapabilityMapper` com tabela testada.
- [ ] Criar `RuntimeConnectorLimitsPolicy`.
- [ ] Criar `RuntimeConnectorSafeMetadataBuilder`.
- [ ] Criar `RuntimeConnectorCommandValidationPort` local.
- [ ] Criar testes de tenant isolation.
- [ ] Criar testes de forbidden fields.
- [ ] Criar testes de `credentialRef` sem secret.
- [ ] Criar testes de `connectionId` sem connection string.
- [ ] Criar testes de source-agnostic mapping.
- [ ] Criar eventos `command_prepared` e `command_blocked` metadata-only.
- [ ] Manter dispatch desabilitado ate ADR propria.
- [ ] Atualizar docs do `delfos-connectors` quando o contrato local mudar.

## Referencias

- [`docs/runtime-connectors-bridge-plan.md`](./runtime-connectors-bridge-plan.md)
- [`docs/adr/adr-0015-runtime-connectors-command-envelope-bridge.md`](./adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [`docs/adr/adr-0014-runtime-execution-requests-foundation.md`](./adr/adr-0014-runtime-execution-requests-foundation.md)
- [`docs/adr/adr-0008-connectors-and-integration-execution.md`](./adr/adr-0008-connectors-and-integration-execution.md)
- [`docs/api-foundation-contracts.md`](./api-foundation-contracts.md)
- [`docs/foundation-credentials-and-security.md`](./foundation-credentials-and-security.md)
- [`docs/data-access-policy.md`](./data-access-policy.md)
- [`docs/operations-runbook.md`](./operations-runbook.md)
- `delfos-connectors/docs/runtime-contracts.md`
- `delfos-connectors/docs/security-boundaries.md`
- `delfos-connectors/docs/multitenancy-and-isolation.md`
- `delfos-connectors/docs/adr/ADR-0013-connectors-boundary-and-multitenant-runtime-contract.md`
