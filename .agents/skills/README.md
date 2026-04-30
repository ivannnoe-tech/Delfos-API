# Repo Skills — delfos-api

Skills de repositório para orientar o Codex em fluxos repetitivos do `delfos-api`.

## Como usar

Ao pedir uma tarefa ao Codex, mencione a skill quando quiser forçar o fluxo:

- `Use a skill execution-plan`
- `Use a skill nestjs-structure`
- `Use a skill api-contract-review`
- `Use a skill security-lgpd-review`
- `Use a skill mongo-modeling-review`
- `Use a skill testing-quality-review`
- `Use a skill ci-fix-review`

## Skills disponíveis

| Skill | Uso principal |
|---|---|
| `execution-plan` | planejar tarefas estruturais antes de editar código |
| `nestjs-structure` | base técnica NestJS, módulos, config, healthcheck, Swagger e testes |
| `api-contract-review` | endpoints, DTOs, OpenAPI, erros, paginação e contratos |
| `security-lgpd-review` | auth, permissões, multi-tenant, secrets, logs e LGPD |
| `mongo-modeling-review` | schemas MongoDB, índices, De/Para, metadados e auditoria |
| `testing-quality-review` | testes, lint, build, DoD e revisão final |
| `ci-fix-review` | falhas de CI, build, lint e testes |

## Regra

As skills complementam `AGENTS.md`. Elas não substituem os documentos normativos em `docs/`.
