# ADR-0030 — Contrato uniforme de erro de API e contexto de requisição

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1 e Fase 2
- **Implementação**: implementado

---

## Contexto

Toda API consumida pelo `delfos-web` precisa de erros previsíveis e de um
mecanismo confiável para propagar o contexto multi-tenant (tenant e ator) por
requisição. Sem padronização, cada módulo tenderia a inventar formatos de erro
distintos e a passar `tenantId`/`actorId` de forma ad hoc.

O `delfos-api` já implementa, na camada `src/core/`:

- um filtro de exceção (`core/filters/http-exception.filter.ts`) que produz um
  envelope de erro uniforme;
- um interceptor de contexto (`core/interceptors/request-context.interceptor.ts`)
  que estabelece o contexto tenant/ator por requisição;
- um pipe de validação (`core/pipes/api-validation.pipe.ts`) sobre
  class-validator.

Faltava um ADR registrando formalmente esse contrato transversal.

## Decisão

O `delfos-api` adota um **contrato uniforme de erro** e um **contexto de
requisição por tenant/ator** como infraestrutura transversal, reutilizada por
todos os módulos.

### Envelope de erro

Todas as respostas de erro seguem um envelope único, com `statusCode`, `error`,
`message`, `details` (quando houver informação segura e acionável, especialmente
em validações), `requestId`/`correlationId`, `timestamp`, `path` e `method`.

Regras invariantes:

- erros inesperados `500` usam mensagem genérica;
- nenhuma resposta de erro retorna stack trace, secrets, env, payload sensível
  ou detalhes internos;
- o contrato de erro é o mesmo para todos os endpoints, garantido pelo filtro em
  `core/filters/`.

### Contexto de requisição

O interceptor em `core/interceptors/` estabelece, por requisição, o contexto de
tenant e ator a partir dos headers temporários (`x-delfos-tenant-id`,
`x-delfos-actor-id`, `x-delfos-actor-role`), validando-os. O `tenantId` é tratado
como **boundary de isolamento obrigatório**, nunca como filtro opcional.

A validação de entrada usa um pipe único (`core/pipes/api-validation.pipe.ts`)
sobre class-validator, garantindo que toda entrada seja validada antes de
alcançar a lógica do módulo.

## Alternativas consideradas

- **Cada módulo formatar seus próprios erros** — rejeitada: produz contratos
  inconsistentes e dificulta o consumo pelo `delfos-web`.
- **Propagar tenant/ator manualmente em cada service** — rejeitada: repetitivo,
  propenso a erro e arriscado para o isolamento multi-tenant.
- **Expor detalhes técnicos no erro para facilitar debug** — rejeitada: viola a
  política de segurança (sem stack trace/secrets para o cliente).

## Consequências

### Positivas

- O `delfos-web` consome um único contrato de erro previsível.
- O contexto tenant/ator é estabelecido de forma central e consistente.
- Reduz risco de vazamento de informação em respostas de erro.

### Negativas / trade-offs aceitos

- Mudanças no envelope de erro são breaking changes e exigem coordenação com o
  `delfos-web`.

### Neutras

- O contrato é independente do mecanismo de autenticação; a troca futura da
  admin-key por JWT (ADR-0006) não muda o envelope de erro.

## Impacto na Fase 1

- Formaliza infraestrutura transversal já implementada em `src/core/`.
- Não altera comportamento atual — apenas o documenta.

## Impacto futuro / Fase 2

- O envelope de erro e o contexto de requisição permanecem válidos quando o auth
  real (JWT) e o runtime real forem introduzidos.

## Relação com outros documentos

- `AGENTS.md`
- `docs/architecture.md`
- `docs/api-contracts.md`
- `docs/foundation-auth-and-errors.md`
- ADR-0016 — autenticação temporária por admin-key
- ADR-0024 — definição de Fase 1 e Fase 2
