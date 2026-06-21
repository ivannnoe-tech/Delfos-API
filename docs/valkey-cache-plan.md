# Plano de Cache Valkey — Delfos Analytics

> Status: plano normativo de uso futuro.
> Decisão de origem: **ADR-0035** — PostgreSQL primary database + Valkey cache.
> Escopo: define **como** o Valkey será usado quando o cache for promovido
> (fase P6 do `docs/postgresql-migration-plan.md`).
>
> **Fundação implementada (fase P6).** O cache passou a existir como
> **abstração** — não como cache aplicado a endpoints ainda. O que existe:
> `CacheService` (porta) em `src/core/cache/`, com `ValkeyCacheService` (Valkey
> por trás, via `iovalkey`) selecionado por `VALKEY_URL` e `NoopCacheService`
> como **default desligado**; builder de chave `buildCacheKey` (env + tenant
> obrigatórios, §4); TTL obrigatório em todo `set`; `delByPrefix` por `SCAN`
> (nunca `KEYS *`/`FLUSH`); fallback silencioso para o banco em erro; serviço
> `valkey` no `docker-compose.yml`. **Ainda NÃO existe**: cache aplicado a
> qualquer caso de uso da §2 — cada um exige escopo explícito próprio. Aplicar o
> cache a um endpoint específico continua sendo decisão futura.

Quando este plano foi escrito, o cache não existia (ADR-0033). A fase P6
introduziu a **fundação** acima; os casos de uso da §2 permanecem como trabalho
futuro com escopo explícito.

---

## 1. Objetivo

- Valkey é a **camada de cache / cache runtime futuro** do `delfos-api`.
- Valkey é um fork open-source compatível com o protocolo Redis, sob licença
  permissiva — escolhido na ADR-0035 no lugar nominal de "Redis".
- O cache é sempre **derivável, descartável e reconstruível** a partir do
  PostgreSQL.
- Valkey **não é source of truth**: a verdade é sempre o PostgreSQL.

## 2. Casos de uso permitidos (futuros, após P6)

- **Cache de catálogos declarativos** — listas tenant-scoped de baixo churn
  (datasets, connections, query/dashboard/report definitions).
- **Cache de readiness / dry-run** — resultados de readiness sobre contratos
  declarativos já persistidos.
- **Cache de preview / demo** — resultados de demo-execute fictícios, quando o
  conteúdo for seguro (sem dado real de cliente — hoje já é fictício).
- **Cache de metadata segura** — apenas metadata sanitizada.
- **Idempotency keys (futura)** — para operações que precisem de idempotência.
- **Locks distribuídos (futura)** — coordenação leve entre instâncias.
- **Rate limit (futuro)** — rate limit compartilhado entre instâncias.
- **Sessão (futura, se aprovada)** — depende do auth real (ADR-0006); só entra
  se for decidido por ADR própria.

Cada caso acima exige escopo explícito na fase P6 ou posterior; estar listado
aqui **não** autoriza implementação.

## 3. Casos de uso proibidos

- **Source of truth** de qualquer dado.
- **Secrets, credentials, connection strings, tokens.**
- **Valores descriptografados** de qualquer natureza.
- **Auditoria permanente** — `audit_events` é permanente e fica no PostgreSQL.
- **Execution-request events permanentes** — ficam no PostgreSQL.
- **Fila / worker** sem ADR de promoção própria.
- **Dispatch real** para o `delfos-connectors` (bloqueado por ADR-0022).
- **Runtime real** sem ADR.
- **Dados cross-tenant** — nenhuma chave pode misturar tenants.
- **Dados sem TTL** — toda chave expira.
- **Payload bruto de cliente** — não existe hoje e não pode ser cacheado.

## 4. Namespace de chaves

Toda chave segue um padrão com `env` e `tenant` obrigatórios:

```text
delfos:{env}:tenant:{tenantId}:catalog:{resource}:{key}
delfos:{env}:tenant:{tenantId}:runtime:{executionRequestId}:readiness
delfos:{env}:tenant:{tenantId}:idempotency:{operation}:{key}
delfos:{env}:tenant:{tenantId}:lock:{resource}:{key}
delfos:{env}:tenant:{tenantId}:ratelimit:{scope}:{key}
```

- `{env}` — `local`, `dev`, `staging`, `prod`.
- `{tenantId}` — **obrigatório**; chaves globais sem tenant são exceção rara e
  explícita (ex.: health), nunca para dado tenant-scoped.
- O prefixo `delfos:{env}:` permite coexistência segura de ambientes e
  facilita limpeza por padrão de prefixo.

## 5. Regras operacionais

- **Tenant obrigatório na chave** — sem `tenantId`, a chave não é criada.
- **TTL obrigatório** — toda chave tem expiração; não há chave permanente.
  Default conservador (ex.: 300s) por tipo de conteúdo, ajustável por caso.
- **Invalidação documentada** — toda escrita no PostgreSQL que torne um cache
  obsoleto deve invalidar a(s) chave(s) correspondente(s); a política de
  invalidação por recurso é documentada na fase P6.
- **Sem wildcard perigoso** — proibido `KEYS *` ou `FLUSHALL`/`FLUSHDB` em
  runtime; varredura só por prefixo restrito via `SCAN`.
- **Sem secrets** — ver §3 e §6.
- **Observabilidade** — métricas de hit/miss ratio, latência, contagem de
  chaves e evicção.
- **Local dev** — serviço `valkey` no `docker-compose.yml`; o sistema deve
  subir e funcionar mesmo sem Valkey (cache desligável por flag).
- **CI** — o cache não deve ser obrigatório para os testes passarem; testes de
  cache rodam com um Valkey efêmero ou com a abstração mockada.
- **Rollback** — o uso de cache é desligável por configuração; o PostgreSQL
  permanece a fonte de verdade.
- **Fallback para DB** — se o Valkey estiver indisponível ou retornar erro, a
  aplicação consulta o PostgreSQL normalmente; cache nunca é dependência
  crítica.

## 6. Segurança

- **Não logar** valor de cache sensível; logs só com chave/metadados.
- **Não armazenar** material secreto, descriptografado ou de credencial.
- **Não armazenar** connection string real.
- **Não armazenar** tokens (de cliente, de auth ou de provider).
- **Não armazenar** payload bruto de cliente.
- Isolamento por tenant é garantido pelo namespace da chave; nenhuma leitura
  pode cruzar tenants.
- Acesso ao Valkey é autenticado e, em ambientes não-locais, com transporte
  seguro; credenciais do Valkey seguem ADR-0019 (secret de ambiente, nunca
  versionado).

## 7. O que este plano NÃO faz

- Não cria cache, `CacheService`, `core/cache/` ou serviço Valkey agora.
- Não autoriza fila, worker, scheduler ou dispatch.
- Não autoriza runtime real, conector real ou descriptografia real.
- Não altera contrato REST, rotas, controllers, services ou schemas.

## Relação com outros documentos

- `docs/adr/adr-0035-postgresql-primary-database-and-valkey-cache.md`
- `docs/postgresql-migration-plan.md` — fase P6 (Valkey Cache Foundation).
- `docs/adr/adr-0033-no-cache-redis-phase-1.md` — estado atual sem cache.
- `docs/adr/adr-0022-connector-dispatch-transport.md` — dispatch real bloqueado.
- `docs/data-access-policy.md` — política de dados e cache.
