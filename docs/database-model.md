# Modelo de Banco — Delfos Analytics

> Status: documento normativo inicial  
> Banco: MongoDB 8.0+  
> Escopo: dados de configuração do Delfos na Fase 1.

O MongoDB armazena configuração e metadados do Delfos, não dados operacionais permanentes dos clientes.

> **Direção futura (ADR-0035)**: foi aprovada a migração do banco primário para
> **PostgreSQL** (com Valkey como cache layer futuro). Este documento descreve o
> **modelo MongoDB vigente**, que continua sendo o banco em uso até a migração
> faseada. O modelo relacional candidato está em
> `docs/postgresql-data-model-draft.md` e o plano de migração em
> `docs/postgresql-migration-plan.md`. Enquanto a fase de remoção do MongoDB
> (P5) não concluir, este documento permanece a referência do banco real.

---

## 1. Princípios

- todo recurso tenant-scoped contém `tenantId`
- credenciais são criptografadas
- timestamps são obrigatórios
- exclusão lógica é preferível para dados administrativos
- índices devem refletir consultas reais
- payload operacional bruto não é persistido

---

## 2. Coleções iniciais

### tenants

Representa empresa/cliente.

Campos principais:

- `_id`
- `name`
- `slug`
- `status`
- `settings`
- `createdAt`
- `updatedAt`

### users

Representa usuário do Delfos.

Campos principais:

- `_id`
- `tenantId`
- `name`
- `email`
- `role` (`owner`, `admin`, `operator`, `viewer` na foundation atual)
- `status`
- `lastLoginAt` — **[futuro]** depende de auth real (ADR-0006); não existe na foundation atual
- `createdAt`
- `updatedAt`

### tenant_users — **[futuro]**

> Coleção planejada para vínculo multi-tenant entre usuário e tenant. Depende de
> auth real (ADR-0006) e RBAC granular. Não existe na foundation atual.

- `tenantId`
- `userId`
- `roleIds`
- `status`

### roles — **[futuro]**

> Coleção planejada para perfis de acesso por tenant ou globais. Depende de
> auth real (ADR-0006) e RBAC granular. Não existe na foundation atual.

- `tenantId`
- `name`
- `permissions`
- `system`

### connections

Configuração de API externa.

- `tenantId`
- `name`
- `baseUrl`
- `authType`
- `credentialRef`
- `allowedHeaders`
- `timeoutMs`
- `rateLimit`
- `status`

### credentials

Referencia protegida de credenciais usadas por conexoes.

- `tenantId`
- `connectionId`
- `type`
- `provider`
- `name`
- `status`
- `maskedPreview`
- `protectedSecretValue`
- `protectionProvider`
- `rotatedAt`
- `revokedAt`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

### datasets

Dataset logico declarativo usado futuramente por dashboards, relatorios, De/Para e conectores.
Na foundation atual, nao armazena payload operacional nem executa consulta.

- `tenantId`
- `connectionId`
- `datasetKey`
- `name`
- `description`
- `sourceType`
- `status`
- `refreshMode`
- `schemaMode`
- `fields`
- `primaryKeyFields`
- `timeField`
- `tags`
- `metadata`
- `settings`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

### query_definitions

Definicao logica da camada semantica usada futuramente por dashboards e relatorios.
Na foundation atual, armazena apenas configuracao declarativa e nao executa consulta.

- `tenantId`
- `datasetId`
- `queryKey`
- `name`
- `description`
- `status`
- `type`
- `metrics`
- `dimensions`
- `filters`
- `sorts`
- `defaultLimit`
- `timeField`
- `allowedGranularities`
- `tags`
- `metadata`
- `settings`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

Regras:

- `datasetId` e obrigatorio para rastreabilidade com o dataset declarativo.
- `queryKey` e unico por tenant e deve ser estavel para integracoes.
- `filters.defaultValue`, `filters.allowedValues`, `metadata` e `settings` guardam apenas valores sanitizados.
- `DELETE` logico usa `status: archived`.

### field_mappings

De/Para de campos.

- `tenantId`
- `connectionId`
- `datasetKey`
- `sourcePath`
- `targetField`
- `targetType`
- `required`
- `transform`

### dashboard_definitions

Definicoes logicas de dashboards, layouts, secoes, widgets e filtros globais.
Na foundation atual, armazena apenas configuracao declarativa para o futuro `delfos-web`;
o preview demo gera dados ficticios em memoria e nao renderiza dashboard real, nao executa
query real, nao busca dados reais e nao consome API externa.

- `tenantId`
- `dashboardKey`
- `name`
- `description`
- `status`
- `visibility`
- `layout`
- `sections`
- `widgets`
- `filters`
- `tags`
- `metadata`
- `settings`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

Regras:

- `dashboardKey` e unico por tenant e deve ser estavel para integracoes.
- `queryDefinitionId` em `widgets` e referencia declarativa sem validacao cruzada nesta etapa.
- `metadata`, `settings`, `widgets.options`, `filters.defaultValue` e `filters.allowedValues` guardam apenas valores sanitizados.
- `DELETE` logico usa `status: archived`.

### execution_preview

Nao ha collection persistida para preview/demo execution nesta fase.

Os endpoints `POST /api/v1/query-definitions/:id/preview` e
`POST /api/v1/dashboard-definitions/:id/preview` carregam configuracoes tenant-scoped ja
persistidas em `query_definitions` e `dashboard_definitions`, geram dados ficticios em memoria e
retornam `mode: "demo"`.

Nao persistem resultado, nao criam cache, nao criam snapshots, nao criam `query_result_snapshots`
e nao armazenam dado operacional de cliente. Apenas eventos seguros de audit podem ser gravados
em `audit_logs`.

### execution_requests

Registros administrativos foundation para solicitacoes futuras de runtime. Na foundation atual,
armazenam apenas contrato, references e estado seguro; nao executam query, conector, worker, fila,
scheduler, cache, exportacao, chamada externa ou acesso a fonte de cliente.

- `tenantId`
- `requestKey`
- `kind`
- `status`
- `queryDefinitionId`
- `dashboardDefinitionId`
- `reportDefinitionId`
- `connectionId`
- `datasetId`
- `requestedByActorId`
- `requestedByRole`
- `mode`
- `reason`
- `message`
- `metadata`
- `createdAt`
- `updatedAt`

Regras:

- `kind=query` exige `queryDefinitionId`.
- `kind=dashboard` exige `dashboardDefinitionId`.
- `kind=report` exige `reportDefinitionId`.
- `status` atual e `accepted`; estados como `queued`, `blocked`, `failed`, `completed_demo` e
  `not_supported` ficam registrados para compatibilidade futura.
- `metadata` guarda apenas valores sanitizados.
- Nao armazenar filters, parameters, settings livres, secrets, rows, payload operacional,
  credentialRef, token, senha, authorization header ou connection string.

### execution_request_events

Eventos administrativos foundation de ciclo de vida para `execution_requests`. Armazenam historico
seguro de solicitacao, notas e transicoes de status futuras; nao representam execucao real e nao
executam query, conector, worker, fila, scheduler, cache, exportacao, chamada externa ou acesso a
fonte de cliente.

- `tenantId`
- `executionRequestId`
- `requestKey`
- `eventType`
- `previousStatus`
- `nextStatus`
- `message`
- `reason`
- `actorId`
- `actorRole`
- `metadata`
- `createdAt`

Regras:

- Ao criar uma execution request, a API registra um evento inicial `accepted` com
  `reason: "runtime_foundation_only"`.
- `status_changed` exige `nextStatus`; eventos `accepted`, `blocked`, `failed`,
  `completed_demo` e `not_supported` atualizam o status administrativo correspondente da
  execution request.
- `note_added` nao altera status.
- `previousStatus` e calculado pela API e nao vem do cliente.
- `metadata`, `message` e `reason` sao sanitizados.
- Nao armazenar filters, parameters, settings livres, secrets, rows, payload operacional,
  credentialRef, token, senha, authorization header ou connection string.

### report_definitions

Definicoes administrativas e declarativas de relatorios. Na foundation atual, armazena apenas
configuracao para relatorios futuros; nao gera PDF, Excel ou CSV, nao executa query, nao envia
e-mail, nao agenda job e nao consome fonte externa.

- `tenantId`
- `reportKey`
- `name`
- `description`
- `status`
- `visibility`
- `queryDefinitionId`
- `dashboardDefinitionId`
- `layout`
- `sections`
- `blocks`
- `filters`
- `parameters`
- `exportOptions`
- `tags`
- `metadata`
- `settings`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

Regras:

- `reportKey` e unico por tenant e deve ser estavel para integracoes.
- `queryDefinitionId` e `dashboardDefinitionId` sao referencias declarativas opcionais sem
  validacao cruzada nesta etapa.
- `metadata`, `settings`, `exportOptions`, `blocks.options`, filtros e parametros guardam apenas
  valores sanitizados.
- `DELETE` logico usa `status: archived`.

### white_label_settings — **[futuro]**

> Coleção planejada para configuração visual por tenant/domínio. Depende de
> white-label real (Fase 2). Não existe na foundation atual.

- `tenantId`
- `logoUrl`
- `primaryColor`
- `themeMode`
- `displayName`
- `domain`

### audit_logs

Auditoria de ações sensíveis.

- `tenantId`
- `userId`
- `action`
- `resourceType`
- `resourceId`
- `metadata`
- `ip`
- `userAgent`
- `createdAt`

---

## 3. Índices mínimos

- `tenants.slug` único
- `users.tenantId + email` único
- `tenant_users.tenantId + userId` único
- `connections.tenantId + name`
- `credentials.tenantId + connectionId`
- `credentials.tenantId + status`
- `credentials.tenantId + type`
- `datasets.tenantId + datasetKey` único
- `datasets.tenantId + connectionId`
- `datasets.tenantId + status`
- `datasets.tenantId + sourceType`
- `query_definitions.tenantId + queryKey` unico
- `query_definitions.tenantId + datasetId`
- `query_definitions.tenantId + status`
- `query_definitions.tenantId + type`
- `field_mappings.tenantId + datasetKey + targetField`
- `field_mappings.tenantId + connectionId`
- `dashboard_definitions.tenantId + dashboardKey` unico
- `dashboard_definitions.tenantId + status`
- `dashboard_definitions.tenantId + visibility`
- `report_definitions.tenantId + reportKey` unico
- `report_definitions.tenantId + status`
- `report_definitions.tenantId + visibility`
- `report_definitions.tenantId + queryDefinitionId`
- `report_definitions.tenantId + dashboardDefinitionId`
- `execution_requests.tenantId + requestKey` unico
- `execution_requests.tenantId + createdAt`
- `execution_requests.tenantId + status`
- `execution_requests.tenantId + kind`
- `execution_requests.tenantId + queryDefinitionId`
- `execution_requests.tenantId + dashboardDefinitionId`
- `execution_requests.tenantId + reportDefinitionId`
- `execution_request_events.tenantId + executionRequestId + createdAt`
- `execution_request_events.tenantId + requestKey + createdAt`
- `execution_request_events.tenantId + eventType`
- `audit_logs.tenantId + createdAt`

---

## 4. Dados proibidos

Não persistir na Fase 1:

- payload completo de vendas
- payload completo de pedidos
- dados fiscais operacionais
- dados financeiros operacionais
- dados de clientes finais sem necessidade
- respostas brutas de APIs externas

---

## 5. Migrações

Toda alteração estrutural deve:

- ser versionada
- ter script ou estratégia de migração
- ser testada em ambiente local
- considerar rollback quando possível
- atualizar este documento se alterar modelo importante

---

## 6. Auditoria

Auditar no mínimo:

- login/logout sensível
- criação/alteração de usuário
- alteração de permissões
- criação/alteração de conexão
- alteração de credenciais
- alteração de De/Para
- exportações sensíveis
- alterações de white label

---

## 7. Definições de schema (source of truth)

Arquivos Mongoose que definem as coleções. Toda alteração de campo deve
atualizar tanto o schema quanto este documento.

| Coleção | Schema |
|---|---|
| tenants | `src/modules/tenants/schemas/tenant.schema.ts` |
| users | `src/modules/users/schemas/user.schema.ts` |
| connections | `src/modules/connections/schemas/connection.schema.ts` |
| credentials | `src/modules/credentials/schemas/credential.schema.ts` |
| datasets | `src/modules/datasets/schemas/dataset.schema.ts` |
| field_mappings | `src/modules/field-mappings/schemas/field-mapping.schema.ts` |
| query_definitions | `src/modules/query-definitions/schemas/query-definition.schema.ts` |
| dashboard_definitions | `src/modules/dashboard-definitions/schemas/dashboard-definition.schema.ts` |
| report_definitions | `src/modules/report-definitions/schemas/report-definition.schema.ts` |
| execution_requests | `src/modules/runtime/schemas/execution-request.schema.ts` |
| execution_request_events | `src/modules/runtime/schemas/execution-request-event.schema.ts` |
| audit_logs | `src/modules/audit/schemas/audit-log.schema.ts` |
