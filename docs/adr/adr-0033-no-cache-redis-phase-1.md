# ADR-0033 — Sem cache/Redis na Fase 1

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1
- **Implementação**: não iniciada

---

> **Supersede:** esta ADR substitui a **ADR-0007 — No Redis cache in Phase 1**. A
> decisão permanece a mesma; este ADR é criado para registrar a decisão vigente
> em um documento próprio, conforme a regra do projeto de que decisões revistas
> ou reafirmadas geram um **novo** ADR em vez de edição in-place. A ADR-0007 fica
> `Superseded by ADR-0033`.

## Contexto

A solução de cache mais comum em Node é Redis (cache, rate limit, fila). Adotar
Redis significa mais um serviço a operar (HA, backup, monitoração), mais uma
dependência no Compose local, mais um secret a rotacionar, mais superfície de
ataque e a complexidade de invalidação distribuída.

A Fase 1 é a foundation administrativa/declarativa: não há conector real,
chamada externa, execução real de query, base de usuários ou volume de tráfego
que justifique o custo operacional de Redis. O número de instâncias do
`delfos-api` é tipicamente uma ou duas, e a latência aceita é generosa.

## Decisão

A Fase 1 **não** usa Redis, cache real, fila, worker ou scheduler.

Não existem `core/cache/`, `CacheService` ou módulo equivalente. O módulo
`execution-preview` gera demonstração em memória e não usa cache real nem
persistência analítica.

Componentes como cache compartilhado, rate limit distribuído, ETag e throttle
dedicado só voltam como desenho futuro quando houver dor real e ADR de promoção
específico.

## Alternativas consideradas

- **Redis desde a Fase 1** — descartada: custo operacional sem ganho real para o
  tráfego atual.
- **Redis opcional via feature flag** — descartada: evitar dois caminhos de
  código mantidos em paralelo; quando precisar de Redis, será explícito por ADR
  de promoção.
- **Cache em disco local (SQLite, LevelDB)** — descartada: complexidade extra sem
  benefício claro.

## Consequências

### Positivas

- Operação simples — um serviço a menos.
- Setup local trivial.
- Sem custo de infraestrutura adicional.

### Negativas / trade-offs aceitos

- Quando houver múltiplas instâncias, não haverá cache nem rate limit
  compartilhados; tolerável no volume atual.
- Sem fila/jobs assíncronos sofisticados nesta fase.

### Neutras

- Se cache for reintroduzido no futuro, a interface deverá ser definida em ADR de
  promoção próprio. Hoje **não existe** `CacheService`.

## Impacto na Fase 1

- Não criar Redis, cache em memória real, fila, worker, scheduler, `core/cache/`
  ou `CacheService` sem nova autorização.
- `execution-preview` permanece demo em memória.

## Impacto futuro / Fase 2

- Cache, BullMQ, fila, scheduler ou worker dependem de um ADR de promoção quando
  a dor aparecer (múltiplas instâncias, exportações pesadas, ingestão), conforme
  ADR-0024.

## Relação com outros documentos

- ADR-0007 — No Redis cache in Phase 1 (superseded por este ADR)
- ADR-0008 — delfos-connectors e execução de integrações
- ADR-0012 — local connectors agent e fontes on-premise
- ADR-0024 — definição de Fase 1 e Fase 2
- `docs/api-connectors.md` (conceitual/futuro)
- `docs/phase-2-vision.md`
