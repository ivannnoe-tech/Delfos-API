# Runtime Connectors Bridge Plan

## Status

Planejamento conceitual. Este documento nao implementa bridge real, endpoint, worker, fila,
cache, scheduler, local agent, chamada ao `delfos-connectors`, execucao SQL/API externa,
descriptografia de credenciais ou export real.

## Objetivo

Explicar como uma `ExecutionRequest` futura do `delfos-api` podera virar um
`ConnectorExecutionCommand` seguro para o `delfos-connectors`, mantendo isolamento por tenant,
referencias seguras, sanitizacao e rastreabilidade.

O desenho tecnico das interfaces internas futuras do resolver esta em
[`docs/runtime-connectors-bridge-resolver-design.md`](./runtime-connectors-bridge-resolver-design.md).

Esta ponte e documental. Nenhum codigo atual deve interpretar este documento como autorizacao para
execucao real.

## Estado Atual

### delfos-api

O runtime atual da API e foundation administrativa/declarativa.

> **Nota honesta:** ja existe codigo de foundation de bridge/resolver/adapter
> sob `src/modules/runtime/bridge/`. Esse codigo e **tests-only e nao
> operacional**: classes puras, sem provider NestJS, sem registro no
> `RuntimeModule`, sem endpoint, sem dispatch e sem chamada externa. Ele esta
> congelado nesse estado ate a **ADR-0015** estar `Accepted`.

Enums atuais:

| Contrato | Valores atuais |
|---|---|
| `ExecutionRequestKind` | `query`, `dashboard`, `report` |
| `ExecutionRequestMode` | `demo`, `dry_run`, `future_runtime` |
| `ExecutionRequestStatus` | `queued`, `accepted`, `blocked`, `failed`, `completed_demo`, `not_supported` |

Campos atuais da `ExecutionRequest`:

- `tenantId`;
- `requestKey`;
- `kind`;
- `status`;
- `queryDefinitionId`;
- `dashboardDefinitionId`;
- `reportDefinitionId`;
- `connectionId`;
- `datasetId`;
- `requestedByActorId`;
- `requestedByRole`;
- `mode`;
- `reason`;
- `message`;
- `metadata`;
- `createdAt`;
- `updatedAt`.

Eventos atuais sao administrativos, tenant-scoped e metadata-only. O contrato atual inclui:

- `requested`;
- `accepted`;
- `status_changed`;
- `blocked`;
- `failed`;
- `completed_demo`;
- `not_supported`;
- `note_added`.

O dry-run atual avalia readiness declarativa ja persistida no Mongo administrativo:

- para `query`, valida `queryDefinition`, `dataset` e `fieldMappings`;
- para `dashboard`, valida `dashboardDefinition`, widgets e queries resolviveis;
- para `report`, valida `reportDefinition`, referencias de query/dashboard e `exportOptions`
  apenas como configuracao declarativa;
- retorna `checks`, `warnings`, `blockers`, `ready` e `recommendedStatus`;
- nao executa runtime real, conector, query, export, credencial, worker, fila, cache, scheduler,
  chamada externa ou acesso a fonte de cliente.

O demo-execute atual:

- reaproveita readiness declarativa;
- gera resultado ficticio e limitado quando nao ha blockers;
- registra evento seguro e atualiza status administrativo para `completed_demo` ou `blocked`;
- nao aceita body;
- nao executa runtime real, query, dashboard, report, export, conector, worker, fila, cache,
  scheduler, descriptografia de credencial, chamada externa ou acesso a fonte de cliente.

Ainda nao existe:

- bridge real;
- dispatch para `delfos-connectors`;
- transporte HTTP/fila/pull;
- endpoint novo;
- executor real;
- conector real;
- worker/fila/cache/scheduler/local agent;
- teste real de conexao;
- discovery real;
- SQL/API externa;
- descriptografia de credenciais no fluxo runtime.

### delfos-connectors

O `delfos-connectors` possui Skeleton Foundation TypeScript seguro.

Contratos existentes:

- `ConnectorExecutionCommand`;
- `ConnectorExecutionContext`;
- `ConnectorTenantScope`;
- `ConnectorSourceScope`;
- `ConnectorCapability`;
- `ConnectorExecutionMode`;
- `ConnectorExecutionStatus`;
- `ConnectorExecutionResult`;
- `ConnectorExecutionError`;
- `ConnectorExecutionEvent`;
- `ConnectorSafeMetadata`;
- `ConnectorDataPreview`;
- `ConnectorSchemaInspectionResult`;
- `ConnectorSanitizedLogEvent`.

Capabilities futuras permitidas:

- `test_connection`;
- `inspect_schema`;
- `preview_dataset`;
- `execute_query_preview`;
- `generate_report_preview`;
- `export_report`;
- `refresh_dashboard_data`;
- `validate_mapping`;
- `estimate_query_cost`.

Modos futuros permitidos:

- `dry_run`;
- `demo`;
- `preview`;
- `execute`;
- `export`.

Estados permitidos:

- `created`;
- `queued`;
- `accepted`;
- `running`;
- `blocked`;
- `completed`;
- `completed_demo`;
- `failed`;
- `cancelled`;
- `expired`;
- `not_supported`.

Seguranca existente no skeleton:

- `assertSafeCommand` valida obrigatorios, capability, mode, `credentialRef`, `connectionId`,
  `requestedAt`, limites e campos proibidos;
- `validateExecutionCommand` retorna `valid: true` ou `valid: false` com erro sanitizado;
- `sanitizeMetadata` remove campos proibidos, valores suspeitos e limita strings;
- `sanitizeError` nao confia em mensagens externas sensiveis, nao retorna stack trace e aceita
  `occurredAt` controlado;
- `FakeConnectorAdapter` e deterministico, ficticio, sem rede, banco, arquivo, secret, worker,
  fila, cache, scheduler, local agent ou export real.

## Fora de Escopo

- conector real;
- bridge real;
- chamada do `delfos-api` ao `delfos-connectors`;
- dependencia entre repositorios;
- package compartilhado ou monorepo;
- endpoint novo;
- alteracao de controller, schema, DTO ou contrato publico;
- worker, fila, cache, scheduler ou local agent;
- SQL/API externa real;
- descriptografia real de credenciais;
- export real PDF/Excel/CSV;
- acesso a banco, API, arquivo ou fonte de cliente;
- dados reais em exemplos.

## Responsabilidades Futuras

### delfos-api

- validar request, tenant, actor e role;
- validar readiness declarativa;
- resolver referencias administrativas;
- confirmar que recursos pertencem ao mesmo `tenantId`;
- resolver `connectionId` e `credentialRef` como referencias, sem segredo bruto;
- montar `ConnectorExecutionCommand` seguro;
- aplicar limites antes do dispatch;
- registrar eventos e auditoria metadata-only;
- nunca executar fonte externa.

### delfos-connectors

- validar command envelope;
- aplicar limites de tempo, volume e preview;
- executar capability somente quando fase futura autorizar;
- retornar `ConnectorExecutionResult`, `ConnectorExecutionError` e eventos sanitizados;
- nunca receber secret bruto por esta bridge conceitual;
- nunca misturar tenants;
- nunca compartilhar conexao/cache/estado sem escopo de tenant e fonte.

### delfos-web

- exibir status, timeline, readiness e resultados seguros;
- nunca executar conector;
- nunca receber secret;
- nunca acessar fonte de cliente.

## Bridge Conceitual

Fluxo futuro planejado:

```text
ExecutionRequest
  -> RuntimeReadiness
  -> BridgeResolver
  -> ConnectorExecutionCommand
  -> ConnectorValidation
  -> Future dispatch
  -> ConnectorExecutionResult / ConnectorExecutionError / ConnectorExecutionEvent
  -> Runtime Events / Audit / Web
```

Esse fluxo ainda nao existe em codigo.

## Mapeamento Conceitual Kind/Mode -> Capability/Mode

| API kind | API mode atual/futuro | Connector capability futura | Connector mode futuro | Observacao |
|---|---|---|---|---|
| `query` | `dry_run` | `validate_mapping` / `estimate_query_cost` | `dry_run` | Apenas validacao declarativa/custo futuro; sem execucao real. |
| `query` | `future_runtime` / preview futuro | `execute_query_preview` ou `preview_dataset` | `preview` | Depende de `queryDefinition` e `dataset`; sempre limitado. |
| `dashboard` | `future_runtime` / preview futuro | `refresh_dashboard_data` | `preview` | Cada widget pode depender de uma query resolvida. |
| `report` | `future_runtime` / preview futuro | `generate_report_preview` | `preview` | Sem export real nesta etapa. |
| `report` | export futuro | `export_report` | `export` | Requer politica propria de limite, masking, armazenamento e auditoria. |
| connection | readiness futuro | `test_connection` | `dry_run` / `preview` | Sem secret bruto; teste real exige fase futura. |
| connection/schema | discovery futuro | `inspect_schema` | `preview` | Retorna metadados limitados e genericos. |
| field mapping | validation futuro | `validate_mapping` | `dry_run` | De/Para logico, tenant-scoped. |
| `query` | cost guard futuro | `estimate_query_cost` | `dry_run` | Evita execucao cara antes de qualquer preview real. |

Regras:

- a tabela e conceitual;
- nao autoriza execucao real;
- implementacao futura deve ter testes unitarios e revisao de seguranca;
- toda traducao deve preservar `tenantId`, `requestId`, `correlationId`, `sourceType`,
  `connectionId` e `credentialRef`;
- toda traducao deve aplicar `timeoutMs`, `maxRows`, `previewLimit` e sanitizacao.

## ConnectorExecutionCommand Futuro

Preenchimento conceitual:

| Campo | Origem futura | Regra |
|---|---|---|
| `executionRequestId` | `_id` da `ExecutionRequest` | Obrigatorio. |
| `tenantId` | `ExecutionRequest.tenantId` | Obrigatorio e boundary. |
| `actorId` | contexto autenticado / `requestedByActorId` | Obrigatorio quando auth final existir. |
| `actorRole` | contexto autenticado / `requestedByRole` | Obrigatorio quando auth final existir. |
| `connectionId` | cadeia dataset/query/connection ou `ExecutionRequest.connectionId` | Referencia, nunca connection string. |
| `credentialRef` | credential associada a connection | Referencia, nunca segredo. |
| `datasetId` | `QueryDefinition.datasetId` ou request | Conforme kind/capability. |
| `fieldMappingId` | mapping aplicavel ou conjunto futuro | Quando a capability exigir mapping especifico. |
| `queryDefinitionId` | `ExecutionRequest.queryDefinitionId` ou widget/block resolvido | Conforme kind. |
| `dashboardDefinitionId` | `ExecutionRequest.dashboardDefinitionId` | Conforme kind. |
| `reportDefinitionId` | `ExecutionRequest.reportDefinitionId` | Conforme kind. |
| `sourceType` | connection/dataset declarativo | Obrigatorio quando houver fonte. |
| `capability` | traducao kind/mode -> capability | Obrigatorio. |
| `mode` | traducao mode API -> mode connectors | Obrigatorio. |
| `requestedAt` | timestamp da request/dispatch | ISO string obrigatoria. |
| `requestId` | contexto da API | Obrigatorio. |
| `correlationId` | contexto da API | Obrigatorio. |
| `safeParameters` | parametros declarativos sanitizados | Nunca SQL livre, header sensivel ou payload bruto. |
| `schemaMappingVersion` | dataset/mapping/versionamento futuro | Usado para compatibilidade. |
| `maxRows` | limite aprovado | Obrigatorio quando retornar dados. |
| `timeoutMs` | limite aprovado | Obrigatorio quando houver operacao externa futura. |
| `previewLimit` | limite aprovado | Obrigatorio para preview. |
| `metadata` | metadados sanitizados | Apenas contadores, flags, codigos, sourceType, limites. |

Nao pode entrar no command:

- `secretValue`;
- `protectedSecretValue`;
- `password`;
- `token`;
- API key bruta;
- private key;
- connection string;
- headers sensiveis;
- cookies;
- SQL livre;
- URL livre sem allowlist futura;
- raw payload;
- stack trace;
- erro bruto;
- dados de outro tenant.

## Resolucao Futura de Referencias

Resolucao conceitual, sem execucao real:

```text
ExecutionRequest
  -> QueryDefinition / DashboardDefinition / ReportDefinition
  -> Dataset
  -> FieldMappings
  -> Connection
  -> CredentialRef
  -> SourceType
  -> Limits
  -> ConnectorExecutionCommand
```

Regras:

- a API resolve IDs e contratos administrativos;
- toda busca deve ser tenant-scoped;
- a API confirma pertencimento ao `tenantId`;
- a API nao descriptografa secret para montar command;
- `credentialRef` continua referencia;
- `connectionId` continua referencia;
- o `delfos-connectors` tambem nao recebe secret bruto nessa bridge conceitual;
- Vault/KMS/local agent/provider de credenciais futuro exige ADR/fase propria.

## Limites Default Futuros

Defaults sugeridos para a primeira implementacao futura, sujeitos a revisao:

| Limite | Default conceitual | Observacao |
|---|---:|---|
| `timeoutMs` | `5000` | Aumentos por capability devem ser explicitos. |
| `maxRows` | `100` | Nunca retornar dataset completo. |
| `previewLimit` | `20` | Preview pequeno, mascarado e tenant-scoped. |
| `maxMetadataLength` | `256` caracteres por string | Alinhado ao skeleton connectors. |
| `maxEventsPerExecution` | `100` | Evita timeline ruidosa. |
| `maxWarnings` | `50` | Excesso deve virar contador truncado. |
| `maxBlockers` | `50` | Excesso deve virar contador truncado. |
| rate limit futuro | por `tenantId + connectionId + capability` | Definir em ADR de transporte/runtime. |
| idempotency key futura | `tenantId + executionRequestId + capability + mode` | Evita re-dispatch acidental. |

Esses limites nao estao implementados por este documento.

## Eventos Futuros da Timeline

| Evento futuro | Metadata permitida | Metadata proibida | Status anterior/proximo possivel | Web |
|---|---|---|---|---|
| `command_prepared` | `capability`, `mode`, `sourceType`, limites, contadores de referencias | secrets, SQL, headers, payload bruto | `accepted` -> `accepted` | Sim |
| `command_validated` | `valid`, `checksCount`, `warningsCount`, `blockersCount` | erro bruto, stack trace | `accepted` -> `accepted` ou `blocked` | Sim |
| `connector_dispatch_planned` | transporte planejado, idempotency key hash, capability | URL livre, credencial, body bruto | `accepted` -> `queued` | Sim |
| `connector_dispatch_started` | `capability`, `mode`, `timeoutMs` | segredo, payload externo | `queued` -> `running` | Sim |
| `connector_result_received` | status, duracao, rowCount limitado, warningsCount | rows completas, payload bruto | `running` -> `completed` | Sim |
| `connector_failed_safely` | error code, category, retryable, duration | driver error bruto, stack, token | `running` -> `failed` | Sim |
| `connector_blocked` | blocker codes, counts, capability | payload bruto, segredo | `accepted`/`running` -> `blocked` | Sim |
| `connector_not_supported` | capability, mode, reason code | detalhes internos sensiveis | `accepted` -> `not_supported` | Sim |
| `connector_completed_preview` | rowCount limitado, masked, previewLimit, duration | dataset completo, dados de outro tenant | `running` -> `completed` | Sim |
| `connector_completed_export` | export manifest seguro, size class, duration | arquivo real bruto, URL publica sem assinatura | `running` -> `completed` | Sim futuro |

Eventos reais exigem implementacao futura e contrato de auditoria. Este documento nao cria esses
eventos.

## Estrategia Source-Agnostic

A bridge nao pode assumir SQL. O command deve representar escopo e parametros declarativos para
fontes diferentes.

Conceitos obrigatorios:

- `sourceType`;
- `sourceScope`;
- source object;
- source field path;
- logical dataset;
- field mapping;
- `schemaMappingVersion`;
- `safeParameters` declarativos;
- schema inspection generico.

Exemplos ficticios:

| Fonte | Source field/path | Logical field |
|---|---|---|
| SQL | `Pedidos.ValorTotal` | `sales.totalAmount` |
| REST/JSON | `$.items[*].amount` | `sales.totalAmount` |
| MongoDB | `orders.items.amount` | `sales.totalAmount` |
| Arquivo futuro | `columns.amount` | `sales.totalAmount` |

Regras:

- dashboards e reports nao dependem de nomes fisicos;
- query definitions consomem dataset/mapping logico;
- conector futuro transforma fonte fisica em preview logico limitado;
- nenhuma query string livre atravessa a bridge sem validacao futura;
- SQL, JSON, documentos e arquivos devem passar pelo mesmo isolamento de tenant/source.

## Matriz de Riscos

| Risco | Mitigacao planejada |
|---|---|
| Vazamento de secret no command | allowlist de campos, sanitizacao, proibicao de `secretValue`/`protectedSecretValue`. |
| Mistura cross-tenant | todas as resolucoes tenant-scoped e command com `tenantId` obrigatorio. |
| Acoplamento API -> package connectors | nao importar package; contrato documentado e decisao futura de transporte. |
| Execucao real acidental | bridge futura deve iniciar como command preparation + validation only. |
| SQL/API livre | `safeParameters` declarativos e policies por capability. |
| Timeline com payload bruto | eventos metadata-only e erro sanitizado. |
| Limites ausentes | defaults e testes antes de qualquer dispatch real. |

## Checklist de Implementacao Futura

- [ ] criar `BridgeResolver` no `delfos-api`;
- [ ] criar testes unitarios da traducao kind/mode -> capability/mode;
- [ ] criar testes de tenant isolation;
- [ ] criar testes de `credentialRef` sem secret;
- [ ] criar testes de forbidden fields;
- [ ] criar eventos `command_prepared` e `command_validated`;
- [ ] criar contrato de dispatch futuro;
- [ ] decidir se `delfos-api` chama connectors via HTTP, fila ou outro transporte;
- [ ] criar ADR para transporte;
- [ ] revisar threat model;
- [ ] so entao habilitar fake adapter remoto/local;
- [ ] so entao planejar primeiro conector real.

## Plano de Fases Futuras

1. Documentar e revisar este plano.
2. Documentar o design tecnico do Bridge Resolver.
3. Definir ADR de transporte real, sem conector real.
4. Implementar `BridgeResolver` apenas com command preparation e validacao local/ficticia.
5. Registrar eventos `command_prepared`/`command_validated` metadata-only.
6. Integrar fake adapter por transporte aprovado, ainda sem fonte externa.
7. Definir politica de credenciais real com Vault/KMS/local agent se necessario.
8. Planejar primeiro conector real com escopo, limites, threat model e testes dedicados.
