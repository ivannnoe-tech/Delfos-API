# Contratos HTTP da foundation

> Status: referencia pratica da foundation MongoDB/configuracao.  
> Escopo: endpoints administrativos temporarios ja expostos pelo `delfos-api`.

Este documento registra os contratos atuais para desenvolvimento e testes manuais. Ele nao substitui `docs/api-contracts.md`.

## 1. Aviso de escopo

- Estes endpoints sao administrativos e temporarios da foundation.
- Agora ha autenticacao temporaria por `x-delfos-admin-key` para reduzir o estado inseguro da foundation.
- Esta autenticacao e uma base explicita de desenvolvimento/foundation, nao a estrategia final de producao.
- Ainda nao ha login real, senha, JWT, refresh token, MFA, OAuth ou provedor externo neste contrato.
- `tenantId` ainda aparece explicitamente em algumas requests ate existir contexto autenticado real.
- Headers temporarios de tenant, actor e role existem apenas para contexto de desenvolvimento e nao devem ser tratados como autoridade final.
- Nao considerar estes endpoints prontos para producao sem auth final, autorizacao completa, isolamento multi-tenant real, auditoria completa e revisao de seguranca.
- O service de audit existe nesta etapa como service interno. Nao ha rota publica de audit.

## 2. Convencoes

- Base path principal: `/api/v1`.
- Excecao atual: `GET /health` fica fora do base path.
- Content-Type: `application/json`.
- IDs MongoDB nos exemplos sao ficticios.
- Listagens aceitam `page` e `pageSize`; padrao atual: `page=1`, `pageSize=25`, maximo `pageSize=100`.
- Request context usa `x-request-id` e `x-correlation-id`. Se omitidos, a API gera valores e devolve os headers.
- Exemplos usam apenas dados ficticios e seguros.

Headers opcionais para rastreio:

```http
x-request-id: dev-req-001
x-correlation-id: dev-corr-001
```

Headers temporarios de auth/contexto para endpoints administrativos:

```http
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-tenant-id: 662d4f6e7a1c2b00124f0001
x-delfos-actor-id: dev-actor-001
x-delfos-actor-role: admin
```

Regras:

- `x-delfos-admin-key` e obrigatorio para `tenants`, `users`, `connections`, `credentials`, `datasets`, `query-definitions`, `dashboard-definitions` e `field-mappings`.
- `GET /health` continua publico e nao exige headers de auth.
- `x-delfos-tenant-id` e opcional nesta foundation, mas quando enviado deve ser um ObjectId MongoDB valido.
- `x-delfos-actor-id` e opcional e aceita apenas identificadores tecnicos simples.
- `x-delfos-actor-role` aceita apenas `owner`, `admin`, `operator` ou `viewer`.
- Leitura/listagem exige apenas a admin key no checkpoint atual.
- Mutacoes administrativas gerais exigem `owner`, `admin` ou `operator`, quando aplicavel.
- Operacoes sensiveis de credenciais exigem `owner` ou `admin`.
- A role enviada por header e temporaria/foundation. Nao usar como autorizacao final de producao.
- A API nao deve logar `x-delfos-admin-key` nem revelar se a chave existe, tamanho esperado ou valor esperado.

Erros comuns de auth:

- `401 Unauthorized` quando `x-delfos-admin-key` estiver ausente ou invalida.
- `403 Forbidden` quando a admin key for valida, mas a role temporaria nao permitir a acao.
- `400 Bad Request` quando headers temporarios de contexto tiverem formato invalido.

Envelope de lista:

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

Contrato vigente de erro:

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
  "requestId": "dev-req-001",
  "correlationId": "dev-corr-001",
  "timestamp": "2026-04-26T12:00:00.000Z",
  "path": "/api/v1/users?tenantId=invalid",
  "method": "GET"
}
```

Regras do contrato de erro:

- `statusCode`, `error`, `message`, `requestId`, `correlationId`, `timestamp`, `path` e `method` aparecem em todos os erros.
- `details` aparece somente quando houver informacao segura e acionavel, especialmente em erros de validacao.
- Erros `400` de DTO/ValidationPipe usam `message: "Validation failed"` e `details` com `field` e `message`.
- Erros `401` e `403` da auth foundation seguem o mesmo envelope.
- Erros `404` de rota inexistente seguem o mesmo envelope.
- Erros internos `500` usam `message: "Unexpected error."` e nao retornam stack trace, env, secrets, headers sensiveis ou payload interno.
- Quando `x-request-id` ou `x-correlation-id` forem omitidos ou invalidos, a API gera valores seguros e os devolve tambem nos headers da resposta.

## 3. Health

Objetivo: validar se a API esta respondendo.

Rotas:

- `GET /health`

Request:

```http
GET /health
```

Response `200`:

```json
{
  "status": "ok",
  "timestamp": "2026-04-26T12:00:00.000Z",
  "uptimeSeconds": 12.34
}
```

Erros esperados:

- `500 Internal Server Error` para falha inesperada.

## 4. Tenants

Objetivo: cadastrar e consultar empresas/tenants da foundation.

Rotas:

- `POST /api/v1/tenants`
- `GET /api/v1/tenants?page=1&pageSize=25`
- `GET /api/v1/tenants/:id`
- `PATCH /api/v1/tenants/:id`

Request seguro:

```http
POST /api/v1/tenants
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: admin
```

```json
{
  "name": "Acme Analytics",
  "slug": "acme-analytics",
  "status": "active",
  "settings": {
    "onboardingStage": "foundation"
  }
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0001",
  "name": "Acme Analytics",
  "slug": "acme-analytics",
  "status": "active",
  "settings": {
    "onboardingStage": "foundation"
  },
  "createdAt": "2026-04-26T12:00:00.000Z",
  "updatedAt": "2026-04-26T12:00:00.000Z"
}
```

Exemplo de listagem:

```http
GET /api/v1/tenants?page=1&pageSize=25
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
```

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `slug`, `status`, `page`, `pageSize` ou MongoDB id invalidos.
- `404 Not Found` quando `:id` nao existir.
- `500 Internal Server Error` para falha inesperada de persistencia, incluindo duplicidade de `slug` enquanto nao houver erro de dominio especifico.

## 5. Users

Objetivo: cadastrar e consultar usuarios administrativos vinculados a tenant. Nesta etapa nao ha login nem senha neste contrato.

Rotas:

- `POST /api/v1/users`
- `GET /api/v1/users?tenantId=...&page=1&pageSize=25`
- `PATCH /api/v1/users/:id?tenantId=...`

Request seguro:

```http
POST /api/v1/users
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: admin
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "name": "Delfos Operator",
  "email": "operator@example.com",
  "role": "viewer",
  "status": "invited"
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0101",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "name": "Delfos Operator",
  "email": "operator@example.com",
  "role": "viewer",
  "status": "invited",
  "createdAt": "2026-04-26T12:00:00.000Z",
  "updatedAt": "2026-04-26T12:00:00.000Z"
}
```

Exemplo de update:

```http
PATCH /api/v1/users/662d4f6e7a1c2b00124f0101?tenantId=662d4f6e7a1c2b00124f0001
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: admin
```

```json
{
  "role": "operator",
  "status": "active"
}
```

Roles de usuario aceitas na foundation atual: `owner`, `admin`, `operator` e `viewer`.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `tenantId`, e-mail, `role`, `status`, `page` ou `pageSize` invalidos.
- `404 Not Found` quando o usuario nao existir para o `tenantId` informado.
- `500 Internal Server Error` para falha inesperada de persistencia, incluindo duplicidade de `tenantId + email` enquanto nao houver erro de dominio especifico.

## 6. Connections

Objetivo: cadastrar configuracao de conexoes com APIs de clientes. Nenhuma rota executa chamada externa nesta etapa.

Rotas:

- `POST /api/v1/connections`
- `GET /api/v1/connections?tenantId=...&page=1&pageSize=25`
- `GET /api/v1/connections/:id?tenantId=...`
- `PATCH /api/v1/connections/:id?tenantId=...`

Request seguro:

```http
POST /api/v1/connections
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "name": "Primary customer API",
  "type": "customer_api",
  "baseUrl": "https://api.customer.example",
  "authType": "api_key_header",
  "credentialRef": "vault-ref-foundation-example",
  "allowedHeaders": ["x-client-id"],
  "metadata": {
    "environment": "sandbox"
  },
  "status": "draft"
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0201",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "name": "Primary customer API",
  "type": "customer_api",
  "baseUrl": "https://api.customer.example",
  "authType": "api_key_header",
  "hasCredentialReference": true,
  "allowedHeaders": ["x-client-id"],
  "metadata": {
    "environment": "sandbox"
  },
  "status": "draft",
  "createdAt": "2026-04-26T12:00:00.000Z",
  "updatedAt": "2026-04-26T12:00:00.000Z"
}
```

Observacoes de seguranca:

- Enviar somente `credentialRef` ficticio ou referencia tecnica futura.
- Nunca enviar token, senha, secret, privateKey, API key real ou credential real.
- `metadata` e sanitizado; chaves sensiveis e valores nao escalares sao descartados.
- A resposta nao retorna `credentialRef`, apenas `hasCredentialReference`.
- Eventos internos de audit: `connection.created`, `connection.updated`.
- Auditoria registra apenas `type`, `authType`, `status` e `hasCredentialReference`; nunca registra `baseUrl`, `credentialRef`, metadata livre ou segredo real.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para URL sem protocolo, protocolo invalido, `tenantId`, `authType`, headers ou `status` invalidos.
- `404 Not Found` quando a conexao nao existir para o `tenantId` informado.
- `500 Internal Server Error` para falha inesperada de persistencia, incluindo duplicidade de `tenantId + name` enquanto nao houver erro de dominio especifico.

## 7. Datasets

Objetivo: cadastrar datasets logicos e declarativos por tenant, com estrutura futura de campos, sem buscar dados reais e sem executar integracao externa.

Rotas:

- `POST /api/v1/datasets`
- `GET /api/v1/datasets?tenantId=...&page=1&pageSize=25`
- `GET /api/v1/datasets/:id?tenantId=...`
- `PATCH /api/v1/datasets/:id?tenantId=...`
- `DELETE /api/v1/datasets/:id?tenantId=...`

Request seguro:

```http
POST /api/v1/datasets
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "connectionId": "662d4f6e7a1c2b00124f0201",
  "datasetKey": "sales_orders",
  "name": "Pedidos de venda",
  "description": "Dataset logico para pedidos de venda",
  "sourceType": "api",
  "refreshMode": "manual",
  "schemaMode": "declared",
  "fields": [
    {
      "key": "order_id",
      "label": "Codigo do pedido",
      "type": "string",
      "required": true,
      "description": "Identificador do pedido",
      "semanticRole": "identifier"
    },
    {
      "key": "total_amount",
      "label": "Valor total",
      "type": "currency",
      "required": false,
      "semanticRole": "metric"
    }
  ],
  "primaryKeyFields": ["order_id"],
  "timeField": "created_at",
  "tags": ["sales", "orders"],
  "metadata": {
    "domain": "sales"
  },
  "settings": {
    "defaultPageSize": 50
  }
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0501",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "connectionId": "662d4f6e7a1c2b00124f0201",
  "datasetKey": "sales_orders",
  "name": "Pedidos de venda",
  "description": "Dataset logico para pedidos de venda",
  "sourceType": "api",
  "status": "draft",
  "refreshMode": "manual",
  "schemaMode": "declared",
  "fields": [
    {
      "key": "order_id",
      "label": "Codigo do pedido",
      "type": "string",
      "required": true,
      "description": "Identificador do pedido",
      "semanticRole": "identifier"
    }
  ],
  "primaryKeyFields": ["order_id"],
  "timeField": "created_at",
  "tags": ["sales", "orders"],
  "metadata": {
    "domain": "sales"
  },
  "settings": {
    "defaultPageSize": 50
  },
  "createdAt": "2026-04-26T12:00:00.000Z",
  "updatedAt": "2026-04-26T12:00:00.000Z",
  "createdBy": "dev-actor-001",
  "updatedBy": "dev-actor-001"
}
```

Enums iniciais:

- `sourceType`: `api`, `database`, `file`, `manual`, `computed`, `custom`
- `status`: `active`, `inactive`, `draft`, `archived`
- `refreshMode`: `manual`, `scheduled`, `realtime`, `none`
- `schemaMode`: `declared`, `inferred`, `dynamic`
- `field.type`: `string`, `number`, `boolean`, `date`, `datetime`, `currency`, `percentage`, `object`, `array`, `unknown`
- `field.semanticRole`: `dimension`, `metric`, `identifier`, `timestamp`, `attribute`

Exemplo de listagem:

```http
GET /api/v1/datasets?tenantId=662d4f6e7a1c2b00124f0001&status=active
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
```

Exemplo de arquivamento logico:

```http
DELETE /api/v1/datasets/662d4f6e7a1c2b00124f0501?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

O `DELETE` atual nao remove fisicamente o documento. Ele aplica `status: "archived"` e retorna o dataset atualizado.

Regras de seguranca:

- `datasetKey` e unico por tenant e deve ser estavel para integracoes futuras.
- `connectionId` e opcional.
- `fields` descreve estrutura futura, nunca linhas ou payload real de cliente.
- `metadata` e `settings` sao sanitizados; chaves e valores com aparencia de segredo sao descartados.
- Nenhuma rota executa query, preview, cache, scheduler, ingestao, conector ou chamada externa.
- Eventos internos de audit: `dataset.created`, `dataset.updated`, `dataset.archived`.
- Auditoria registra apenas `datasetKey`, `status`, `sourceType` e `connectionId`; nunca registra metadata/settings ou payload sensivel.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `tenantId`, `connectionId`, `datasetKey`, enums, fields, tags, `page` ou `pageSize` invalidos.
- `404 Not Found` quando o dataset nao existir para o `tenantId` informado.
- `409 Conflict` quando `datasetKey` ja existir para o tenant.
- `500 Internal Server Error` para falha inesperada de persistencia.

## 8. Query definitions / semantic layer

Objetivo: cadastrar definicoes logicas de consulta, metricas, dimensoes, filtros e
ordenacoes por tenant/dataset. Nesta etapa o recurso e apenas declarativo: nenhuma rota
executa query, SQL, aggregation, cache, worker, scheduler, conector ou chamada externa.

Rotas:

- `POST /api/v1/query-definitions`
- `GET /api/v1/query-definitions?tenantId=...&page=1&pageSize=25`
- `GET /api/v1/query-definitions/:id?tenantId=...`
- `PATCH /api/v1/query-definitions/:id?tenantId=...`
- `DELETE /api/v1/query-definitions/:id?tenantId=...`

Request seguro:

```http
POST /api/v1/query-definitions
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "datasetId": "662d4f6e7a1c2b00124f0501",
  "queryKey": "sales_overview",
  "name": "Visao geral de vendas",
  "description": "Definicao logica para indicadores principais de vendas",
  "type": "metric",
  "status": "draft",
  "metrics": [
    {
      "key": "total_sales",
      "label": "Vendas totais",
      "field": "total_amount",
      "aggregation": "sum",
      "format": "currency",
      "description": "Soma do valor total de vendas"
    }
  ],
  "dimensions": [
    {
      "key": "seller",
      "label": "Vendedor",
      "field": "seller_name",
      "type": "string"
    }
  ],
  "filters": [
    {
      "key": "period",
      "label": "Periodo",
      "field": "created_at",
      "operator": "date_range",
      "required": true,
      "allowedValues": ["last_7_days", "last_30_days"]
    }
  ],
  "sorts": [
    {
      "field": "total_amount",
      "direction": "desc"
    }
  ],
  "defaultLimit": 100,
  "timeField": "created_at",
  "allowedGranularities": ["day", "week", "month"],
  "tags": ["sales", "overview"],
  "metadata": {
    "domain": "sales"
  },
  "settings": {
    "visibleInBuilder": true
  }
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0601",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "datasetId": "662d4f6e7a1c2b00124f0501",
  "queryKey": "sales_overview",
  "name": "Visao geral de vendas",
  "description": "Definicao logica para indicadores principais de vendas",
  "status": "draft",
  "type": "metric",
  "metrics": [],
  "dimensions": [],
  "filters": [],
  "sorts": [],
  "defaultLimit": 100,
  "timeField": "created_at",
  "allowedGranularities": ["day", "week", "month"],
  "tags": ["sales", "overview"],
  "metadata": {
    "domain": "sales"
  },
  "settings": {
    "visibleInBuilder": true
  },
  "createdAt": "2026-04-26T12:00:00.000Z",
  "updatedAt": "2026-04-26T12:00:00.000Z",
  "createdBy": "dev-actor-001",
  "updatedBy": "dev-actor-001"
}
```

Enums iniciais:

- `type`: `table`, `metric`, `timeseries`, `comparison`, `custom`
- `status`: `active`, `inactive`, `draft`, `archived`
- `metrics.aggregation`: `count`, `count_distinct`, `sum`, `avg`, `min`, `max`, `none`
- `dimensions.type`: `string`, `number`, `boolean`, `date`, `datetime`, `currency`, `percentage`, `object`, `array`, `unknown`
- `filters.operator`: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `contains`, `between`, `date_range`
- `sorts.direction`: `asc`, `desc`
- `allowedGranularities`: `hour`, `day`, `week`, `month`, `quarter`, `year`

Exemplo de listagem:

```http
GET /api/v1/query-definitions?tenantId=662d4f6e7a1c2b00124f0001&datasetId=662d4f6e7a1c2b00124f0501
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
```

Exemplo de arquivamento logico:

```http
DELETE /api/v1/query-definitions/662d4f6e7a1c2b00124f0601?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

O `DELETE` atual nao remove fisicamente o documento. Ele aplica `status: "archived"` e retorna a query definition atualizada.

Regras de seguranca:

- `queryKey` e unico por tenant e deve ser estavel para integracoes futuras.
- `datasetId` e obrigatorio para manter rastreabilidade ate o dataset declarativo de origem.
- `metrics`, `dimensions`, `filters` e `sorts` descrevem consultas futuras; nao carregam resultado real de cliente.
- `metadata`, `settings`, `filters.defaultValue` e `filters.allowedValues` sao sanitizados. Valores com aparencia de segredo, token, senha, connection string real, authorization header ou alta entropia sao descartados.
- Respostas retornam apenas configuracao segura e nunca campos sensiveis.
- Eventos internos de audit: `query_definition.created`, `query_definition.updated`, `query_definition.archived`.
- Auditoria registra apenas `queryKey`, `status`, `type` e `datasetId`; nunca registra metadata/settings, filtros livres ou payload sensivel.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `tenantId`, `datasetId`, `queryKey`, enums, arrays, `defaultLimit`, tags, `page` ou `pageSize` invalidos.
- `404 Not Found` quando a query definition nao existir para o `tenantId` informado.
- `409 Conflict` quando `queryKey` ja existir para o tenant.
- `500 Internal Server Error` para falha inesperada de persistencia.

## 9. Dashboard definitions

Objetivo: cadastrar definicoes logicas de dashboards, layouts, secoes, widgets e filtros
globais por tenant. Nesta etapa o recurso e apenas declarativo: nenhuma rota renderiza
dashboard, executa query, busca dados reais, consome API externa, cria cache, worker,
scheduler ou fila.

Rotas:

- `POST /api/v1/dashboard-definitions`
- `GET /api/v1/dashboard-definitions?tenantId=...&page=1&pageSize=25`
- `GET /api/v1/dashboard-definitions/:id?tenantId=...`
- `PATCH /api/v1/dashboard-definitions/:id?tenantId=...`
- `DELETE /api/v1/dashboard-definitions/:id?tenantId=...`

Request seguro:

```http
POST /api/v1/dashboard-definitions
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "dashboardKey": "sales_dashboard",
  "name": "Dashboard de vendas",
  "description": "Painel logico para acompanhamento comercial",
  "status": "draft",
  "visibility": "tenant",
  "layout": {
    "type": "grid",
    "columns": 12,
    "gap": "md",
    "density": "comfortable"
  },
  "sections": [
    {
      "key": "overview",
      "title": "Visao geral",
      "description": "Indicadores principais",
      "order": 1,
      "layout": {
        "type": "grid",
        "columns": 12
      }
    }
  ],
  "widgets": [
    {
      "key": "total_sales",
      "title": "Vendas totais",
      "description": "Soma das vendas do periodo",
      "type": "metric_card",
      "queryDefinitionId": "662d4f6e7a1c2b00124f0601",
      "sectionKey": "overview",
      "order": 1,
      "size": {
        "cols": 3,
        "rows": 1
      },
      "position": {
        "x": 0,
        "y": 0
      },
      "visualization": {
        "chartType": "number",
        "format": "currency"
      },
      "options": {
        "showTrend": true
      }
    }
  ],
  "filters": [
    {
      "key": "period",
      "label": "Periodo",
      "field": "created_at",
      "operator": "date_range",
      "required": true,
      "defaultValue": "last_30_days",
      "allowedValues": ["last_7_days", "last_30_days"]
    }
  ],
  "tags": ["sales", "overview"],
  "metadata": {
    "domain": "sales"
  },
  "settings": {
    "visibleInBuilder": true
  }
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0701",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "dashboardKey": "sales_dashboard",
  "name": "Dashboard de vendas",
  "description": "Painel logico para acompanhamento comercial",
  "status": "draft",
  "visibility": "tenant",
  "layout": {
    "type": "grid",
    "columns": 12,
    "gap": "md",
    "density": "comfortable"
  },
  "sections": [],
  "widgets": [],
  "filters": [],
  "tags": ["sales", "overview"],
  "metadata": {
    "domain": "sales"
  },
  "settings": {
    "visibleInBuilder": true
  },
  "createdAt": "2026-04-26T12:00:00.000Z",
  "updatedAt": "2026-04-26T12:00:00.000Z",
  "createdBy": "dev-actor-001",
  "updatedBy": "dev-actor-001"
}
```

Enums iniciais:

- `status`: `active`, `inactive`, `draft`, `archived`
- `visibility`: `private`, `tenant`, `public`
- `layout.type`: `grid`, `tabs`, `list`, `custom`
- `layout.gap`: `none`, `sm`, `md`, `lg`
- `layout.density`: `compact`, `comfortable`, `spacious`
- `widgets.type`: `metric_card`, `chart`, `table`, `text`, `filter`, `custom`
- `widgets.visualization.chartType`: `line`, `bar`, `area`, `pie`, `donut`, `scatter`, `stacked_bar`, `table`, `number`, `custom`
- `filters.operator`: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `contains`, `between`, `date_range`

Exemplo de listagem:

```http
GET /api/v1/dashboard-definitions?tenantId=662d4f6e7a1c2b00124f0001&status=active
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
```

Exemplo de arquivamento logico:

```http
DELETE /api/v1/dashboard-definitions/662d4f6e7a1c2b00124f0701?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

O `DELETE` atual nao remove fisicamente o documento. Ele aplica `status: "archived"`
e retorna a dashboard definition atualizada.

Regras de seguranca:

- `dashboardKey` e unico por tenant e deve ser estavel para integracoes futuras.
- `tenantId` e obrigatorio em criacao, listagem e buscas tenant-scoped.
- `queryDefinitionId` em widgets e apenas referencia declarativa nesta foundation; a existencia real da query definition nao e validada nesta etapa para evitar acoplamento entre cadastros e permitir montagem incremental do dashboard builder.
- `sections`, `widgets` e `filters` descrevem configuracao futura; nao carregam resultado real de cliente.
- `metadata`, `settings`, `widgets.options`, `filters.defaultValue` e `filters.allowedValues` sao sanitizados. Valores com aparencia de segredo, token, senha, connection string real, authorization header ou alta entropia sao descartados.
- Respostas retornam apenas configuracao segura e nunca campos sensiveis.
- Eventos internos de audit: `dashboard_definition.created`, `dashboard_definition.updated`, `dashboard_definition.archived`.
- Auditoria registra apenas `dashboardKey`, `status`, `visibility`, quantidade de `sections` e quantidade de `widgets`; nunca registra metadata/settings/options/filtros livres ou payload sensivel.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `tenantId`, `dashboardKey`, enums, arrays, tags, `page` ou `pageSize` invalidos.
- `404 Not Found` quando a dashboard definition nao existir para o `tenantId` informado.
- `409 Conflict` quando `dashboardKey` ja existir para o tenant.
- `500 Internal Server Error` para falha inesperada de persistencia.

## 10. Field mappings

Objetivo: cadastrar De/Para de campos por tenant/dataset sem processar dados operacionais do cliente.

Rotas:

- `POST /api/v1/field-mappings`
- `GET /api/v1/field-mappings?tenantId=...&datasetKey=...&page=1&pageSize=25`
- `PATCH /api/v1/field-mappings/:id?tenantId=...`
- `DELETE /api/v1/field-mappings/:id?tenantId=...`

Request seguro:

```http
POST /api/v1/field-mappings
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "connectionId": "662d4f6e7a1c2b00124f0201",
  "datasetKey": "sales",
  "sourcePath": "order.total",
  "targetField": "totalAmount",
  "targetType": "money",
  "required": true,
  "transform": "string_to_number",
  "status": "active"
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0301",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "connectionId": "662d4f6e7a1c2b00124f0201",
  "datasetKey": "sales",
  "sourcePath": "order.total",
  "targetField": "totalAmount",
  "targetType": "money",
  "required": true,
  "transform": "string_to_number",
  "status": "active",
  "createdAt": "2026-04-26T12:00:00.000Z",
  "updatedAt": "2026-04-26T12:00:00.000Z"
}
```

Exemplo de listagem por dataset:

```http
GET /api/v1/field-mappings?tenantId=662d4f6e7a1c2b00124f0001&datasetKey=sales
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
```

Exemplo de delete logico:

```http
DELETE /api/v1/field-mappings/662d4f6e7a1c2b00124f0301?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

O `DELETE` atual desativa o mapping com `status: "inactive"` e retorna o recurso atualizado.

Eventos internos de audit: `field_mapping.created`, `field_mapping.updated`, `field_mapping.deactivated`.
Auditoria registra apenas `datasetKey`, `targetField`, `targetType`, `status` e `connectionId`; nunca registra `sourcePath` ou payload operacional.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `tenantId`, `connectionId`, `datasetKey`, `targetType`, `transform`, `status`, `page` ou `pageSize` invalidos.
- `404 Not Found` quando o mapping nao existir para o `tenantId` informado.
- `500 Internal Server Error` para falha inesperada de persistencia, incluindo duplicidade de `tenantId + datasetKey + targetField` enquanto nao houver erro de dominio especifico.

## 11. Credentials / secrets

Objetivo: registrar referencias seguras de credenciais para conexoes sem expor segredo real em respostas, listagens, logs ou auditoria.

Rotas:

- `POST /api/v1/credentials`
- `GET /api/v1/credentials?tenantId=...&page=1&pageSize=25`
- `GET /api/v1/credentials/:id?tenantId=...`
- `PATCH /api/v1/credentials/:id/rotate?tenantId=...`
- `PATCH /api/v1/credentials/:id/revoke?tenantId=...`

Request seguro:

```http
POST /api/v1/credentials
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-id: dev-actor-001
x-delfos-actor-role: admin
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "connectionId": "662d4f6e7a1c2b00124f0201",
  "type": "api_key",
  "provider": "customer-api",
  "name": "Primary customer API credential",
  "secretValue": "not-a-real-secret-value"
}
```

Response `201`:

```json
{
  "id": "662d4f6e7a1c2b00124f0401",
  "credentialRef": "cred_662d4f6e7a1c2b00124f0401",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "connectionId": "662d4f6e7a1c2b00124f0201",
  "type": "api_key",
  "provider": "customer-api",
  "name": "Primary customer API credential",
  "status": "active",
  "maskedPreview": "********alue",
  "createdAt": "2026-04-26T12:00:00.000Z",
  "updatedAt": "2026-04-26T12:00:00.000Z",
  "createdBy": "dev-actor-001",
  "updatedBy": "dev-actor-001"
}
```

Tipos iniciais:

- `api_key`
- `bearer_token`
- `basic_auth`
- `oauth_client`
- `database_connection_string`
- `custom`

Status:

- `active`
- `inactive`
- `revoked`

Exemplo de listagem:

```http
GET /api/v1/credentials?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
```

Exemplo de rotacao:

```http
PATCH /api/v1/credentials/662d4f6e7a1c2b00124f0401/rotate?tenantId=662d4f6e7a1c2b00124f0001
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: admin
```

```json
{
  "secretValue": "not-a-real-rotated-secret-value"
}
```

Exemplo de revogacao:

```http
PATCH /api/v1/credentials/662d4f6e7a1c2b00124f0401/revoke?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: admin
```

Regras de seguranca:

- `secretValue` existe apenas em `POST` e `rotate`.
- `POST`, `rotate` e `revoke` sao operacoes sensiveis e exigem role temporaria `owner` ou `admin`.
- Respostas nunca retornam `secretValue`, valor protegido, token, senha, connection string real ou headers sensiveis.
- `credentialRef` segue `cred_<ObjectId>` e pode ser usado em `connections.credentialRef`.
- `maskedPreview` so mostra sufixo quando o valor tem tamanho suficiente; caso contrario retorna `null`.
- A foundation temporaria protege o valor com AES-256-GCM local usando `ENCRYPTION_KEY_BASE64`.
- A implementacao fica isolada em service proprio para troca futura por Vault/KMS/Secrets Manager sem alterar o contrato publico.
- Eventos internos de audit: `credential.created`, `credential.rotated`, `credential.revoked`.
- Auditoria registra apenas `tenantId`, `entityId`, `type`, `status`, `provider` e `connectionId`; nunca registra segredo real.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `tenantId`, `connectionId`, `id`, `type`, `provider`, `name`, `secretValue`, `page` ou `pageSize` invalidos.
- `404 Not Found` quando a credencial nao existir para o `tenantId` informado.
- `500 Internal Server Error` para falha inesperada de persistencia ou protecao local.

## 12. Seguranca dos exemplos

- Nao usar dados reais de cliente, usuario, tenant, API externa ou ambiente interno.
- Nao incluir token, senha, secret, privateKey, API key, admin key real, credential real ou `.env`.
- Usar e-mails `example.com`, hosts `*.example` e IDs MongoDB ficticios.
- Em `connections`, usar sempre `credentialRef` ficticio; nunca segredo bruto.
- Em `settings` e `metadata`, usar apenas metadados nao sensiveis. Chaves como `token`, `secret`, `password`, `credential`, `authorization`, `apiKey` e `privateKey` nao devem aparecer.
- Estes endpoints manipulam configuracao do Delfos. Eles nao devem receber payload operacional bruto de APIs de clientes.
- Em `query-definitions` e `dashboard-definitions`, exemplos devem usar apenas chaves logicas e valores ficticios seguros para filtros/opcoes.

## 13. Checkpoint tecnico da foundation

Estado revisado neste checkpoint:

- `GET /health` permanece publico e fora de `/api/v1`.
- Endpoints administrativos de `tenants`, `users`, `connections`, `credentials`, `datasets`, `query-definitions`, `dashboard-definitions` e `field-mappings` exigem `x-delfos-admin-key`.
- Leitura/listagem usa o padrao temporario atual: admin key obrigatoria, sem role obrigatoria.
- Mutacoes gerais usam `owner`, `admin` ou `operator`, exceto operacoes sensiveis de credenciais.
- Operacoes sensiveis de credenciais (`POST`, `rotate`, `revoke`) usam apenas `owner` ou `admin`.
- Recursos tenant-scoped exigem `tenantId` explicito em body ou query enquanto nao existir contexto autenticado final.
- Buscas/updates/deletes por id em `users`, `connections`, `credentials`, `datasets` e `field-mappings` sao tenant-scoped.
- Buscas/updates/deletes por id em `query-definitions` tambem sao tenant-scoped.
- Buscas/updates/deletes por id em `dashboard-definitions` tambem sao tenant-scoped.
- `createdBy` e `updatedBy` usam `x-delfos-actor-id` nos recursos que possuem esses campos (`credentials`, `datasets`, `query-definitions` e `dashboard-definitions`).
- `metadata`/`settings` sao sanitizados em `tenants`, `connections`, `datasets`, `query-definitions` e `dashboard-definitions`; secrets, tokens, credenciais, connection strings e valores nao escalares sao descartados.
- `query-definitions` tambem sanitiza `filters.defaultValue` e `filters.allowedValues`, mantendo apenas escalares seguros.
- `dashboard-definitions` tambem sanitiza `widgets.options`, `filters.defaultValue` e `filters.allowedValues`, mantendo apenas escalares seguros.
- Auditoria interna nao possui rota publica e nao grava segredo real, `secretValue`, `protectedSecretValue`, `credentialRef`, `baseUrl`, `sourcePath`, `metadata` livre, `settings` ou payload operacional.
- Swagger documenta os headers temporarios via `ApiFoundationAuthHeaders` nos controllers protegidos.
- O contrato de erro global padronizado vale para validacao, auth, forbidden, not found e erros inesperados.
- `.env.example` e `docs/env-reference.md` usam `DELFOS_DATABASE_URL`, `DELFOS_ADMIN_KEY`, `ENCRYPTION_KEY_BASE64`, `CORS_ORIGIN` e `LOG_LEVEL` como base implementada atual.
