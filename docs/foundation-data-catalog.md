# Foundation: catalogo declarativo de dados e dashboards

> Escopo: contratos administrativos temporarios de datasets, query definitions, dashboard definitions e field mappings.

Todos os endpoints deste documento seguem as regras transversais de
[`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md).

## 1. Datasets

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

## 2. Query definitions / semantic layer

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

## 3. Dashboard definitions

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

## 4. Field mappings

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
