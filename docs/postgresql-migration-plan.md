# Plano de Migração PostgreSQL — Delfos Analytics

> Status: plano normativo, faseado.
> Decisão de origem: **ADR-0035** — PostgreSQL primary database + Valkey cache.
> Escopo: migração do banco do `delfos-api` de MongoDB/Mongoose para PostgreSQL,
> com Valkey como camada de cache futura.

Este documento descreve **como** a decisão da ADR-0035 será executada, em fases.
Ele **não autoriza** implementação: cada fase de P1 em diante exige escopo
explícito e, quando indicado, ADR própria. A fase atual concluída é a **P0**.

---

## Princípios da migração

- Migração **incremental e reversível**, fase a fase, módulo a módulo.
- O **contrato REST não muda** em nenhuma fase; `delfos-web` não é afetado.
- MongoDB continua sendo o banco real até a fase de remoção (P5).
- Cada fase tem critérios de conclusão objetivos e plano de rollback.
- Nenhum runtime real, dispatch real ou descriptografia real é habilitado —
  ADR-0021 e ADR-0022 continuam bloqueantes.
- Valkey só entra como cache (P6), nunca como source of truth, fila ou worker.

---

## P0 — ADR / docs only

**Status: concluída.**

### Escopo
- Decisão arquitetural registrada na ADR-0035.
- Índice de ADRs atualizado.
- Este plano de migração, o modelo relacional draft e o plano Valkey criados.
- Docs de alto nível atualizadas com nota forward-looking.

### Fora de escopo
- Qualquer código funcional, dependência, schema PostgreSQL ou runtime.

### Riscos
- Documentação dar a impressão de que a migração já ocorreu — mitigado por
  notas explícitas de estado vigente.

### Validações
- `npm run lint`, `npm test`, `npm run build` (docs-only não deve quebrá-los).
- Revisão humana das ADRs e docs.

### Rollback
- Reverter os commits de documentação.

### Arquivos/módulos afetados
- `docs/adr/adr-0035-*.md`, `docs/adr/README.md`,
  `docs/postgresql-migration-plan.md`, `docs/postgresql-data-model-draft.md`,
  `docs/valkey-cache-plan.md`, docs de alto nível do `delfos-api`.

### Critérios de conclusão
- ADR-0035 `Accepted`; índice atualizado; três documentos de plano criados;
  validações docs-only verdes.

---

## P1 — PostgreSQL Infrastructure Foundation

> **Infra concluída (resta CI).** Subdecisão de ORM **resolvida**: **Kysely**
> (ADR-0036), via spike comparativo runnable (Kysely 43 / Drizzle 42 / Prisma 37
> em PostgreSQL real, módulo `tenants`+`users`). Dependências, env, serviço Docker,
> conexão Kysely e health-check entregues e testados (436 testes verdes, conexão
> real validada). Pendência: serviço `postgres` no pipeline de CI (será fechada
> junto com a P4, que move o E2E para PostgreSQL).

### Escopo
- ~~Resolver a subdecisão pendente **"ORM/Query Layer Decision Review"**~~ —
  **CONCLUÍDO**: spike comparativo runnable resolveu para **Kysely** (ADR-0036).
- ~~Adicionar as dependências do PostgreSQL e do ORM escolhido~~ — **CONCLUÍDO**:
  `kysely` + `pg` (deps), `kysely-codegen` + `@types/pg` (devDeps).
- ~~Configurar `DELFOS_POSTGRES_URL` com validação no bootstrap~~ — **CONCLUÍDO**:
  variável **opcional**, validada em `src/config/environment.ts`.
- ~~Adicionar o serviço `postgres` ao `docker-compose.yml`~~ — **CONCLUÍDO**
  (`postgres:16-alpine`, coexiste com `mongo`, com healthcheck).
- ~~Health-check de conexão PostgreSQL (sem trocar o health atual)~~ —
  **CONCLUÍDO**: `src/database/postgres/` (módulo global, provider Kysely,
  `PostgresHealthService`); `/health` ganha o campo `postgres` (up/down/disabled).
- ~~Testes de conexão~~ — **CONCLUÍDO**: unit (DummyDriver) + teste de conexão
  real guardado por `TEST_POSTGRES_URL` (validado contra PostgreSQL 16 em Docker).

### Fora de escopo
- Criar schema de domínio, migrations de tabela ou repositories PostgreSQL.
- Remover MongoDB ou qualquer dependência Mongoose.

### Riscos
- Escolher mal o ORM e pagar retrabalho — mitigado pelo spike.
- Conflito de configuração entre os dois bancos coexistindo.

### Validações
- Conexão PostgreSQL sobe local e no CI; health-check responde.
- `lint`, `test`, `build` verdes; MongoDB segue funcional.

### Rollback
- Remover dependências, serviço Compose e config PostgreSQL; nenhum dado real
  foi tocado.

### Arquivos/módulos afetados
- `package.json`, `docker-compose.yml`, `.env.example`, `src/config/`,
  `src/modules/health/`.

### Critérios de conclusão
- ORM decidido e registrado **(ok — Kysely, ADR-0036)**; conexão PostgreSQL
  validada local **(ok)** + CI **(pendente — fecha com a P4)**; MongoDB intacto
  **(ok)**.

---

## P2 — Schema / Migrations Foundation

> **Concluída.** Schema das 13 tabelas criado como **migrations versionadas
> Kysely** (5 arquivos `0001`–`0005` em `src/database/postgres/migrations/`),
> com `up`/`down` validados contra PostgreSQL 16 real (sobe as 13 tabelas e
> reverte a zero, idempotente). Tipos `DB` gerados por `kysely-codegen` a partir
> do schema migrado. Subdecisões abertas resolvidas no `postgresql-data-model-draft.md`
> §4 (UUID v4; semantic subdocs → JSONB; política de FK real × lógica).

### Escopo
- ~~Criar o schema inicial PostgreSQL conforme `postgresql-data-model-draft.md`~~
  — **CONCLUÍDO** (13 tabelas, fiel ao modelo Mongoose atual).
- ~~Mecanismo de **migrations versionadas**~~ — **CONCLUÍDO**: Kysely `Migrator`
  com `FileMigrationProvider` (`migrator.ts`), CLI `scripts/migrate.ts`
  (`migrate:latest`/`down`/`status`).
- ~~`tenant_id NOT NULL` + FK → tenants em toda tabela tenant-scoped~~ — **OK**
  (17 FKs reais; refs declarativas opcionais ficam lógicas, ver §4 do draft).
- ~~Índices prefixados por `tenant_id`, constraints e unique compostos~~ — **OK**.
- ~~Colunas JSONB para metadata/config declarativa~~ — **OK** (inclui measures/
  dimensions/glossaryTerms como JSONB, decisão P2).
- ~~`created_at`/`updated_at`~~ — **OK** (`execution_request_events` e `audit_logs`
  só `created_at`, fiel ao modelo). Soft archive via coluna `status`.

### Fora de escopo
- Migrar dados; ligar repositories aos módulos; remover MongoDB.

### Riscos
- Schema divergir do modelo Mongoose atual — mitigado pela revisão contra
  `database-model.md` e os schemas `*.schema.ts`.

### Validações
- ~~Migrations sobem e descem limpas (up/down) em banco efêmero~~ — **OK**
  (`src/database/postgres/tests/migrations.spec.ts`, guardado por
  `TEST_POSTGRES_URL`, contra PostgreSQL 16 em Docker).
- ~~Constraints e índices verificados~~ — **OK** (FKs/uniques conferidos no schema vivo).
- `format:check`, `lint`, `build`, `test` verdes; cobertura acima do piso
  (migrations/migrator ficam fora do piso de cobertura unitária — são cobertos
  pelo spec de integração com Postgres real).

### Rollback
- Migrations `down`; schema é descartável (sem dados reais ainda).

### Arquivos/módulos afetados
- `src/database/postgres/migrations/0001`–`0005`, `migrator.ts`,
  `scripts/migrate.ts`, `database.types.ts` (codegen), `package.json` (scripts),
  `jest.config.js` (exclusão de cobertura das migrations).

### Critérios de conclusão
- **OK**: schema completo aplicável via migration; índices e constraints
  conferidos; tipos `DB` gerados; MongoDB ainda é o banco em uso.

---

## P3 — Repository Port Migration

> **Concluída.** Os 12 repositórios foram portados para o padrão **dual-backend**:
> um contrato abstrato por repositório retornando um **record persistence-neutral**,
> com `Mongo*Repository` (lógica Mongoose atual) e `Postgres*Repository` (Kysely),
> selecionados em runtime por um factory no módulo conforme `DELFOS_POSTGRES_URL`.
> O service mapeia record→DTO, então **o contrato REST é idêntico** nos dois
> backends. MongoDB segue o default até a P5.
>
> Verificação: **550 testes verdes contra PostgreSQL 16 real** (specs de paridade
> de todos os módulos + migrations) e **E2E 17/17 no caminho MongoDB** (sem
> regressão). format/lint/build verdes; cobertura 87.9/71.6/83.1/88.1 acima do piso.
>
> Notas de implementação:
> - Decorator compartilhado **`@IsEntityId`** (aceita ObjectId **ou** UUID) substitui
>   `@IsMongoId` em todos os controllers/DTOs — mantém a validação estável na
>   transição de formato de id.
> - Repos PostgreSQL: `tenant_id` em todo `WHERE`; JSONB via `JSON.stringify`
>   (lido de volta como objeto); ids não-UUID retornam não-encontrado (404, não 500);
>   `updated_at` atualizado via `sql\`now()\``.
> - Harness de teste `pg-test-db.ts`: um banco efêmero isolado por spec, migrado,
>   para specs de paridade rodarem concorrentes sem corrida.

Migração **módulo a módulo**. Para cada módulo: criar o repository PostgreSQL,
manter o contrato do repository, validar paridade por testes, e só então passar
ao próximo. O service/controller/DTO muda o **mínimo** (passa a consumir o record
neutro); o contrato REST não muda.

Ordem sugerida (de menor para maior acoplamento):

1. `tenants`
2. `users`
3. `connections`
4. `credentials`
5. `datasets`
6. `field_mappings`
7. `query_definitions`
8. `dashboard_definitions`
9. `report_definitions`
10. `semantic_models`
11. runtime `execution_requests` / `execution_request_events`
12. `audit`

### Escopo
- Repository PostgreSQL por módulo, atrás da mesma interface de repository.
- Testes de paridade entre o repository Mongoose e o PostgreSQL.
- Mapeamento fiel: `ObjectId` → UUID, subdocumentos → JSONB ou tabelas-filhas
  conforme o data-model draft.

### Fora de escopo
- Alterar controllers, services, DTOs, rotas ou o contrato REST.
- Remover schemas Mongoose (só em P5).
- Alterar o `AppModule` além do necessário para selecionar o repository por
  módulo já migrado.

### Riscos
- Divergência de comportamento entre os dois repositories.
- Quebra de contrato REST por mapeamento infiel.
- Período de convivência dos dois bancos.

### Validações
- Testes unitários e de integração de cada módulo verdes nos dois repositories.
- E2E mantido verde a cada módulo migrado.

### Rollback
- Reverter o repository de um módulo para a implementação Mongoose; os módulos
  são independentes.

### Arquivos/módulos afetados
- `src/modules/<n>/repositories/` de cada módulo; wiring no módulo.

### Critérios de conclusão
- Todos os módulos com repository PostgreSQL e paridade validada; contrato REST
  inalterado.

---

## P4 — Seed and E2E Migration

> **Concluída.** Três entregas:
> 1. **E2E em PostgreSQL** — `startE2EApp` provisiona um banco efêmero
>    (`provisionEphemeralDb`, helper compartilhado com o `pg-test-db.ts` das
>    specs de paridade), migra para latest, semeia o tenant de isolamento e
>    define `DELFOS_POSTGRES_URL` **antes** do `import('app.module')` para que os
>    factories escolham os repos PostgreSQL. As **mesmas 5 specs** passam nos dois
>    backends (Mongo via `npm run test:e2e`; Postgres via
>    `npm run test:e2e:postgres`), provando paridade do contrato REST. O AppModule
>    ainda sobe o Mongo em memória (MongooseModule fica até a P5).
> 2. **Seed em PostgreSQL** — `seed:dev` ramifica por backend: com
>    `DELFOS_POSTGRES_URL` configurado, semeia o PostgreSQL via `KYSELY_DB`
>    (`scripts/seed-dev-postgres.ts`) com upserts `onConflict(...).doUpdateSet(...)`
>    nas **mesmas chaves estáveis** do seed Mongo; reuso das shapes de
>    `seed-dev-data.ts`. Mesmo conjunto fictício, idempotente e re-executável.
>    Sem `DELFOS_POSTGRES_URL`, o caminho Mongo segue inalterado.
> - **Encoding de id no E2E:** `tenantId`/`actorId` são ObjectId (Mongo) ou UUID
>   (Postgres) conforme o backend — o formato muda, o contrato REST não. No
>   caminho Postgres o harness semeia a linha `tenants` com o UUID fixo do
>   `E2E_TENANT_ID` para satisfazer a FK `tenant_id → tenants(id)`.
> - **CI:** `test` e `coverage` ganharam um serviço `postgres:16-alpine`
>   health-checked + `TEST_POSTGRES_URL`, então as specs de paridade e o
>   round-trip de migrations passam a **rodar** no CI (antes pulavam). Novo job
>   opcional `e2e-postgres` (espelha o `e2e`) roda `npm run test:e2e:postgres`.
>
> Verificação: `format:check`/`lint`/`build` verdes; `npm test` (sem env) 439
> testes (15 suites de paridade puladas); suíte completa contra PostgreSQL real
> **76 suites / 550 testes verdes**; E2E Mongo e E2E Postgres **5 suites / 17
> testes** cada; seed Postgres idempotente (contagens estáveis na 2ª execução).
> Cobertura 87.9/71.6/83.1/88.1 acima do piso.

### Escopo
- `npm run seed:dev` passa a popular PostgreSQL com dados fictícios.
- E2E (`test:e2e`) passa a usar PostgreSQL efêmero (container ou embedded) no
  lugar de `mongodb-memory-server`.
- Atualizar fixtures e o pipeline de CI (serviço PostgreSQL).
- Documentar e exercitar o rollback do ambiente de teste.

### Fora de escopo
- Remover MongoDB de produção/dev (só em P5).

### Riscos
- Regressão de testes ao trocar o backend de teste.
- CI mais lento por subir um serviço adicional.

### Validações
- `test`, `test:e2e` e o E2E de CI verdes contra PostgreSQL.
- Seed PostgreSQL gera o mesmo conjunto fictício esperado.

### Rollback
- Manter `mongodb-memory-server` disponível até P4 estar estável.

### Arquivos/módulos afetados
- `scripts/` de seed, `jest.e2e.config.js`, fixtures de teste, workflows de CI.

### Critérios de conclusão
- Seed e E2E rodam em PostgreSQL; CI verde; paridade funcional confirmada.

---

## P5 — Mongo / Mongoose Removal

### Escopo
- Remover os schemas Mongoose (`src/modules/<n>/schemas/*.schema.ts`).
- Remover `MongooseModule` e a config Mongo do `AppModule`/`src/config/`.
- Remover `mongodb-memory-server` e dependências Mongo do `package.json`.
- Remover o serviço `mongo` do `docker-compose.yml` e as variáveis Mongo do
  `.env.example`.
- Atualizar a documentação (incluindo `database-model.md`) para refletir
  PostgreSQL como banco único.
- Promover a **ADR-0005** a `Superseded by ADR-0035`.

### Fora de escopo
- Qualquer novo recurso; esta fase é só remoção.

### Riscos
- Remover algo ainda referenciado — mitigado por P3/P4 concluídas e CI verde.

### Validações
- `lint`, `test`, `test:e2e`, `build` verdes sem nenhuma dependência Mongo.
- Busca por `mongoose`/`mongodb` no código retorna apenas histórico em docs.

### Rollback
- Reverter o commit de remoção; só fazer P5 após P3/P4 estáveis.

### Arquivos/módulos afetados
- Schemas de todos os módulos, `AppModule`, `src/config/`, `package.json`,
  `docker-compose.yml`, `.env.example`, docs, `docs/adr/adr-0005-*.md`.

### Critérios de conclusão
- Zero dependência de MongoDB; PostgreSQL é o banco único; ADR-0005 superseded.

---

## P6 — Valkey Cache Foundation

> **Concluída (fundação).** Abstração de cache implementada em `src/core/cache/`;
> **não** há cache aplicado a endpoints ainda (cada caso de uso da §2 do
> `valkey-cache-plan.md` exige escopo próprio). Cache **desligado por default**
> (NoopCacheService); habilita Valkey quando `VALKEY_URL` é configurado.
> Verificado contra Valkey 8 real em Docker.

### Escopo
- ~~Adicionar o serviço `valkey` ao `docker-compose.yml`~~ — **OK**
  (`valkey/valkey:8-alpine`, healthcheck).
- ~~Variáveis de ambiente do Valkey com validação no bootstrap~~ — **OK**
  (`VALKEY_URL` opcional, validada em `environment.ts`).
- ~~Abstração de cache (`CacheService` / port), com Valkey atrás~~ — **OK**
  (`CacheService` abstrato; `ValkeyCacheService` via `iovalkey`;
  `NoopCacheService` default desligado; factory por config no `CacheModule`).
- ~~**TTL obrigatório** em toda chave~~ — **OK** (`set` rejeita TTL ≤ 0).
- ~~**Namespace por tenant** nas chaves~~ — **OK** (`buildCacheKey`: env + tenant
  obrigatórios; sem chave cross-tenant; `delByPrefix` por `SCAN`, nunca `KEYS *`).
- Política de invalidação documentada — **parcial**: o mecanismo (`delByPrefix`
  por tenant/namespace) existe; a política por recurso será fechada ao aplicar o
  cache a cada caso de uso.
- ~~Fallback para o banco quando o cache falhar~~ — **OK** (erros do backend são
  engolidos: `get`→miss, `set`/`del`→no-op; cache nunca é dependência crítica).

### Fora de escopo
- Fila, worker, dispatch, scheduler — exigem ADR de promoção própria.
- Cache de secrets ou de qualquer dado proibido (ver `valkey-cache-plan.md`).

### Riscos
- Cache servir dado obsoleto ou cross-tenant — mitigado por TTL e namespace.
- Cache virar dependência crítica — mitigado pelo fallback ao banco.

### Validações
- Cache hit/miss e invalidação cobertos por testes.
- Sistema funciona com o Valkey indisponível (fallback).

### Rollback
- Desligar o uso de cache via flag de configuração; o banco continua sendo a
  fonte de verdade.

### Arquivos/módulos afetados
- `docker-compose.yml`, `.env.example`, `src/config/`, `src/core/cache/` (novo).

### Critérios de conclusão
- Cache opcional, com TTL, namespace por tenant e fallback; nenhum dado
  proibido em cache.

---

## P7 — Hardening

### Escopo
- CI completo (lint/test/build/E2E) estável contra PostgreSQL + Valkey.
- Revisão de branch protection.
- Observabilidade: métricas de pool de conexão, cache hit ratio, latência.
- Performance: revisão de índices, planos de query, N+1.
- Backups e estratégia de restore do PostgreSQL.
- Segurança de migrations (revisão de migrations destrutivas).
- Rollback drills documentados e exercitados.
- Avaliar Row-Level Security (RLS) como defesa adicional de tenant.

### Fora de escopo
- Novos recursos de produto; runtime real; dispatch real.

### Riscos
- Hardening tardio deixar lacunas operacionais — mitigado por checklist.

### Validações
- CI verde; backup/restore testado; drill de rollback executado.

### Rollback
- N/A — fase de robustez, sem mudança funcional reversível única.

### Arquivos/módulos afetados
- Workflows de CI, `docs/operations-runbook.md`, `docs/backup-restore.md`,
  `docs/branch-protection-checklist.md`.

### Critérios de conclusão
- Operação PostgreSQL + Valkey observável, com backup/restore e rollback
  validados.

---

## Resumo das fases

| Fase | Tema | Estado |
|---|---|---|
| P0 | ADR / docs only | concluída |
| P1 | PostgreSQL Infrastructure Foundation | concluída (serviço PG no CI fechado na P4) |
| P2 | Schema / Migrations Foundation | concluída |
| P3 | Repository Port Migration | concluída (12 módulos, dual-backend) |
| P4 | Seed and E2E Migration | concluída (seed + E2E em PostgreSQL; CI com serviço PG) |
| P5 | Mongo / Mongoose Removal | futura |
| P6 | Valkey Cache Foundation | concluída (fundação — cache não aplicado a endpoints ainda) |
| P7 | Hardening | futura |

## Relação com outros documentos

- `docs/adr/adr-0035-postgresql-primary-database-and-valkey-cache.md`
- `docs/postgresql-data-model-draft.md`
- `docs/valkey-cache-plan.md`
- `docs/database-model.md` — modelo MongoDB atual.
- `docs/adr/adr-0024-phase-1-and-phase-2-definition.md` — gates de fase.
- ADR-0021 / ADR-0022 — gates de execução/dispatch real (não afetados).
