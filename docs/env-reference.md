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
| `CORS_ORIGIN` | Nao | `http://localhost:5173,http://localhost:8080,http://localhost:3000,http://127.0.0.1:4174,http://localhost:4174` | Origens permitidas separadas por virgula (whitelist exata, sem coringa). Quando omitida, CORS fica desabilitado. Cada origem e exata: protocolo + host + porta, e `localhost` **nao** equivale a `127.0.0.1`. A porta `4174` cobre o servidor estatico do E2E integrado do `delfos-web`. |
| `LOG_LEVEL` | Sim | `info` | Nivel de log. |

## MongoDB

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `DELFOS_DATABASE_URL` | Sim | `mongodb://localhost:27017/delfos` | URL completa do MongoDB de configuracao/metadados. |

Na Fase 1, MongoDB armazena configuracao e metadados do Delfos, nao payload operacional bruto de cliente. `DELFOS_DATABASE_URL` continua sendo a URL do banco **operacional** ate a fase P5 da migracao (remocao do Mongo).

## PostgreSQL (migracao ADR-0035 / ADR-0036)

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `DELFOS_POSTGRES_URL` | Nao (P1) | `postgresql://delfos:delfos@localhost:5432/delfos` | URL do PostgreSQL, banco primario futuro. **Opcional** durante a migracao: se ausente, a API roda 100% em MongoDB e o health-check de Postgres reporta `disabled`; se presente, a conexao Kysely sobe e `/health` reporta o status do Postgres. Validada no bootstrap (deve comecar com `postgres://` ou `postgresql://`). |

> **Estado da migracao (P1 em andamento)**: o ORM escolhido e **Kysely** (ADR-0036).
> A fase P1 adiciona a conexao e o health-check de Postgres; o schema/migrations
> vem na P2 e a troca de repositorios na P3. Ate la, MongoDB continua sendo o
> banco operacional. A config do **Valkey** so e adicionada na fase P6 e **nao
> existe hoje**. Plano completo: `docs/postgresql-migration-plan.md`.

## Valkey (cache — ADR-0035 / P6)

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `VALKEY_URL` | Nao | `redis://localhost:6379` | URL do Valkey (cache). **Opcional**: se ausente, o cache fica **desligado** (no-op) e tudo vem do banco; se presente, habilita o `CacheService` com Valkey. Aceita `valkey://`, `redis://` ou `rediss://`. Toda chave tem TTL e namespace por tenant; nunca armazena secret/credencial/token. |

## Seguranca

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `DELFOS_ADMIN_KEY` | Sim | `change-me-local-admin-key-at-least-32-chars` | Chave temporaria da foundation para endpoints administrativos. Nao substitui autenticacao final. |
| `ENCRYPTION_KEY_BASE64` | Sim | `MDEy...YmY=` | Chave base64 que deve decodificar para 32 bytes e criptografar secrets locais da foundation. |
| `JWT_ACCESS_SECRET` | Futuro | `change-me-access-secret` | Secret forte para access tokens quando o auth final for implementado. |
| `JWT_REFRESH_SECRET` | Futuro | `change-me-refresh-secret` | Secret forte para refresh tokens quando o auth final for implementado. |
| `JWT_ACCESS_TTL` | Futuro | `15m` | TTL planejado do access token. |
| `JWT_REFRESH_TTL` | Futuro | `7d` | TTL planejado do refresh token. |

`ENCRYPTION_KEY_BASE64` e uma **chave unica por ambiente** na Fase 1 (decisao ADR-0019). E um
secret de ambiente: **nunca** versionada, sempre via secret manager ou pipeline seguro. Sua
rotacao operacional e procedimento controlado em `docs/operations-runbook.md`. Chave por tenant,
envelope encryption por tenant e KMS/Vault sao evolucao futura e dependem de ADR propria.

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

## LLM / analytics_text_generation (futuras/conceituais)

As variaveis abaixo sao **futuras/conceituais**: nao existem no codigo atual, nao sao consumidas
pelo bootstrap e **nao devem** receber secrets reais agora. Documentadas para a capability
assistiva `analytics_text_generation` (ver ADR-0025). A capability nasce **desligada por padrao**.

| Variavel | Obrigatoria | Exemplo | Descricao |
|---|---:|---|---|
| `LLM_ANALYTICS_ENABLED` | Futuro | `false` | Liga/desliga a capability assistiva de geracao textual analitica. Default `false`. |
| `LLM_ANALYTICS_PROVIDER` | Futuro | `openai` | Provider de LLM configuravel por ambiente, nunca hardcoded. |
| `LLM_ANALYTICS_MODEL` | Futuro | `gpt-4o-mini` | Modelo inicial recomendado, configuravel por ambiente. |
| `LLM_ANALYTICS_MAX_INPUT_TOKENS` | Futuro | `4000` | Limite planejado de tokens de entrada por chamada (controle de custo). |
| `LLM_ANALYTICS_MAX_OUTPUT_TOKENS` | Futuro | `800` | Limite planejado de tokens de saida por chamada (controle de custo). |
| `LLM_ANALYTICS_TIMEOUT_MS` | Futuro | `15000` | Timeout planejado por chamada ao provider de LLM. |

A eventual chave de API do provider de LLM e um **secret futuro** e segue ADR-0019/ADR-0020:
nunca hardcoded, nunca em log, nunca em documentacao. Integracao real nao autorizada por esta
referencia — ver ADR-0025.

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
