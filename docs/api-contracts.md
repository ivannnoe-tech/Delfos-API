# Contratos de API — Delfos Analytics

> Status: contrato inicial da Fase 1  
> Escopo: formato e diretrizes dos endpoints REST do `delfos-api` consumidos pelo `delfos-web`.

Este documento define padrões gerais. Para os contratos detalhados dos endpoints da foundation já implementados, ver **`docs/api-foundation-contracts.md`**.

Este documento define padrões. Endpoints finais devem ser detalhados conforme implementação.

---

## 1. Convenções REST

- Base path: `/api/v1`
- JSON como formato padrão
- Autenticação via Bearer JWT
- Datas em ISO 8601
- Valores monetários como número decimal e moeda separada quando necessário
- Erros padronizados
- Paginação padronizada

---

## 2. Envelope de lista

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 0,
    "totalPages": 0
  }
}
```

---

## 3. Envelope de erro

Contrato vigente para todos os endpoints:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "tenantId",
      "message": "tenantId must be a mongodb id"
    }
  ],
  "requestId": "req_123",
  "correlationId": "req_123",
  "timestamp": "2026-04-26T00:00:00.000Z",
  "path": "/api/v1/users",
  "method": "POST"
}
```

`details` aparece quando houver informacao segura e acionavel, especialmente em validacoes.
Erros inesperados `500` usam mensagem generica e nunca retornam stack trace, secrets, env,
payload sensivel ou detalhes internos.

## 4. Códigos de erro comuns

| Código | Uso |
|---|---|
| `VALIDATION_ERROR` | entrada inválida |
| `UNAUTHENTICATED` | token ausente/inválido |
| `FORBIDDEN` | sem permissão |
| `NOT_FOUND` | recurso inexistente ou inacessível |
| `TENANT_REQUIRED` | tenant não informado/selecionado |
| `EXTERNAL_API_UNAVAILABLE` | API do cliente indisponível |
| `EXTERNAL_API_TIMEOUT` | timeout externo |
| `EXTERNAL_API_AUTH_FAILED` | credencial externa inválida |
| `DATASET_SCHEMA_INVALID` | resposta não bate com dataset/mapping |
| `CONFIGURATION_INCOMPLETE` | conexão/dataset/mapping incompleto |
| `INTERNAL_ERROR` | erro inesperado |

---

## 5. Headers

Requisições autenticadas:

```http
Authorization: Bearer <access_token>
X-Tenant-Id: <tenant_id>
```

`X-Tenant-Id` é obrigatório quando o usuário possui mais de um tenant ou quando o recurso é tenant-scoped.

---

## 6. Endpoints iniciais

### Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Tenants

- `GET /api/v1/tenants`
- `GET /api/v1/tenants/:id`
- `POST /api/v1/tenants`
- `PATCH /api/v1/tenants/:id`

### Users

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `POST /api/v1/users/:id/invite`

### Connections

- `GET /api/v1/connections`
- `POST /api/v1/connections`
- `GET /api/v1/connections/:id`
- `PATCH /api/v1/connections/:id`
- `POST /api/v1/connections/:id/test`

### Credentials / secrets

- `GET /api/v1/credentials`
- `POST /api/v1/credentials`
- `GET /api/v1/credentials/:id`
- `PATCH /api/v1/credentials/:id/rotate`
- `PATCH /api/v1/credentials/:id/revoke`

As respostas de credentials retornam apenas `credentialRef` e metadados seguros. Campos como
`secretValue`, tokens, senhas, connection strings reais, headers sensiveis e representacao
protegida interna nunca fazem parte do contrato publico. `credentialRef` segue o formato
`cred_<ObjectId>` e e compativel com `connections.credentialRef`.

### Datasets

- `GET /api/v1/datasets`
- `POST /api/v1/datasets`
- `GET /api/v1/datasets/:id`
- `PATCH /api/v1/datasets/:id`
- `DELETE /api/v1/datasets/:id`

Na foundation atual, datasets sao apenas configuracao declarativa. Nao ha preview, query,
ingestao, cache, scheduler ou chamada externa. `DELETE` e soft delete: o recurso passa para
`status: "archived"`. `metadata` e `settings` sao sanitizados e nao podem conter secrets,
tokens, senhas, connection strings reais ou headers sensiveis.

### Query definitions / semantic layer

- `GET /api/v1/query-definitions`
- `POST /api/v1/query-definitions`
- `GET /api/v1/query-definitions/:id`
- `PATCH /api/v1/query-definitions/:id`
- `DELETE /api/v1/query-definitions/:id`
- `POST /api/v1/query-definitions/:id/preview`

Na foundation atual, query definitions sao apenas configuracao declarativa da camada
semantica. Elas descrevem `metrics`, `dimensions`, `filters`, `sorts`, `defaultLimit`,
`timeField` e granularidades futuras para dashboards e relatorios. O endpoint de preview
gera apenas dados demonstrativos em memoria com `mode: "demo"`; nenhum endpoint executa query
real, SQL, aggregation, cache, worker, scheduler, conector ou chamada externa.

`tenantId`, `datasetId`, `queryKey` e `name` sao obrigatorios. `datasetId` e obrigatorio
para manter rastreabilidade com o dataset declarativo. `queryKey` e unico por tenant e
deve ser estavel para integracoes.

`DELETE` e soft delete: o recurso passa para `status: "archived"`. `metadata`,
`settings`, `filters.defaultValue` e `filters.allowedValues` sao sanitizados e nao podem
conter secrets, tokens, senhas, connection strings reais, authorization headers ou valores
de alta entropia. Eventos internos de audit registram apenas `queryKey`, `status`, `type`
e `datasetId`.

Preview demo:

```http
POST /api/v1/query-definitions/662d4f6e7a1c2b00124f0601/preview?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
Content-Type: application/json
```

Body opcional:

```json
{
  "rowLimit": 6
}
```

Response `200`:

```json
{
  "mode": "demo",
  "queryDefinitionId": "662d4f6e7a1c2b00124f0601",
  "queryKey": "sales_overview_demo",
  "generatedAt": "2026-04-26T12:00:00.000Z",
  "columns": [
    { "key": "period", "label": "Periodo", "type": "string" },
    { "key": "total_sales", "label": "Vendas totais", "type": "currency" }
  ],
  "rows": [{ "period": "Jan demo", "total_sales": 125000 }],
  "meta": {
    "rowCount": 1,
    "isPreview": true,
    "source": "demo-generator"
  }
}
```

Regras do preview de query:

- Exige `x-delfos-admin-key` e `tenantId` na query string.
- A busca por `:id` e tenant-scoped.
- Nao exige role temporaria, seguindo o padrao atual de leitura/listagem da foundation.
- Usa apenas `metrics`, `dimensions`, `filters` declarativos, `type` e `timeField` para gerar
  dados ficticios.
- Nao usa nem expoe `metadata`, `settings`, `filters.defaultValue` ou
  `filters.allowedValues`.
- Nao persiste resultado e nao cria snapshot/cache.
- Evento interno de audit: `execution_preview.query.generated`.

### Dashboard definitions

- `GET /api/v1/dashboard-definitions`
- `POST /api/v1/dashboard-definitions`
- `GET /api/v1/dashboard-definitions/:id`
- `PATCH /api/v1/dashboard-definitions/:id`
- `DELETE /api/v1/dashboard-definitions/:id`
- `POST /api/v1/dashboard-definitions/:id/preview`

Na foundation atual, dashboard definitions sao apenas configuracao declarativa para o
futuro `delfos-web`. Elas descrevem `layout`, `sections`, `widgets`, `filters`, tags e
metadados seguros. O endpoint de preview gera apenas dados demonstrativos em memoria com
`mode: "demo"`; ele nao renderiza dashboard real, nao executa query real, nao busca dados
reais, nao consome API externa, nao cria cache, worker, scheduler ou fila.

`tenantId`, `dashboardKey` e `name` sao obrigatorios. `dashboardKey` e unico por tenant e
deve ser estavel para integracoes. `queryDefinitionId` em widgets e somente uma referencia
declarativa nesta etapa; a existencia real da query definition nao e validada para permitir
montagem incremental dos cadastros.

`DELETE` e soft delete: o recurso passa para `status: "archived"`. `metadata`, `settings`,
`widgets.options`, `filters.defaultValue` e `filters.allowedValues` sao sanitizados e nao
podem conter secrets, tokens, senhas, connection strings reais, authorization headers ou
valores de alta entropia. Eventos internos de audit registram apenas `dashboardKey`,
`status`, `visibility`, quantidade de secoes e quantidade de widgets.

Preview demo:

```http
POST /api/v1/dashboard-definitions/662d4f6e7a1c2b00124f0701/preview?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
Content-Type: application/json
```

Body opcional:

```json
{
  "rowLimitPerWidget": 6
}
```

Response `200`:

```json
{
  "mode": "demo",
  "dashboardDefinitionId": "662d4f6e7a1c2b00124f0701",
  "dashboardKey": "commercial_dashboard_demo",
  "generatedAt": "2026-04-26T12:00:00.000Z",
  "widgets": [
    {
      "widgetKey": "total_sales",
      "title": "Vendas totais",
      "type": "metric_card",
      "queryDefinitionId": "662d4f6e7a1c2b00124f0601",
      "status": "ready",
      "visualization": {
        "chartType": "number",
        "yFields": ["total_sales"],
        "format": "currency"
      },
      "data": {
        "columns": [
          { "key": "period", "label": "Periodo", "type": "string" },
          { "key": "total_sales", "label": "Vendas totais", "type": "currency" }
        ],
        "rows": [{ "period": "Jan demo", "total_sales": 125000 }]
      }
    }
  ],
  "meta": {
    "isPreview": true,
    "source": "demo-generator",
    "widgetsCount": 1,
    "readyWidgetsCount": 1
  }
}
```

Quando um widget nao tiver `queryDefinitionId` ou a query definition referenciada nao existir
no mesmo `tenantId`, a resposta inteira continua `200` e apenas o widget fica degradado:

```json
{
  "widgetKey": "missing_query",
  "title": "Widget demo incompleto",
  "type": "metric_card",
  "status": "degraded",
  "reason": "missing_query_definition",
  "visualization": { "yFields": [] },
  "data": { "columns": [], "rows": [] }
}
```

Regras do preview de dashboard:

- Exige `x-delfos-admin-key` e `tenantId` na query string.
- A busca do dashboard por `:id` e tenant-scoped.
- Query definitions relacionadas tambem sao carregadas por `id + tenantId`.
- Nao exige role temporaria, seguindo o padrao atual de leitura/listagem da foundation.
- Nao usa nem expoe `metadata`, `settings`, `widgets.options`, `filters.defaultValue` ou
  `filters.allowedValues`.
- Nao persiste resultado e nao cria snapshot/cache.
- Evento interno de audit: `execution_preview.dashboard.generated`.

### Field mappings

- `GET /api/v1/field-mappings?tenantId=...&datasetKey=...`
- `POST /api/v1/field-mappings`
- `PATCH /api/v1/field-mappings/:id`
- `DELETE /api/v1/field-mappings/:id`

### Dashboards e widgets

- `GET /api/v1/dashboards`
- `POST /api/v1/dashboards`
- `GET /api/v1/dashboards/:id`
- `PATCH /api/v1/dashboards/:id`
- `POST /api/v1/dashboards/:id/widgets`
- `PATCH /api/v1/widgets/:id`
- `DELETE /api/v1/widgets/:id`
- `POST /api/v1/widgets/:id/data`

### Reports

- `GET /api/v1/reports`
- `POST /api/v1/reports`
- `GET /api/v1/reports/:id`
- `PATCH /api/v1/reports/:id`
- `POST /api/v1/reports/:id/query`
- `POST /api/v1/reports/:id/export`

---

## 7. Resposta de dataset query

```json
{
  "items": [],
  "meta": {
    "source": "customer_api",
    "cached": false,
    "durationMs": 120,
    "page": 1,
    "pageSize": 50,
    "total": null
  }
}
```

---

## 8. Compatibilidade

Mudanças que quebram contrato exigem:

- atualização deste documento
- ajuste no `delfos-web`
- testes
- changelog/nota de migração quando necessário
- ADR se a mudança for arquitetural
