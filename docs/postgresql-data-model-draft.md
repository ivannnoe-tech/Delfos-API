# Modelo Relacional Draft — PostgreSQL (Delfos Analytics)

> Status: **draft + decisões de P2 fixadas** (subdecisões resolvidas na §4).
> Decisão de origem: **ADR-0035**; ORM: **Kysely** (ADR-0036).
> Escopo: schema relacional PostgreSQL para a migração faseada descrita em
> `docs/postgresql-migration-plan.md` (fase P2).

Este documento guiou o schema inicial da **fase P2** (migration versionada
Kysely). As subdecisões abertas foram resolvidas na §4. Ele não substitui
`docs/database-model.md` (que descreve o MongoDB atual, banco operacional até a
fase P5). MongoDB continua sendo o banco em uso durante P2.

---

## 1. Decisões globais

| Tema | Decisão draft | Justificativa |
|---|---|---|
| Chave primária | **UUID v4** (`uuid` nativo, `gen_random_uuid()`) — **decidido (P2)** | Migração direta de `ObjectId` (ambos opacos, não sequenciais); suportado nativamente pelo PostgreSQL via `gen_random_uuid()`; não exige extensão de terceiros. UUID v7 (ordenável por tempo) fica como reavaliação futura de performance de índice (P7), não bloqueia a P2. |
| `tenant_id` | **Obrigatório** (`NOT NULL`) em toda tabela tenant-scoped | Isolamento é boundary, não filtro (ADR-0035 §multi-tenant). |
| FK vs referência lógica | **FK real** entre entidades do mesmo tenant; referências hoje "declarativas sem validação cruzada" viram FK quando a integridade for desejável | O banco passa a garantir integridade que hoje só existe na aplicação. Algumas referências declarativas opcionais (ex.: `query_definition_id` em widget) podem permanecer **referência lógica** se a validação cruzada não for desejada — marcado caso a caso. |
| JSONB | Para metadata/config declarativa variável e segura | Relacional para o domínio governado; JSONB para o declarativo (ADR-0035 §JSONB). |
| Nomenclatura | **snake_case** em tabelas e colunas | Convenção PostgreSQL. O mapeamento para o contrato REST (camelCase) é responsabilidade da camada de aplicação; o contrato não muda. |
| Migrations | **Versionadas**, com up/down | Fase P2 do plano de migração. |
| Timestamps | `created_at` / `updated_at` `NOT NULL DEFAULT now()` em toda tabela | Padrão atual já exige timestamps. |
| Soft archive | `status` com valor `archived` e/ou `archived_at` quando aplicável | Preserva o `DELETE` lógico atual (`status: archived`). |
| Secrets | **Nunca** em JSONB público; material de credencial em coluna dedicada isolada | ADR-0019, ADR-0035. |
| FK cross-tenant | **Proibida** | Uma FK só liga registros do mesmo tenant. |

Convenções de coluna recorrentes (omitidas nas tabelas abaixo para concisão):
`id UUID PK`, `tenant_id UUID NOT NULL` (exceto `tenants`), `created_at`,
`updated_at`, e `created_by` / `updated_by` (`TEXT`) onde o modelo atual já os
tem.

---

## 2. Tabelas candidatas

### tenants
- **Propósito:** empresa/cliente. Entidade global (sem `tenant_id`).
- **Campos principais:** `name`, `slug`, `status`, `settings JSONB`.
- **Unique:** `slug` (único global).
- **Índices:** `slug`.
- **FKs:** nenhuma.
- **JSONB permitido:** `settings`. **Proibido:** secrets.
- **Status/archive:** `status`.

### users
- **Propósito:** usuário administrativo do Delfos.
- **Campos principais:** `name`, `email`, `role`, `status`,
  `last_login_at` (**futuro** — depende de auth real, ADR-0006; pode nascer
  nullable e ocioso).
- **Unique:** `(tenant_id, email)`.
- **Índices:** `(tenant_id, email)`, `(tenant_id, status)`.
- **FKs:** `tenant_id → tenants(id)`.
- **JSONB:** nenhum necessário. **Proibido:** password/secret.
- **Status/archive:** `status`.

### roles / permissions — **futuro / opcional**
- **Propósito:** RBAC granular relacional. Hoje o RBAC é o campo `role` em
  `users` (`owner`/`admin`/`operator`/`viewer`). A migração inicial **preserva o
  campo `role`**; tabelas `roles`/`permissions`/`user_roles` são uma evolução
  futura, dependente de auth real (ADR-0006), e não fazem parte do schema P2
  mínimo.

### connections
- **Propósito:** configuração declarativa de API externa.
- **Campos principais:** `name`, `base_url`, `auth_type`, `credential_ref`,
  `allowed_headers JSONB`, `timeout_ms`, `rate_limit JSONB`, `status`.
- **Unique:** `(tenant_id, name)`.
- **Índices:** `(tenant_id, name)`, `(tenant_id, status)`.
- **FKs:** `tenant_id → tenants(id)`.
- **JSONB permitido:** `allowed_headers`, `rate_limit`.
  **Proibido:** connection string real, secret, token.
- **Status/archive:** `status`.

### credentials
- **Propósito:** referência protegida de credencial usada por conexões.
- **Campos principais:** `connection_id`, `type`, `provider`, `name`, `status`,
  `masked_preview`, `protected_secret_value` (**coluna dedicada isolada**),
  `protection_provider`, `rotated_at`, `revoked_at`.
- **Unique:** avaliar `(tenant_id, connection_id, name)`.
- **Índices:** `(tenant_id, connection_id)`, `(tenant_id, status)`,
  `(tenant_id, type)`.
- **FKs:** `tenant_id → tenants(id)`, `connection_id → connections(id)`.
- **JSONB permitido:** nenhum para material sensível.
  **Proibido:** `protected_secret_value` **nunca** em JSONB; sem secret em
  texto plano; sem token/password em colunas livres.
- **Status/archive:** `status`, `revoked_at`.

### datasets
- **Propósito:** dataset lógico declarativo.
- **Campos principais:** `connection_id`, `dataset_key`, `name`, `description`,
  `source_type`, `status`, `refresh_mode`, `schema_mode`, `fields JSONB`,
  `primary_key_fields JSONB`, `time_field`, `tags JSONB`, `metadata JSONB`,
  `settings JSONB`.
- **Unique:** `(tenant_id, dataset_key)`.
- **Índices:** `(tenant_id, dataset_key)`, `(tenant_id, connection_id)`,
  `(tenant_id, status)`, `(tenant_id, source_type)`.
- **FKs:** `tenant_id → tenants(id)`, `connection_id → connections(id)`.
- **JSONB permitido:** `fields`, `primary_key_fields`, `tags`, `metadata`,
  `settings`. **Proibido:** payload operacional, secret.
- **Status/archive:** `status`.

### field_mappings
- **Propósito:** De/Para declarativo de campos por dataset.
- **Campos principais:** `connection_id`, `dataset_key`, `source_path`,
  `target_field`, `target_type`, `required`, `transform JSONB`.
- **Unique:** `(tenant_id, dataset_key, target_field)`.
- **Índices:** `(tenant_id, dataset_key, target_field)`,
  `(tenant_id, connection_id)`.
- **FKs:** `tenant_id → tenants(id)`, `connection_id → connections(id)`.
  `dataset_key` permanece **referência lógica** indexada (decidido P2, sem FK).
- **JSONB permitido:** `transform`. **Proibido:** payload real.
- **Status/archive:** n/a (ou `status` se introduzido).

### query_definitions
- **Propósito:** definição lógica da camada semântica/query.
- **Campos principais:** `dataset_id`, `query_key`, `name`, `description`,
  `status`, `type`, `metrics JSONB`, `dimensions JSONB`, `filters JSONB`,
  `sorts JSONB`, `default_limit`, `time_field`, `allowed_granularities JSONB`,
  `tags JSONB`, `metadata JSONB`, `settings JSONB`.
- **Unique:** `(tenant_id, query_key)`.
- **Índices:** `(tenant_id, query_key)`, `(tenant_id, dataset_id)`,
  `(tenant_id, status)`, `(tenant_id, type)`.
- **FKs:** `tenant_id → tenants(id)`, `dataset_id → datasets(id)`
  (`dataset_id` é obrigatório no modelo atual).
- **JSONB permitido:** `metrics`, `dimensions`, `filters`, `sorts`,
  `allowed_granularities`, `tags`, `metadata`, `settings`.
  **Proibido:** secret, valores não sanitizados.
- **Status/archive:** `status: archived`.

### dashboard_definitions
- **Propósito:** definição declarativa de dashboard.
- **Campos principais:** `dashboard_key`, `name`, `description`, `status`,
  `visibility`, `layout JSONB`, `sections JSONB`, `filters JSONB`, `tags JSONB`,
  `metadata JSONB`, `settings JSONB`. Ver `dashboard_widgets` abaixo.
- **Unique:** `(tenant_id, dashboard_key)`.
- **Índices:** `(tenant_id, dashboard_key)`, `(tenant_id, status)`,
  `(tenant_id, visibility)`.
- **FKs:** `tenant_id → tenants(id)`.
- **JSONB permitido:** `layout`, `sections`, `filters`, `tags`, `metadata`,
  `settings`. **Proibido:** secret.
- **Status/archive:** `status: archived`.

### dashboard_widgets — **decisão: JSONB embutido (draft)**
- **Decisão draft:** manter os widgets como **array JSONB** dentro de
  `dashboard_definitions.widgets`, **não** como tabela própria.
- **Justificativa:** no modelo atual (`database-model.md`) os widgets já são
  subdocumentos do dashboard; não são consultados/filtrados isoladamente, não
  têm ciclo de vida independente e o `query_definition_id` do widget é hoje
  "referência declarativa sem validação cruzada". Promovê-los a tabela só se
  justifica quando o dashboard runtime real existir (Fase 2) e os widgets forem
  consultados/versionados individualmente.
- **Reavaliar:** quando widget virar entidade própria de runtime (já previsto
  em `architecture.md` §9 como "armazenará no futuro"). Nesse momento, uma
  tabela `dashboard_widgets` (`dashboard_id` FK, `query_definition_id` FK,
  `type`, `options JSONB`) passa a fazer sentido.

### report_definitions
- **Propósito:** definição declarativa de relatório.
- **Campos principais:** `report_key`, `name`, `description`, `status`,
  `visibility`, `query_definition_id`, `dashboard_definition_id`,
  `layout JSONB`, `sections JSONB`, `blocks JSONB`, `filters JSONB`,
  `parameters JSONB`, `export_options JSONB`, `tags JSONB`, `metadata JSONB`,
  `settings JSONB`.
- **Unique:** `(tenant_id, report_key)`.
- **Índices:** `(tenant_id, report_key)`, `(tenant_id, status)`,
  `(tenant_id, visibility)`, `(tenant_id, query_definition_id)`,
  `(tenant_id, dashboard_definition_id)`.
- **FKs:** `tenant_id → tenants(id)`. `query_definition_id` e
  `dashboard_definition_id` permanecem **referências lógicas** indexadas
  (decidido P2, sem FK; promoção a FK real é decisão futura).
- **JSONB permitido:** `layout`, `sections`, `blocks`, `filters`, `parameters`,
  `export_options`, `tags`, `metadata`, `settings`. **Proibido:** secret.
- **Status/archive:** `status: archived`.

### execution_requests
- **Propósito:** registro administrativo foundation de solicitação de runtime.
- **Campos principais:** `request_key`, `kind`, `status`,
  `query_definition_id`, `dashboard_definition_id`, `report_definition_id`,
  `connection_id`, `dataset_id`, `requested_by_actor_id`, `requested_by_role`,
  `mode`, `reason`, `message`, `metadata JSONB`.
- **Unique:** `(tenant_id, request_key)`.
- **Índices:** `(tenant_id, request_key)`, `(tenant_id, created_at)`,
  `(tenant_id, status)`, `(tenant_id, kind)`, `(tenant_id, query_definition_id)`,
  `(tenant_id, dashboard_definition_id)`, `(tenant_id, report_definition_id)`.
- **FKs:** `tenant_id → tenants(id)`. As referências para query/dashboard/report
  definitions e connection/dataset podem ser FK lógica (avaliar em P2; o módulo
  hoje não faz validação cruzada).
- **JSONB permitido:** `metadata` (sanitizado).
  **Proibido:** filters, parameters, settings livres, secrets, rows, payload
  operacional, `credentialRef`, token, senha, authorization header, connection
  string.
- **Status/archive:** `status` (`accepted` e estados futuros).

### execution_request_events
- **Propósito:** eventos administrativos de ciclo de vida de uma execution
  request.
- **Campos principais:** `execution_request_id`, `request_key`, `event_type`,
  `previous_status`, `next_status`, `message`, `reason`, `actor_id`,
  `actor_role`, `metadata JSONB`. Só `created_at` (eventos são imutáveis).
- **Unique:** n/a.
- **Índices:** `(tenant_id, execution_request_id, created_at)`,
  `(tenant_id, request_key, created_at)`, `(tenant_id, event_type)`.
- **FKs:** `tenant_id → tenants(id)`,
  `execution_request_id → execution_requests(id)` (FK real, 1‑N).
- **JSONB permitido:** `metadata`, `message`, `reason` sanitizados.
  **Proibido:** mesma lista de `execution_requests`.
- **Status/archive:** n/a (registro imutável de evento).

### audit_events
- **Propósito:** auditoria de ações sensíveis (hoje `audit_logs`).
- **Campos principais:** `user_id`, `action`, `resource_type`, `resource_id`,
  `metadata JSONB`, `ip`, `user_agent`. Só `created_at`.
- **Unique:** n/a.
- **Índices:** `(tenant_id, created_at)`, avaliar
  `(tenant_id, resource_type, created_at)`.
- **FKs:** `tenant_id → tenants(id)`. `user_id` pode ser FK lógica (auditoria
  não deve quebrar se um usuário for removido).
- **JSONB permitido:** `metadata` sanitizado.
  **Proibido:** secret, payload sensível, token.
- **Status/archive:** n/a (registro append-only permanente).

### semantic_models
- **Propósito:** modelo semântico declarativo (Semantic Layer Foundation,
  ADR-0034).
- **Campos principais:** `model_key`, `name`, `description`, `status`,
  `dataset_keys JSONB`, `owner`, `steward`, `certification_owner`, `tags JSONB`,
  `quality JSONB`, `metadata JSONB`, `settings JSONB`. Ver tabelas-filhas
  abaixo.
- **Unique:** `(tenant_id, model_key)`.
- **Índices:** `(tenant_id, model_key)`, `(tenant_id, status)`.
- **FKs:** `tenant_id → tenants(id)`.
- **JSONB permitido:** `dataset_keys`, `quality`, `tags`, `metadata`,
  `settings`. **Proibido:** secret.
- **Status/archive:** `status` (inclui `archived`).

### semantic_measures / semantic_dimensions / semantic_glossary_terms — **decidido (P2): opção B (JSONB)**
- **Estado atual:** no modelo Mongoose, `measures`, `dimensions` e
  `glossaryTerms` são **subdocumentos embutidos** em `semantic_models`.
- **Decisão P2: opção B — arrays JSONB** (`measures`, `dimensions`,
  `glossary_terms`) em `semantic_models`. Espelha fielmente o modelo atual e o
  contrato REST (que retorna o modelo com os subdocumentos aninhados), com risco
  mínimo de paridade na P3. O próprio draft autoriza B **enquanto não houver
  consulta individual** — e hoje não há (foundation declarativa, sem endpoint
  por measure/dimension).
- **Promoção futura à opção A (tabelas-filhas):** condicionada ao runtime real
  que consulte/version/filtre measures/dimensions individualmente (Fase 2). Aí
  uma tabela-filha com `UNIQUE (semantic_model_id, key)` passa a se justificar —
  decisão futura própria, fora desta migração.

### semantic_quality_rules — **não existe hoje**
- **Estado atual:** não há entidade `quality_rules`. A qualidade é um objeto
  embutido `quality` (`score`, `level`, `warnings`) no `semantic_model` e em
  cada measure/dimension.
- **Decisão draft:** **não criar** `semantic_quality_rules` na migração. O
  objeto `quality` permanece JSONB. Uma tabela de regras de qualidade só se
  justifica se/quando regras de qualidade configuráveis virarem escopo
  explícito — exige decisão futura própria, fora desta migração.

---

## 3. Resumo de FKs principais

```text
tenants 1───N users
tenants 1───N connections 1───N credentials
tenants 1───N datasets ───(connection_id)──> connections
tenants 1───N field_mappings ──(connection_id)──> connections
tenants 1───N query_definitions ──(dataset_id)──> datasets
tenants 1───N dashboard_definitions   (widgets em JSONB)
tenants 1───N report_definitions      (refs query/dashboard: FK lógica/avaliar)
tenants 1───N execution_requests 1───N execution_request_events
tenants 1───N audit_events
tenants 1───N semantic_models 1───N semantic_measures / _dimensions / _glossary_terms
```

## 4. Itens fechados na fase P2 (decididos)

As subdecisões abertas foram resolvidas na P2, otimizando para **migração
incremental, paridade de contrato REST e baixo risco** (princípios do plano):

- **UUID v4** (`gen_random_uuid()` nativo) — **decidido**. Sem extensão de
  terceiros; `created_at` indexado cobre ordenação temporal. UUID v7 fica como
  reavaliação futura de performance de índice (P7), não bloqueia.
- **`field_mappings.dataset_key` → referência lógica** (indexada, **sem FK**) —
  **decidido**. Preserva o comportamento atual (sem validação cruzada) e evita
  quebra por ordem de inserção. `tenant_id` e `connection_id` continuam FK reais.
- **`report_definitions` refs e `execution_requests` refs → referência lógica**
  (indexadas, **sem FK**) — **decidido**. São refs declarativas opcionais sem
  validação cruzada hoje; FK real é promoção futura. `execution_request_events →
  execution_requests` permanece **FK real** (1‑N, integridade importa).
- **semantic measures/dimensions/glossary → JSONB (opção B)** — **decidido para
  P2**. Espelha o modelo Mongoose atual (subdocumentos embutidos) e é aceitável
  enquanto **não há consulta individual** (o próprio draft autoriza B nesse caso).
  Promoção a tabelas-filhas (opção A) fica condicionada ao runtime real que
  consulte/version measures/dimensions individualmente — decisão futura própria.
- **Índices GIN em JSONB** — **não criar agora**; só quando houver consulta real
  sobre o conteúdo do JSONB (reavaliar em P7).
- **Row-Level Security por tenant** — avaliação adiada para o hardening (P7),
  como defesa adicional; o boundary é garantido na aplicação + `tenant_id NOT NULL`.

Política de FK consolidada para a P2: `tenant_id → tenants(id)` é **FK real** em
toda tabela tenant-scoped; FKs reais adicionais — `credentials.connection_id →
connections(id)`, `datasets.connection_id → connections(id)`,
`field_mappings.connection_id → connections(id)`, `query_definitions.dataset_id →
datasets(id)`, `execution_request_events.execution_request_id →
execution_requests(id)`. Demais referências cruzadas permanecem **lógicas**
(indexadas) até que a validação cruzada seja escopo explícito.

## Relação com outros documentos

- `docs/adr/adr-0035-postgresql-primary-database-and-valkey-cache.md`
- `docs/postgresql-migration-plan.md`
- `docs/database-model.md` — modelo MongoDB atual (source of truth vigente).
- `docs/adr/adr-0034-semantic-layer-foundation-declarative-model.md`
