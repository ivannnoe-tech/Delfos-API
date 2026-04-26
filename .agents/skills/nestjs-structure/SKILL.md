---
name: delfos-api-nestjs-structure
description: "Crie ou reorganize estrutura NestJS do delfos-api: módulos, controllers, services, DTOs, config, healthcheck, Swagger e testes base."
---

# Skill — Estrutura NestJS do delfos-api

Use esta skill quando a tarefa envolver criação, reorganização ou revisão da base técnica do `delfos-api`.

## Quando não usar

Não use para regra de negócio específica, layout do frontend, ajustes de texto ou modelagem MongoDB isolada. Para planejar refatoração grande, use também `delfos-api-execution-plan`.

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

## Fluxo obrigatório

1. Verificar se a estrutura proposta já existe ou tem padrão equivalente.
2. Definir módulos pequenos com responsabilidade clara.
3. Criar contratos, DTOs, pipes, filtros e interceptors reutilizáveis em `common/` quando aplicável.
4. Configurar `.env` validado por schema antes de depender de variáveis.
5. Criar healthcheck mínimo sem expor dados sensíveis.
6. Garantir Swagger/OpenAPI alinhado ao contrato real.
7. Prever testes desde o início.

## Regras de implementação

- Não misturar controller, service, repository, schema e DTO no mesmo arquivo.
- Não criar arquivos acima de 500 linhas.
- Não adicionar biblioteca fora da política sem revisão.
- Nunca hardcodar secrets, URLs sensíveis ou credenciais.
- Todo endpoint deve ter DTOs explícitos.
- Todo módulo novo deve prever testes proporcionais.
- Logs não podem expor tokens, payloads sensíveis ou stack trace para usuário.

## Limites da Fase 1

- Não implementar ingestão própria de dados operacionais do cliente.
- Não acessar banco de dados do cliente diretamente.
- Não criar Redis, filas ou cache analítico persistente.
- MongoDB guarda configuração/metadados do Delfos, não dado operacional bruto do cliente.
- Integrações com clientes devem seguir `docs/api-connectors.md`.

## Saída esperada

Ao finalizar, informar:

- módulos/arquivos criados ou alterados;
- decisões técnicas tomadas;
- comandos executados ou pendentes;
- riscos conhecidos;
- documentação atualizada.

## Checklist de saída

- `npm run lint` planejado/executado quando existir.
- `npm run test` planejado/executado quando existir.
- `npm run build` planejado/executado quando existir.
- Estrutura separa módulos e responsabilidades.
- Contratos HTTP documentados.
- Configuração validada.
- Nenhum secret ou dado real em código/log.
