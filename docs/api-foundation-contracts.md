# Contratos HTTP da foundation

> Status: referencia pratica da foundation MongoDB/configuracao.  
> Escopo: indice dos endpoints administrativos temporarios ja expostos pelo `delfos-api`.

Este documento e a porta de entrada dos contratos foundation. Ele resume o escopo, as
convencoes e aponta para documentos especificos com exemplos completos. Ele nao substitui
[`docs/api-contracts.md`](./api-contracts.md).

## 1. Escopo

- Estes endpoints sao administrativos e temporarios da foundation.
- A autenticacao temporaria usa `x-delfos-admin-key` para reduzir o estado inseguro da foundation.
- Esta autenticacao nao e a estrategia final de producao.
- Ainda nao ha login real, senha, JWT, refresh token, MFA, OAuth ou provedor externo neste contrato.
- `tenantId` ainda aparece explicitamente em algumas requests ate existir contexto autenticado real.
- Headers temporarios de tenant, actor e role existem apenas para contexto de desenvolvimento.
- Nao considerar estes endpoints prontos para producao sem auth final, autorizacao completa, isolamento multi-tenant real, auditoria completa e revisao de seguranca.
- O service de audit existe nesta etapa como service interno. Nao ha rota publica de audit.

## 2. Convencoes gerais

- Base path principal: `/api/v1`.
- Excecao atual: `GET /health` fica fora do base path.
- Content-Type: `application/json`.
- IDs MongoDB nos exemplos sao ficticios.
- Listagens aceitam `page` e `pageSize`; padrao atual: `page=1`, `pageSize=25`, maximo `pageSize=100`.
- Request context usa `x-request-id` e `x-correlation-id`. Se omitidos, a API gera valores e devolve os headers.
- Exemplos usam apenas dados ficticios e seguros.

Headers temporarios de auth/contexto para endpoints administrativos:

```http
x-delfos-admin-key: <valor de DELFOS_ADMIN_KEY>
x-delfos-tenant-id: 662d4f6e7a1c2b00124f0001
x-delfos-actor-id: dev-actor-001
x-delfos-actor-role: admin
```

Regras resumidas:

- `x-delfos-admin-key` e obrigatorio para endpoints administrativos foundation.
- `GET /health` continua publico e nao exige headers de auth.
- Leitura/listagem exige apenas a admin key no checkpoint atual.
- Mutacoes administrativas gerais exigem `owner`, `admin` ou `operator`.
- Operacoes sensiveis de credenciais exigem `owner` ou `admin`.
- A API nao deve logar `x-delfos-admin-key` nem revelar se a chave existe, tamanho esperado ou valor esperado.

Detalhes completos de headers, erros, envelope de lista e healthcheck ficam em
[`docs/foundation-auth-and-errors.md`](./foundation-auth-and-errors.md).

## 3. Documentos detalhados

| Documento | Conteudo |
|---|---|
| [`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md) | Escopo, headers temporarios, envelope de lista, contrato de erro e `GET /health`. |
| [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md) | Contratos de `tenants`, `users` e `connections`. |
| [`foundation-data-catalog.md`](./foundation-data-catalog.md) | Contratos de `datasets`, `query-definitions`, `dashboard-definitions`, `report-definitions` e `field-mappings`. |
| [`foundation-credentials-and-security.md`](./foundation-credentials-and-security.md) | Contrato de `credentials`, seguranca dos exemplos e checkpoint tecnico da foundation. |

## 4. Indice de endpoints

| Recurso | Rotas | Detalhes |
|---|---|---|
| Health | `GET /health` | [`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md#3-health) |
| Tenants | `POST /api/v1/tenants`, `GET /api/v1/tenants`, `GET /api/v1/tenants/:id`, `PATCH /api/v1/tenants/:id` | [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md#1-tenants) |
| Users | `POST /api/v1/users`, `GET /api/v1/users`, `PATCH /api/v1/users/:id` | [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md#2-users) |
| Connections | `POST /api/v1/connections`, `GET /api/v1/connections`, `GET /api/v1/connections/:id`, `PATCH /api/v1/connections/:id` | [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md#3-connections) |
| Datasets | `POST /api/v1/datasets`, `GET /api/v1/datasets`, `GET /api/v1/datasets/:id`, `PATCH /api/v1/datasets/:id`, `DELETE /api/v1/datasets/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#1-datasets) |
| Query definitions | `POST /api/v1/query-definitions`, `GET /api/v1/query-definitions`, `GET /api/v1/query-definitions/:id`, `PATCH /api/v1/query-definitions/:id`, `DELETE /api/v1/query-definitions/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#2-query-definitions--semantic-layer) |
| Dashboard definitions | `POST /api/v1/dashboard-definitions`, `GET /api/v1/dashboard-definitions`, `GET /api/v1/dashboard-definitions/:id`, `PATCH /api/v1/dashboard-definitions/:id`, `DELETE /api/v1/dashboard-definitions/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#3-dashboard-definitions) |
| Report definitions | `POST /api/v1/report-definitions`, `GET /api/v1/report-definitions`, `GET /api/v1/report-definitions/:id`, `PATCH /api/v1/report-definitions/:id`, `DELETE /api/v1/report-definitions/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#4-report-definitions) |
| Field mappings | `POST /api/v1/field-mappings`, `GET /api/v1/field-mappings`, `PATCH /api/v1/field-mappings/:id`, `DELETE /api/v1/field-mappings/:id` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#5-field-mappings) |
| Execution preview | `POST /api/v1/query-definitions/:id/preview`, `POST /api/v1/dashboard-definitions/:id/preview` | [`foundation-data-catalog.md`](./foundation-data-catalog.md#6-previewdemo-execution) |
| Credentials | `POST /api/v1/credentials`, `GET /api/v1/credentials`, `GET /api/v1/credentials/:id`, `PATCH /api/v1/credentials/:id/rotate`, `PATCH /api/v1/credentials/:id/revoke` | [`foundation-credentials-and-security.md`](./foundation-credentials-and-security.md#1-credentials--secrets) |

## 5. Regras transversais

- Recursos tenant-scoped exigem `tenantId` explicito em body ou query enquanto nao existir contexto autenticado final.
- Buscas, updates e deletes por id em recursos tenant-scoped sao tenant-scoped.
- `createdBy` e `updatedBy` usam `x-delfos-actor-id` nos recursos que possuem esses campos.
- `metadata`, `settings`, filtros, parametros, exportOptions e opcoes livres sao sanitizados conforme o recurso.
- Auditoria interna nao possui rota publica e nao grava segredo real, credenciais, metadata livre, settings ou payload operacional.
- Swagger documenta os headers temporarios via `ApiFoundationAuthHeaders` nos controllers protegidos.
- O contrato de erro global padronizado vale para validacao, auth, forbidden, not found e erros inesperados.

O checkpoint tecnico completo fica em
[`foundation-credentials-and-security.md`](./foundation-credentials-and-security.md#3-checkpoint-tecnico-da-foundation).
