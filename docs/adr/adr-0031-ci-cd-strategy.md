# ADR-0031 — Estratégia de CI/CD

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1 e Fase 2
- **Implementação**: implementado

---

## Contexto

O `delfos-api` é desenvolvido por humanos e agentes e precisa de uma rede de
segurança automatizada que impeça regressões antes do merge. Sem CI obrigatório,
a qualidade dependeria apenas de execução local e disciplina manual.

O repositório já adota GitHub Actions e proteção de branch. Faltava um ADR
registrando formalmente a estratégia de CI/CD: o que é obrigatório, o que é
opcional e como a `main` é protegida.

## Decisão

O `delfos-api` adota a seguinte estratégia de integração contínua via GitHub
Actions:

### Jobs obrigatórios

- `lint` — ESLint;
- `test` — Jest (unit/integration);
- `build` — `nest build`.

Esses três jobs são **obrigatórios** e bloqueiam o merge se falharem.

### Jobs separados e opcionais

- `E2E` — smoke `test:e2e` contra `mongodb-memory-server` (sem banco de produção,
  sem secrets reais, sem execução real de conector);
- `Commitlint` — verificação de Conventional Commits;
- `Markdown Lint` — lint de Markdown.

Esses jobs rodam separadamente e não bloqueiam o merge nesta fase, mas devem ser
mantidos verdes.

### Branch e proteção

- O modelo de branch vai direto para `main` (não existe branch `develop`);
  branches de trabalho usam os prefixos `feat/`, `fix/`, `chore/`, `docs/`.
- A `main` é protegida: exige PR com os jobs obrigatórios verdes e ao menos
  **1 aprovação humana**.
- Commits seguem **Conventional Commits**.

Antes de abrir PR, o fluxo local recomendado continua sendo `format:check`,
`lint`, `test` e `build`.

## Alternativas consideradas

- **Não ter CI e confiar apenas em validação local** — rejeitada: não escala e
  não protege contra regressões de terceiros.
- **Tornar E2E/Commitlint/Markdown Lint obrigatórios desde já** — rejeitada nesta
  fase: mantê-los separados e opcionais reduz atrito enquanto a foundation
  estabiliza; podem ser promovidos a obrigatórios por decisão futura.
- **Adotar um branch `develop` de integração** — rejeitada: o fluxo direto para
  `main` com proteção é suficiente para o tamanho atual do projeto.

## Consequências

### Positivas

- Regressões de lint, teste e build são barradas antes do merge.
- A `main` permanece sempre construível e testada.
- Conventional Commits e revisão humana ficam garantidos por processo.

### Negativas / trade-offs aceitos

- Jobs opcionais podem regredir sem bloquear o merge até serem promovidos.

### Neutras

- A promoção de jobs opcionais a obrigatórios é uma decisão incremental futura.
- Esta ADR cobre CI; o CD real (deploy automatizado) depende de decisões de
  Fase 2, dado que o produto está em fase de foundation.

## Impacto na Fase 1

- Formaliza a estratégia de CI já em uso e a proteção de `main`.

## Impacto futuro / Fase 2

- O CD real e a promoção de jobs opcionais a obrigatórios podem ser tratados por
  ADRs futuros quando o produto avançar para produção.

## Relação com outros documentos

- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/branch-protection-checklist.md`
- `docs/testing-guide.md`
- `docs/quality-checklist.md`
- ADR-0024 — definição de Fase 1 e Fase 2
