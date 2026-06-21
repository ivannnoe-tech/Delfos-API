# Plano de Cutover P5 — Remoção do MongoDB / Mongoose

> **Status: Proposto — aguardando go-ahead humano explícito.**
> P5 é o **gate de cutover humano** da migração ADR-0035. Remove o MongoDB
> em definitivo e torna o PostgreSQL o banco único. É **irreversível** a não
> ser por `git revert`. Este documento é o plano de execução; **nenhum código
> foi alterado**. Só executar mediante autorização explícita.

- **ADR base**: [ADR-0035](adr/adr-0035-postgresql-primary-database-and-valkey-cache.md)
  (PostgreSQL primary + Valkey), [ADR-0036](adr/adr-0036-orm-query-layer-kysely.md) (ORM = Kysely).
- **Plano-mãe**: [postgresql-migration-plan.md](postgresql-migration-plan.md) §P5.
- **Inventário-fonte**: recon read-only de 2026-06-21 (estado dual-backend atual).
- **Gates fora de escopo**: ADR-0021 (descriptografia) e ADR-0022 (dispatch)
  permanecem `Proposed` e **intocados** — P5 não os altera.

---

## 1. Pré-requisitos (bloqueiam o início)

| Pré-requisito | Estado em 2026-06-21 | Ação |
|---|---|---|
| P1–P4 concluídas e estáveis | OK (commitadas, suíte 565/565, e2e 17/17 em Mongo+PG) | — |
| Branch `feat/postgresql-migration-p1-p7` **mergeada em `main`** | **Pendente** — pushada, 20 commits à frente, **sem PR** | Abrir PR e mergear **antes** de iniciar P5 |
| Cobertura acima do piso, CI verde | OK | Reconfirmar pós-merge |
| Go-ahead humano explícito para o cutover | **Pendente** | Obrigatório |

> P5 **não** deve começar sobre a branch P1-P7 não mergeada — começar de `main`
> já com PostgreSQL como dual-backend testado.

---

## 2. Inventário de remoção (exato)

### 2.1 Dependências — `package.json`
Remover 3 linhas:
- `"@nestjs/mongoose": "^11.0.0"`
- `"mongoose": "^8.0.0"`
- `"mongodb-memory-server": "^11.1.0"` (devDependencies)

### 2.2 Wiring do AppModule e config
- `src/app.module.ts` — remover `import { MongooseModule }` e o bloco
  `MongooseModule.forRootAsync({ ... createMongooseOptions })`.
- `src/config/mongoose.config.ts` — **deletar arquivo**.
- `src/config/app-config.service.ts` — remover getter `databaseUrl`
  (Mongo); manter `postgresUrl`, agora obrigatório (ver §3).
- `src/config/environment.ts` — remover `DELFOS_DATABASE_URL` (campos de tipo,
  `readRequiredString`, e do retorno); promover `DELFOS_POSTGRES_URL` a
  obrigatório.

### 2.3 Factories dual-backend — 12 módulos `.module.ts`
Em cada um: remover `MongooseModule.forFeature([...])` e o provider-factory
condicional `config.postgresUrl ? postgres : mongo`; deixar **só** o provider
PostgreSQL ligado direto à interface do repositório.

```
tenants, users, connections, credentials, datasets, field-mappings,
query-definitions, dashboard-definitions, report-definitions,
semantic-models, runtime, audit
```

### 2.4 Repositórios Mongo — 13 arquivos (deletar)
`src/modules/*/repositories/mongo-*.repository.ts` — confirmado 13 arquivos
(runtime tem 2: `execution-requests` + `execution-request-events`).
Os 13 `postgres-*.repository.ts` permanecem e viram a única implementação.

### 2.5 Schemas Mongoose — 13 arquivos (deletar)
`src/modules/*/schemas/*.schema.ts` — confirmado 13. Elimina todo
`@Schema`/`@Prop`/`SchemaFactory` e o acoplamento a `Types.ObjectId` /
`HydratedDocument`.

### 2.6 Seed e E2E
- `scripts/seed-dev.ts` — remover o ramo dual; manter só
  `seedDevFoundationPostgres`. Deletar `seedDevFoundation` e `getSeedModels`
  (`getModelToken`). Remover imports Mongo.
- `test/e2e/support/e2e-app.ts` — remover `import { MongoMemoryServer }` e a
  lógica Mongo-in-memory; PostgreSQL efêmero vira o caminho único.
- `jest.e2e.config.js` — atualizar comentário (cosmético).

### 2.7 Infra local e env
- `docker-compose.yml` — remover serviço `mongo` (linhas ~2–11), o volume
  `delfos_mongo_data` (~52) e comentários que citam "até a P5".
- `.env.example` — remover `DELFOS_DATABASE_URL=mongodb://...` e ajustar o
  comentário de `DELFOS_POSTGRES_URL` (deixa de ser "opcional nesta fase").

### 2.8 Validação de ID — `@IsEntityId`
**Sem mudança funcional.** O decorator já aceita ObjectId **ou** UUID;
contrato REST estável. O ramo `isMongoId` vira dead-code inofensivo —
simplificação para UUID-only é **follow-up opcional pós-P5**, não bloqueia.

---

## 3. Decisão de config (resolvida para a execução)

- Var única de banco passa a ser **`DELFOS_POSTGRES_URL`** (obrigatória).
  `DELFOS_DATABASE_URL` é removida.
- `AppConfigService`: remover `databaseUrl`; manter `postgresUrl`.
- **Follow-up opcional** (não-bloqueante): renomear `postgresUrl` →
  `databaseUrl` e a var para `DELFOS_DATABASE_URL` por clareza, num commit
  separado. Mantido fora de P5 p/ não inflar o diff de remoção.

---

## 4. ADR-0005 — supersessão
- `docs/adr/adr-0005-mongodb-as-config-store.md`: `Status: Accepted`
  → `Status: Superseded by ADR-0035`.
- Adicionar seção "Superseded" com data e referência à conclusão de P5.
- ADR-0035 já documenta a transição — **não** mexer nela.

---

## 5. Docs a atualizar
- `docs/postgresql-migration-plan.md` — marcar P5 `concluída`; remover ressalvas
  "até a P5" (linhas ~18, 172, 216, 252, 282).
- `docs/database-model.md` — PostgreSQL como banco único.
- `README.md` / `CLAUDE.md` / `AGENTS.md` — remover MongoDB como default;
  PostgreSQL passa a ser o backend único (ajustar comandos `docker compose`).
- `docs/foundation-stability-checkpoint.md` — refletir backend único.

---

## 6. Sequência de execução (ordem segura)
Branch nova a partir de `main` (pós-merge P1-P7): `feat/postgresql-p5-mongo-removal`.

1. `app.module.ts` + 12 factories → só PostgreSQL (build quebra até passo 2 ok).
2. Deletar 13 mongo-repos + 13 schemas.
3. `package.json` (remover 3 deps) + `npm install`.
4. `config/` (mongoose.config.ts, app-config.service.ts, environment.ts).
5. `seed-dev.ts` + `e2e-app.ts` + `jest.e2e.config.js`.
6. `docker-compose.yml` + `.env.example`.
7. Docs + ADR-0005.
8. Rodar verificação (§7); commitar por blocos lógicos (Conventional Commits).

---

## 7. Checklist de verificação (pós-cutover)
- [ ] `npm run format:check` verde
- [ ] `npm run lint` verde
- [ ] `npm test` verde (specs Mongo removidos)
- [ ] `npm run build` verde, sem imports não resolvidos
- [ ] `npm run test:e2e` verde (PostgreSQL como caminho único)
- [ ] `grep -rE "mongoose|mongodb|@nestjs/mongoose" src/ scripts/ test/` → zero
      (só histórico em docs)
- [ ] `.env.example` sem var Mongo; `DELFOS_POSTGRES_URL` obrigatória
- [ ] `docker-compose.yml` sem serviço `mongo` nem volume
- [ ] ADR-0005 = `Superseded by ADR-0035`
- [ ] Gates ADR-0021/0022 inalterados (`Proposed`)

---

## 8. Rollback
- Reverter o commit (ou a faixa de commits) de remoção; o dual-backend volta
  intacto. Por isso P5 deve ser uma **branch isolada e atômica**, fácil de
  reverter, e só após P1-P4 estáveis em `main`.

---

## 9. Resumo quantitativo

| Categoria | Qtd | Ação |
|---|---|---|
| Deps em `package.json` | 3 | remover |
| Wiring AppModule/config | 4 arquivos | editar/deletar |
| Factories dual-backend | 12 módulos | só PostgreSQL |
| Repos Mongo | 13 arquivos | deletar |
| Schemas Mongoose | 13 arquivos | deletar |
| Seed + E2E + jest config | 3 arquivos | tirar ramo Mongo |
| Infra (compose + env) | 2 arquivos | tirar Mongo |
| `@IsEntityId` | 0 | sem mudança (follow-up opcional) |
| ADR-0005 | 1 | Superseded |
| Docs | ~5 | banco único |
