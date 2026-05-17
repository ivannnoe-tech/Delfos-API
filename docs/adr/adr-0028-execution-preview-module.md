# ADR-0028 — Módulo execution-preview (preview demo em memória)

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1
- **Implementação**: implementado

---

## Contexto

A foundation do `delfos-api` cataloga query-definitions e dashboard-definitions de
forma declarativa, sem execução real. Ainda assim, o produto e o `delfos-web`
precisam de uma forma de **demonstrar** como uma query ou um dashboard
apareceriam, sem conectar a fontes reais, sem conectores, sem cache e sem expor
dados de cliente.

Para isso foi implementado o módulo `execution-preview`. Faltava um ADR
registrando formalmente sua existência, suas garantias e seus limites, para deixar
explícito que ele **não é execução real** e não deve ser confundido com runtime.

## Decisão

O `delfos-api` mantém o módulo `execution-preview` como **gerador de dados
demonstrativos em memória**, seguindo a estrutura interna padrão dos módulos.

Garantias e contrato:

- O preview gera dados fictícios determinísticos em memória a partir das
  definições declarativas (metrics, dimensions, filters, type, timeField);
- toda resposta de preview é explicitamente identificada com `mode: "demo"`;
- o preview **não** executa query real, SQL, aggregation analítico, chamada
  externa, conector, cache, fila, worker ou scheduler;
- o preview **não** persiste resultado e **não** cria snapshot/cache;
- o preview **não** usa nem expõe `metadata`, `settings`, `widgets.options`,
  `filters.defaultValue` ou `filters.allowedValues`;
- a busca de query/dashboard definitions por `:id` é tenant-scoped;
- eventos internos de audit registram apenas o evento
  (`execution_preview.query.generated`, `execution_preview.dashboard.generated`),
  sem rows nem payload sensível;
- quando um widget não tem `queryDefinitionId` ou a referência não existe no
  mesmo tenant, a resposta continua `200` e apenas o widget fica `degraded`.

O `execution-preview` exige `x-delfos-admin-key` e `tenantId`, seguindo o padrão
de leitura/listagem da foundation; não exige role temporária.

## Alternativas consideradas

- **Não ter preview e mostrar apenas telas vazias no `delfos-web`** — rejeitada:
  prejudica a validação de UX e a demonstração do produto na fase de foundation.
- **Fazer o preview chamar fontes reais "só para desenvolvimento"** — rejeitada:
  violaria a fronteira de segurança da foundation (sem chamada externa, sem
  credenciais reais) e arriscaria vazar dados de cliente.
- **Persistir os resultados de preview para reuso** — rejeitada: o preview é
  efêmero por definição; persistir resultados criaria um pseudo-cache não
  governado e confundiria demo com dado real.

## Consequências

### Positivas

- O `delfos-web` pode validar fluxos visuais com dados plausíveis sem runtime
  real.
- A separação demo vs. real fica explícita via `mode: "demo"`.
- Nenhum risco de vazamento: o preview não toca fonte externa nem secrets.

### Negativas / trade-offs aceitos

- Os dados do preview não refletem dados reais; o produto deve deixar isso claro
  ao usuário.

### Neutras

- O preview real futuro (com dados reais) é de Fase 2 e dependerá de
  `delfos-connectors`, snapshots ou mecanismo aprovado por ADR.

## Impacto na Fase 1

- Formaliza um módulo já implementado e seus limites de segurança.
- Não altera contratos, schemas ou comportamento atuais.

## Impacto futuro / Fase 2

- O preview real substituirá/estenderá o preview demo apenas mediante runtime
  real aprovado; o contrato `mode` permanece o ponto de distinção.

## Referências

- `AGENTS.md`
- `docs/architecture.md`
- `docs/api-contracts.md`
- `docs/foundation-data-catalog.md`
- `docs/phase-1-scope.md`
- ADR-0011 — dashboard builder e widget model
- ADR-0014 — runtime execution requests foundation
- ADR-0024 — definição de Fase 1 e Fase 2
