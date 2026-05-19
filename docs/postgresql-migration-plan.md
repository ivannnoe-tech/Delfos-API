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

### Escopo
- Resolver a subdecisão pendente **"ORM/Query Layer Decision Review"** (Kysely
  vs. Prisma vs. Drizzle) via spike curto em um módulo representativo.
- Adicionar as dependências do PostgreSQL e do ORM escolhido.
- Configurar variáveis de ambiente (`DELFOS_POSTGRES_URL` ou equivalente) com
  validação no bootstrap.
- Adicionar o serviço `postgres` ao `docker-compose.yml`.
- Adicionar um health-check de conexão PostgreSQL (sem trocar o health atual).
- Testes de conexão.

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
- ORM decidido e registrado; conexão PostgreSQL validada local + CI; MongoDB
  intacto.

---

## P2 — Schema / Migrations Foundation

### Escopo
- Criar o schema inicial PostgreSQL conforme `postgresql-data-model-draft.md`.
- Estabelecer o mecanismo de **migrations versionadas**.
- `tenant_id` obrigatório (`NOT NULL`) nas tabelas de domínio.
- Índices (prefixados por `tenant_id`), constraints e unique compostos.
- Colunas JSONB para metadata/config declarativa.
- `created_at` / `updated_at` obrigatórios; `archived_at` quando aplicável.
- Soft archive/status conforme o modelo atual.

### Fora de escopo
- Migrar dados; ligar repositories aos módulos; remover MongoDB.

### Riscos
- Schema divergir do modelo Mongoose atual — mitigado pela revisão contra
  `database-model.md` e os schemas `*.schema.ts`.

### Validações
- Migrations sobem e descem de forma limpa (up/down) em banco efêmero.
- Constraints e índices verificados por testes de schema.

### Rollback
- Migrations `down`; schema é descartável (sem dados reais ainda).

### Arquivos/módulos afetados
- Diretório de migrations; possível `src/database/` PostgreSQL.

### Critérios de conclusão
- Schema completo aplicável via migration; índices e constraints conferidos;
  MongoDB ainda é o banco em uso.

---

## P3 — Repository Port Migration

Migração **módulo a módulo**. Para cada módulo: criar o repository PostgreSQL,
manter o contrato do repository, validar paridade por testes, e só então passar
ao próximo. O service/controller/DTO não muda; muda a implementação do
repository.

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

### Escopo
- Adicionar o serviço `valkey` ao `docker-compose.yml`.
- Configurar variáveis de ambiente do Valkey com validação no bootstrap.
- Criar uma **abstração de cache** (`CacheService` / port), com Valkey atrás.
- **TTL obrigatório** em toda chave.
- **Namespace por tenant** nas chaves (ver `valkey-cache-plan.md`).
- Política de invalidação documentada.
- Fallback para PostgreSQL quando o cache falhar.

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
| P1 | PostgreSQL Infrastructure Foundation | futura |
| P2 | Schema / Migrations Foundation | futura |
| P3 | Repository Port Migration | futura |
| P4 | Seed and E2E Migration | futura |
| P5 | Mongo / Mongoose Removal | futura |
| P6 | Valkey Cache Foundation | futura |
| P7 | Hardening | futura |

## Relação com outros documentos

- `docs/adr/adr-0035-postgresql-primary-database-and-valkey-cache.md`
- `docs/postgresql-data-model-draft.md`
- `docs/valkey-cache-plan.md`
- `docs/database-model.md` — modelo MongoDB atual.
- `docs/adr/adr-0024-phase-1-and-phase-2-definition.md` — gates de fase.
- ADR-0021 / ADR-0022 — gates de execução/dispatch real (não afetados).
