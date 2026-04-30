# Referencia de Variaveis de Ambiente - delfos-api

Este documento descreve variaveis esperadas para local, homologacao e producao.

> Nunca versionar `.env` real. Use `.env.example` como referencia segura.

## Principios

- Toda variavel obrigatoria deve ser validada no bootstrap.
- Secrets devem vir de ambiente, secret manager ou pipeline seguro.
- Valores sensiveis nunca devem aparecer em log, print, fixture ou documentacao publica.

## Variaveis gerais

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `NODE_ENV` | Sim | `development` | Ambiente de execucao. |
| `PORT` | Sim | `3000` | Porta HTTP da API. |
| `CORS_ORIGIN` | Nao | `http://localhost:8080` | Origens permitidas separadas por virgula. Quando omitida, CORS fica desabilitado. |
| `LOG_LEVEL` | Sim | `info` | Nivel de log. |

## MongoDB

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `DELFOS_DATABASE_URL` | Sim | `mongodb://localhost:27017/delfos` | URL completa do MongoDB de configuracao/metadados. |

Na Fase 1, MongoDB armazena configuracao e metadados do Delfos, nao payload operacional bruto de cliente.

## Seguranca

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `DELFOS_ADMIN_KEY` | Sim | `change-me-local-admin-key-at-least-32-chars` | Chave temporaria da foundation para endpoints administrativos. Nao substitui autenticacao final. |
| `ENCRYPTION_KEY_BASE64` | Sim | `MDEy...YmY=` | Chave base64 que deve decodificar para 32 bytes e criptografar secrets locais da foundation. |
| `JWT_ACCESS_SECRET` | Futuro | `change-me-access-secret` | Secret forte para access tokens quando o auth final for implementado. |
| `JWT_REFRESH_SECRET` | Futuro | `change-me-refresh-secret` | Secret forte para refresh tokens quando o auth final for implementado. |
| `JWT_ACCESS_TTL` | Futuro | `15m` | TTL planejado do access token. |
| `JWT_REFRESH_TTL` | Futuro | `7d` | TTL planejado do refresh token. |

## APIs externas e cache planejado

As variaveis abaixo ja aparecem em `.env.example` como referencia de Fase 1, mas nem todas sao consumidas pelo bootstrap atual.

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `CACHE_DRIVER` | Nao | `memory` | Driver planejado de cache transitorio. Redis continua fora da Fase 1. |
| `CACHE_DEFAULT_TTL_S` | Nao | `300` | TTL padrao planejado para cache em memoria. |
| `CACHE_MAX_ITEMS` | Nao | `1000` | Limite planejado de itens em cache local. |
| `HTTP_TIMEOUT_MS` | Nao | `30000` | Timeout padrao planejado para APIs de clientes. |
| `HTTP_MAX_RETRIES` | Nao | `2` | Retentativas planejadas para chamadas externas seguras. |
| `HTTP_RATE_LIMIT_PER_MINUTE` | Nao | `120` | Rate limit planejado por conexao/API de cliente. |

## Swagger/OpenAPI

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `SWAGGER_ENABLED` | Nao | `true` | Habilita Swagger UI em `/docs`. Default: `true` em desenvolvimento/teste, `false` em producao. Desabilitar antes de deploy em producao. |

Caminho fixo: `/docs`. Em producao, omitir a variavel ou definir `SWAGGER_ENABLED=false`.

## Checklist

- [ ] `.env.example` atualizado.
- [ ] Nenhum `.env` real versionado.
- [ ] Variaveis obrigatorias validadas.
- [ ] Logs nao expoem valores sensiveis.
