# Modelo Relacional Draft — PostgreSQL (Delfos Analytics)

> Status: **draft** — modelo candidato, não normativo ainda.
> Decisão de origem: **ADR-0035**.
> Escopo: esboço do schema relacional PostgreSQL para a migração faseada
> descrita em `docs/postgresql-migration-plan.md` (fase P2).

Este documento é um **rascunho de trabalho**. Ele não cria schema, não autoriza
migrations e não substitui `docs/database-model.md` (que descreve o MongoDB
atual). O modelo definitivo será fixado na fase P2, após a decisão de ORM (P1).

---

## 1. Decisões globais

| Tema | Decisão draft | Justificativa |
|---|---|---|
| Chave primária | **UUID v4** (`uuid` nativo, `gen_random_uuid()`) | Migração direta de `ObjectId` (ambos opacos, não sequenciais); suportado nativamente pelo PostgreSQL via `pgcrypto`/`gen_random_uuid()`; não exige extensão de terceiros. ULID foi considerado (ordenável por tempo, bom para índices) mas exigiria extensão/encoding custom; UUID v4 + coluna `created_at` indexada cobre ordenação temporal com menos dependência. **Subdecisão aberta:** reavaliar UUID v7 (ordenável por tempo, padronizado) em P2. |
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
  `dataset_key` pode virar FK lógica para `datasets(dataset_key)` por tenant —
  avaliar em P2.
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
  `dashboard_definition_id` são **referências declarativas opcionais**; avaliar
  em P2 se viram FK real (com `ON DELETE SET NULL`) ou permanecem lógicas.
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

### semantic_measures / semantic_dimensions / semantic_glossary_terms — **decisão aberta**
- **Estado atual:** no modelo Mongoose, `measures`, `dimensions` e
  `glossaryTerms` são **subdocumentos embutidos** em `semantic_models`.
- **Decisão draft:** **opção A — tabelas-filhas** (`semantic_measures`,
  `semantic_dimensions`, `semantic_glossary_terms`), cada uma com
  `semantic_model_id` FK, `tenant_id`, `key`, `name`, `status` e os campos
  específicos; `metadata JSONB` por linha.
- **Justificativa da preferência por tabelas-filhas:** measures/dimensions/terms
  têm `key` único por modelo, `status` próprio e relações cruzadas
  (`relatedMeasureKeys`, `relatedDimensionKeys`); são candidatos naturais a
  consulta/filtragem individual e a constraints de unicidade
  (`UNIQUE (semantic_model_id, key)`). Tabelas-filhas tornam isso verificável no
  banco.
- **Opção B (alternativa):** manter como arrays JSONB em `semantic_models`,
  espelhando o modelo atual — mais simples de migrar, aceitável **se** não
  houver consulta individual. Decisão final em P2.

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

## 4. Itens a fechar na fase P2

- UUID v4 vs UUID v7 para PK.
- `field_mappings.dataset_key` → FK real para `datasets`?
- `report_definitions` refs e `execution_requests` refs → FK real ou lógica?
- semantic measures/dimensions/glossary → tabelas-filhas (opção A) vs JSONB
  (opção B).
- Necessidade de índices GIN em colunas JSONB efetivamente consultadas.
- Avaliação de Row-Level Security por tenant (hardening, P7).

## Relação com outros documentos

- `docs/adr/adr-0035-postgresql-primary-database-and-valkey-cache.md`
- `docs/postgresql-migration-plan.md`
- `docs/database-model.md` — modelo MongoDB atual (source of truth vigente).
- `docs/adr/adr-0034-semantic-layer-foundation-declarative-model.md`
