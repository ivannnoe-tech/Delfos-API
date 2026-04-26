---
name: delfos-api-contract-review
description: Use para criar ou revisar endpoints, DTOs, OpenAPI/Swagger, versionamento, contratos entre delfos-api e delfos-web, e integrações consumidas pelo frontend.
---

# Skill — Revisão de contratos da API

Use esta skill quando a tarefa envolver endpoints, DTOs, payloads, OpenAPI/Swagger, erros HTTP, paginação, filtros ou contratos entre `delfos-api` e `delfos-web`.

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

## Regras obrigatórias

- Todo endpoint deve ter DTO de request e response.
- Todo DTO deve ser validado.
- Erros devem ser padronizados.
- Paginação, ordenação e filtros devem ser explícitos.
- Campos opcionais devem ter semântica clara.
- IDs internos não devem expor detalhes sensíveis.
- Contratos não podem depender de nomes de campos específicos do cliente sem passar por De/Para.
- Não quebrar contrato público sem registrar impacto e migração.
- OpenAPI deve ser atualizado junto com o código.

## Modelo de erro esperado

Garantir resposta de erro consistente, com pelo menos:

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

## Checklist para integrações com APIs de clientes

- Base URL e credenciais vêm de configuração segura.
- Headers e parâmetros são validados.
- Timeout e retry foram considerados.
- Rate limit foi considerado.
- Payload do cliente é normalizado antes de chegar no frontend.
- De/Para está explícito.
- Logs não expõem payload sensível.
