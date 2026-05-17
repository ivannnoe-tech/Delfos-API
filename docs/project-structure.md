# Estrutura do Projeto — Delfos Analytics

> Status: documento normativo
> Escopo: organização atual dos repositórios.

---

## 1. Repositórios

O Delfos é dividido em dois repositórios principais:

- `delfos-api`: backend NestJS
- `delfos-web`: frontend Flutter Web

Ver ADR-0004.

---

## 2. Estrutura do delfos-api

Esta estrutura reflete o estado atual implementado. Pastas futuras como `delfos-connectors`, `dashboards`, `widgets`, `reports`, `exports`, `white-label`, `preferences`, `core/cache` e `permissions` nao devem ser criadas sem escopo aprovado.

```text
delfos-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── core/
│   │   ├── errors/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── dto/
│   │   └── utils/
│   └── modules/
│       ├── health/
│       ├── auth/
│       ├── audit/
│       ├── tenants/
│       ├── users/
│       ├── connections/
│       ├── credentials/
│       ├── datasets/
│       ├── field-mappings/
│       ├── query-definitions/
│       ├── dashboard-definitions/
│       ├── report-definitions/
│       ├── runtime/
│       │   └── bridge/
│       │       └── adapters/
│       └── execution-preview/
├── scripts/
├── docs/
├── prompts/
└── docker-compose.yml
```

### 2.1 src/modules/runtime/bridge/ (foundation-only)

O diretorio `src/modules/runtime/bridge/` contem a foundation da ponte futura entre o runtime do
`delfos-api` e o executor `delfos-connectors`. Estado atual: **foundation-only** — apenas types e
testes, sem provider NestJS registrado e sem dispatch.

- **bridge resolver**: prepara command em memoria a partir de um `ExecutionRequest`
  (`prepareCommand`), sem transporte nem dispatch real.
- **reference resolver**: resolve referencias declarativas e `credentialRef` de forma
  conservadora e source-agnostic, sem decrypt e sem acesso externo.
- **adapters/** (`runtime/bridge/adapters/`): adapters internos puros para os ports do reference
  resolver, ainda sem services/repositories reais e sem wiring em `RuntimeModule`.

Limite atual: nenhum componente do `bridge/` esta registrado como provider, exposto por endpoint
ou habilitado a disparar execucao real.

---

## 3. Estrutura de módulo backend

```text
modules/<module>/
├── controllers/
├── dto/
├── services/
├── repositories/
├── schemas/
├── guards/
├── mappers/
└── tests/
```

Criar apenas pastas necessárias. Não criar estrutura vazia sem uso.

Nao criar módulos de conector real, cache, fila, scheduler, login/JWT real ou dashboard runtime final apenas porque aparecem em documentos de visão futura.

---

## 4. Estrutura do delfos-web

Ver `delfos-web/docs/frontend-architecture.md`.

Resumo:

```text
lib/
├── main.dart
├── bootstrap.dart
├── app.dart
├── core/
├── shared/
└── features/
```

---

## 5. Regras de organização

- Arquivos pequenos e focados.
- A regra oficial e canônica de tamanho de arquivo é a de
  **`docs/quality-checklist.md` §0.1** (alvo até 300, permitido 301–450,
  justificado 451–600, proibido acima de 600). Consulte aquele documento como
  fonte única — não há faixa específica de tamanho duplicada aqui.
- Código compartilhado vai para `core` ou `shared` conforme contexto.
- Regra de negócio fica em service/use-case, não em controller/widget.
- Contratos públicos ficam em DTOs e documentação.
- Testes próximos do domínio ou em pasta dedicada, conforme padrão do stack.

---

## 6. Nomes de pastas

Backend TypeScript:

- kebab-case para arquivos e pastas
- PascalCase para classes
- camelCase para funções/variáveis

Frontend Dart:

- snake_case para arquivos
- PascalCase para classes
- camelCase para métodos/variáveis

---

## 7. Documentação

Documentos ficam em:

- raiz: `README.md`, `AGENTS.md`, `DESIGN.md`, `CONTRIBUTING.md`, `SECURITY.md`
- `docs/`: guias, políticas e contratos
- `docs/adr/`: decisões arquiteturais
- `prompts/`: templates de IA/CLI

---

## 8. O que evitar

- pasta `utils` genérica virando depósito
- componentes duplicados
- services gigantes
- controllers com lógica
- DTO reaproveitado indevidamente entre entrada e saída
- arquivos temporários versionados
- documentação desatualizada após decisão arquitetural
