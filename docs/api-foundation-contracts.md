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

- `x-delfos-admin-key` e obrigatorio para `tenants`, `users`, `connections` e `field-mappings`.
- `GET /health` continua publico e nao exige headers de auth.
- `x-delfos-tenant-id` e opcional nesta foundation, mas quando enviado deve ser um ObjectId MongoDB valido.
- `x-delfos-actor-id` e opcional e aceita apenas identificadores tecnicos simples.
- `x-delfos-actor-role` aceita apenas `owner`, `admin`, `operator` ou `viewer`.
- Operacoes mutaveis podem exigir role temporaria por header; listagens atuais exigem apenas a admin key.
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
  "role": "editor",
  "status": "active"
}
```

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

## 8. Field mappings

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

Principais erros esperados:

- `401 Unauthorized` para admin key ausente ou invalida.
- `403 Forbidden` para role temporaria sem permissao em escrita.
- `400 Bad Request` para `tenantId`, `connectionId`, `datasetKey`, `targetType`, `transform`, `status`, `page` ou `pageSize` invalidos.
- `404 Not Found` quando o mapping nao existir para o `tenantId` informado.
- `500 Internal Server Error` para falha inesperada de persistencia, incluindo duplicidade de `tenantId + datasetKey + targetField` enquanto nao houver erro de dominio especifico.

## 9. Credentials / secrets

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
x-delfos-actor-role: operator
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
x-delfos-actor-role: operator
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
x-delfos-actor-role: operator
```

Regras de seguranca:

- `secretValue` existe apenas em `POST` e `rotate`.
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

## 10. Seguranca dos exemplos

- Nao usar dados reais de cliente, usuario, tenant, API externa ou ambiente interno.
- Nao incluir token, senha, secret, privateKey, API key, admin key real, credential real ou `.env`.
- Usar e-mails `example.com`, hosts `*.example` e IDs MongoDB ficticios.
- Em `connections`, usar sempre `credentialRef` ficticio; nunca segredo bruto.
- Em `settings` e `metadata`, usar apenas metadados nao sensiveis. Chaves como `token`, `secret`, `password`, `credential`, `authorization`, `apiKey` e `privateKey` nao devem aparecer.
- Estes endpoints manipulam configuracao do Delfos. Eles nao devem receber payload operacional bruto de APIs de clientes.
