# ADR-0007 — No Redis cache in Phase 1

- **Status**: Superseded by ADR-0033
- **Data**: 2026-04-25
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1
- **Implementação**: não iniciada

> **Superseded:** esta decisão foi substituída pela **ADR-0033 — Sem cache/Redis
> na Fase 1**, que carrega a decisão vigente. Este arquivo é mantido apenas como
> registro histórico; consulte a ADR-0033 para a decisão atual.

> Nota de status atual: decisão histórica/parcialmente deferida. Cache em memória, `core/cache/` e `CacheService` não estão implementados atualmente. Redis, cache real, fila e scheduler continuam fora do escopo atual. O módulo `execution-preview` gera demo em memória e não usa cache real.

---

## Contexto

Esta ADR foi escrita quando a Fase 1 considerava consumo direto de APIs custom de cada cliente. As ADRs 0008 e 0012 deferiram essa execução para componentes futuros, como `delfos-connectors` e eventual agente local. No estado atual não há conector real, chamada externa, cache, fila, scheduler ou execução real.

A solução de cache mais comum em ambientes Node é Redis (cache, rate limit, fila), mas Redis significa:

- mais um serviço a operar (HA, backup, monitoração)
- mais uma dependência no Compose local de dev
- mais um secret pra rotacionar
- mais uma porta de superfície de ataque
- decisão de invalidação distribuída (a complicar antes de existir base de uso real)

A Fase 1 ainda está em validação comercial. Não há base de usuários para justificar custo operacional de Redis hoje. O volume de tráfego é baixo, a latência aceita é generosa, e o número de instâncias do `delfos-api` é tipicamente uma ou duas.

---

## Decisão

A decisão vigente para o estado atual é: a Fase 1 **não** usa Redis, cache real, fila ou scheduler.

Itens como cache em memória, rate limit de conectores, ETag e throttle dedicado só devem voltar como desenho futuro quando conectores reais forem aprovados. Não há implementação atual desses componentes.

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

- Se cache for reintroduzido no futuro, a interface deverá ser definida em nova decisão ou atualização explícita desta ADR.

---

## Impacto na Fase 1 atual

- Não criar Redis.
- Não criar cache em memória real.
- Não criar fila, worker ou scheduler.
- Não criar `core/cache/`, `CacheService` ou módulo equivalente sem nova autorização.
- `execution-preview` permanece demo em memória, sem cache e sem persistência analítica.

## Impacto futuro / Fase 2

- Quando a dor aparecer (múltiplas instâncias, exportações pesadas, alertas, ingestão), criar novo ADR de promoção antes de introduzir Redis, BullMQ, cache, fila, scheduler ou worker.

---

## Referências

- `docs/api-connectors.md` (conceitual/futuro)
- ADR-0008
- ADR-0012
