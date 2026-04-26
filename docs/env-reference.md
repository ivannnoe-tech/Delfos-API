# Referência de Variáveis de Ambiente — delfos-api

Este documento descreve variáveis esperadas para local, homologação e produção.

> Nunca versionar `.env` real. Use `.env.example` como referência segura.

## Princípios

- Toda variável obrigatória deve ser validada no bootstrap.
- Secrets devem vir de ambiente, secret manager ou pipeline seguro.
- Valores sensíveis nunca devem aparecer em log, print, fixture ou documentação pública.

## Variáveis gerais

| Variável | Obrigatória | Exemplo | Descrição |
|---|---:|---|---|
| `NODE_ENV` | Sim | `development` | Ambiente de execução. |
| `PORT` | Sim | `3000` | Porta HTTP da API. |
| `APP_BASE_URL` | Não | `http://localhost:3000` | URL base da API. |
| `CORS_ORIGINS` | Sim | `http://localhost:8080` | Origens permitidas separadas por vírgula. |
| `LOG_LEVEL` | Sim | `info` | Nível de log. |

## MongoDB

| Variável | Obrigatória | Exemplo | Descrição |
|---|---:|---|---|
| `MONGODB_URI` | Sim | `mongodb://localhost:27017` | Conexão MongoDB. |
| `MONGODB_DB_NAME` | Sim | `delfos` | Banco de configuração/metadados. |

Na Fase 1, MongoDB armazena configuração e metadados do Delfos, não payload operacional bruto de cliente.

## Segurança

| Variável | Obrigatória | Exemplo | Descrição |
|---|---:|---|---|
| `JWT_SECRET` | Sim | `change-me` | Secret forte para tokens. |
| `JWT_EXPIRES_IN` | Sim | `1h` | Expiração do access token. |
| `ENCRYPTION_KEY` | Sim | `base64-or-hex-key` | Chave para criptografar secrets. |
| `RATE_LIMIT_WINDOW_MS` | Não | `60000` | Janela de rate limit. |
| `RATE_LIMIT_MAX` | Não | `100` | Limite por janela. |

## Swagger/OpenAPI

| Variável | Obrigatória | Exemplo | Descrição |
|---|---:|---|---|
| `SWAGGER_ENABLED` | Não | `true` | Habilita Swagger em ambientes permitidos. |
| `SWAGGER_PATH` | Não | `/docs` | Caminho da documentação. |

## Checklist

- [ ] `.env.example` atualizado.
- [ ] Nenhum `.env` real versionado.
- [ ] Variáveis obrigatórias validadas.
- [ ] Logs não expõem valores sensíveis.
