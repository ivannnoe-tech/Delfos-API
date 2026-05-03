# Runtime Reference Reader Adapters Design

## Status

Foundation tests-only implementada. Os adapters internos existem como classes puras, isoladas e
testaveis em `src/modules/runtime/bridge/adapters/`, sem provider NestJS, sem decorators, sem
registro no `RuntimeModule`, sem endpoint, sem controller, sem DTO/schema publico, sem dispatch,
sem chamada ao `delfos-connectors`, sem SQL/API externa, sem descriptografia de credencial, sem
worker, fila, cache, scheduler, local agent, PDF/Excel/CSV real ou acesso a fonte de cliente.

Esta foundation converte shapes retornados por dependencias minimas/fakes em shapes minimos dos
ports do `RuntimeConnectorReferenceResolver`. Ela ainda nao pluga services/repositories reais do
Mongo administrativo em fluxo operacional.

O desenho futuro de wiring dos adapters foundation com services/repositories reais esta em
[`docs/runtime-reference-reader-adapter-wiring-design.md`](./runtime-reference-reader-adapter-wiring-design.md).
Esse wiring tambem e apenas design: ainda nao ha provider, `RuntimeModule`, endpoint, dispatch,
decrypt ou chamada externa.

## Objetivo

Desenhar e registrar a foundation tests-only de como os ports/readers do
`RuntimeConnectorReferenceResolver` poderao ser alimentados futuramente por readers/adapters
baseados nos modulos declarativos reais do Mongo administrativo do `delfos-api`.

O objetivo dos adapters e transformar recursos administrativos tenant-scoped em shapes minimos
internos:

```text
services/repositories reais do Mongo administrativo
  -> reader adapters internos
  -> RuntimeQueryDefinitionLike / RuntimeDatasetLike / ...
  -> RuntimeConnectorReferenceResolver
```

Adapters nao devem expor documentos Mongoose inteiros ao resolver. Eles devem retornar somente os
campos minimos exigidos pelos ports, com metadados sanitizados e sem secrets.

## Estado Atual

- `RuntimeConnectorReferenceResolver` existe como classe interna testavel em
  `src/modules/runtime/bridge/runtime-connector-reference-resolver.ts`.
- Os ports/readers internos ja existem no mesmo arquivo do resolver.
- `RuntimeConnectorBridgeResolver.prepareCommand` existe internamente e usa
  `RuntimeReferenceResolverPort`.
- Testes unitarios usam fakes em memoria para o `ReferenceResolver`.
- Testes internos integrados cobrem `prepareCommand` + `RuntimeConnectorReferenceResolver` real
  com fakes/readers declarativos em memoria.
- Adapters foundation tests-only existem em `src/modules/runtime/bridge/adapters/`.
- Os adapters recebem dependencias minimas por constructor e sao testados com fakes em memoria.
- Os adapters ainda nao estao conectados a services/repositories reais por provider NestJS.
- O wiring futuro dos adapters com services/repositories reais esta documentado em
  [`docs/runtime-reference-reader-adapter-wiring-design.md`](./runtime-reference-reader-adapter-wiring-design.md),
  ainda sem implementacao operacional.
- Ainda nao ha provider NestJS, endpoint, dispatch, transporte, executor real ou chamada ao
  `delfos-connectors`.

## Fora de Escopo

- registrar adapters como providers operacionais;
- plugar adapters reais no `RuntimeModule`;
- alterar service/repository existente;
- registrar provider NestJS;
- alterar `RuntimeModule`;
- alterar controller, DTO publico ou schema;
- criar endpoint;
- fazer dispatch ou transporte;
- chamar ou importar `delfos-connectors`;
- executar SQL/API externa;
- descriptografar credenciais;
- acessar fonte de cliente;
- criar worker, fila, cache, scheduler ou local agent;
- gerar PDF/Excel/CSV real;
- alterar `delfos-web` ou `delfos-connectors`;
- adicionar dependencia;
- versionar `.env` real ou segredo.

## Principios

- `tenantId` e boundary obrigatorio em toda leitura.
- Adapter deve buscar por `tenantId + id` ou `tenantId + filtro` sempre que o recurso for
  tenant-scoped.
- Adapter deve retornar shape minimo, nao documento Mongoose inteiro.
- Adapter nao deve retornar `protectedSecretValue`, `secretValue`, senha, token, authorization,
  connection string, headers sensiveis, payload bruto ou stack trace.
- Adapter nao deve chamar fonte externa, `delfos-connectors`, driver de banco de cliente,
  API externa, arquivo operacional, worker, fila, cache ou scheduler.
- Adapter nao deve descriptografar credencial.
- Adapter deve converter `NotFoundException` ou resultado ausente em `null`/`[]` conforme o port.
- Adapter nao deve propagar erro bruto ao resolver. Erros inesperados devem virar falha segura
  do resolver ou blocker seguro em uma camada de wrapper futura.
- Adapter deve preservar IDs como string e objetos de origem como referencias, nunca como
  connection string.
- A politica de preparo de command deve ser mais conservadora que a readiness diagnostica.

## Foundation Implementada

Arquivos adicionados:

- `src/modules/runtime/bridge/adapters/runtime-query-definition-reader.adapter.ts`;
- `src/modules/runtime/bridge/adapters/runtime-dashboard-definition-reader.adapter.ts`;
- `src/modules/runtime/bridge/adapters/runtime-report-definition-reader.adapter.ts`;
- `src/modules/runtime/bridge/adapters/runtime-dataset-reader.adapter.ts`;
- `src/modules/runtime/bridge/adapters/runtime-field-mapping-reader.adapter.ts`;
- `src/modules/runtime/bridge/adapters/runtime-connection-reader.adapter.ts`;
- `src/modules/runtime/bridge/adapters/runtime-credential-reference-reader.adapter.ts`;
- `src/modules/runtime/bridge/adapters/runtime-reader-adapter-utils.ts`;
- `src/modules/runtime/bridge/adapters/index.ts`.

Testes adicionados:

- `src/modules/runtime/tests/runtime-reference-reader-adapters.spec.ts`.

Cobertura:

- shapes minimos por adapter, sem retornar documento bruto;
- tenant scope defensivo;
- `null`/`[]` para not found, outro tenant e falha interna de reader;
- sanitizacao de metadata com `RuntimeConnectorSafeMetadataBuilder`;
- preservacao de status para policy do resolver;
- source-agnostic mappings para SQL, REST/JSON, MongoDB e file;
- `credentialRef` seguro sem `protectedSecretValue`, sem `secretValue`, sem decrypt e sem
  `maskedPreview`;
- integracao interna `adapters fakeados -> RuntimeConnectorReferenceResolver` para happy path de
  query.

Esta foundation continua sem Nest `@Injectable`, sem provider, sem `RuntimeModule`, sem endpoint,
sem dispatch, sem chamada externa e sem import de `delfos-connectors`.

## Matriz Port -> Modulo Real

| Port                                   | Fonte real futura                                                 | Metodo/servico provavel                                                                 | Observacoes                                                                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RuntimeQueryDefinitionReaderPort`     | `QueryDefinitionsService` ou `QueryDefinitionsRepository`         | `findOne(tenantId, id)` ou `findByTenantAndId(tenantId, id)`                            | Retornar `id`, `tenantId`, `datasetId`, `queryKey`, `status`, `type` e metadata segura minima.                                                                      |
| `RuntimeDashboardDefinitionReaderPort` | `DashboardDefinitionsService` ou `DashboardDefinitionsRepository` | `findOne(tenantId, id)` ou `findByTenantAndId(tenantId, id)`                            | Retornar `id`, `tenantId`, `dashboardKey`, `widgets` minimos com `key`, `type`, `queryDefinitionId`, `status` e metadata segura.                                    |
| `RuntimeReportDefinitionReaderPort`    | `ReportDefinitionsService` ou `ReportDefinitionsRepository`       | `findOne(tenantId, id)` ou `findByTenantAndId(tenantId, id)`                            | Retornar `id`, `tenantId`, `reportKey`, `queryDefinitionId`, `dashboardDefinitionId`, blocks minimos e metadata segura.                                             |
| `RuntimeDatasetReaderPort`             | `DatasetsService` ou `DatasetsRepository`                         | `findOne(tenantId, id)` ou `findByTenantAndId(tenantId, id)`                            | Retornar `datasetKey`, `connectionId`, `sourceType`, `status` e futura `schemaMappingVersion` quando existir.                                                       |
| `RuntimeFieldMappingReaderPort`        | `FieldMappingsService` ou `FieldMappingsRepository`               | `findByFilters({ tenantId, datasetKey, page, pageSize })` ou filtro interno equivalente | Preferencia futura: retornar apenas mappings `active`; se qualquer mapping non-active for relevante para command, bloquear de forma conservadora.                   |
| `RuntimeConnectionReaderPort`          | `ConnectionsService` ou `ConnectionsRepository`                   | `findOne(tenantId, id)` ou `findByTenantAndId(tenantId, id)`                            | O DTO publico atual nao retorna `credentialRef`; adapter interno pode precisar de repository/mapper seguro ou metodo interno que exponha referencia, nunca segredo. |
| `RuntimeCredentialReferenceReaderPort` | `CredentialsService` ou `CredentialsRepository`                   | buscar por `tenantId + credentialRef` ou por `tenantId + connectionId`                  | Nunca selecionar, ler, retornar ou descriptografar `protectedSecretValue`. Se resolver por connection, tratar multiplas credenciais ativas como blocker.            |

Regra geral: se o service publico esconder um campo necessario por seguranca, o adapter futuro
pode usar repository interno ou um metodo interno dedicado, desde que retorne somente shape minimo
seguro. Isso nao autoriza alterar contratos publicos.

## Shapes de Adapter

Os pseudocodigos abaixo ficam como referencia de design. A foundation tests-only ja criou classes
internas equivalentes, ainda sem wiring operacional.

### RuntimeQueryDefinitionReaderAdapter

```ts
class RuntimeQueryDefinitionReaderAdapter implements RuntimeQueryDefinitionReaderPort {
  constructor(
    private readonly queryDefinitions: QueryDefinitionsService,
    private readonly safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  ) {}

  async findByTenantAndId(
    tenantId: string,
    queryDefinitionId: string,
  ): Promise<RuntimeQueryDefinitionLike | null> {
    try {
      const query = await this.queryDefinitions.findOne(tenantId, queryDefinitionId);

      return {
        id: query.id,
        tenantId: query.tenantId,
        datasetId: query.datasetId,
        queryKey: query.queryKey,
        status: query.status,
        type: query.type,
        safeMetadata: this.safeMetadataBuilder.build({
          metadata: {
            domain: query.metadata?.domain,
            status: query.status,
            type: query.type,
          },
        }),
      };
    } catch (error) {
      return null;
    }
  }
}
```

Notas:

- `NotFoundException` deve virar `null`.
- Erro inesperado nao deve vazar `error.toString()` ou stack para o resolver.
- Adapter nao deve retornar metrics, filters, settings ou payload livre ao resolver nesta fase,
  salvo se houver allowlist futura.

### RuntimeDashboardDefinitionReaderAdapter

```ts
class RuntimeDashboardDefinitionReaderAdapter implements RuntimeDashboardDefinitionReaderPort {
  constructor(
    private readonly dashboards: DashboardDefinitionsService,
    private readonly safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  ) {}

  async findByTenantAndId(
    tenantId: string,
    dashboardDefinitionId: string,
  ): Promise<RuntimeDashboardDefinitionLike | null> {
    try {
      const dashboard = await this.dashboards.findOne(tenantId, dashboardDefinitionId);

      return {
        id: dashboard.id,
        tenantId: dashboard.tenantId,
        dashboardKey: dashboard.dashboardKey,
        widgets: dashboard.widgets.map((widget) => ({
          key: widget.key,
          type: widget.type,
          queryDefinitionId: widget.queryDefinitionId,
        })),
        safeMetadata: this.safeMetadataBuilder.build({
          metadata: {
            status: dashboard.status,
            visibility: dashboard.visibility,
            widgetsCount: dashboard.widgets.length,
          },
        }),
      };
    } catch (error) {
      return null;
    }
  }
}
```

Notas:

- `widgets.options`, filtros e layout completo nao devem ir ao resolver.
- Widgets sem `queryDefinitionId` continuam degradados para readiness, mas o command bridge deve
  exigir pelo menos uma query resolvivel.

### RuntimeReportDefinitionReaderAdapter

```ts
class RuntimeReportDefinitionReaderAdapter implements RuntimeReportDefinitionReaderPort {
  constructor(
    private readonly reports: ReportDefinitionsService,
    private readonly safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  ) {}

  async findByTenantAndId(
    tenantId: string,
    reportDefinitionId: string,
  ): Promise<RuntimeReportDefinitionLike | null> {
    try {
      const report = await this.reports.findOne(tenantId, reportDefinitionId);

      return {
        id: report.id,
        tenantId: report.tenantId,
        reportKey: report.reportKey,
        queryDefinitionId: report.queryDefinitionId,
        dashboardDefinitionId: report.dashboardDefinitionId,
        blocks: report.blocks.map((block) => ({
          key: block.key,
          type: block.type,
          queryDefinitionId: block.queryDefinitionId,
          dashboardDefinitionId: block.dashboardDefinitionId,
        })),
        safeMetadata: this.safeMetadataBuilder.build({
          metadata: {
            status: report.status,
            visibility: report.visibility,
            blocksCount: report.blocks.length,
          },
        }),
      };
    } catch (error) {
      return null;
    }
  }
}
```

Notas:

- `exportOptions`, parameters, filters, block options e settings nao devem alimentar command.
- Geracao de arquivo real permanece fora de escopo.

### RuntimeDatasetReaderAdapter

```ts
class RuntimeDatasetReaderAdapter implements RuntimeDatasetReaderPort {
  constructor(
    private readonly datasets: DatasetsService,
    private readonly safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  ) {}

  async findByTenantAndId(tenantId: string, datasetId: string): Promise<RuntimeDatasetLike | null> {
    try {
      const dataset = await this.datasets.findOne(tenantId, datasetId);

      return {
        id: dataset.id,
        tenantId: dataset.tenantId,
        datasetKey: dataset.datasetKey,
        connectionId: dataset.connectionId,
        sourceType: dataset.sourceType,
        status: dataset.status,
        schemaMappingVersion: dataset.metadata?.schemaMappingVersion,
        safeMetadata: this.safeMetadataBuilder.build({
          metadata: {
            domain: dataset.metadata?.domain,
            sourceType: dataset.sourceType,
            status: dataset.status,
            fieldsCount: dataset.fields.length,
          },
        }),
      };
    } catch (error) {
      return null;
    }
  }
}
```

Notas:

- `fields` completos, `settings`, amostras e payloads nao devem ir ao resolver.
- `schemaMappingVersion` ainda nao existe como campo de schema; se for necessario, deve ser
  decidido em fase futura sem alterar este design docs-only.

### RuntimeFieldMappingReaderAdapter

```ts
class RuntimeFieldMappingReaderAdapter implements RuntimeFieldMappingReaderPort {
  constructor(private readonly fieldMappings: FieldMappingsService) {}

  async findByTenantAndDatasetKey(
    tenantId: string,
    datasetKey: string,
  ): Promise<readonly RuntimeFieldMappingLike[]> {
    try {
      const result = await this.fieldMappings.findByFilters({
        tenantId,
        datasetKey,
        page: 1,
        pageSize: 1000,
      });

      return result.items
        .filter((mapping) => mapping.status === 'active')
        .map((mapping) => ({
          id: mapping.id,
          tenantId: mapping.tenantId,
          connectionId: mapping.connectionId,
          datasetKey: mapping.datasetKey,
          sourcePath: mapping.sourcePath,
          sourceFieldPath: mapping.sourcePath,
          targetField: mapping.targetField,
          logicalField: mapping.targetField,
          targetType: mapping.targetType,
          dataType: mapping.targetType,
          required: mapping.required,
          transform: mapping.transform,
          status: mapping.status,
        }));
    } catch (error) {
      return [];
    }
  }
}
```

Notas:

- O schema atual usa `sourcePath`; o resolver tambem aceita `sourceFieldPath`.
- Fase futura pode adicionar `sourceObject` se o catalogo precisar separar objeto e campo.
- Mappings inativos nao devem preparar command. Politica detalhada abaixo.

### RuntimeConnectionReaderAdapter

```ts
class RuntimeConnectionReaderAdapter implements RuntimeConnectionReaderPort {
  constructor(
    private readonly connections: ConnectionsRepository,
    private readonly safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder,
  ) {}

  async findByTenantAndId(
    tenantId: string,
    connectionId: string,
  ): Promise<RuntimeConnectionLike | null> {
    try {
      const connection = await this.connections.findByTenantAndId(
        toObjectId(tenantId),
        connectionId,
      );

      if (!connection) {
        return null;
      }

      return {
        id: connection._id.toString(),
        tenantId: connection.tenantId.toString(),
        type: connection.type,
        sourceType: connection.metadata?.sourceType ?? connection.type,
        status: connection.status,
        credentialRef: connection.credentialRef,
        authType: connection.authType,
        requiresCredential: connection.authType !== 'none',
        safeMetadata: this.safeMetadataBuilder.build({
          metadata: {
            type: connection.type,
            authType: connection.authType,
            status: connection.status,
            sourceType: connection.metadata?.sourceType,
          },
        }),
      };
    } catch (error) {
      return null;
    }
  }
}
```

Notas:

- `ConnectionsService.findOne` retorna DTO publico com `hasCredentialReference`, mas nao retorna
  `credentialRef`. A foundation atual nao inventa referencia a partir desse booleano: quando a
  dependencia do adapter nao expuser `credentialRef`, o adapter retorna `credentialRef:
undefined` e inclui apenas `hasCredentialReference` em `safeMetadata`.
- Com `credentialRef: undefined`, o `RuntimeConnectorReferenceResolver` mantem o blocker
  conservador `credential_ref_missing` quando credencial for obrigatoria.
- `baseUrl`, `allowedHeaders` e metadata livre nao devem entrar no command.
- `connectionId` continua sendo ID tecnico, nunca connection string.

### RuntimeCredentialReferenceReaderAdapter

```ts
class RuntimeCredentialReferenceReaderAdapter implements RuntimeCredentialReferenceReaderPort {
  constructor(private readonly credentials: CredentialsRepository) {}

  async findByTenantAndCredentialRef(
    tenantId: string,
    credentialRef: string,
  ): Promise<RuntimeCredentialReferenceLike | null> {
    try {
      const credentialId = parseCredentialRef(credentialRef);
      if (!credentialId) {
        return null;
      }

      const credential = await this.credentials.findByTenantAndId(
        toObjectId(tenantId),
        credentialId,
      );

      if (!credential) {
        return null;
      }

      return {
        credentialRef,
        tenantId: credential.tenantId.toString(),
        status: credential.status,
        provider: credential.provider,
        safeMetadata: {
          provider: credential.provider ?? null,
          status: credential.status,
          type: credential.type,
        },
      };
    } catch (error) {
      return null;
    }
  }
}
```

Notas:

- `protectedSecretValue` tem `select: false` no schema e nao deve ser selecionado.
- Adapter nao deve usar `LocalCredentialProtectorService`.
- Adapter nao deve decryptar segredo.
- `maskedPreview` deve ficar fora do command por padrao.

## Politica de Status

Readiness atual e diagnostico declarativo. Ela pode produzir warnings para recursos non-active,
por exemplo query/dataset/mappings ainda em `draft` ou `inactive`, porque o objetivo e mostrar
configuracao incompleta sem executar runtime.

`prepareCommand` para bridge deve ser mais conservador. Antes de montar um command para o
contrato futuro de connectors:

- recurso inexistente ou not found vira blocker;
- `queryDefinition.status !== "active"` vira blocker;
- `dashboardDefinition.status !== "active"` vira blocker;
- `reportDefinition.status !== "active"` vira blocker;
- `dataset.status !== "active"` vira blocker;
- `fieldMapping.status !== "active"` vira blocker ou mapping omitido, desde que a omissao nao
  esconda configuracao incompleta;
- `connection.status !== "active"` vira blocker;
- `credential.status !== "active"` vira blocker;
- credencial `revoked`, `inactive`, `disabled` ou status desconhecido vira blocker;
- status ausente em recurso que deveria ter status vira blocker.

Blockers sugeridos:

| Condicao                      | Blocker sugerido                                        |
| ----------------------------- | ------------------------------------------------------- |
| Query non-active              | `query_definition_not_active`                           |
| Dashboard non-active          | `dashboard_definition_not_active`                       |
| Report non-active             | `report_definition_not_active`                          |
| Dataset non-active            | `dataset_not_active`                                    |
| Mapping non-active            | `field_mapping_not_active`                              |
| Connection non-active         | `connection_not_active`                                 |
| Credential non-active/revoked | `credential_ref_missing` ou `credential_ref_not_active` |
| Status desconhecido           | `<resource>_status_not_supported`                       |

Se o `RuntimeConnectorReferenceResolver` atual nao bloqueia todos esses status por si so, a fase
de implementacao dos adapters deve decidir entre:

- filtrar non-active nos adapters e deixar a ausencia virar blocker existente; ou
- retornar shape com status e evoluir o resolver/testes para bloquear status explicitamente.

Essa decisao deve ser implementada em fase futura com tests only primeiro.

## Politica de CredentialRef

O modelo atual permite `connection.credentialRef`, mas a resposta publica de connection retorna
apenas `hasCredentialReference`. O adapter real deve preservar o boundary de segredo e resolver
somente a referencia.

Regras:

- `credentialRef` nao e secret.
- Adapter de connection pode retornar `credentialRef`, mas nunca segredo bruto.
- Se a connection nao carregar `credentialRef`, adapter de credenciais pode resolver por
  `tenantId + connectionId` quando existir relacao segura.
- Se houver exatamente uma credencial ativa para `tenantId + connectionId`, a fase futura pode
  retornar seu `credentialRef`.
- Se houver multiplas credenciais ativas para a mesma connection, bloquear com
  `multiple_active_credentials_not_supported`.
- Se nenhuma credencial ativa existir e a fonte exigir auth, bloquear com
  `credential_ref_missing`.
- Se a connection usa `authType: "none"` ou fonte declarativa `manual`/`computed`, credential pode
  ser opcional.
- Nunca selecionar, ler, retornar, logar ou descriptografar `protectedSecretValue`.
- Nunca chamar `LocalCredentialProtectorService` no adapter.
- `maskedPreview` nao deve ir ao command. Se uma UI futura precisar exibir preview mascarado,
  isso deve ficar fora do command envelope e passar por contrato proprio.

Pseudopolitica para resolucao por connection:

```ts
async function resolveCredentialRefForConnection(tenantId: string, connectionId: string) {
  const activeCredentials = await credentials.findByFilters({
    tenantId,
    connectionId,
    status: 'active',
    page: 1,
    pageSize: 2,
  });

  if (activeCredentials.items.length === 0) {
    return blocker('credential_ref_missing');
  }

  if (activeCredentials.items.length > 1) {
    return blocker('multiple_active_credentials_not_supported');
  }

  return { credentialRef: activeCredentials.items[0].credentialRef };
}
```

## Politica de Multiplas Fontes

O `RuntimeConnectorReferenceResolver` atual tem politica conservadora de uma fonte principal por
command. Ele compara `connectionId`, `sourceType` e `credentialRef` ao mesclar query references.

Adapters reais devem preservar essa politica:

- dashboard com widgets que resolvem para fontes diferentes deve bloquear;
- report com blocks/query/dashboard que resolvem para fontes diferentes deve bloquear;
- o blocker deve continuar sendo `multiple_sources_not_supported`;
- adapters nao devem tentar escolher uma fonte "principal" quando houver divergencia;
- adapters nao devem criar multiplos commands nesta fase.

Fase futura pode decompor dashboard/report multi-source em multiplos commands por fonte ou por
capability, mas isso exige design proprio, threat model, idempotencia, limites, timeline e testes.

## Design Source-Agnostic

Adapters nao devem assumir SQL nem exigir campos `table`/`column`.

Representacao por fonte:

| Fonte     | `sourceObject`                                        | `sourceFieldPath`                   | Proibido nesta fase                                                     |
| --------- | ----------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| SQL       | Nome declarativo de tabela/view/objeto, ex. `Pedidos` | Campo declarativo, ex. `ValorTotal` | SQL livre, connection string, query text com valores.                   |
| REST/JSON | JSON path de objeto/lista, ex. `$.items[*]`           | Campo/path relativo, ex. `amount`   | URL livre, headers sensiveis, body bruto, response bruto.               |
| MongoDB   | Collection/logical object, ex. `orders`               | Document path, ex. `items.amount`   | Aggregation livre, pipeline bruto, connection URI.                      |
| File      | Aba/objeto declarativo, ex. `sheet:Vendas`            | Coluna/path, ex. `Valor Total`      | Caminho real de arquivo operacional, leitura de arquivo, payload bruto. |

O schema atual de `field_mappings` possui `sourcePath`. Adapter futuro pode mapear:

- `sourcePath` -> `sourceFieldPath`;
- `targetField` -> `logicalField`;
- `targetType` -> `dataType`;
- futura metadata allowlisted -> `sourceObject`, se a separacao objeto/campo for adicionada.

`Dataset.sourceType` atual usa familias declarativas (`api`, `database`, `file`, `manual`,
`computed`, `custom`). O command futuro pode exigir valores mais especificos (`rest_api`,
`sql_server`, `mongodb`, `file`). A fase de adapter real deve definir uma tabela interna segura de
normalizacao, por exemplo:

| Dataset/Connection atual                     | `sourceType` runtime sugerido                   |
| -------------------------------------------- | ----------------------------------------------- |
| `api` + provider REST allowlisted            | `rest_api`                                      |
| `database` + provider SQL Server allowlisted | `sql_server`                                    |
| `database` + provider MongoDB allowlisted    | `mongodb`                                       |
| `file`                                       | `file`                                          |
| `manual`/`computed`                          | sem credential obrigatoria, capability limitada |

Essa normalizacao nao deve executar discovery nem validar conectividade real.

## Erros e Sanitizacao

Adapters devem tratar erros de forma segura:

- `NotFoundException` ou retorno ausente vira `null`/`[]`;
- a foundation tests-only tambem converte erro inesperado de dependency em `null`/`[]`, sem usar
  `error.message`, `error.toString()`, `rawError`, stack trace ou payload bruto;
- camada de resolver deve transformar falha inesperada em `reference_resolution_failed` seguro;
- se a implementacao precisar diferenciar falha de persistencia, usar blocker seguro como
  `reference_reader_failed`, com metadata apenas de recurso, contadores e codigo;
- metadata deve passar por `sanitizeMetadata` ou `RuntimeConnectorSafeMetadataBuilder`;
- logs futuros devem ser metadata-only;
- logs nao devem conter filters livres, settings, headers, `baseUrl`, `sourcePath` sensivel,
  credentialRef quando desnecessario, `protectedSecretValue`, stack trace bruto ou erro bruto.

Allowlist minima de metadata:

- `status`;
- `type`;
- `sourceType`;
- `schemaMappingVersion`;
- `fieldsCount`;
- `widgetsCount`;
- `blocksCount`;
- `mappingsCount`;
- `provider` quando nao sensivel;
- `domain` quando sanitizado;
- codigos de blocker/warning.

## Plano de Testes Futuro

Checklist para fases futuras de integracao dos adapters com services/repositories reais:

- manter cada adapter retornando shape minimo e nao documento Mongoose inteiro;
- manter cada adapter filtrando por `tenantId`;
- manter recurso de outro tenant retornando `null`/`[]`;
- manter not found retornando `null`/`[]`;
- manter adapter sem propagar `NotFoundException` ao resolver;
- avaliar se erro inesperado em service/repository real deve continuar como `null`/`[]` ou virar
  blocker seguro dedicado na camada de wiring, sem stack, `error.toString()` ou raw error;
- query definition active retorna `RuntimeQueryDefinitionLike`;
- query definition non-active vira blocker antes de command;
- dashboard active retorna widgets minimos;
- dashboard sem widgets resolviveis bloqueia;
- report active retorna query/dashboard refs e blocks minimos;
- report sem referencia resolvivel bloqueia;
- dataset active retorna `datasetKey`, `connectionId`, `sourceType` e metadata segura;
- dataset draft/inactive/archived bloqueia command;
- field mappings ativos retornam descriptors;
- mappings inativos bloqueiam ou sao omitidos conforme politica documentada, sem esconder
  configuracao incompleta;
- mapping sem `sourcePath`/`sourceFieldPath` bloqueia;
- connection active retorna `connectionId`, `type`, `authType`, `sourceType` e `credentialRef`
  quando seguro;
- connection sem credentialRef bloqueia quando auth e obrigatoria;
- connection non-active bloqueia;
- credential active por ref retorna `credentialRef` e status;
- credential inactive/revoked bloqueia;
- multiplas credenciais ativas por connection bloqueiam com
  `multiple_active_credentials_not_supported`;
- nenhuma credencial ativa quando auth e obrigatoria bloqueia com `credential_ref_missing`;
- `protectedSecretValue` nunca aparece no shape, command, event, safe error, log ou JSON
  serializado;
- adapter de credencial nunca seleciona `protectedSecretValue`;
- adapter nunca chama decrypt/protector;
- metadata insegura e sanitizada;
- `baseUrl`, headers, settings e payload livre nao entram no command;
- source-agnostic SQL usa `sourceObject/sourceFieldPath` sem SQL livre;
- source-agnostic REST/JSON usa JSON path sem URL livre;
- source-agnostic MongoDB usa document path sem aggregation livre;
- source-agnostic File usa objeto/coluna declarativos sem path real;
- dashboard/report multi-source bloqueiam com `multiple_sources_not_supported`;
- nenhum adapter chama fonte externa, `delfos-connectors`, worker, fila, cache ou scheduler;
- testes integrados futuros continuam sem provider operacional, endpoint ou dispatch ate fase
  explicita.

## Sequencia Recomendada de Implementacao Futura

1. Usar o wiring design em
   [`docs/runtime-reference-reader-adapter-wiring-design.md`](./runtime-reference-reader-adapter-wiring-design.md)
   como referencia para a proxima fase, ainda sem endpoint e sem dispatch.
2. Decidir se adapters usam services existentes ou repositories internos seguros para campos que
   DTO publico omite.
3. Criar testes com fake services que imitam os contracts reais antes de qualquer provider
   operacional.
4. Manter validacao de ausencia de secrets com `JSON.stringify`.
5. So depois avaliar provider interno no `RuntimeModule`, ainda sem endpoint/dispatch.
6. Qualquer dispatch/transporte continua exigindo fase propria, threat model e ADR.

## Referencias

- [`docs/runtime-connectors-bridge-plan.md`](./runtime-connectors-bridge-plan.md)
- [`docs/runtime-connectors-bridge-resolver-design.md`](./runtime-connectors-bridge-resolver-design.md)
- [`docs/runtime-reference-reader-adapter-wiring-design.md`](./runtime-reference-reader-adapter-wiring-design.md)
- [`docs/adr/adr-0015-runtime-connectors-command-envelope-bridge.md`](./adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- [`docs/adr/adr-0014-runtime-execution-requests-foundation.md`](./adr/adr-0014-runtime-execution-requests-foundation.md)
- [`docs/adr/adr-0008-connectors-and-integration-execution.md`](./adr/adr-0008-connectors-and-integration-execution.md)
- [`docs/api-foundation-contracts.md`](./api-foundation-contracts.md)
- [`docs/foundation-credentials-and-security.md`](./foundation-credentials-and-security.md)
- [`docs/foundation-data-catalog.md`](./foundation-data-catalog.md)
- [`docs/data-access-policy.md`](./data-access-policy.md)
- [`docs/external-source-configuration-flow.md`](./external-source-configuration-flow.md)
- [`docs/operations-runbook.md`](./operations-runbook.md)
- [`docs/de-para.md`](./de-para.md)
- [`docs/database-model.md`](./database-model.md)
- `delfos-connectors/docs/runtime-contracts.md`
- `delfos-connectors/docs/security-boundaries.md`
