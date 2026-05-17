# ADR-0027 — Modelo do módulo report-definitions

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1 e Fase 2, como decisão arquitetural e de produto
- **Implementação**: implementado

---

## Contexto

A foundation do `delfos-api` já implementa catálogos declarativos para datasets,
query-definitions e dashboard-definitions. O produto também precisa de
**relatórios** configuráveis — geralmente tabulares, com filtros, parâmetros,
blocos e opções declarativas de exportação.

À época da ADR-0011 (dashboard builder e widget model), o foco era o eixo de
dashboards. O módulo `report-definitions` foi posteriormente implementado seguindo
o mesmo padrão declarativo dos demais catálogos da foundation: ele armazena
configuração, referencia outros recursos por id e **não executa nada**. Faltava um
ADR registrando formalmente esse modelo, de forma análoga à ADR-0011 para
dashboards.

O estado atual é foundation administrativa/declarativa: o `report-definitions`
expõe contratos administrativos protegidos por `x-delfos-admin-key`, persiste
definições declarativas e não gera arquivo, não executa query e não agenda envio.

## Decisão

O `delfos-api` mantém o módulo `report-definitions` como **catálogo declarativo de
relatórios**, seguindo a mesma estrutura interna dos demais módulos
(`controllers/`, `services/`, `repositories/`, `schemas/`, `dto/`, `tests/`).

Uma `reportDefinition` descreve, de forma declarativa e tenant-scoped:

- `tenantId` (boundary obrigatório de isolamento), `reportKey` (único por tenant,
  estável para integrações) e `name`;
- `layout`, `sections` e `blocks` que organizam o relatório;
- `filters` e `parameters` declarativos;
- `exportOptions` declarativas (sem geração real de arquivo);
- referências **opcionais** `queryDefinitionId` e `dashboardDefinitionId`, que são
  apenas referências declarativas — a existência real não é validada, para
  permitir montagem incremental dos cadastros;
- `tags`, `metadata` e `settings` seguros.

Regras invariantes:

- `reportDefinition` não conhece banco, API externa, conector ou credencial.
- `metadata`, `settings`, `exportOptions`, `blocks.options`,
  `filters.defaultValue`/`allowedValues` e `parameters.defaultValue`/`allowedValues`
  são sanitizados: não podem conter secrets, tokens, senhas, connection strings
  reais, authorization headers ou valores de alta entropia.
- `DELETE` é soft delete — o recurso passa para `status: "archived"`.
- Eventos internos de audit registram apenas `reportKey`, `status`, `visibility`,
  referências declarativas e contadores de seções/blocos — nunca payload bruto.

Nenhum endpoint gera PDF, Excel ou CSV, executa query, renderiza relatório, envia
e-mail, agenda job, cria fila, scheduler, cache, worker, conector ou chamada
externa.

## Alternativas consideradas

- **Modelar relatórios como um caso particular de dashboard-definitions** —
  rejeitada: relatórios têm semântica própria (blocos, parâmetros, exportação) e
  misturá-los reduziria a clareza de ambos os catálogos.
- **Não ter um catálogo de relatórios na Fase 1 e adiar tudo para a Fase 2** —
  rejeitada: a foundation se beneficia de já cadastrar e versionar definições
  declarativas de relatório, sem custo de execução real.
- **Validar de imediato a existência de `queryDefinitionId`/`dashboardDefinitionId`**
  — rejeitada nesta fase: validação rígida impediria a montagem incremental dos
  cadastros; a integridade pode ser reforçada quando houver runtime real.

## Consequências

### Positivas

- Relatórios passam a ter um modelo declarativo estruturado e governável,
  consistente com query/dashboard definitions.
- Mantém o desacoplamento: a `reportDefinition` não acessa fonte externa.
- Permite cadastro e versionamento de relatórios antes de qualquer runtime real.

### Negativas / trade-offs aceitos

- Referências declarativas não validadas podem apontar para recursos inexistentes
  até haver validação de integridade futura.
- Exige manutenção de mais um catálogo declarativo.

### Neutras

- A geração real de arquivos, agendamento e envio são de Fase 2 e dependem de ADRs
  próprios.

## Impacto na Fase 1

- Formaliza o modelo de um módulo já implementado como foundation declarativa.
- Não altera contratos, schemas ou comportamento atuais — apenas os documenta.

## Impacto futuro / Fase 2

- O runtime real de relatórios (geração de PDF/Excel/CSV, agendamento, envio)
  dependerá de decisão e ADR específicos de Fase 2, alinhados a ADR-0024.

## Referências

- `AGENTS.md`
- `docs/architecture.md`
- `docs/foundation-data-catalog.md`
- `docs/api-contracts.md`
- `docs/phase-1-scope.md`
- ADR-0011 — dashboard builder e widget model
- ADR-0024 — definição de Fase 1 e Fase 2
- ADR-0029 — modelo declarativo de field-mappings / De-Para
