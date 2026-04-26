# ADR-0007 — No Redis cache in Phase 1

- **Status**: Accepted
- **Data**: 2026-04-25
- **Fase impactada**: Fase 1

---

## Contexto

A Fase 1 consome APIs custom de cada cliente (ADR-0001). APIs externas têm latência variável e quase sempre rate limit, então cache reduz latência percebida e protege a API do cliente de excesso de chamadas.

A solução de cache mais comum em ambientes Node é Redis (cache, rate limit, fila), mas Redis significa:

- mais um serviço a operar (HA, backup, monitoração)
- mais uma dependência no Compose local de dev
- mais um secret pra rotacionar
- mais uma porta de superfície de ataque
- decisão de invalidação distribuída (a complicar antes de existir base de uso real)

A Fase 1 ainda está em validação comercial. Não há base de usuários para justificar custo operacional de Redis hoje. O volume de tráfego é baixo, a latência aceita é generosa, e o número de instâncias do `delfos-api` é tipicamente uma ou duas.

---

## Decisão

A Fase 1 **não** usa Redis. Cache fica **em memória** dentro do processo Node, com TTL configurável e tamanho máximo:

- Implementação via `cache-manager` (driver `memory`) ou estrutura LRU própria simples
- Configuração: `CACHE_DRIVER=memory`, `CACHE_DEFAULT_TTL_S`, `CACHE_MAX_ITEMS` (ver `.env.example`)
- Uso primário: cache das respostas das APIs dos clientes em `data-connectors`, com chave por `(tenantId, datasetId, queryHash)`
- Suporte a **ETag** quando a API do cliente expõe — economia adicional sem ocupar memória
- Rate limit do `delfos-api` (lado consumidor das APIs dos clientes) implementado **em memória** com janela deslizante por `connectionId`
- Throttling do `delfos-api` (proteção do próprio backend contra abuso de cliente final) via `@nestjs/throttler` em memória

---

## Alternativas consideradas

- **Redis desde a Fase 1** — descartada pelo custo operacional sem ganho real para o tráfego atual
- **Redis opcional via feature flag** — descartada para evitar dois caminhos de código mantidos em paralelo. Quando precisar de Redis, será explícito (ADR de promoção)
- **Cache em disco local (SQLite, LevelDB)** — descartada pela complexidade extra sem benefício claro

---

## Consequências

### Positivas

- Operacional simples — um serviço a menos
- Setup local trivial (sem precisar subir Redis)
- Sem custo de infraestrutura adicional
- Isolamento por processo é compatível com baixa concorrência da Fase 1

### Negativas / trade-offs aceitos

- **Cache não compartilhado entre instâncias** — se rodarmos múltiplas instâncias do `delfos-api`, cada uma tem seu próprio cache. Tolerável no volume atual; eventualmente vira sinal de migração
- Cache sumir em deploy — não é problema crítico (TTL curtos, dado de cliente não fica desatualizado)
- Rate limit em memória **não** é compartilhado entre instâncias — em produção com mais de uma instância, isso pode permitir que cada instância faça `N` chamadas (multiplicando o N total). Mitigação: definir `HTTP_RATE_LIMIT_PER_MIN_DEFAULT` conservador e ficar atento a esse comportamento até migrar
- Sem fila/jobs assíncronos sofisticados — exportações grandes e relatórios pesados rodam de forma síncrona ou via processo simples; quando virar dor, voltamos a essa decisão

### Neutras

- A interface do cache no código é **agnóstica de driver** — quando virar Redis, troca-se o driver e pronto. O contrato em `core/cache/` não muda

---

## Impacto na Fase 1

- `core/cache/` provê interface única (`CacheService.get`, `set`, `del`, `wrap`) com driver `memory`
- `data-connectors/services/response-cache.service.ts` usa `CacheService` com TTL por dataset
- `@nestjs/throttler` com storage in-memory para proteger o `delfos-api` de abuso
- Headers HTTP `ETag` e `If-None-Match` propagados quando a API do cliente os expõe

## Impacto futuro / Fase 2

- Quando a dor aparecer (múltiplas instâncias, exportações pesadas, alertas, ingestão), criamos um novo ADR de promoção e introduzimos **Redis + BullMQ**
- A migração é local: trocar o driver do `CacheService` e migrar throttler para Redis. Sem refactor de feature

---

## Referências

- `.env.example` (`CACHE_*`, `THROTTLE_*`, `HTTP_RATE_LIMIT_*`)
- `docs/api-connectors.md`
- ADR-0001 (consumo via APIs)
