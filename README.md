# delfos-api

Backend do **Delfos Analytics** — API NestJS que atualmente fornece a foundation administrativa/declarativa consumida pelo frontend (`delfos-web`).

> **Estado atual**: o Delfos guarda configuração, catálogos, referências seguras de credenciais e auditoria interna. Não há consumo real de APIs/bancos de clientes, conectores reais, execução real de query, cache, fila ou scheduler.

---

> Nota de organização: este diretório deve ser publicado como repositório próprio. A pasta raiz `Delfos_Analytics_Project` é apenas staging de documentação/preparação.

---

Contratos HTTP: referência completa em [`docs/api-contracts.md`](./docs/api-contracts.md);
resumo rápido da foundation em [`docs/api-foundation-contracts.md`](./docs/api-foundation-contracts.md).

Os endpoints administrativos da foundation exigem temporariamente `x-delfos-admin-key`
configurado por `DELFOS_ADMIN_KEY`. Esse mecanismo existe apenas para desenvolvimento da
foundation e nao substitui a autenticacao final de producao.

## Stack

- **Node.js** 24 LTS
- **NestJS** 11
- **MongoDB** 8.0+ via Mongoose (backend padrão)
- **PostgreSQL** 16 via Kysely — backend dual opcional, ativado por `DELFOS_POSTGRES_URL` (ADR-0035 / ADR-0036)
- **Valkey** 8 — cache, desligado por padrão; ativado por `VALKEY_URL` (ADR-0035)
- **class-validator** + **class-transformer**
- **Jest**

Planejado/futuro, mas não implementado no estado atual: JWT/login/OAuth, conectores reais, chamadas externas para clientes, cache/fila/scheduler e serviço `delfos-connectors`.

> **Decisão arquitetural (ADR-0035 / ADR-0036)**: o banco primário do Delfos é
> **PostgreSQL** (camada de acesso **Kysely**) e o cache é **Valkey**. A migração
> faseada (P1–P7) está **concluída** e o backend roda em modo **dual**: o
> **MongoDB/Mongoose** segue como padrão e o **PostgreSQL** é ativado por
> `DELFOS_POSTGRES_URL`. A remoção definitiva do MongoDB (fase **P5**) está
> **adiada**, aguardando decisão humana de cutover. Estado das fases em
> [`docs/postgresql-migration-plan.md`](./docs/postgresql-migration-plan.md).

---

## Quick start

```bash
nvm use                       # ou fnm use
npm ci
cp .env.example .env          # edite os valores
docker compose up -d mongo    # backend padrão; ou aponte DELFOS_DATABASE_URL
npm run start:dev
```

A API sobe em `http://localhost:3000`. Swagger em `http://localhost:3000/docs`.

Para rodar no backend **PostgreSQL** (opcional): suba os serviços, defina
`DELFOS_POSTGRES_URL` no `.env` e aplique as migrations antes do `start:dev`.

```bash
docker compose up -d postgres valkey   # valkey é opcional (cache)
npm run migrate:latest                 # aplica as migrations Kysely
```

Para o fluxo local validado no Windows com MongoDB local, veja [`docs/local-development.md`](./docs/local-development.md).

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run start:dev` | desenvolvimento com watch |
| `npm run build` | build de produção |
| `npm start` | executa o build |
| `npm run seed:dev` | popula o banco local (MongoDB ou PostgreSQL conforme env) com dados fictícios da foundation |
| `npm run migrate:latest` | aplica as migrations Kysely no PostgreSQL |
| `npm run migrate:status` / `migrate:down` | status / rollback das migrations PostgreSQL |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm test` | testes unitários e de integração |
| `npm run test:cov` | cobertura |
| `npm run test:e2e` | E2E smoke da foundation (MongoDB em memória) |
| `npm run test:e2e:postgres` | E2E da foundation contra PostgreSQL efêmero |

O `npm run test:e2e` sobe o `AppModule` real contra um MongoDB em memória
(`mongodb-memory-server`), sem banco de produção, sem secrets reais e sem execução real de
conectores. O `npm run test:e2e:postgres` roda o mesmo conjunto contra um PostgreSQL
efêmero. No CI há serviço `postgres:16` e os jobs E2E rodam separados e opcionais.

---

## Antes de codar — leitura obrigatória

A lista canônica de leitura obrigatória antes de qualquer implementação está em
[`AGENTS.md`](./AGENTS.md) (seção inicial "Antes de qualquer implementação,
ler"). Consulte-a como fonte única — comece sempre pelo próprio `AGENTS.md`.

---

## Estrutura resumida

```
src/
├── config/                  # @nestjs/config + validacao customizada de ambiente
├── core/                    # logger, guards, interceptors, decorators, pipes
└── modules/
    ├── auth/                # admin-key temporário da foundation
    ├── tenants/             # multi-tenant (empresas)
    ├── users/
    ├── audit/
    ├── connections/         # configuração declarativa; sem chamada externa
    ├── credentials/         # credentialRef e proteção local de secrets
    ├── datasets/            # catálogo lógico declarativo
    ├── field-mappings/      # De/Para
    ├── query-definitions/   # camada semântica declarativa
    ├── dashboard-definitions/
    ├── report-definitions/
    ├── runtime/             # execution requests foundation; sem runtime real
    └── execution-preview/   # preview demo em memória
```

Detalhes completos em [`docs/project-structure.md`](./docs/project-structure.md).

---

## Repositório irmão

O frontend Flutter Web vive em [`delfos-web`](https://github.com/ivannoe-debug/delfos-web).

Contratos públicos (REST) entre os dois ficam em [`docs/api-contracts.md`](./docs/api-contracts.md).

---

## Convenções

- **Conventional Commits** — política atual, validada por `commitlint` no CI (job dedicado em
  pull requests). O CI via GitHub Actions executa lint, test e build como jobs obrigatórios,
  além de coverage e markdown lint, mais um job separado e opcional de E2E (`test:e2e`). Antes
  de PR/entrega, continue rodando localmente `npm run format:check`, `npm run lint`, `npm test`
  e `npm run build`. A inclusão de `format:check` no pipeline de CI permanece planejada.
- **Idioma**: código em EN, docs em PT-BR
- **Branches**: `feat/`, `fix/`, `chore/`, `docs/` → `main` (não existe branch `develop`)
- **PRs**: 1 aprovação humana mínima

Ver [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## Segurança

Reportar vulnerabilidades em [`SECURITY.md`](./SECURITY.md). **Não abra issue pública.**

---

## Licença

Proprietária — All Rights Reserved. Ver [`LICENSE`](./LICENSE).
