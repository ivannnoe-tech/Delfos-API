# Prompt — Revisão geral de código (dispatcher)

Este prompt não contém regras de revisão. Ele apenas direciona o agente para a
skill mais específica conforme o tipo de mudança. Use sempre a skill mais
específica que se aplicar; combine quando a mudança cruzar domínios.

---

## Como escolher a skill

- Endpoints, DTOs ou contratos públicos → `api-contract-review`
- Schemas e modelagem de dados → `mongo-modeling-review`
- Autenticação, tenant, permissões ou secrets → `security-lgpd-review`
- Estrutura/organização NestJS → `nestjs-structure`
- Antes de finalizar qualquer alteração → `testing-quality-review`
- Falhas de lint, teste ou build → `ci-fix-review`
- Planejamento de tarefas multi-etapa → `execution-plan`

As skills vivem em `delfos-api/.agents/skills/<nome>/SKILL.md`.

---

## Definition of Done

`docs/quality-checklist.md` é a referência canônica de Definition of Done.
Toda revisão deve confirmar a alteração contra esse checklist antes de aprovar.
