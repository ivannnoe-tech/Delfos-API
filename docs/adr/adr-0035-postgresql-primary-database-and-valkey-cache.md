# ADR-0035 — PostgreSQL como primary database e Valkey como cache layer

- **Status**: Accepted
- **Data**: 2026-05-18
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Ambas
- **Implementação**: não iniciada

---

> **Esta ADR é uma decisão arquitetural, não uma autorização de implementação.**
> Ela registra a direção aprovada. Nenhuma migração de código, instalação de
> dependência, criação de schema PostgreSQL, criação de runtime Valkey ou
> remoção de MongoDB é autorizada por este documento. A implementação é faseada
> e cada fase exige escopo explícito — ver `docs/postgresql-migration-plan.md`.
>
> Esta ADR **não supersede** a ADR-0005 (MongoDB como config store) de imediato:
> a ADR-0005 permanece `Accepted`/`implementado` enquanto o MongoDB for o banco
> em uso. A ADR-0005 só passa a `Superseded by ADR-0035` quando a fase de
> remoção do MongoDB (P5 do plano de migração) for concluída.

## Contexto

O Delfos Analytics está em estado **foundation administrativa/declarativa**
(ADR-0024). O estado atual:

- MongoDB/Mongoose é o banco da foundation desde a ADR-0005; armazena
  configuração, catálogos declarativos, referências seguras de credenciais e
  auditoria;
- não existe runtime real, conector real, execução real de query, dispatch
  real nem descriptografia real de credenciais em runtime;
- a Baseline Visual v1.0 do `delfos-web` foi promovida com o gate visual verde
  (analyze, test, E2E estático e integrado, build release);
- as ADRs **0021** (descriptografia de credenciais) e **0022** (transporte de
  dispatch) permanecem `Proposed` por decisão humana e constituem o gate formal
  de entrada da Fase 2 (ADR-0024).

A ADR-0005 já antecipava, na seção "Impacto futuro / Fase 2", que PostgreSQL era
o plano caso entrasse dado estruturado, e listava "PostgreSQL com JSONB" como
alternativa forte. Conforme o domínio do Delfos amadureceu — tenants, RBAC,
connections, credentials, datasets, field-mappings, query/dashboard/report
definitions, semantic-models, runtime execution-requests e auditoria — ficou
claro que o modelo de dados é **majoritariamente relacional**, com integridade
referencial entre entidades e necessidade de unicidade composta por tenant.

Era necessária uma decisão arquitetural formal antes que qualquer fase futura
escolhesse banco de forma implícita.

## Problema

O modelo de dados do Delfos não é "config rica e aninhada de documento"; é um
**catálogo relacional governado**. Cada eixo do domínio se beneficia de um banco
relacional:

- **multi-tenancy** — `tenant_id` é uma fronteira de isolamento obrigatória; o
  banco relacional permite constraints e índices que tornam o isolamento
  verificável no schema, não só na aplicação;
- **usuários** — entidade estável, com unicidade `(tenant_id, email)`;
- **papéis/permissões (RBAC)** — naturalmente relacional (roles, permissions,
  vínculos), hoje implícito e fácil de modelar com FKs;
- **conexões** — referenciam credenciais; FK expressa a relação;
- **credenciais** — `credentialRef` e material protegido isolado; integridade
  referencial entre `connections` e `credentials` é desejável;
- **datasets / field-mappings** — `field_mappings` pertence a um dataset e a uma
  connection; relação 1‑N clara;
- **query definitions** — pertencem a um dataset (`datasetId` obrigatório);
- **dashboards / widgets** — dashboard 1‑N widgets; widget referencia query;
- **reports** — referenciam query/dashboard definitions;
- **execution requests / events** — `execution_request_events` é 1‑N de
  `execution_requests`; ordenação temporal e integridade importam;
- **audit** — volume crescente, consultas por tenant + período + tipo;
- **integridade referencial** — hoje as referências cruzadas são "lógicas, sem
  validação cruzada" (ver `database-model.md`); FKs trazem a garantia para o
  banco;
- **transações** — operações multi-entidade (ex.: criar connection + credential)
  ganham atomicidade nativa, sem o custo de replica set do Mongo;
- **índices** — índices compostos por tenant são primeira-classe e o planner os
  usa de forma previsível;
- **modelagem relacional** — reduz duplicação e referências manuais/`populate`;
- **JSONB** — PostgreSQL cobre as partes genuinamente flexíveis (metadata
  segura, options de widget, layout) sem abrir mão do relacional, com indexação
  GIN quando necessário.

Em paralelo, a foundation **não tem cache** (ADR-0033, que supersede a ADR-0007).
Quando a Fase 2 introduzir cache, a decisão de tecnologia de cache deve estar
registrada com antecedência para não ser tomada de forma apressada.

## Decisão

1. **PostgreSQL passa a ser o primary operational database futuro do Delfos
   Analytics.** Toda a configuração, catálogos declarativos, referências seguras
   de credenciais, runtime execution-requests e auditoria migrarão para
   PostgreSQL nas fases definidas em `docs/postgresql-migration-plan.md`.

2. **MongoDB/Mongoose será descontinuado (`deprecated`) e removido em fases
   futuras.** A remoção ocorre apenas após a paridade funcional ser validada em
   PostgreSQL (fase P5 do plano de migração). Até lá, o estado em produção/dev
   **continua em MongoDB/Mongoose**.

3. **Valkey será adotado como cache layer / cache runtime futuro.** Valkey é um
   fork open-source compatível com o protocolo Redis, sob licença permissiva, e
   substitui o "Redis quando justificado" mencionado no roadmap.

4. **Valkey não é source of truth.** A verdade permanece no PostgreSQL. Cache é
   sempre derivável, descartável e reconstruível a partir do banco.

5. **Valkey não armazena secrets, credenciais, connection strings, tokens nem
   material descriptografado.**

6. **Valkey não substitui auditoria nem event store.** Audit e
   execution-request events são dados permanentes e ficam no PostgreSQL.

7. **Valkey não implementa fila, worker ou dispatch real nesta fase.** Qualquer
   uso de Valkey como fila/worker/dispatch exige ADR própria de promoção
   (alinhada a ADR-0033 e ADR-0022).

8. **As ADRs bloqueantes continuam valendo.** ADR-0021 (descriptografia de
   credenciais) e ADR-0022 (transporte de dispatch) permanecem `Proposed` e
   continuam bloqueando descriptografia real e dispatch real. Esta ADR **não**
   altera o status delas e **não** autoriza execução real.

9. **A escolha do ORM / query layer fica pendente** como subdecisão formal —
   ver seção "ORM / query layer" e a subdecisão pendente "ORM/Query Layer
   Decision Review".

10. **O contrato REST não muda.** A migração Mongo → PostgreSQL é interna ao
    `delfos-api`; `delfos-web` continua consumindo REST sem depender do banco
    interno da API.

## Impactos

A análise de impacto detalhada por módulo está em
`docs/postgresql-migration-plan.md` (fase P3). Resumo:

- **tenants** — vira tabela `tenants`; `slug` único global; PK passa a ser UUID.
- **users** — tabela `users`; unicidade `(tenant_id, email)`; FK para `tenants`.
- **RBAC** — papéis/permissões hoje implícitos no campo `role` podem evoluir
  para tabelas relacionais (`roles`, `permissions`) numa fase futura; a migração
  inicial preserva o campo `role` como hoje.
- **connections** — tabela `connections`; FK opcional para `credentials`.
- **credentials** — tabela `credentials`; material protegido isolado em coluna
  dedicada, **nunca** em JSONB público; FK para `connections`.
- **datasets** — tabela `datasets`; `fields` como JSONB; FK para `connections`.
- **field_mappings** — tabela `field_mappings`; FK para `datasets`/`connections`.
- **query_definitions** — tabela `query_definitions`; FK para `datasets`;
  `metrics`/`dimensions`/`filters`/`sorts` como JSONB.
- **dashboard_definitions** — tabela `dashboard_definitions`; `layout`,
  `sections`, `filters` como JSONB; `widgets` ver decisão no data-model draft.
- **report_definitions** — tabela `report_definitions`; FKs declarativas
  opcionais para query/dashboard definitions.
- **semantic_models** — tabela `semantic_models`; `measures`, `dimensions`,
  `glossaryTerms` hoje são subdocumentos — ver data-model draft para decisão
  entre JSONB e tabelas-filhas.
- **runtime execution requests/events** — tabelas `execution_requests` e
  `execution_request_events`; relação 1‑N com FK; ordenação por `created_at`.
- **audit** — tabela `audit_events`; índice por `(tenant_id, created_at)`.
- **seeds** — `npm run seed:dev` passa a popular PostgreSQL (fase P4).
- **testes unitários/e2e** — `mongodb-memory-server` é substituído por
  PostgreSQL efêmero (container ou `pg`-embedded) na fase P4.
- **CI** — pipeline ganha um serviço PostgreSQL; o job E2E passa a usar
  PostgreSQL; ajustes nas fases P1/P4/P7.
- **Docker/local development** — `docker-compose.yml` ganha serviço `postgres`
  (P1) e, depois, `valkey` (P6); o serviço `mongo` só sai em P5.
- **documentação** — `database-model.md`, `architecture.md`, `env-reference.md`,
  `local-development.md`, `testing-guide.md`, `roadmap.md`, `README.md` e este
  conjunto de ADRs são atualizados de forma faseada.
- **web** — nenhum impacto de código; o contrato REST é preservado.
- **connectors** — nenhum impacto de código; o `delfos-connectors` não depende
  do banco interno do `delfos-api`.

## Estratégia multi-tenant

A migração reforça o isolamento por tenant como **boundary obrigatório**, não
filtro opcional:

- `tenant_id` é coluna **obrigatória** (`NOT NULL`) em toda tabela de domínio
  tenant-scoped;
- chaves de negócio são **únicas compostas por tenant** — ex.:
  `UNIQUE (tenant_id, slug)` em users-equivalentes, `UNIQUE (tenant_id, dataset_key)`,
  `UNIQUE (tenant_id, query_key)`, etc.;
- todo índice de consulta frequente é **prefixado por `tenant_id`**;
- nenhuma query tenant-scoped pode buscar recurso apenas por PK global; o
  `tenant_id` entra sempre na cláusula `WHERE`;
- FKs cross-tenant são proibidas: uma FK só liga registros do mesmo tenant;
- entidades globais explícitas (ex.: `tenants`) não têm `tenant_id`;
- considerar, na fase de hardening (P7), Row-Level Security (RLS) como camada
  adicional de defesa — registrado como avaliação futura, não decisão desta ADR.

## Estratégia de dados flexíveis (JSONB)

JSONB é permitido **apenas** para dados genuinamente variáveis e seguros:

- metadata segura e sanitizada (`metadata`, `settings` — `SanitizedMetadata`);
- opções declarativas (`options` de widget/bloco);
- configurações de widget e visualização;
- layout/sections de dashboard e report;
- parâmetros e filtros declarativos (`filters`, `parameters`);
- `fields` de dataset (lista de campos declarativos).

JSONB é **proibido** para:

- secrets de qualquer natureza;
- connection string real;
- token, password, authorization header;
- material de credencial (`protectedSecretValue` fica em coluna dedicada
  isolada, fora de JSONB público);
- secrets descriptografados — que aliás não existem em runtime (ADR-0021).

Regra geral: o que é consultado/filtrado/único vira **coluna tipada**; o que é
estrutura declarativa variável e nunca filtrada vira **JSONB**. Indexação GIN
só quando houver consulta real sobre o conteúdo do JSONB.

## Valkey

### Usos futuros permitidos (após fase P6 e com escopo explícito)

- cache de catálogos declarativos (listas tenant-scoped de baixo churn);
- cache de readiness / dry-run e de resultados de demo/preview, quando seguro;
- cache de metadata segura;
- rate limit futuro (compartilhado entre instâncias);
- idempotency keys e locks distribuídos futuros;
- sessão futura, se e quando for decidido (depende do auth real — ADR-0006).

### Usos proibidos

- source of truth de qualquer dado;
- auditoria permanente (fica no PostgreSQL);
- execution-request events permanentes (ficam no PostgreSQL);
- secrets, credenciais, connection strings, tokens;
- material descriptografado;
- dispatch real para o `delfos-connectors`;
- fila/worker sem ADR de promoção própria;
- runtime real sem ADR;
- dados cross-tenant ou dados sem TTL.

## Alternativas consideradas

- **Manter MongoDB/Mongoose** — rejeitada. O domínio é relacional e governado;
  a falta de integridade referencial no banco já gera "referências lógicas sem
  validação cruzada". Manter Mongo perpetuaria validação relacional só na
  aplicação.
- **PostgreSQL puro (sem JSONB)** — rejeitada. Forçaria normalizar estruturas
  genuinamente variáveis (layout, options de widget) em dezenas de tabelas/joins
  sem ganho.
- **PostgreSQL + JSONB** — **escolhida.** Relacional para o domínio governado,
  JSONB para o declarativo variável e seguro.
- **PostgreSQL + Prisma** — candidata de ORM; ver seção ORM.
- **PostgreSQL + Kysely** — candidata de ORM; ver seção ORM.
- **PostgreSQL + Drizzle** — candidata de ORM; ver seção ORM.
- **PostgreSQL + TypeORM** — candidata de ORM; ver seção ORM.
- **Redis (cache)** — rejeitada como tecnologia nominal por mudança de licença;
  Valkey é o fork open-source compatível e preferido.
- **Valkey (cache)** — **escolhida** como camada de cache futura.
- **Nenhum cache por enquanto** — é o estado atual (ADR-0033) e permanece
  verdadeiro **até** a fase P6; esta ADR apenas registra a tecnologia de cache
  escolhida para quando o cache for promovido. Não cria cache agora.

## ORM / query layer

A migração precisa de uma camada de acesso ao PostgreSQL. Candidatos avaliados:

- **Kysely** — query builder SQL type-safe, fino, sem runtime pesado, próximo do
  SQL real; ótimo controle, migrations via `kysely-ctl`/scripts; menos
  "mágica", maior previsibilidade. Boa aderência ao requisito de não esconder o
  SQL e de manter o repository pattern já usado em `src/modules/<n>/repositories/`.
- **Prisma** — DX forte para CRUD foundation, schema declarativo, migrations
  maduras; porém abstrai mais o SQL, tem runtime próprio e gera acoplamento ao
  seu modelo.
- **Drizzle** — type-safe, leve, schema em TypeScript, SQL-first; maduro mas
  mais novo no ecossistema NestJS.
- **TypeORM** — integração histórica com NestJS via `@nestjs/typeorm`; porém
  padrão Active Record/Data Mapper com histórico de inconsistências e migrations
  frágeis.

**Decisão sobre o ORM:** **pendente.** A escolha vincula migrations, testes,
tipagem e o repository layer de todos os módulos; decidi-la sem um spike
comparativo arriscaria um custo de retrabalho alto. Fica registrada a subdecisão
pendente **"ORM/Query Layer Decision Review"**, a ser resolvida no início da
fase P1 (PostgreSQL Infrastructure Foundation), com:

- preferência inicial a avaliar: **Kysely**, por controle SQL/type-safe e
  proximidade com SQL;
- alternativa de DX forte para o CRUD foundation: **Prisma**;
- entrega da subdecisão: um spike curto comparando Kysely e Prisma em um módulo
  representativo (ex.: `tenants` ou `connections`), seguido de ADR ou registro
  formal da escolha antes de migrar o segundo módulo.

## Consequências

### Positivas

- Integridade referencial garantida pelo banco (FKs), não só pela aplicação.
- Unicidade composta por tenant e índices por tenant como primeira classe.
- Transações multi-entidade nativas e baratas, sem replica set.
- JSONB cobre o declarativo variável sem perder o relacional.
- Tecnologia de cache (Valkey) decidida com antecedência e licença permissiva.
- Modelo relacional reduz duplicação e referências manuais/`populate`.

### Negativas / trade-offs aceitos

- Migração é trabalho real e faseado; há custo de engenharia e risco de
  regressão durante a transição.
- Schema relacional exige migrations versionadas e disciplina de evolução
  (mais rígido que a evolução incremental do Mongo).
- Período de convivência: enquanto P1–P4 não concluírem, MongoDB continua sendo
  o banco real; documentação precisa deixar o estado vigente explícito.
- A escolha do ORM permanece em aberto (subdecisão pendente), mantendo
  incerteza até P1.

### Riscos

- Migração de dados (mapeamento `ObjectId` → UUID, subdocumentos → JSONB ou
  tabelas-filhas) com perda ou divergência.
- Divergência de comportamento entre repositórios Mongoose e PostgreSQL durante
  P3 (migração módulo a módulo).
- Quebra acidental de contrato REST se a camada de mapeamento não for fiel.
- Regressão de testes/E2E ao trocar `mongodb-memory-server` por PostgreSQL
  efêmero.

### Mitigação

- Migração **módulo a módulo** (P3), com testes de paridade por módulo.
- Contrato REST coberto por testes E2E mantidos verdes em cada fase.
- Remoção do MongoDB (P5) só após paridade validada (P4).
- Rollback documentado por fase no plano de migração.
- Subdecisão de ORM resolvida por spike antes de migrar o segundo módulo.

### Impacto de curto prazo

- Nenhum impacto funcional imediato: esta ADR é docs-only. O sistema continua
  em MongoDB.

### Impacto de longo prazo

- PostgreSQL como base operacional estável e Valkey como camada de cache
  habilitam, com ADRs próprias, as capacidades de Fase 2 (cache, rate limit
  distribuído, idempotency).

## Impacto na Fase 1

- Nenhuma mudança de comportamento, contrato, schema, DTO ou rota.
- A foundation permanece declarativa/administrativa e continua em
  MongoDB/Mongoose até a fase de migração.
- A documentação passa a registrar a decisão arquitetural aprovada.

## Impacto futuro / Fase 2

- Habilita as fases P1–P7 do `docs/postgresql-migration-plan.md`.
- A escolha de cache (Valkey) e de banco (PostgreSQL) deixa de ser ambígua.
- Cache real, rate limit distribuído, idempotency e locks ganham tecnologia
  definida — mas cada um ainda exige ADR de promoção própria.
- ADR-0021 e ADR-0022 continuam sendo o gate de execução/dispatch/descriptografia
  real; esta ADR não os altera.

## Escopo atual

- Registrar a decisão: PostgreSQL primary database + Valkey cache layer.
- Registrar a deprecação futura do MongoDB/Mongoose.
- Registrar a subdecisão pendente de ORM.
- Apontar para o plano de migração, o data-model draft e o plano Valkey.

## Fora de escopo

Esta ADR **não** autoriza nem implementa:

- migração de código ou de dados;
- instalação de dependências;
- alteração funcional, de contrato REST, de rotas, de controllers, services,
  repositories, schemas, DTOs ou do `AppModule`;
- PostgreSQL runtime, schema PostgreSQL ou migrations;
- Valkey runtime;
- cache real, fila, worker, scheduler;
- runtime real, conector real, dispatch real;
- descriptografia real de credenciais;
- uso de secrets reais;
- remoção do MongoDB;
- alteração do status da ADR-0021 ou da ADR-0022.

## Relação com outros documentos

- **ADR-0005** — MongoDB como config store; será `Superseded by ADR-0035` ao
  concluir a fase P5 (remoção do MongoDB), não antes.
- **ADR-0007 / ADR-0033** — sem cache/Redis na Fase 1; esta ADR escolhe a
  tecnologia de cache (Valkey) para quando o cache for promovido, sem criá-lo.
- **ADR-0010** — storage analítico e retenção; a base relacional dialoga com
  essa direção futura.
- **ADR-0019** — criptografia e rotação de credenciais; o material protegido
  continua isolado e nunca vai para JSONB público.
- **ADR-0021** — descriptografia de credenciais; permanece `Proposed` e
  bloqueante; esta ADR não a altera.
- **ADR-0022** — transporte de dispatch; permanece `Proposed` e bloqueante;
  esta ADR não a altera.
- **ADR-0024** — definição de Fase 1 e Fase 2; a migração ocorre na transição
  para a Fase 2 e respeita os gates.
- `docs/postgresql-migration-plan.md` — plano de migração faseado P0–P7.
- `docs/postgresql-data-model-draft.md` — modelo relacional draft.
- `docs/valkey-cache-plan.md` — plano de uso futuro do Valkey.
- `docs/database-model.md` — modelo de banco atual (MongoDB).
