---
name: delfos-api-nestjs-structure
description: Use ao criar ou reorganizar a estrutura NestJS do delfos-api, incluindo módulos, controllers, services, DTOs, repositories, schemas, config, healthcheck, Swagger/OpenAPI e testes base.
---

# Skill — Estrutura NestJS do delfos-api

Use esta skill quando a tarefa envolver criação, reorganização ou revisão da base técnica do `delfos-api`.

## Leitura obrigatória antes de agir

- `AGENTS.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/project-structure.md`
- `docs/development-guide.md`
- `docs/phase-1-scope.md`
- `docs/security-checklist.md`
- `docs/libraries-policy.md`

## Objetivo

Criar uma base NestJS limpa, modular, testável e pronta para evoluir sem implementar regra de negócio prematura.

## Stack esperada

- Node.js 24 LTS
- NestJS 11
- TypeScript strict
- MongoDB 8.0+ com Mongoose
- Jest para testes
- Swagger/OpenAPI para contratos HTTP
- validação com `class-validator` e `class-transformer`
- logs estruturados e seguros

## Estrutura base recomendada

```text
src/
├── main.ts
├── app.module.ts
├── config/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── database/
├── modules/
│   ├── health/
│   ├── auth/
│   ├── tenants/
│   ├── users/
│   ├── permissions/
│   ├── connections/
│   ├── datasets/
│   ├── field-mappings/
│   ├── dashboards/
│   ├── widgets/
│   ├── reports/
│   └── audit/
└── docs/
```

## Regras de implementação

- Criar módulos pequenos, com responsabilidade clara.
- Não misturar controller, service, repository, schema e DTO no mesmo arquivo.
- Não criar arquivos acima de 500 linhas.
- Não adicionar biblioteca fora da política sem revisão.
- Configuração deve vir de `.env` validado por schema.
- Nunca hardcodar secrets, URLs sensíveis ou credenciais.
- Todo endpoint deve ter DTOs explícitos.
- Todo módulo novo deve prever testes.
- Swagger/OpenAPI deve refletir o contrato real, não um rascunho genérico.
- Healthcheck deve validar pelo menos processo e conectividade essencial.

## Fase 1: limites obrigatórios

- Não implementar ingestão própria de dados operacionais do cliente.
- Não acessar banco de dados do cliente diretamente.
- Não criar Redis, filas ou cache analítico persistente.
- MongoDB guarda configuração/metadados do Delfos, não dado operacional bruto do cliente.
- Integrações com clientes devem seguir `docs/api-connectors.md`.

## Checklist de saída

- `npm run lint` planejado/configurado.
- `npm run test` planejado/configurado.
- `npm run build` planejado/configurado.
- estrutura separa módulos e responsabilidades.
- contratos HTTP documentados.
- configuração validada.
- nenhum secret ou dado real em código/log.
- documentação atualizada quando a estrutura mudar.
