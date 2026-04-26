# delfos-api

Backend do **Delfos Analytics** — API NestJS que serve o frontend (`delfos-web`) e consome as APIs custom dos clientes para alimentar dashboards, gráficos, KPIs e relatórios.

> **Fase 1**: o Delfos não armazena dados operacionais dos clientes. Todo dado vem em tempo real das APIs que cada cliente expõe. O banco do Delfos guarda apenas configuração.

---

> Nota de organização: este diretório deve ser publicado como repositório próprio. A pasta raiz `Delfos_Analytics_Project` é apenas staging de documentação/preparação.

---

## Stack

- **Node.js** 24 LTS
- **NestJS** 11
- **MongoDB** 8.0+ via Mongoose
- **JWT** próprio (access + refresh)
- **axios** (`@nestjs/axios`) para consumir APIs dos clientes
- **pino** com redact LGPD
- **class-validator** + **class-transformer**
- **Jest**

---

## Quick start

```bash
nvm use                       # ou fnm use
npm ci
cp .env.example .env          # edite os valores
docker compose up -d mongo    # ou aponte DELFOS_DATABASE_URL para outra instância
npm run start:dev
```

A API sobe em `http://localhost:3001`. Swagger em `http://localhost:3001/docs`.

Para o fluxo local validado no Windows com MongoDB local, veja [`docs/local-development.md`](./docs/local-development.md).

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run start:dev` | desenvolvimento com watch |
| `npm run build` | build de produção |
| `npm run start:prod` | executa o build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check (CI usa esse) |
| `npm test` | testes unitários |
| `npm run test:e2e` | testes end-to-end |
| `npm run test:cov` | cobertura |

---

## Antes de codar — leitura obrigatória

1. [`AGENTS.md`](./AGENTS.md)
2. [`DESIGN.md`](./DESIGN.md)
3. [`docs/architecture.md`](./docs/architecture.md)
4. [`docs/phase-1-scope.md`](./docs/phase-1-scope.md)
5. [`docs/data-access-policy.md`](./docs/data-access-policy.md)
6. [`docs/api-connectors.md`](./docs/api-connectors.md)
7. [`docs/security-checklist.md`](./docs/security-checklist.md)
8. [`docs/libraries-policy.md`](./docs/libraries-policy.md)
9. [`docs/development-guide.md`](./docs/development-guide.md)

---

## Estrutura resumida

```
src/
├── config/                  # @nestjs/config + Joi
├── core/                    # logger, guards, interceptors, decorators, pipes
└── modules/
    ├── auth/                # JWT access + refresh
    ├── tenants/             # multi-tenant (empresas)
    ├── users/
    ├── permissions/         # RBAC
    ├── audit/
    ├── connections/         # config das APIs dos clientes (criptografado)
    ├── datasets/            # endpoints/recursos por conexão
    ├── field-mappings/      # De/Para
    ├── data-connectors/     # ⭐ motor de consumo das APIs
    ├── dashboards/
    ├── widgets/
    ├── reports/
    ├── exports/             # CSV / XLSX / PDF
    ├── white-label/
    └── preferences/
```

Detalhes completos em [`docs/project-structure.md`](./docs/project-structure.md).

---

## Repositório irmão

O frontend Flutter Web vive em [`delfos-web`](https://github.com/ivannoe-debug/delfos-web).

Contratos públicos (REST) entre os dois ficam em [`docs/api-contracts.md`](./docs/api-contracts.md).

---

## Convenções

- **Conventional Commits** — `commitlint` no CI
- **Idioma**: código em EN, docs em PT-BR
- **Branches**: `feat/`, `fix/`, `chore/`, `docs/` → `develop` → `main`
- **PRs**: 1 aprovação humana mínima

Ver [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## Segurança

Reportar vulnerabilidades em [`SECURITY.md`](./SECURITY.md). **Não abra issue pública.**

---

## Licença

Proprietária — All Rights Reserved. Ver [`LICENSE`](./LICENSE).
