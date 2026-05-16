# Foundation Stability Checkpoint — Delfos Analytics

> Status: documento normativo (checkpoint vivo).
> Data do checkpoint: 2026-05-16.
> Escopo: estado consolidado da Fase 1 / foundation nos tres repositorios.

Este checkpoint registra, de forma honesta, ate onde a foundation
administrativa/declarativa esta madura. Ele nao autoriza Fase 2.

## 1. delfos-api

- Modulos declarativos: `health`, `auth`, `audit`, `tenants`, `users`,
  `connections`, `credentials`, `datasets`, `field-mappings`,
  `query-definitions`, `dashboard-definitions`, `report-definitions`,
  `runtime`, `execution-preview`.
- Testes: **406 unit/integration** + **12 E2E smoke** (`test:e2e`, MongoDB em
  memoria via `mongodb-memory-server`).
- Cobertura medida: ~87% statements / ~88% lines. `coverageThreshold` global
  progressivo configurado (80/65/70/80) — piso anti-regressao, abaixo do
  medido, para apertar em passos futuros.
- CI: `lint`, `test`, `build` obrigatorios; `E2E`, `Commitlint`,
  `Markdown Lint` como jobs separados.

## 2. delfos-web

- Flutter Web consumindo a foundation; catalogos, builders declarativos,
  Runtime Monitor Foundation, previews demo.
- Testes: **262 testes Flutter** (unit/widget) + **21 Playwright E2E smoke**
  (build estatico, Chromium).
- Smoke E2E integrado API+Web: tarefa local/opcional documentada em
  `delfos-web/docs/e2e-web-testing.md` — nao obrigatoria no CI.
- CI: `Flutter Analyze`, `Flutter Test`; `Web E2E`, `Commitlint`,
  `Markdown Lint` como jobs separados.
- Baseline Visual: **v0.1 oficial** (`docs/layout-base-reference.md`);
  refinamento premium ainda em consolidacao — ver checklist para v1.0 no
  proprio documento.

## 3. delfos-connectors

- Skeleton Foundation TypeScript seguro: contratos, validacao, sanitizacao,
  `FakeConnectorAdapter` deterministico.
- Testes: **106 testes** unitarios. CI `Validation` (format/lint/markdown/
  link-check/test/build) + `Commitlint`.
- Coverage com Vitest: nao configurado — proposto como tarefa futura dedicada
  (adicionar `@vitest/coverage-v8` exige escopo/justificativa proprios).

## 4. Governanca e seguranca

- Documentacao agent-ready ativa; ADRs versionadas; roadmap com taxonomia de
  status.
- `tenantId` como boundary obrigatorio; `credentialRef` como referencia segura;
  sanitizacao de metadata/erros; sem secrets reais versionados.
- Branch protection: ver `docs/branch-protection-checklist.md`.

## 5. Linha de bloqueio (Fase 2)

Permanecem **bloqueados** e dependem de promocao humana explicita:

- Execucao real de conectores.
- Dispatch real (`ExecutionRequest -> ConnectorExecutionCommand`).
- Descriptografia real de credenciais.
- JWT / login / OAuth real.
- ADR-0021 e ADR-0022 permanecem `Proposed` — constituem o gate de entrada da
  Fase 2 (ver ADR-0024 e `docs/roadmap.md`).

## 6. Proximos gates para a Fase 2

1. Promocao humana de ADR-0021 (credential decryption) e ADR-0022 (connector
   dispatch transport) de `Proposed` para `Accepted`.
2. Decisao de transporte + threat model para dispatch real.
3. Escopo explicito (e ADR onde exigido) antes de qualquer provider,
   `RuntimeModule`, endpoint ou chamada real ao `delfos-connectors`.

Enquanto esses gates nao forem atravessados, o trabalho permitido e apenas
maturidade de Fase 1: testes, documentacao, CI, qualidade — sem capacidade de
execucao real.
