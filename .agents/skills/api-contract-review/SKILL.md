---
name: delfos-api-contract-review
description: Revise endpoints, DTOs, OpenAPI/Swagger, paginação, filtros, erros HTTP e contratos entre delfos-api e delfos-web.
---

# Skill — Revisão de contratos da API

Use esta skill quando a tarefa envolver endpoints, DTOs, payloads, OpenAPI/Swagger, erros HTTP, paginação, filtros ou contratos entre `delfos-api` e `delfos-web`.

## Quando não usar

Não use para UI isolada, alteração visual, modelagem de banco sem endpoint ou texto documental sem contrato público.

## Leitura obrigatória antes de agir

- `AGENTS.md`
- `docs/api-contracts.md`
- `docs/api-connectors.md`
- `docs/data-access-policy.md`
- `docs/de-para.md`
- `docs/security-checklist.md`
- `prompts/api-connector-review-prompt.md`

## Objetivo

Garantir que contratos sejam explícitos, versionáveis, seguros, testáveis e compatíveis com o frontend Flutter Web.

## Fluxo obrigatório

1. Identificar consumidor do contrato: frontend, integração interna ou cliente externo.
2. Definir request, response, paginação, filtros, ordenação e erros.
3. Validar se há De/Para quando o contrato tocar campos do cliente.
4. Garantir DTOs separados de input/output.
5. Atualizar OpenAPI/Swagger junto com o código.
6. Avaliar impacto no `delfos-web` antes de alterar contrato existente.
7. Prever testes de sucesso, validação, permissão e erro externo.

## Regras obrigatórias

- Todo endpoint deve ter DTO de request e response.
- Todo DTO deve ser validado.
- Erros devem ser padronizados.
- Campos opcionais devem ter semântica clara.
- IDs internos não devem expor detalhes sensíveis.
- Contratos não podem depender de nomes de campos específicos do cliente sem passar por De/Para.
- Não quebrar contrato público sem registrar impacto e migração.

## Modelo de erro esperado

```json
{
  "code": "STRING_ESTAVEL",
  "message": "Mensagem segura para usuário ou operador",
  "details": {},
  "requestId": "correlation-id"
}
```

Não retornar stack trace, token, payload sensível ou erro cru da API do cliente.

## Checklist para endpoints

- O endpoint pertence à Fase 1?
- O contrato está documentado em OpenAPI?
- Há DTOs separados para input/output?
- Há validação de tenant/permissão?
- Há tratamento de erro padronizado?
- Há testes para sucesso, validação, permissão e erro externo?
- O frontend consegue consumir sem conhecer regra interna?
- O contrato não força acesso direto ao banco do cliente?

## Saída esperada

- resumo do contrato criado/alterado;
- impactos no frontend;
- erros padronizados definidos;
- testes necessários/executados;
- documentação atualizada.
