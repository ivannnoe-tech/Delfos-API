# delfos-api

Backend do **Delfos Analytics** — API NestJS que atualmente fornece a foundation administrativa/declarativa consumida pelo frontend (`delfos-web`).

> **Estado atual**: o Delfos guarda configuração, catálogos, referências seguras de credenciais e auditoria interna. Não há consumo real de APIs/bancos de clientes, conectores reais, execução real de query, cache, fila ou scheduler.

---

> Nota de organização: este diretório deve ser publicado como repositório próprio. A pasta raiz `Delfos_Analytics_Project` é apenas staging de documentação/preparação.

---

Contratos HTTP atuais da foundation MongoDB/configuracao: [`docs/api-foundation-contracts.md`](./docs/api-foundation-contracts.md).

Os endpoints administrativos da foundation exigem temporariamente `x-delfos-admin-key`
configurado por `DELFOS_ADMIN_KEY`. Esse mecanismo existe apenas para desenvolvimento da
foundation e nao substitui a autenticacao final de producao.

## Stack

- **Node.js** 24 LTS
- **NestJS** 11
- **MongoDB** 8.0+ via Mongoose
- **class-validator** + **class-transformer**
- **Jest**

Planejado/futuro, mas não implementado no estado atual: JWT/login/OAuth, conectores reais, chamadas externas para clientes, cache/fila/scheduler e serviço `delfos-connectors`.

---

## Quick start

```bash
nvm use                       # ou fnm use
npm ci
cp .env.example .env          # edite os valores
docker compose up -d mongo    # ou aponte DELFOS_DATABASE_URL para outra instância
npm run start:dev
```

A API sobe em `http://localhost:3000`. Swagger em `http://localhost:3000/docs`.

Para o fluxo local validado no Windows com MongoDB local, veja [`docs/local-development.md`](./docs/local-development.md).

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run start:dev` | desenvolvimento com watch |
| `npm run build` | build de produção |
| `npm start` | executa o build |
| `npm run seed:dev` | popula MongoDB local com dados fictícios da foundation |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm test` | testes unitários |
| `npm run test:cov` | cobertura |

Testes end-to-end (`test:e2e`) são planejados/futuros; não há script operacional nesta etapa da foundation.

---

## Antes de codar — leitura obrigatória

1. [`AGENTS.md`](./AGENTS.md)
2. [`DESIGN.md`](./DESIGN.md)
3. [`docs/architecture.md`](./docs/architecture.md)
4. [`docs/phase-1-scope.md`](./docs/phase-1-scope.md)
5. [`docs/data-access-policy.md`](./docs/data-access-policy.md)
6. [`docs/api-connectors.md`](./docs/api-connectors.md) — conceitual/futuro; não autoriza implementação atual
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
    └── execution-preview/   # preview demo em memória
```

Detalhes completos em [`docs/project-structure.md`](./docs/project-structure.md).

---

## Repositório irmão

O frontend Flutter Web vive em [`delfos-web`](https://github.com/ivannoe-debug/delfos-web).

Contratos públicos (REST) entre os dois ficam em [`docs/api-contracts.md`](./docs/api-contracts.md).

---

## Convenções

- **Conventional Commits** — política atual; `commitlint`/CI estão planejados, ainda não configurados
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
