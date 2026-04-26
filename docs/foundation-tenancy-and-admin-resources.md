# Foundation: tenancy e recursos administrativos

> Escopo: contratos administrativos temporarios de tenants, users e connections.

Todos os endpoints deste documento seguem as regras transversais de
[`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md).

## 1. Tenants

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

## 2. Users

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

## 3. Connections

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
