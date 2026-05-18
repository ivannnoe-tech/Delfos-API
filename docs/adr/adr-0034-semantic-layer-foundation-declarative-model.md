# ADR-0034 — Semantic Layer Foundation (modelo declarativo)

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api (modelo) + delfos-web (UX)
- **Fase impactada**: Fase 1
- **Implementação**: iniciada nesta entrega

---

## Contexto

O `delfos-web` já entregou UX premium para conceitos semânticos (Semantic
Foundation UX, Semantic Analytics Builder, Explainability UX, Template UX), mas
não existia um modelo declarativo oficial na API para representar a camada
semântica do Delfos: measures, dimensions, semantic types, glossário, ownership,
certificação, qualidade semântica e metadados de governança.

Sem um contrato declarativo oficial, cada consumidor (builders, explainability,
templates, IA futura) inventaria sua própria representação — drift garantido.

## Decisão

A Fase 1 cria a **Semantic Layer Foundation** como um **modelo puramente
declarativo, metadata-only** no `delfos-api`, exposto por endpoints
administrativos e consumido pelo `delfos-web`.

Escopo do modelo:

- Entidade agregada `SemanticModel` por tenant, com arrays internos
  `measures[]`, `dimensions[]` e `glossaryTerms[]` — mesmo padrão de
  `dashboard-definitions` (raiz + sub-schemas aninhados). Evita-se criar
  múltiplos módulos/coleções nesta fase.
- Governança declarativa: `status`, `owner`, `steward`, `certificationOwner`,
  `tags`, `quality` (`score`/`level`/`warnings`).
- Tipos semânticos como enum declarativo (`currency`, `percentage`, `date`,
  `customer`, `product`, `city`, `status`, `identifier`, etc.).

A camada é **somente declarativa**:

- **não** executa measures/dimensions;
- **não** gera SQL nem query;
- **não** resolve contra datasets reais, conexões ou credenciais;
- **não** materializa, agrega ou faz cache;
- **não** usa IA, embedding ou RAG;
- **não** aciona connectors nem dispatch;
- valida apenas shape, `tenantId`, chaves estáveis, unicidade e enums.

Autenticação permanece a temporária `x-delfos-admin-key` (Fase 1), com
`tenantId` como fronteira obrigatória e `viewer` somente leitura.

## Alternativas consideradas

- **Múltiplos módulos** (`semantic-measures`, `semantic-dimensions`,
  `semantic-glossary` separados) — descartada nesta fase: overengineering;
  o agregado `SemanticModel` cobre o caso de uso declarativo.
- **Adiar o modelo e manter só UX no Web** — descartada: mantém o drift entre
  UX premium e contrato inexistente.
- **Semantic engine declarativa + resolução** — descartada: é Fase 2.

## Consequências

### Positivas

- Contrato declarativo oficial para governança, explainability, templates e IA
  futura consumirem.
- Base para um query builder semântico futuro sem inventar representação.

### Negativas / trade-offs aceitos

- O modelo descreve semântica mas não a executa — consumidores precisam tratar
  measures/dimensions como metadados, não como capacidade de runtime.

### Neutras

- Materialização real, segurança row/column e resolução em runtime dependem de
  ADR de promoção e da Fase 2.

## Impacto na Fase 1

- Criar o módulo `semantic-models` no `delfos-api` (schema, DTOs, controller,
  service, repository, sanitizer, testes) espelhando `dashboard-definitions`.
- Criar a feature `semantic_models` no `delfos-web` (catálogo declarativo,
  detail panel, form drawer) reutilizando os componentes semânticos existentes.
- Nenhuma capacidade de execução, SQL, connector, decrypt ou IA é criada.

## Impacto futuro / Fase 2

- Resolução real de measures/dimensions contra datasets, materialização,
  segurança em runtime e grounding de IA dependem da Fase 2 e de ADR próprio.
- ADR-0021 (credential decryption) e ADR-0022 (connector dispatch) permanecem
  `Proposed` — esta ADR não os altera.

## Relação com outros documentos

- ADR-0024 — definição de Fase 1 e Fase 2
- ADR-0021 / ADR-0022 — gates de Fase 2 (`Proposed`, inalterados)
- `docs/phase-1-scope.md`
- `docs/references/consolidated/semantic-layer-roadmap.md` (conceitual/futuro)
- `delfos-web/docs/web-execution-phase-checkpoint.md`
