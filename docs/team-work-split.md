# Divisão de Trabalho — 4 Trilhas / Devs

> **Status: planejamento operacional.**
> Este documento é a referência canônica da divisão de trabalho entre as quatro
> trilhas. Ele organiza execução; **não** autoriza implementar capacidades
> gated. Os phase gates (ADR-0024; ADR-0021/0022 `Proposed`) prevalecem sobre
> qualquer entrega aqui listada.

---

## 1. Objetivo

- Dividir a execução entre **4 devs/trilhas** sem conflito.
- Preservar os **gates de fase**: nada marcado como Fase 2 começa sem promoção
  humana das ADRs bloqueantes.
- Evitar **dois devs alterando os mesmos contratos** sem coordenação.
- Tornar explícitas as **dependências** entre trilhas.

## 2. Dev 1 — Backend Core

**Missão:** transformar a API foundation em base backend real e sustentável.

Repos: `delfos-api`.

Escopo:
- PostgreSQL / Valkey — migração de banco (ADR-0035, `postgresql-migration-plan.md`).
- Auth / JWT — `auth-jwt-migration-plan.md`.
- Configuração e validação de ambiente.
- Segurança de backend (secrets, isolamento de tenant).
- Migração dos módulos foundation (repositories).

Limite: **sem runtime real sem ADR**. Não implementa execução, dispatch,
descriptografia real.

## 3. Dev 2 — Runtime / Connectors

**Missão:** preparar execução real com segurança, sem ligá-la antes do gate.

Repos: `delfos-api`, `delfos-connectors`.

Escopo:
- Bridge foundation (`runtime/bridge`, foundation-only).
- Execution requests foundation (ADR-0014).
- Contratos de runtime/connectors (ADR-0013/0015).
- Skeleton do `delfos-connectors`.

Limite — **bloqueado por ADR-0021 e ADR-0022 (`Proposed`)**: runtime real,
dispatch real, test connection real, inspect schema real, connector real e
execução SQL real **não** podem ser iniciados. Apenas planejamento documental
e foundation-only.

## 4. Dev 3 — Web Product

**Missão:** transformar a UI foundation em produto utilizável.

Repos: `delfos-web`.

Escopo:
- Web foundation e Baseline Visual v1.0 (já promovida).
- Builders e refatoração de diálogos (ex.: Phase E.1).
- UI foundation de dashboard/report.
- Mobile/responsividade.

Limite: **Auth UI** só depois do backend JWT existir (depende do Dev 1 e de
`auth-jwt-migration-plan.md`). **Dashboard/report runtime viewer** só depois
dos contratos e gates de runtime (depende do Dev 2). Não toca banco interno da
API, connectors reais, runtime, credential broker ou cache.

## 5. Dev 4 — QA / DevOps / AI

**Missão:** garantir que o produto cresça sem quebrar; trilha transversal.

Repos: `delfos-api`, `delfos-web`, `delfos-connectors`.

Escopo:
- CI/CD e branch protection (ADR-0031, `branch-protection-checklist.md`).
- Observability (`observability-plan.md`).
- Security hardening (`security-checklist.md`, `threat-model.md`).
- Estratégia de testes (`testing-guide.md`, E2E).
- Release / deploy (`deployment-guide.md`, `operations-runbook.md`).
- AI layer foundation (ADR-0025).

Limite: **não age sozinho** — não implementa runtime sem Dev 2, não muda banco
sem Dev 1, não muda UI principal sem Dev 3, não conecta IA ao banco sem ADR.

## 6. Matriz de dependências

| Depende de | Para | Trilha |
|---|---|---|
| Backend JWT (Dev 1) | Auth UI real (Dev 3) | 1 → 3 |
| Runtime real / contratos (Dev 2) | Dashboard/report runtime real (Dev 3) | 2 → 3 |
| ADR de connector / credential broker / dispatch | Test connection / inspect schema reais (Dev 2) | gate → 2 |
| ADR-0035 + decisão de ORM | Repository migration (Dev 1) | gate → 1 |
| Observability foundation (Dev 4) | Operação em produção | 4 → todos |
| ADR-0021/0022 promovidas (humano) | Qualquer execução real (Dev 2/3) | gate → 2,3 |

Ordem geral: **Dev 1 inicia PostgreSQL/Auth → Dev 2 depende das decisões de
broker/dispatch → Dev 3 evolui sobre a Baseline Visual e aguarda backend →
Dev 4 corre em paralelo, transversal.**

## 7. Regras de handoff

- Mudança de **contrato REST** é ponto de coordenação obrigatório entre Dev 1,
  Dev 2 e Dev 3 — comunicar antes, nunca alterar unilateralmente.
- O dono de um contrato publica a mudança; os consumidores adaptam depois.
- Documentação relevante é atualizada **no mesmo PR** da mudança.
- Cada trilha trabalha em branch própria (`feat/`, `fix/`, `chore/`, `docs/`).
- PR exige ≥ 1 aprovação humana; mudança de contrato exige revisão do consumidor.

## 8. Áreas que exigem coordenação

- Contratos REST (`docs/api-contracts.md`) — Dev 1/2/3.
- Schemas / modelo de banco (ADR-0035, `postgresql-data-model-draft.md`) — Dev 1/2.
- `AppModule`, config, env — Dev 1 (Dev 4 revisa CI/segredos).
- Contratos de runtime/connectors — Dev 2 (Dev 1 fornece referências seguras).
- Pipeline de CI / branch protection — Dev 4 (afeta todos).
- Design System e tokens do `delfos-web` — Dev 3.

## 9. Stop conditions

Qualquer trilha para e pede validação humana antes de (ver `AGENTS.md` §9 e
`docs/agent-stop-conditions.md`):
- alterar contrato público de API;
- mexer em secrets/credenciais/descriptografia;
- implementar dispatch real ou runtime real;
- promover ADR `Proposed` (em especial ADR-0021/0022);
- divergência entre ADR, `AGENTS.md` e código;
- ultrapassar 600 linhas em um arquivo;
- ação destrutiva.

## 10. Definition of Done por tarefa de dev

Uma tarefa de qualquer trilha só é "pronta" quando:
- respeita o escopo da trilha e os limites/gates acima;
- `lint`, `test`, `build` verdes (e analyze/test no `delfos-web`);
- contrato REST inalterado, salvo coordenação explícita;
- documentação atualizada junto da mudança;
- DoD canônica de `docs/quality-checklist.md` respeitada;
- nenhuma capacidade gated foi iniciada sem promoção humana de ADR.

## Relação com outros documentos

- `AGENTS.md` — fonte canônica de regras; §9 stop conditions.
- ADR-0024 — modelo de fases; ADR-0021/0022 — gates de execução real.
- `docs/postgresql-migration-plan.md`, `docs/auth-jwt-migration-plan.md`,
  `docs/observability-plan.md`, `docs/runtime-query-layer-decision.md`.
- `docs/roadmap.md` — posição no roadmap.
