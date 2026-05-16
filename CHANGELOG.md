# Changelog — delfos-api

Todas as mudanças relevantes deste repositório devem ser registradas aqui.

O formato segue a ideia do Keep a Changelog e usa versionamento semântico quando o projeto passar a ter releases formais.

## [Unreleased]

> **Marco de estabilização da foundation (2026-05-16).** Foundation estabilizada
> com: documentação agent-ready, testes unit/integration reforçados, API E2E
> smoke com MongoDB em memória, Web Playwright E2E smoke, connectors hardening e
> CI hardening. Números atuais — `delfos-api`: 406 testes + 12 E2E;
> `delfos-web`: 262 testes Flutter + 21 Playwright E2E; `delfos-connectors`:
> 106 testes. O E2E de API e o E2E de Web permanecem em jobs **separados e
> opcionais** (não obrigatórios em branch protection). A execução real de
> conectores permanece **bloqueada**; ADR-0021 e ADR-0022 permanecem `Proposed`.

### Added

- Camada de E2E smoke da foundation (`npm run test:e2e`): 12 testes que sobem o
  `AppModule` real contra um MongoDB em memória (`mongodb-memory-server`), sem
  banco de produção, sem secrets reais e sem execução real de conectores.
- CI: job separado e opcional de E2E no GitHub Actions — não obrigatório em
  branch protection ainda; falha o workflow se o E2E falhar.

### Changed

- CI: `npm run build` passou a integrar o fluxo obrigatório (lint, test e
  build); o job de E2E fica separado e opcional.

### Fixed

- N/A

### Security

- N/A

## [0.1.0] - 2026-05-15 — foundation

Marco inicial da foundation administrativa/declarativa do `delfos-api`. Versão alinhada ao
`package.json` (`0.1.0`).

> Nota: entradas anteriores a este marco não foram rastreadas em detalhe neste changelog. As
> linhas abaixo consolidam, de forma honesta, o que já havia sido entregue até esta data.

### Added

- Documentação inicial de governança do repositório.
- Skills de repositório para orientar agentes de IA/Codex.
- Templates de issue e pull request.
- Módulo `health` (healthcheck).
- Módulo `auth` foundation — autenticação temporária por `x-delfos-admin-key`, sem JWT real.
- Módulo `audit` — auditoria interna.
- Módulo `tenants` — cadastro de tenants administrativos.
- Módulo `users` — cadastro de usuários administrativos.
- Módulo `connections` — connections declarativas, sem chamada externa.
- Módulo `credentials` — credenciais protegidas e `credentialRef`.
- Módulo `datasets` — datasets declarativos.
- Módulo `field-mappings` — De/Para declarativo.
- Módulo `query-definitions` — query-definitions declarativas.
- Módulo `dashboard-definitions` — dashboard-definitions declarativas.
- Módulo `report-definitions` — report-definitions declarativas.
- Módulo `runtime` — execution-requests foundation: contratos, estados, eventos administrativos,
  readiness dry-run e demo-execute fictício, sem execução real.
- Módulo `execution-preview` — preview demo em memória, sem execução real.
- `runtime/bridge` foundation-only — bridge resolver, reference resolver e adapters; apenas types
  e testes, sem provider NestJS, sem dispatch e sem execução real.

### Security

- Credenciais armazenadas de forma protegida e referenciadas por `credentialRef`; segredo real não
  trafega pelo frontend nem aparece em logs ou respostas de API.

## Como manter

Use `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` e `Security`. Não registre secrets, nomes de clientes sem autorização ou payloads reais.
