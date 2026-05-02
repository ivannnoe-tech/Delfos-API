# Contratos HTTP da foundation

> Status: referencia pratica da foundation MongoDB/configuracao.  
> Escopo: indice dos endpoints administrativos temporarios ja expostos pelo `delfos-api`.

Este documento e a porta de entrada dos contratos foundation. Ele resume o escopo, as
convencoes e aponta para documentos especificos com exemplos completos. Ele nao substitui
[`docs/api-contracts.md`](./api-contracts.md).

## 1. Escopo

- Estes endpoints sao administrativos e temporarios da foundation.
- A autenticacao temporaria usa `x-delfos-admin-key` para reduzir o estado inseguro da foundation.
- Esta autenticacao nao e a estrategia final de producao.
- Ainda nao ha login real, senha, JWT, refresh token, MFA, OAuth ou provedor externo neste contrato.
- `tenantId` ainda aparece explicitamente em algumas requests ate existir contexto autenticado real.
- Headers temporarios de tenant, actor e role existem apenas para contexto de desenvolvimento.
- Nao considerar estes endpoints prontos para producao sem auth final, autorizacao completa, isolamento multi-tenant real, auditoria completa e revisao de seguranca.
- O service de audit existe nesta etapa como service interno. Nao ha rota publica de audit.

## 2. Convencoes gerais

- Base path principal: `/api/v1`.
- Excecao atual: `GET /health` fica fora do base path.
- Content-Type: `application/json`.
- IDs MongoDB nos exemplos sao ficticios.
- Listagens aceitam `page` e `pageSize`; padrao atual: `page=1`, `pageSize=25`, maximo `pageSize=100`.
- Request context usa `x-request-id` e `x-correlation-id`. Se omitidos, a API gera valores e devolve os headers.
- Exemplos usam apenas dados ficticios e seguros.

Headers temporarios de auth/contexto para endpoints administrativos:

```http
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-tenant-id: 662d4f6e7a1c2b00124f0001
x-delfos-actor-id: dev-actor-001
x-delfos-actor-role: admin
```

Regras resumidas:

- `x-delfos-admin-key` e obrigatorio para endpoints administrativos foundation.
- `GET /health` continua publico e nao exige headers de auth.
- Leitura/listagem exige apenas a admin key no checkpoint atual.
- Mutacoes administrativas gerais exigem `owner`, `admin` ou `operator`.
- Operacoes sensiveis de credenciais exigem `owner` ou `admin`.
- A API nao deve logar `x-delfos-admin-key` nem revelar se a chave existe, tamanho esperado ou valor esperado.

Detalhes completos de headers, erros, envelope de lista e healthcheck ficam em
[`docs/foundation-auth-and-errors.md`](./foundation-auth-and-errors.md).

## 3. Documentos detalhados

| Documento | Conteudo |
|---|---|
| [`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md) | Escopo, headers temporarios, envelope de lista, contrato de erro e `GET /health`. |
| [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md) | Contratos de `tenants`, `users` e `connections`. |
| [`foundation-data-catalog.md`](./foundation-data-catalog.md) | Contratos de `datasets`, `query-definitions`, `dashboard-definitions`, `report-definitions` e `field-mappings`. |
| [`foundation-credentials-and-security.md`](./foundation-credentials-and-security.md) | Contrato de `credentials`, seguranca dos exemplos e checkpoint tecnico da foundation. |

## 4. Indice de endpoints

| Recurso | Rotas | Detalhes |
|---|---|---|
| Health | `GET /health` | [`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md#3-health) |
| Tenants | `POST /api/v1/tenants`, `GET /api/v1/tenants`, `GET /api/v1/tenants/:id`, `PATCH /api/v1/tenants/:id` | [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md#1-tenants) |
| Users | `POST /api/v1/users`, `GET /api/v1/users`, `PATCH /api/v1/users/:id` | [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md#2-users) |
| Connections | `POST /api/v1/connections`, `GET /api/v1/connections`, `GET /api/v1/connections/:id`, `PATCH /api/v1/connections/:id` | [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md#3-connections) |
| Datasets | `POST /api/v1/datasets`, `GET /api/v1/datasets`, `GET /api/v1/datasets/:id`, `PATCH /api/v1/datasets/:id`, `DELETE /api/v1/datasets/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#1-datasets) |
| Query definitions | `POST /api/v1/query-definitions`, `GET /api/v1/query-definitions`, `GET /api/v1/query-definitions/:id`, `PATCH /api/v1/query-definitions/:id`, `DELETE /api/v1/query-definitions/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#2-query-definitions--semantic-layer) |
| Dashboard definitions | `POST /api/v1/dashboard-definitions`, `GET /api/v1/dashboard-definitions`, `GET /api/v1/dashboard-definitions/:id`, `PATCH /api/v1/dashboard-definitions/:id`, `DELETE /api/v1/dashboard-definitions/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#3-dashboard-definitions) |
| Report definitions | `POST /api/v1/report-definitions`, `GET /api/v1/report-definitions`, `GET /api/v1/report-definitions/:id`, `PATCH /api/v1/report-definitions/:id`, `DELETE /api/v1/report-definitions/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#4-report-definitions) |
| Field mappings | `POST /api/v1/field-mappings`, `GET /api/v1/field-mappings`, `PATCH /api/v1/field-mappings/:id`, `DELETE /api/v1/field-mappings/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#5-field-mappings) |
| Execution preview | `POST /api/v1/query-definitions/:id/preview`, `POST /api/v1/dashboard-definitions/:id/preview` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#6-previewdemo-execution) |
| Runtime execution requests foundation | `POST /api/v1/runtime/execution-requests`, `GET /api/v1/runtime/execution-requests`, `GET /api/v1/runtime/execution-requests/:id`, `GET /api/v1/runtime/execution-requests/:id/events`, `POST /api/v1/runtime/execution-requests/:id/events` | [`api-foundation-contracts.md`](./api-foundation-contracts.md#5-runtime-execution-requests-foundation) |
| Credentials | `POST /api/v1/credentials`, `GET /api/v1/credentials`, `GET /api/v1/credentials/:id`, `PATCH /api/v1/credentials/:id/rotate`, `PATCH /api/v1/credentials/:id/revoke` | [`foundation-credentials-and-security.md`](./foundation-credentials-and-security.md#1-credentials--secrets) |

## 5. Runtime execution requests foundation

Objetivo: registrar contratos administrativos para solicitacoes futuras de execucao, sem executar
nada. Este recurso prepara estados, referencias e auditoria segura para uma etapa futura de
runtime/conectores.

Rotas:

- `POST /api/v1/runtime/execution-requests`
- `GET /api/v1/runtime/execution-requests?tenantId=...&page=1&pageSize=25`
- `GET /api/v1/runtime/execution-requests/:id?tenantId=...`
- `GET /api/v1/runtime/execution-requests/:id/events?tenantId=...&page=1&pageSize=25`
- `POST /api/v1/runtime/execution-requests/:id/events`

Request seguro:

```http
POST /api/v1/runtime/execution-requests
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-id: dev-actor-001
x-delfos-actor-role: operator
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "kind": "query",
  "queryDefinitionId": "662d4f6e7a1c2b00124f0601",
  "connectionId": "662d4f6e7a1c2b00124f0201",
  "datasetId": "662d4f6e7a1c2b00124f0501",
  "mode": "future_runtime",
  "metadata": {
    "domain": "sales"
  }
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0901",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "requestKey": "exec_req_662d4f6e7a1c2b00124f0901",
  "kind": "query",
  "status": "accepted",
  "queryDefinitionId": "662d4f6e7a1c2b00124f0601",
  "connectionId": "662d4f6e7a1c2b00124f0201",
  "datasetId": "662d4f6e7a1c2b00124f0501",
  "requestedByActorId": "dev-actor-001",
  "requestedByRole": "operator",
  "mode": "future_runtime",
  "reason": "runtime_foundation_only",
  "message": "Runtime foundation request accepted. No real execution was started.",
  "metadata": {
    "domain": "sales"
  },
  "createdAt": "2026-05-02T12:00:00.000Z",
  "updatedAt": "2026-05-02T12:00:00.000Z"
}
```

Enums iniciais:

- `kind`: `query`, `dashboard`, `report`
- `status`: `queued`, `accepted`, `blocked`, `failed`, `completed_demo`, `not_supported`
- `mode`: `demo`, `dry_run`, `future_runtime`
- `eventType`: `requested`, `accepted`, `status_changed`, `blocked`, `failed`,
  `completed_demo`, `not_supported`, `note_added`

Evento de ciclo de vida seguro:

```http
POST /api/v1/runtime/execution-requests/662d4f6e7a1c2b00124f0901/events
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-id: dev-actor-001
x-delfos-actor-role: operator
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "eventType": "blocked",
  "message": "Reference validation pending for future runtime.",
  "reason": "runtime_foundation_only",
  "metadata": {
    "origin": "admin_console"
  }
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0911",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "executionRequestId": "662d4f6e7a1c2b00124f0901",
  "requestKey": "exec_req_662d4f6e7a1c2b00124f0901",
  "eventType": "blocked",
  "previousStatus": "accepted",
  "nextStatus": "blocked",
  "message": "Reference validation pending for future runtime.",
  "reason": "runtime_foundation_only",
  "actorId": "dev-actor-001",
  "actorRole": "operator",
  "metadata": {
    "origin": "admin_console"
  },
  "createdAt": "2026-05-02T12:05:00.000Z"
}
```

Regras:

- `POST` nao executa query, dashboard, report, conector, worker, fila, scheduler, cache ou
  chamada externa.
- `kind=query` exige `queryDefinitionId`.
- `kind=dashboard` exige `dashboardDefinitionId`.
- `kind=report` exige `reportDefinitionId`.
- A existencia real da definition referenciada nao e validada nesta etapa; o objetivo e registrar
  contrato foundation tenant-scoped para futura orquestracao.
- `connectionId` e `datasetId` sao referencias opcionais para rastreabilidade declarativa.
- `requestKey` e gerado pela API no formato `exec_req_<ObjectId>`.
- O status gravado atualmente e `accepted` com `reason: "runtime_foundation_only"`.
- A criacao de execution request registra automaticamente um evento inicial `accepted` em
  `execution_request_events`.
- `POST /:id/events` apenas registra evento foundation e, quando aplicavel, atualiza o status
  administrativo da execution request. Isso nao dispara runtime, worker, conector, fila ou query.
- `status_changed` exige `nextStatus`; eventos `accepted`, `blocked`, `failed`,
  `completed_demo` e `not_supported` definem o status correspondente; `note_added` nao altera
  status.
- `previousStatus` e calculado pela API a partir da execution request existente; clientes nao
  enviam esse campo.
- `metadata` e sanitizado; chaves ou valores com aparencia de segredo sao descartados.
- `message` e `reason` tambem sao sanitizados; textos com aparencia de segredo sao omitidos.
- Campos livres de execucao como `filters`, `parameters`, `settings`, `secretValue`, tokens,
  senhas, headers sensiveis, connection strings ou payload operacional bruto nao fazem parte do
  contrato e sao rejeitados pela validacao global.
- Leitura/listagem exige admin key, conforme padrao dos catalogos.
- Criacao de solicitacao e criacao de evento/status exigem role temporaria `owner`, `admin` ou
  `operator`; `viewer` nao cria solicitacao nem evento.
- `GET /health` continua publico e inalterado.

Auditoria:

- Evento interno: `execution_request.created`.
- Evento interno: `execution_request.event.created`.
- Quando ha transicao de status, tambem ha `execution_request.status_changed`.
- Auditoria registra apenas `tenantId`, `kind`, `status`, references declarativas e ator/role.
- Auditoria de eventos registra apenas `tenantId`, `executionRequestId`, `requestKey`,
  `eventType`, `previousStatus`, `nextStatus` e ator/role.
- Auditoria nunca registra metadata livre, filters, parameters, settings, payload bruto, rows,
  secrets, credentialRef, token, senha, authorization header ou connection string.

Fora de escopo explicito:

- runtime real;
- connector real;
- `delfos-connectors`;
- local agent;
- worker/fila real;
- query real;
- acesso a fonte de cliente;
- cache, staging, snapshot ou materializacao real;
- PDF, Excel ou CSV real;
- envio de e-mail;
- scheduler;
- descriptografia de credenciais;
- teste real de conexao;
- discovery real de schema.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao de criacao.
- `400 Bad Request` para `tenantId`, `kind`, references obrigatorias, ObjectIds, enums ou campos
  nao permitidos.
- `404 Not Found` quando a execution request nao existir para o `tenantId` informado.
- `500 Internal Server Error` para falha inesperada de persistencia ou auditoria.

## 6. Regras transversais

- Recursos tenant-scoped exigem `tenantId` explicito em body ou query enquanto nao existir contexto autenticado final.
- Buscas, updates e deletes por id em recursos tenant-scoped sao tenant-scoped.
- `createdBy` e `updatedBy` usam `x-delfos-actor-id` nos recursos que possuem esses campos.
- `metadata`, `settings`, filtros, parametros, exportOptions e opcoes livres sao sanitizados conforme o recurso.
- Auditoria interna nao possui rota publica e nao grava segredo real, credenciais, metadata livre, settings ou payload operacional.
- Swagger documenta os headers temporarios via `ApiFoundationAuthHeaders` nos controllers protegidos.
- O contrato de erro global padronizado vale para validacao, auth, forbidden, not found e erros inesperados.

O checkpoint tecnico completo fica em
[`foundation-credentials-and-security.md`](./foundation-credentials-and-security.md#3-checkpoint-tecnico-da-foundation).
