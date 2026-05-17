# Metabase — Anti-padrões e Decisões a Evitar

> Tipo: referência estratégica · Produto estudado: Metabase · Status: conceitual/futuro — não autoriza implementação

---

Este documento registra o que **não** queremos reproduzir no Delfos. Não é crítica ao Metabase
— é leitura defensiva: cada item é uma armadilha conhecida que a arquitetura do Delfos pode evitar.

---

## Problemas observados

### Multi-tenancy emulado por permissões

No Metabase, o isolamento entre clientes depende de permissões, grupos e sandboxing sobre uma
instância compartilhada. Não há `tenantId` como fronteira de modelo de dados.

- **Risco**: uma permissão mal configurada vaza dados entre clientes.
- **Decisão Delfos**: `tenantId` é fronteira de isolamento **obrigatória** em toda query
  multi-tenant — nunca um filtro opcional (ver ADR-0009). Isolamento é estrutural, não configuracional.

### Fan-out de queries internas

Rotas da API interna do Metabase chegam a disparar centenas de queries SQL por request
(`GET /api/database` ~915 chamadas; `GET /api/dashboard` ~333).

- **Risco**: latência alta, carga imprevisível no banco de aplicação.
- **Decisão Delfos**: manter contratos de leitura **previsíveis e paginados**. O `delfos-api`
  já usa DTOs de paginação compartilhados — preservar essa disciplina e evitar N+1.

### Performance degradada em datasets grandes

Datasets muito grandes degradam a experiência; o workaround comum é aplicar `LIMIT`. Editar o
Data Model em bancos com muitas tabelas pode levar mais de 1 minuto.

- **Risco**: a ferramenta vira gargalo em vez de habilitador.
- **Decisão Delfos**: tratar paginação, limites e carga de catálogo como requisito de design
  desde a fase foundation, não como ajuste posterior.

---

## UX ruim

### Mensagens de erro inconsistentes

Estados de erro variam entre telas; queries com falha exibem mensagens técnicas cruas, pouco
úteis para usuários de negócio.

- **Decisão Delfos**: telas de dados **devem** implementar `DelfosLoadingState`,
  `DelfosEmptyState`, `DelfosErrorState` e `DelfosPermissionState` de forma padronizada.

### Mobile como segunda classe

Dashboards são desenhados para desktop; a experiência mobile é secundária e o layout responsivo
é limitado.

- **Decisão Delfos**: o design system Flutter Web trata responsividade como base; light e dark
  themes são validados antes de qualquer PR.

### Profundidade de menu em ações de drill

Algumas ações exigem navegar menus aninhados, escondendo capacidades de usuários novos.

- **Decisão Delfos**: ações contextuais saem do design system (`shared/widgets`) e devem
  priorizar descoberta direta.

---

## Complexidade excessiva

### Camada semântica leve demais

Models e Metrics são úteis mas não substituem ferramentas dedicadas (dbt, Cube). Equipes acabam
mantendo lógica de negócio duplicada entre Models, SQL nativo e ferramentas externas.

- **Decisão Delfos**: se evoluir uma semantic layer (ver `./ideas-for-delfos.md`), defini-la com
  contrato claro e fonte única — não como camada parcial que convive com duplicação.

### Dois caminhos de query com regras diferentes

Query builder gráfico e SQL nativo têm capacidades distintas (ex.: drill-through limitado em SQL
puro). O usuário precisa saber qual caminho escolher para obter quais recursos.

- **Decisão Delfos**: se houver mais de um modo de definição de query, manter o IR declarativo
  como base comum para que recursos não dependam do caminho escolhido.

---

## Gargalos

| Gargalo | Causa raiz | Mitigação no Delfos |
|---|---|---|
| Catálogo lento | Carregar metadados de bancos enormes de uma vez | Paginação e carga incremental de catálogo |
| Excesso de queries por request | APIs com fan-out / N+1 | Contratos de leitura previsíveis e paginados |
| Dashboards lentos | Sem cache ou cache mal configurado | Decidir cache por ADR quando houver execução real (ADR-0007) |
| Escala horizontal difícil | Monólito JAR | Delfos já é multi-repo / multi-serviço |

---

## Problemas arquiteturais

### Monólito empacotado em JAR único

Simplifica deploy, mas acopla frontend e backend e dificulta escalar componentes de forma
independente.

- **Decisão Delfos**: arquitetura deliberadamente multi-repo (`delfos-api`, `delfos-web`,
  `delfos-connectors`), cada um publicável de forma independente.

### Recursos críticos de segurança atrás de paywall

Row/column security, SSO e embedding interativo são pagos. Quem usa a edição OSS não tem
isolamento fino de dados.

- **Decisão Delfos**: isolamento e governança (`tenantId`, `credentialRef`, sanitização de
  metadados, auditoria) são **invariantes de base**, nunca add-ons comerciais.

### Adicionar cache/scheduler cedo aumenta a superfície operacional

O scheduler de subscriptions/alerts e o cache de resultados acrescentam estado e modos de falha.

- **Decisão Delfos**: ADR-0007 decidiu **não** usar cache/Redis na Fase 1. Manter a decisão até
  existir execução real que a justifique — não introduzir fila/worker/scheduler por antecipação.

---

## Decisões que NÃO queremos reproduzir

| Decisão Metabase | Por que evitar no Delfos |
|---|---|
| Multi-tenancy por permissão sobre instância compartilhada | Delfos exige `tenantId` como fronteira estrutural |
| Frontend e backend acoplados em um artefato | Delfos é multi-repo independente por design |
| Construção de query sensível a caminho (GUI vs SQL) | IR declarativo único deve ser a base |
| Estados de erro/loading inconsistentes | Estados padronizados são invariante de UI no Delfos |
| Segurança de dados como recurso pago | Governança é fundação, não monetização |
| APIs com fan-out de queries | Contratos de leitura previsíveis e paginados |
| Cache/scheduler introduzidos por antecipação | Adiar até execução real existir (ADR-0007) |

---

## Princípio-guia

Metabase otimiza para **simplicidade de adoção e operação**, aceitando trade-offs de isolamento,
escala e governança. O Delfos faz a aposta oposta na fundação: **isolamento, governança e
contratos declaráveis primeiro**, conveniência depois. Os anti-padrões acima são exatamente os
pontos onde essas duas filosofias divergem — e onde o Delfos não deve ceder.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md)
- [../../adr/adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- [../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md](../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
