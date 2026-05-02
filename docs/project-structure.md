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

Esta estrutura reflete o estado atual implementado. Pastas futuras como `data-connectors`, `dashboards`, `widgets`, `reports`, `exports`, `white-label`, `preferences`, `core/cache` e `permissions` nao devem ser criadas sem escopo aprovado.

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
│       └── execution-preview/
├── scripts/
├── docs/
├── prompts/
└── docker-compose.yml
```

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
- Sem arquivo acima de 500 linhas sem refatorar/justificar.
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
