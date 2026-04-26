# Contributing — Delfos Analytics (delfos-api)

Este documento define como contribuir com o repositório `delfos-api`.

A leitura de `AGENTS.md`, `DESIGN.md` e da `docs/` é obrigatória **antes** de qualquer mudança.

---

## 1. Pré-requisitos

- **Node.js 24 LTS** (use `nvm use` ou `fnm use` — o repo tem `.nvmrc`)
- **npm** 10+ (vem com Node 22)
- **MongoDB 8.0+** rodando localmente, ou Docker (`docker compose up -d mongo`)
- **Git** e acesso ao repositório privado no GitHub

---

## 2. Setup local

```bash
git clone git@github.com:ivannoe-debug/delfos-api.git
cd delfos-api
nvm use
npm ci
cp .env.example .env       # edite os valores antes de subir o app
npm run start:dev
```

A API sobe em `http://localhost:3001`. Documentação Swagger em `http://localhost:3001/docs` (em ambiente não-produção).

---

## 3. Idioma

- **Código** (variáveis, classes, funções, comentários): inglês
- **Mensagens de commit**: inglês
- **Documentação** (`docs/`, `prompts/`, `README.md`, `AGENTS.md`, `DESIGN.md`): português brasileiro
- **Mensagens de erro voltadas ao usuário final**: português brasileiro (i18n preparado para EN)

---

## 4. Branches

- `main`: produção. Protegida.
- `develop`: integração. Protegida.
- `feat/<scope>-<short-description>`: nova feature
- `fix/<scope>-<short-description>`: correção de bug
- `chore/<scope>-<short-description>`: manutenção
- `docs/<scope>-<short-description>`: alteração só de documentação

PRs sempre vão para `develop`. Releases sobem `develop → main`.

---

## 5. Conventional Commits

Todo commit segue [Conventional Commits](https://www.conventionalcommits.org/). O `commitlint` valida no CI.

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Exemplos:

```
feat(connections): add encrypted credentials storage
fix(auth): refresh token rotation on logout
docs(adr): add ADR-0007 for no-cache phase 1
refactor(data-connectors): split fetcher into smaller services
chore(deps): bump nestjs to 10.4.0
```

Escopo recomendado é o nome do módulo afetado (`auth`, `connections`, `data-connectors`, `dashboards`, `reports`, `core`, `ci`, `docs`).

---

## 6. Antes de abrir PR

```bash
npm run format:check
npm run lint
npm test
npm run build
```

PR sem CI verde não entra.

---

## 7. Pull Request

- Título no formato Conventional (`feat(scope): ...`)
- Descrição responde: **o que mudou**, **por quê**, **como testar**, **impacto em outros módulos**
- Marcar **breaking changes** explicitamente (`BREAKING CHANGE:` no rodapé do commit)
- Linkar issue/ticket relacionado
- Atualizar documentação se a mudança afeta arquitetura, contrato público, segurança ou política
- Para qualquer decisão arquitetural relevante, criar **ADR** em `docs/adr/`

---

## 8. ADR (Architecture Decision Record)

Decisões arquiteturais relevantes viram ADR. Use o template em `docs/adr/adr-template.md`.

Considere ADR quando a mudança:

- altera a arquitetura ou a estrutura do projeto
- introduz ou substitui uma biblioteca importante
- muda a forma de autenticar, autorizar, persistir ou cachear
- afeta o consumo de APIs externas
- afeta multi-tenant, segurança ou LGPD

---

## 9. Code review

Toda PR exige pelo menos **1 aprovação humana**. Aprovações de bots/IAs não substituem revisão humana em mudanças sensíveis.

O revisor verifica:

- segue `AGENTS.md` e os documentos da `docs/`
- segue o Design System se a mudança tem UI
- não introduz dependência paga ou de licença restritiva
- não introduz arquivo monolítico
- testes cobrem caminhos críticos
- segurança preservada (credenciais, multi-tenant, log sem PII)

---

## 10. Reportar vulnerabilidades

Vulnerabilidades de segurança **não** devem virar issue pública. Ver `SECURITY.md`.

---

## 11. Cabeçalho SPDX

Arquivos-chave (entrypoints, módulos públicos, contratos) devem ter o cabeçalho:

```ts
// SPDX-License-Identifier: LicenseRef-Proprietary
// Copyright (c) 2026 [Razão Social].
```
