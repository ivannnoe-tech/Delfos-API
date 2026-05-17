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
| `npm test` | testes unitários/integração (406 testes) |
| `npm run test:cov` | cobertura |
| `npm run test:e2e` | E2E smoke da foundation (12 testes, MongoDB em memória) |

O `npm run test:e2e` sobe o `AppModule` real contra um MongoDB em memória
(`mongodb-memory-server`), sem banco de produção, sem secrets reais e sem execução real de
conectores. No CI ele roda em job separado e opcional.

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

- **Conventional Commits** — politica atual; o CI via GitHub Actions executa lint, test e
  build como jobs obrigatorios, mais um job separado e opcional de E2E (`test:e2e`). Antes de
  PR/entrega, continue rodando localmente `npm run format:check`, `npm run lint`, `npm test` e
  `npm run build`. `commitlint` e a ampliacao do CI com `format:check` permanecem planejados.
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
