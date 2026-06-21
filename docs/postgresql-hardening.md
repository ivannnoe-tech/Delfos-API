# PostgreSQL + Valkey Hardening (migração P7)

> Fase **P7** do `docs/postgresql-migration-plan.md` (ADR-0035 / ADR-0036).
> Registro de robustez/operação da migração. Complementa — não substitui —
> `docs/operations-runbook.md`, `docs/backup-restore.md`,
> `docs/observability-plan.md` e `docs/branch-protection-checklist.md`.

## 1. Observabilidade

- `GET /health` reporta:
  - `postgres`: `up | down | disabled` + `latencyMs` (probe `select 1` via Kysely).
    `disabled` quando `DELFOS_POSTGRES_URL` não está configurado.
  - `cache`: `{ enabled, hits, misses, errors }` (de `CacheService.stats()`).
    `enabled:false` = `NoopCacheService` (sem `VALKEY_URL`). `errors` conta
    falhas de backend engolidas (o cache é best-effort).
- **Hit ratio** do cache é derivável de `hits/(hits+misses)`.
- **Futuro (não nesta fase):** métricas de pool de conexão PostgreSQL
  (`total/idle/waiting`) e exportação de métricas (Prometheus/OpenTelemetry) —
  ver `docs/observability-plan.md`.

## 2. CI contra PostgreSQL + Valkey

- Os jobs `test` e `coverage` sobem serviços `postgres:16-alpine` e
  `valkey:8-alpine` e exportam `TEST_POSTGRES_URL` / `TEST_VALKEY_URL`, então os
  specs guardados (paridade de repositórios, round-trip de migrations,
  integração Valkey) **rodam em CI** — não ficam só locais.
- Job opcional `e2e-postgres` roda o E2E REST contra PostgreSQL efêmero.
- O cache/Postgres **não são obrigatórios** para o `npm test` local passar (os
  specs guardados são `describe.skip` sem as URLs); a cobertura unitária segue
  no piso sem eles.

## 3. Backup / restore

- **PostgreSQL** é a fonte de verdade → tem backup. Procedimento padrão
  `pg_dump`/`pg_restore` (lógico) ou snapshot do volume; detalhes operacionais em
  `docs/backup-restore.md`. Restaurar = aplicar dump + rodar `migrate:status`
  para conferir o estado de migrations.
- **Valkey** é cache **derivável e descartável** → **não tem backup**. Perda de
  Valkey é reconstruída a partir do PostgreSQL; nenhuma chave é permanente (TTL
  obrigatório) e nada sensível é cacheado.

## 4. Segurança de migrations

- Migrations versionadas em `src/database/postgres/migrations/`; o `Migrator`
  rastreia o aplicado em `kysely_migration`.
- O `down()` de cada migration **DROPa tabelas** — é destrutivo e existe para
  **reverter schema efêmero em teste**. **Nunca** rodar `down()` contra um banco
  com dados reais. Em produção, evolução de schema é **forward-only** e revisada;
  rollback de dados se faz por backup, não por `down()`.
- `migrate:latest` é idempotente (no-op quando já aplicado).

## 5. Rollback por fase

- Cada fase é um commit revertível no branch.
- A troca de backend (P3) é **reversível por configuração**: remover
  `DELFOS_POSTGRES_URL` faz o factory voltar ao MongoDB sem mudar código.
- O uso de cache (P6) é desligável removendo `VALKEY_URL`.
- A **única** etapa não reversível por config é a **P5 (remoção do MongoDB)** —
  por isso ela é uma decisão humana de cutover e segue **adiada**; o estado atual
  é dual-backend (MongoDB default, PostgreSQL pronto e testado).

## 6. Isolamento por tenant / RLS

- Isolamento garantido na aplicação: `tenant_id` é coluna `NOT NULL` e entra em
  **todo** `WHERE` tenant-scoped (provado pelos specs de paridade — leitura/escrita
  cross-tenant retornam vazio/`null`). FKs cross-tenant são proibidas.
- **Row-Level Security (RLS)** avaliada como defesa-em-profundidade adicional:
  **não adotada agora**. Exigiria políticas por tabela atreladas a um GUC de
  sessão (ex.: `app.tenant_id`) e disciplina de `SET` por requisição; o ganho
  sobre o isolamento já garantido na aplicação não justifica a complexidade
  operacional nesta fase. Fica registrada como opção futura.

## 7. Branch protection

- Checks obrigatórios sugeridos: `lint`, `test`, `build`, `coverage`. Os jobs
  `e2e` / `e2e-postgres` seguem opcionais (não-bloqueantes) até serem promovidos.
  Ver `docs/branch-protection-checklist.md`.

## Relação com outros documentos

- `docs/postgresql-migration-plan.md` — fase P7.
- `docs/operations-runbook.md`, `docs/backup-restore.md`,
  `docs/observability-plan.md`, `docs/branch-protection-checklist.md`.
- `docs/valkey-cache-plan.md` — política de cache.
