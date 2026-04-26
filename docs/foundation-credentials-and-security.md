# Foundation: credenciais e seguranca

> Escopo: contrato de credentials, regras de exemplos seguros e checkpoint tecnico da foundation.

Todos os endpoints deste documento seguem as regras transversais de
[`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md).

## 1. Credentials / secrets

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

## 2. Seguranca dos exemplos

- Nao usar dados reais de cliente, usuario, tenant, API externa ou ambiente interno.
- Nao incluir token, senha, secret, privateKey, API key, admin key real, credential real ou `.env`.
- Usar e-mails `example.com`, hosts `*.example` e IDs MongoDB ficticios.
- Em `connections`, usar sempre `credentialRef` ficticio; nunca segredo bruto.
- Em `settings` e `metadata`, usar apenas metadados nao sensiveis. Chaves como `token`, `secret`, `password`, `credential`, `authorization`, `apiKey` e `privateKey` nao devem aparecer.
- Estes endpoints manipulam configuracao do Delfos. Eles nao devem receber payload operacional bruto de APIs de clientes.
- Em `query-definitions` e `dashboard-definitions`, exemplos devem usar apenas chaves logicas e valores ficticios seguros para filtros/opcoes.

## 3. Checkpoint tecnico da foundation

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
