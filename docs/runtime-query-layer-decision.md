# Decisão de ORM / Query Layer — DECIDIDO (Kysely)

> **Status: decidido — Kysely** (ver [ADR-0036](./adr/adr-0036-orm-query-layer-kysely.md)).
> A escolha foi resolvida na **fase P1** da migração por **spike comparativo
> runnable** em PostgreSQL real, conforme exigido pela ADR-0035. Este documento
> mantém a análise de candidatos como contexto histórico; a decisão formal é a
> ADR-0036. A escolha vale para a **camada de acesso a dados** da migração; ela
> **não** autoriza runtime SQL real (segue bloqueado por ADR-0021/0022/0024).

---

## 1. Decisão atual

**Kysely** é a camada de acesso ao PostgreSQL escolhida (query builder SQL
type-safe sobre `pg`), com migrations versionadas (Migrator nativo, up/down) e
tipos do banco via `kysely-codegen`.

Placar do spike (PostgreSQL 16.14 real, módulo `tenants`+`users`, A1–A10 10/10):

| Candidato | Total /45 | Veredito |
|---|:--:|---|
| **Kysely** | **43** | **Escolhido** — vence os critérios críticos (auditabilidade, multi-tenant, SQL dinâmico) |
| Drizzle | 42 | Runner-up; migrations forward-only conflitam com o requisito up/down do P2 |
| Prisma | 37 | `migrate` bloqueado p/ agente de IA; fraco p/ SQL analítico dinâmico (C9=2) |
| TypeORM | n/a | Não finalista (de-priorizado pela ADR-0035) |

Detalhes, evidência de SQL capturado e justificativas por critério: **ADR-0036**.

## 2. Contexto atual

- O banco vigente é **MongoDB/Mongoose**, cobrindo a foundation
  administrativa/declarativa. O `delfos-api` não tem camada SQL.
- A **ADR-0035** decidiu migrar o banco primário para **PostgreSQL**
  (com Valkey como cache). A migração é faseada (`postgresql-migration-plan.md`)
  e ainda **não iniciada**.
- **Runtime SQL real ainda não existe.** Não há execução real de query.
- **Connectors reais ainda não existem.** O `delfos-connectors` é skeleton
  (ADR-0013).
- Execução de query real está **bloqueada** por ADR-0021/ADR-0022 (`Proposed`)
  e ADR-0024.

Existem, portanto, **dois drivers** distintos para a escolha de query layer:

1. **Migração da foundation** — mover os módulos declarativos para PostgreSQL
   precisa de um query layer (CRUD, migrations, tipagem, multi-tenant).
2. **Runtime SQL analítico real (futuro/gated)** — execução de query dinâmica
   sobre fontes reais; depende dos gates e de threat model próprio.

## 3. Candidatos

### Prisma
- ORM completo, schema declarativo, client gerado.
- Forte para **CRUD** da foundation; migrations maduras; DX alta.
- Atenção: SQL dinâmico/analítico é menos natural; runtime próprio e
  abstração maior do SQL.

### Kysely
- Query builder **type-safe**, fino, próximo do SQL.
- Forte para **SQL dinâmico** e auditável; bom candidato para runtime
  analítico.
- Atenção: menos "baterias inclusas" para CRUD/migrations que um ORM completo.

### Drizzle
- ORM leve, SQL-like, schema em TypeScript.
- Bom candidato para **SQL tipado e migrations**; equilíbrio entre ORM e query
  builder.
- Atenção: ecossistema mais novo no NestJS.

### TypeORM
- ORM clássico por entidades/classes; familiar no NestJS via `@nestjs/typeorm`.
- Possível para a foundation.
- Atenção: cautela para runtime analítico; histórico de migrations frágeis e
  inconsistências de padrão.

## 4. Critérios futuros de decisão

A decisão deverá avaliar:

- suporte sólido a **PostgreSQL**;
- suporte a **SQL Server**, se relevante para connectors futuros;
- **queries dinâmicas seguras** (sem concatenação de string, parametrização);
- **tipagem** forte ponta a ponta;
- **migrations** versionadas e confiáveis;
- **multi-tenant** — facilidade de impor `tenant_id` como boundary;
- **performance** sob o perfil de carga real;
- **auditabilidade do SQL gerado** — inspecionar o que vai ao banco;
- **compatibilidade com connectors/runtime** quando a execução real existir.

## 5. Gatilho e bloqueio da decisão

- A **ADR-0035** já registra a subdecisão **"ORM/Query Layer Decision Review"**,
  a ser resolvida no **início da fase P1** do `postgresql-migration-plan.md` —
  porque a própria migração da foundation precisa de um query layer. A
  preferência inicial a avaliar registrada na ADR-0035 é **Kysely**, com
  **Prisma** como alternativa de DX; este documento **não** confirma nenhuma.
- A decisão deve ser tomada por **spike comparativo** em um módulo
  representativo, não por preferência a priori.
- Os critérios de **runtime SQL analítico real** (queries dinâmicas sobre
  fontes de cliente) só se aplicam após:
  - a fase de runtime real;
  - a promoção humana dos gates necessários (ADR-0021/ADR-0022);
  - o threat model de execução real.
  Enquanto isso, nada de runtime SQL é decidido ou implementado.

Resumo: a escolha **base** do ORM/query layer pertence à fase P1 da migração;
os critérios de **runtime analítico** são reavaliados depois, sob os gates.
Hoje, tudo permanece **pendente**.

## 6. Fora de escopo

- Escolher a biblioteca agora.
- Instalar Prisma, Kysely, Drizzle ou TypeORM.
- Implementar runtime SQL.
- Implementar connector real.
- Alterar ADR-0021/0022 ou promover ADR `Proposed`.

## 7. Recomendação atual

- **Resolvido: Kysely** (ADR-0036), via spike comparativo runnable no início da P1.
- Adicionar dependências `kysely` + `pg` ao `delfos-api` (P1).
- Adotar `kysely-codegen` como fonte dos tipos do schema (P2).
- Os critérios de **runtime SQL analítico real** (queries dinâmicas sobre fontes
  de cliente) continuam reavaliáveis sob os gates ADR-0021/0022 — a escolha do
  Kysely é compatível com eles (C9), mas **não** os antecipa nem os autoriza.

## Relação com outros documentos

- ADR-0035 — PostgreSQL primary database + Valkey cache; registra a subdecisão
  de ORM como pendente.
- `docs/postgresql-migration-plan.md` — fase P1 (escolha do ORM).
- `docs/postgresql-data-model-draft.md` — modelo relacional candidato.
- ADR-0021/ADR-0022 — gates de execução real; ADR-0024 — modelo de fases.
- `docs/team-work-split.md` — Dev 1 dono da migração; Dev 2 do runtime.
- `docs/roadmap.md` — posição no roadmap.
