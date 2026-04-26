# Contratos de API — Delfos Analytics

> Status: contrato inicial da Fase 1  
> Escopo: formato e diretrizes dos endpoints REST do `delfos-api` consumidos pelo `delfos-web`.

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
- `POST /api/v1/datasets/:id/preview`
- `POST /api/v1/datasets/:id/query`

### Field mappings

- `GET /api/v1/field-mappings?datasetId=...`
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
