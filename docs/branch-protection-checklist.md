# Branch protection checklist — Delfos Analytics

> Status: documento normativo.
> Escopo: os tres repositorios — `delfos-api`, `delfos-web`, `delfos-connectors`.

Branch protection nao e algo que o repositorio garante por arquivo versionado:
e configuracao do GitHub (Settings -> Branches). Este checklist registra a
configuracao esperada para que a revisao seja auditavel e reproduzivel.

## 1. Regra geral

- `main` e protegida nos tres repositorios.
- Merge em `main` apenas via pull request — sem push direto.
- `force push` para `main` bloqueado.
- Branch deletada apos o merge (limpeza).

## 2. Pull request

- PR obrigatorio antes de qualquer merge em `main`.
- Pelo menos **1 aprovacao humana** por PR.
- Conversas resolvidas antes do merge.
- Exigir branch atualizada com `main` antes do merge quando fizer sentido
  (evita merge com base defasada).

## 3. Required status checks

Marcar como obrigatorios (required) os checks ja estaveis de cada repo:

| Repo | Required checks |
|---|---|
| `delfos-api` | `Lint`, `Test`, `Build` |
| `delfos-web` | `Flutter Analyze`, `Flutter Test` |
| `delfos-connectors` | `Validation` |

## 4. Checks opcionais (ainda nao obrigatorios)

Rodam no CI e falham por conta propria, mas **nao** bloqueiam o merge ate
estabilizarem:

- `delfos-api`: job `E2E (optional)` (`test:e2e`).
- `delfos-web`: workflow `Web E2E (optional)` (Playwright) e o smoke integrado
  API+Web (tarefa local/opcional).
- `delfos-api` / `delfos-web` / `delfos-connectors`: `Commitlint`.
- `delfos-api` / `delfos-web`: `Markdown Lint`.

Promover a obrigatorio apenas quando o check estiver estavel e reprodutivel.

## 5. Revisao humana obrigatoria por area sensivel

Alem da aprovacao padrao de PR, mudancas nas areas abaixo exigem revisao
humana atenta (idealmente um `CODEOWNERS` cobrindo esses caminhos):

- ADRs (`docs/adr/`).
- Auth e seguranca (auth temporaria, guards, `x-delfos-admin-key`).
- Credentials e protecao de segredo (`credentialRef`).
- Runtime e bridge (`src/modules/runtime/`).
- Connectors (`delfos-connectors`).
- CI / GitHub Actions (`.github/workflows/`).
- Secrets e variaveis de ambiente (`.env*`, `env-reference`).

Nenhuma dessas areas pode ser mesclada sem revisao humana explicita, mesmo que
os checks automatizados passem.

## 6. O que NAO e coberto por branch protection

Branch protection nao substitui:

- As stop conditions do agente (`docs/agent-stop-conditions.md`).
- O gate de Fase 2: ADR-0021 e ADR-0022 permanecem `Proposed`; nenhuma
  capacidade de execucao/dispatch/descriptografia real e iniciada sem promocao
  humana dessas ADRs (ver ADR-0024 e `docs/roadmap.md`).

## 7. Verificacao periodica

Revisar este checklist contra a configuracao real do GitHub quando:

- um novo check de CI for adicionado;
- um check opcional estabilizar e for promovido a obrigatorio;
- um novo repositorio entrar no projeto.
