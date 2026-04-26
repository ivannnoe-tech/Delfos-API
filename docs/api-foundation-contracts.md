# Contratos HTTP da foundation

> Status: referencia pratica da foundation MongoDB/configuracao.  
> Escopo: endpoints administrativos temporarios ja expostos pelo `delfos-api`.

Este documento registra os contratos atuais para desenvolvimento e testes manuais. Ele nao substitui `docs/api-contracts.md`.

## 1. Aviso de escopo

- Estes endpoints sao administrativos e temporarios da foundation.
- Ainda nao ha autenticacao, autorizacao ou contexto real de usuario/tenant.
- `tenantId` aparece explicitamente em algumas requests ate existir contexto autenticado.
- Nao considerar estes endpoints prontos para producao sem auth, autorizacao, RBAC, auditoria completa e revisao de seguranca.
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

Modelo de erro HTTP atual:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["tenantId must be a mongodb id"],
  "requestId": "dev-req-001",
  "correlationId": "dev-corr-001",
  "timestamp": "2026-04-26T12:00:00.000Z",
  "path": "/api/v1/users?tenantId=invalid"
}
```

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
```

Principais erros esperados:

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
```

```json
{
  "role": "editor",
  "status": "active"
}
```

Principais erros esperados:

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

- `400 Bad Request` para URL sem protocolo, protocolo invalido, `tenantId`, `authType`, headers ou `status` invalidos.
- `404 Not Found` quando a conexao nao existir para o `tenantId` informado.
- `500 Internal Server Error` para falha inesperada de persistencia, incluindo duplicidade de `tenantId + name` enquanto nao houver erro de dominio especifico.

## 7. Field mappings

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
```

Exemplo de delete logico:

```http
DELETE /api/v1/field-mappings/662d4f6e7a1c2b00124f0301?tenantId=662d4f6e7a1c2b00124f0001
```

O `DELETE` atual desativa o mapping com `status: "inactive"` e retorna o recurso atualizado.

Principais erros esperados:

- `400 Bad Request` para `tenantId`, `connectionId`, `datasetKey`, `targetType`, `transform`, `status`, `page` ou `pageSize` invalidos.
- `404 Not Found` quando o mapping nao existir para o `tenantId` informado.
- `500 Internal Server Error` para falha inesperada de persistencia, incluindo duplicidade de `tenantId + datasetKey + targetField` enquanto nao houver erro de dominio especifico.

## 8. Seguranca dos exemplos

- Nao usar dados reais de cliente, usuario, tenant, API externa ou ambiente interno.
- Nao incluir token, senha, secret, privateKey, API key, credential real ou `.env`.
- Usar e-mails `example.com`, hosts `*.example` e IDs MongoDB ficticios.
- Em `connections`, usar sempre `credentialRef` ficticio; nunca segredo bruto.
- Em `settings` e `metadata`, usar apenas metadados nao sensiveis. Chaves como `token`, `secret`, `password`, `credential`, `authorization`, `apiKey` e `privateKey` nao devem aparecer.
- Estes endpoints manipulam configuracao do Delfos. Eles nao devem receber payload operacional bruto de APIs de clientes.
