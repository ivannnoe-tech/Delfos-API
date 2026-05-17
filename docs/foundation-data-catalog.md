# Foundation: catalogo declarativo de dados e dashboards

> **Justificativa de tamanho:** este arquivo excede o limite de 600 linhas de
> `docs/quality-checklist.md` §0.1. A exceção se aplica por ser **documentação
> de referência longa** — um catálogo de contratos de API único e coeso que
> cobre cinco recursos relacionados; dividi-lo fragmentaria a referência. Não
> dividir; manter coeso.

> Escopo: contratos administrativos temporarios de datasets, query definitions, dashboard definitions, report definitions e field mappings.

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

## 4. Report definitions

Objetivo: cadastrar definicoes administrativas e declarativas de relatorios por tenant, com
referencias opcionais para query definitions e dashboard definitions. Nesta etapa o recurso e
apenas configuracao: nenhuma rota gera PDF, Excel, CSV, executa query, renderiza relatorio, envia
e-mail, agenda job, cria fila, scheduler, cache, worker, conector ou chamada externa.

Rotas:

- `POST /api/v1/report-definitions`
- `GET /api/v1/report-definitions?tenantId=...&page=1&pageSize=25`
- `GET /api/v1/report-definitions/:id?tenantId=...`
- `PATCH /api/v1/report-definitions/:id?tenantId=...`
- `DELETE /api/v1/report-definitions/:id?tenantId=...`

Request seguro:

```http
POST /api/v1/report-definitions
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

```json
{
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "reportKey": "monthly_sales_report",
  "name": "Relatorio mensal de vendas",
  "description": "Definicao declarativa para relatorio comercial mensal",
  "status": "draft",
  "visibility": "tenant",
  "queryDefinitionId": "662d4f6e7a1c2b00124f0601",
  "dashboardDefinitionId": "662d4f6e7a1c2b00124f0701",
  "layout": {
    "type": "paged",
    "columns": 12,
    "density": "comfortable"
  },
  "sections": [
    {
      "key": "summary",
      "title": "Resumo executivo",
      "order": 1
    }
  ],
  "blocks": [
    {
      "key": "sales_table",
      "title": "Tabela de vendas",
      "type": "table",
      "queryDefinitionId": "662d4f6e7a1c2b00124f0601",
      "sectionKey": "summary",
      "order": 1,
      "options": {
        "showTotals": true
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
  "parameters": [
    {
      "key": "report_period",
      "label": "Periodo do relatorio",
      "type": "date_range",
      "required": true,
      "defaultValue": "last_30_days",
      "allowedValues": ["last_7_days", "last_30_days"]
    }
  ],
  "exportOptions": {
    "defaultFormat": "pdf",
    "includeFilters": true
  },
  "tags": ["sales", "monthly"],
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
  "id": "662d4f6e7a1c2b00124f0801",
  "tenantId": "662d4f6e7a1c2b00124f0001",
  "reportKey": "monthly_sales_report",
  "name": "Relatorio mensal de vendas",
  "description": "Definicao declarativa para relatorio comercial mensal",
  "status": "draft",
  "visibility": "tenant",
  "queryDefinitionId": "662d4f6e7a1c2b00124f0601",
  "dashboardDefinitionId": "662d4f6e7a1c2b00124f0701",
  "layout": {
    "type": "paged",
    "columns": 12,
    "density": "comfortable"
  },
  "sections": [],
  "blocks": [],
  "filters": [],
  "parameters": [],
  "exportOptions": {
    "defaultFormat": "pdf",
    "includeFilters": true
  },
  "tags": ["sales", "monthly"],
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

- `status`: `draft`, `active`, `archived`
- `visibility`: `private`, `tenant`
- `layout.type`: `paged`, `sections`, `table`, `custom`
- `layout.density`: `compact`, `comfortable`, `spacious`
- `blocks.type`: `text`, `table`, `chart`, `metric`, `dashboard_widget`, `custom`
- `filters.operator`: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `not_in`, `contains`, `between`, `date_range`
- `parameters.type`: `string`, `number`, `boolean`, `date`, `date_range`, `select`

Exemplo de listagem:

```http
GET /api/v1/report-definitions?tenantId=662d4f6e7a1c2b00124f0001&status=active
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
```

Exemplo de arquivamento logico:

```http
DELETE /api/v1/report-definitions/662d4f6e7a1c2b00124f0801?tenantId=662d4f6e7a1c2b00124f0001
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-actor-role: operator
```

O `DELETE` atual nao remove fisicamente o documento. Ele aplica `status: "archived"` e retorna a report definition atualizada.

Regras de seguranca:

- `reportKey` e unico por tenant e deve ser estavel para integracoes futuras.
- `queryDefinitionId` e `dashboardDefinitionId` sao referencias declarativas opcionais; a existencia real nao e validada nesta etapa para permitir montagem incremental.
- `sections`, `blocks`, `filters`, `parameters` e `exportOptions` descrevem configuracao futura; nao carregam resultado real de cliente.
- `exportOptions` e declarativo e nao aciona geracao de arquivo.
- `metadata`, `settings`, `exportOptions`, `blocks.options`, `filters.defaultValue`, `filters.allowedValues`, `parameters.defaultValue` e `parameters.allowedValues` sao sanitizados. Valores com aparencia de segredo, token, senha, connection string real, authorization header ou alta entropia sao descartados.
- Respostas retornam apenas configuracao segura e nunca campos sensiveis.
- Eventos internos de audit: `report_definition.created`, `report_definition.updated`, `report_definition.archived`.
- Auditoria registra apenas `reportKey`, `status`, `visibility`, referencias declarativas e contadores de secoes/blocos; nunca registra metadata/settings/exportOptions/options/filtros/parametros livres ou payload sensivel.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `tenantId`, `reportKey`, enums, arrays, tags, `page` ou `pageSize` invalidos.
- `404 Not Found` quando a report definition nao existir para o `tenantId` informado.
- `409 Conflict` quando `reportKey` ja existir para o tenant.
- `500 Internal Server Error` para falha inesperada de persistencia.

## 5. Field mappings

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

## 6. Preview/demo execution

Objetivo: permitir que `delfos-web` renderize previews de query definitions e dashboard
definitions com dados demonstrativos seguros, sem executar consultas reais e sem acessar dados de
cliente.

Rotas:

- `POST /api/v1/query-definitions/:id/preview?tenantId=...`
- `POST /api/v1/dashboard-definitions/:id/preview?tenantId=...`

Esses endpoints seguem as regras transversais de
[`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md):

- `x-delfos-admin-key` e obrigatorio.
- `tenantId` e obrigatorio na query string e deve ser ObjectId valido.
- A busca por `:id` e sempre tenant-scoped.
- Nao ha role temporaria obrigatoria para preview; a decisao segue o padrao atual de
  leitura/listagem da foundation, em que a admin key e suficiente.
- Se `x-delfos-actor-role` for enviado, ele precisa ser uma role valida da foundation.

### 6.1 Query preview

Request:

```http
POST /api/v1/query-definitions/662d4f6e7a1c2b00124f0601/preview?tenantId=662d4f6e7a1c2b00124f0001
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
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

Regras:

- Carrega a query definition por `id + tenantId`.
- Usa `metrics`, `dimensions`, `filters` declarativos, `type`, `timeField` e `defaultLimit`
  apenas para gerar formato e volume pequeno de linhas ficticias.
- `filters.defaultValue`, `filters.allowedValues`, `metadata` e `settings` nao sao usados para
  gerar nem expor dados.
- Os valores gerados usam nomes demonstrativos, como `Jan demo`, `Cliente Demo A` e
  `Vendedor Demo A`.
- O retorno sempre indica `mode: "demo"` e `meta.isPreview: true`.
- Nao executa SQL, Mongo aggregation, query builder real, API externa, conector, cache, fila,
  scheduler ou worker.
- Nao persiste resultados e nao cria `query_result_snapshots`.

Evento interno de audit:

- `execution_preview.query.generated`

Auditoria registra somente:

- `tenantId`
- `queryDefinitionId`
- `queryKey`
- `mode`

Auditoria nunca registra `rows`, `columns`, metadata/settings, filtros livres, valores gerados,
default values ou allowed values.

### 6.2 Dashboard preview

Request:

```http
POST /api/v1/dashboard-definitions/662d4f6e7a1c2b00124f0701/preview?tenantId=662d4f6e7a1c2b00124f0001
Content-Type: application/json
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
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

Widgets sem query definition relacionada nao quebram o preview inteiro. Eles retornam
`status: "degraded"` e `reason` seguro:

- `missing_query_definition` quando `queryDefinitionId` nao foi configurado.
- `query_definition_not_found` quando a referencia nao existe para o mesmo `tenantId`.

Exemplo degradado:

```json
{
  "widgetKey": "total_sales",
  "title": "Vendas totais",
  "type": "metric_card",
  "status": "degraded",
  "reason": "missing_query_definition",
  "visualization": { "yFields": [] },
  "data": { "columns": [], "rows": [] }
}
```

Regras:

- Carrega a dashboard definition por `id + tenantId`.
- Carrega query definitions relacionadas por `queryDefinitionId + tenantId`.
- Usa `widget.visualization` e a query definition relacionada para montar colunas e linhas demo.
- `metadata`, `settings`, `widgets.options`, `filters.defaultValue` e `filters.allowedValues`
  nao sao usados para gerar nem expor dados.
- O retorno sempre indica `mode: "demo"` e `meta.isPreview: true`.
- Nao renderiza dashboard real, nao executa query real, nao chama API externa, nao cria cache,
  fila, scheduler, worker, staging ou snapshot.

Evento interno de audit:

- `execution_preview.dashboard.generated`

Auditoria registra somente:

- `tenantId`
- `dashboardDefinitionId`
- `dashboardKey`
- `mode`
- `widgetsCount`
- `readyWidgetsCount`

Auditoria nunca registra `rows`, `columns`, metadata/settings/options, filtros livres, valores
gerados, default values ou allowed values.

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `400 Bad Request` para `tenantId`, `id`, `rowLimit` ou `rowLimitPerWidget` invalidos.
- `404 Not Found` quando a query/dashboard definition raiz nao existir para o `tenantId`
  informado.
- `500 Internal Server Error` para falha inesperada de persistencia ou auditoria.
