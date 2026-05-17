# Foundation: auth temporaria, erros e health

> Escopo: regras transversais dos endpoints administrativos temporarios da foundation.

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

- `x-delfos-admin-key` e obrigatorio para `tenants`, `users`, `connections`, `credentials`, `datasets`, `query-definitions`, `dashboard-definitions`, `report-definitions` e `field-mappings`.
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
