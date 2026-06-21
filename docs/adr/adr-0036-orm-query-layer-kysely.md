# ADR-0036 — ORM / Query Layer: Kysely

- **Status**: Accepted
- **Data**: 2026-06-20
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Migração PostgreSQL (P1–P7), majoritariamente P1–P3
- **Implementação**: P1 em andamento (dependência adicionada, infra de conexão)

---

> Esta ADR **resolve** a subdecisão pendente **"ORM/Query Layer Decision Review"**
> registrada pela [ADR-0035](./adr-0035-postgresql-primary-database-and-valkey-cache.md)
> e detalhada em `docs/runtime-query-layer-decision.md`. A escolha foi tomada por
> **spike comparativo runnable** em um módulo representativo, não por preferência
> a priori, conforme exigido pela ADR-0035 (seção "ORM / query layer") e pela
> fase **P1** do `docs/postgresql-migration-plan.md`.

## Contexto

A migração do `delfos-api` de MongoDB/Mongoose para PostgreSQL (ADR-0035) precisa
de uma camada de acesso ao banco. A ADR-0035 deixou a escolha do ORM/query layer
**pendente**, listando como candidatos **Kysely**, **Prisma**, **Drizzle** e
**TypeORM**, com preferência inicial registrada a **avaliar Kysely** e **Prisma**
como alternativa de DX — mas exigindo um spike comparativo antes de decidir.

A decisão vincula migrations, tipagem, testes e o repository layer de **todos** os
módulos (`src/modules/<n>/repositories/`). Decidi-la sem evidência arriscaria
retrabalho alto.

## Método do spike

Spike **runnable** (não análise teórica) sobre uma fatia representativa do domínio:
as tabelas `tenants` (entidade global) + `users` (tenant-scoped). Juntas exercem
toda a superfície de critérios: PK UUID, JSONB, `timestamptz`, FK, `UNIQUE`
composto `(tenant_id, email)`, índice por tenant, e a **fronteira multi-tenant
obrigatória** (`tenant_id` em todo `WHERE`) num list dinâmico paginado.

- Contrato idêntico para todos: 11 operações de repository + 10 asserções de
  paridade (A1–A10), incluindo isolamento cross-tenant e captura do SQL gerado.
- **PostgreSQL real** (16.14 em container Docker), não emulação, para os três
  candidatos runnable: **Kysely**, **Drizzle**, **Prisma** — cada um em banco
  isolado, com `vitest` executando A1–A10 e capturando o SQL verbatim.
- **TypeORM** avaliado qualitativamente (não-runnable): a ADR-0035 já o
  de-prioriza por histórico de migrations frágeis e padrão Active Record/Data
  Mapper inconsistente; mantido por completude, não como finalista.
- Critérios C1–C9 de `runtime-query-layer-decision.md` §4, nota 1–5 cada.

Todos os três candidatos runnable passaram A1–A10 (10/10) contra o PostgreSQL real,
de forma idempotente.

## Resultado (placar)

| Critério | Peso p/ Delfos | Kysely | Drizzle | Prisma |
|---|---|:--:|:--:|:--:|
| C1 Suporte PostgreSQL (uuid/jsonb/timestamptz) | alto | 5 | 5 | 5 |
| C2 Queries dinâmicas seguras (parametrizadas) | **crítico** | 5 | 5 | 5 |
| C3 Tipagem ponta a ponta | alto | 4 | 5 | 5 |
| C4 Migrations versionadas (up/down) | alto | 4 | 4 | 5 |
| C5 Multi-tenant (`tenant_id` como boundary) | **crítico** | **5** | 4 | 4 |
| C6 Performance / overhead de runtime | médio | 5 | 5 | 3 |
| C7 Auditabilidade do SQL gerado | **crítico** | 5 | 5 | 4 |
| C8 Aderência ao repository pattern | alto | 5 | 5 | 4 |
| C9 Compat. connector/runtime (SQL analítico dinâmico) | **crítico** | **5** | 4 | 2 |
| **Total** | | **43** | **42** | **37** |

LoC do repository (11 ops): Kysely 194, Drizzle 177, Prisma 184.

### Evidência de auditabilidade (C7) e segurança dinâmica (C2)

SQL verbatim capturado do list com filtro opcional de status (Kysely, via
`query.compile()` — **sem round-trip ao banco**):

```text
com filtro:  select * from "users" where "tenant_id" = $1 and "status" = $2
             order by "created_at" desc limit $3 offset $4
sem filtro:  select * from "users" where "tenant_id" = $1
             order by "created_at" desc limit $2 offset $3
```

A cláusula `and "status" = $N` **desaparece** quando o filtro é omitido — prova de
construção condicional sem concatenação de string. Todo valor é placeholder `$n`.

## Decisão

**A camada de acesso ao PostgreSQL do `delfos-api` será o Kysely** (query builder
SQL type-safe sobre o driver `pg`), com migrations versionadas via o `Migrator`
nativo do Kysely (up/down) e geração de tipos do banco via `kysely-codegen`.

### Por que Kysely

- **Maior placar (43/45)** e vitória/empate em todos os critérios **críticos** de
  Delfos: auditabilidade (C7), segurança dinâmica (C2), boundary multi-tenant
  (C5, melhor da comparação) e SQL analítico dinâmico futuro (C9, melhor).
- **Auditabilidade best-in-class** (C7): `compile()` expõe `{sql, parameters}`
  exatos **antes** da execução, sem round-trip — atende a prioridade declarada de
  "não esconder o SQL" e "auditabilidade do SQL gerado".
- **Boundary multi-tenant explícito** (C5): `tenant_id` é um `.where()` simples em
  toda query; centralizável num helper `usersScoped()` para não divergir. Encaixa
  a invariante de isolamento obrigatório (ADR-0035 §multi-tenant).
- **Aderência ao repository pattern** (C8): classe fina (194 LoC), cada op com
  3–10 linhas, sem decorators/entidades/engine — cai direto no contrato
  `src/modules/<n>/repositories/`.
- **Migrations up/down** (C4): casa com o requisito de "migrations versionadas com
  up/down" da fase P2 — diferente do modelo **forward-only** do Drizzle.
- **SQL analítico dinâmico futuro** (C9, melhor): construção programática com
  cláusulas condicionais + `sql` escape hatch tipado, mantendo parametrização —
  exatamente o que o runtime/connector futuro exigirá.
- Confirma a **preferência inicial registrada na ADR-0035** (Kysely), agora com
  base em evidência, não a priori.

### Por que não os outros

- **Drizzle (42)** — runner-up forte e quase empate; melhor tipagem inferida (C3=5,
  `$inferSelect`/`$inferInsert` sem codegen). Perdeu por **migrations
  forward-only** (sem down/rollback de primeira classe — conflita com o requisito
  P2) e por C5/C9 levemente menores. **Enxerto adotado:** usar `kysely-codegen`
  para recuperar a tipagem inferida sem abrir mão das forças do Kysely.
- **Prisma (37)** — melhor tipagem e tooling de migration no papel, mas: (1)
  **bloqueador para automação** — `prisma migrate`/`db push` é barrado pelo
  guard-rail interno do Prisma quando "invocado por agente de IA", inviabilizando
  pipeline de migração autônomo/CI deste projeto; (2) **C9=2**, fraco para SQL
  analítico dinâmico sobre fontes arbitrárias (modelo schema-first); (3) engine
  Rust separada (processo/IPC extra, cold start maior, artefato nativo por
  plataforma).
- **TypeORM** — não finalista; de-priorizado pela ADR-0035 (migrations frágeis,
  padrão inconsistente). Não foi ao spike runnable.

## Consequências

### Positivas
- SQL visível e auditável por construção; parametrização garantida.
- Repository layer fino e previsível, fiel ao contrato atual.
- Migrations up/down versionadas, com rollback por fase (suporta P2/P5/P7).
- Camada pronta para o SQL analítico dinâmico do runtime futuro (sob gates).

### Negativas / trade-offs aceitos
- A interface de tipos do banco é escrita à mão; mitigado por **`kysely-codegen`**
  (gera os tipos a partir do banco/migrations) — adotado como parte do P2.
- Fragmentos `sql` crus às vezes exigem anotação de tipo explícita
  (ex.: `sql<Date>\`now()\``). Documentar no guia de migração.
- Tooling de migration é de baixo nível (você escreve o DDL); exige disciplina de
  arquivos de migration versionados — coberto pela fase P2.

### Mitigação
- `kysely-codegen` como fonte dos tipos do schema (P2), reduzindo a manutenção
  manual da interface `Database`.
- Guia curto de convenções de migration/SQL no P2 (`docs/postgresql-migration-plan.md`).

## Relação com outros documentos
- [ADR-0035](./adr-0035-postgresql-primary-database-and-valkey-cache.md) — origem
  da subdecisão; esta ADR a resolve.
- `docs/runtime-query-layer-decision.md` — atualizado para **decidido (Kysely)**.
- `docs/postgresql-migration-plan.md` — fase P1 (esta decisão) e P2 (migrations,
  `kysely-codegen`).
- `docs/postgresql-data-model-draft.md` — modelo relacional candidato (P2).
- ADR-0021 / ADR-0022 — gates de execução real **inalterados**; esta ADR é de
  camada de acesso a dados e **não** autoriza runtime/dispatch/descriptografia real.
