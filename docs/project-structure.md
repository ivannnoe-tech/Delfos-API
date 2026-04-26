# Estrutura do Projeto — Delfos Analytics

> Status: documento normativo  
> Escopo: organização inicial dos repositórios.

---

## 1. Repositórios

O Delfos é dividido em dois repositórios principais:

- `delfos-api`: backend NestJS
- `delfos-web`: frontend Flutter Web

Ver ADR-0004.

---

## 2. Estrutura do delfos-api

```text
delfos-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── core/
│   │   ├── auth/
│   │   ├── cache/
│   │   ├── decorators/
│   │   ├── errors/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── logger/
│   │   ├── pipes/
│   │   └── utils/
│   └── modules/
│       ├── auth/
│       ├── tenants/
│       ├── users/
│       ├── permissions/
│       ├── audit/
│       ├── connections/
│       ├── datasets/
│       ├── field-mappings/
│       ├── data-connectors/
│       ├── dashboards/
│       ├── widgets/
│       ├── reports/
│       ├── exports/
│       ├── white-label/
│       └── preferences/
├── test/
├── docs/
├── prompts/
├── .github/workflows/
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
