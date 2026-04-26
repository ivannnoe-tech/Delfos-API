# ADR-0004 — Two-repo strategy (delfos-api + delfos-web)

- **Status**: Accepted
- **Data**: 2026-04-25
- **Fase impactada**: Fase 1 e Fase 2

---

## Contexto

O projeto tem dois deliverables principais: um backend NestJS em TypeScript e um frontend Flutter Web em Dart. Cada um tem seu próprio toolchain, gerenciador de pacotes, build, testes e ciclo de release.

Misturar os dois em um único repositório é tecnicamente possível, mas:

- Flutter/Dart não convive bem com `npm`/`pnpm workspaces` (toolchains diferentes, lockfiles diferentes, gerenciadores diferentes)
- Ferramentas de monorepo Node-centric (Turborepo, Nx) têm Flutter como cidadão de segunda classe
- Ferramentas Dart-centric (Melos) ignoram Node
- CI fica mais complicado: roda lint/test/build dos dois mundos em todo PR mesmo quando só um foi alterado
- Permissões granulares (quem pode mexer em quê) ficam piores
- Reviews ficam mais ruidosos

---

## Decisão

Usaremos **dois repositórios separados** no GitHub privado:

- **`delfos-api`** — backend NestJS, TypeScript, MongoDB
- **`delfos-web`** — frontend Flutter Web

A documentação compartilhada (AGENTS, DESIGN, /docs, /prompts, ADRs) vive no `delfos-api`. O `delfos-web` referencia esses arquivos via README/AGENTS próprios e mantém apenas docs específicas de frontend em `delfos-web/docs/`.

---

## Alternativas consideradas

- **Monorepo único com pnpm + Melos** — descartada por complexidade de toolchain e CI
- **Monorepo único sem ferramenta** (npm scripts manuais) — descartada por falta de orquestração e cache de build
- **Três repos** (api, web, docs) — descartada por overhead operacional (mais um repo pra manter, abrir PR, dar permissão); upgrade futuro para 3 repos é trivial se necessário
- **Submódulos git** para a documentação compartilhada — descartada por fricção de DX

---

## Consequências

### Positivas

- Cada repo é simples, com toolchain único
- CI roda só o necessário em cada PR
- Permissões granulares (e.g. um colaborador só do front)
- Versionamento independente: o `delfos-api` pode evoluir sem release do `delfos-web` e vice-versa
- Onboarding mais simples por especialização

### Negativas / trade-offs aceitos

- Mudanças que afetam contrato (REST entre os dois) precisam de **dois PRs coordenados**
- Documentação canônica vive em um dos dois repos (`delfos-api/`); o outro precisa olhar pra lá
- Tipos compartilhados (DTOs do contrato REST) são duplicados — um em TS no api, outro em Dart no web. Mantemos sincronia via `docs/api-contracts.md` e validação contratual em testes E2E
- Sem geração automática de cliente Dart a partir do schema TS na Fase 1 (avaliar OpenAPI codegen na Fase 2)

### Neutras

- O `delfos-api` ganha o papel de "fonte canônica" de regras de produto. Isso é deliberado.

---

## Impacto na Fase 1

- Criar dois repositórios privados no GitHub: `delfos-api`, `delfos-web`
- CI configurado independente em cada (`.github/workflows/ci.yml` (a ser configurado futuramente))
- Doc compartilhada (`docs/`, `prompts/`, ADRs) vive **apenas** em `delfos-api`
- `delfos-web/AGENTS.md` aponta pra `delfos-api/AGENTS.md` como fonte canônica
- `delfos-web/DESIGN.md` aponta pra `delfos-api/DESIGN.md`
- Contratos REST consumidos pelo front estão em `delfos-api/docs/api-contracts.md`

## Impacto futuro / Fase 2

- Se aparecer um terceiro deliverable (e.g. mobile nativo, CLI, worker independente), avaliamos novo repo na hora
- Se a duplicação de tipos doer, introduzir geração automática (OpenAPI → cliente Dart)
- Se a doc compartilhada começar a competir com pull-requests de código no `delfos-api`, extrair pra `delfos-docs`

---

## Referências

- `delfos-api/AGENTS.md`
- `delfos-api/docs/api-contracts.md`
