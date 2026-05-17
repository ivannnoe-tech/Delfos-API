# Roadmap consolidado — Governança Enterprise

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Escopo e premissas

Este roadmap consolida os padrões de **governança, permissões, segurança e
auditoria** observados nos dez produtos estudados — com peso para NocoBase (ACL
field-level), Superset (certificação/ownership de ativos), Cube (security context),
WrenAI e Lightdash (versionamento, explainability, row/column-level security),
Vanna (observability de IA) e Airbyte (timeline imutável) — e os traduz para o
contexto multi-tenant do Delfos.

Premissas que governam o documento:

- A governança do Delfos se apoia em invariantes já firmes: `tenantId` como
  fronteira de isolamento obrigatória, `credentialRef` que nunca é o segredo,
  `connectionId` que nunca é connection string.
- Há base sólida de ADRs: roles/permissões (`adr-0017`), auditoria segura
  (`adr-0018`), criptografia/rotação de credenciais (`adr-0019`), sanitização de
  metadados e forbidden fields (`adr-0020`), política de mascaramento de dados
  (`adr-0023`).
- Boa parte da governança é **declarativa e viável na foundation** — metadados,
  ACL, certificação, versionamento. Itens que dependem de **execução real** (RLS
  aplicada a dados, mascaramento em resultados, IA como ator) são **gated**.
- A auth atual é a chave temporária `x-delfos-admin-key`; RBAC real para usuários
  finais depende de `adr-0006` (JWT). Nada aqui autoriza implementação.

---

## Princípios de governança

1. **Isolamento derivado, não escrito à mão** — o `tenantId` (e o filtro de
   tenant) vêm do security context verificado, não de código por query (Cube
   security context). Esquecer o isolamento deve ser impossível.
2. **Governança fina por papel** — permissões granulares por recurso e por campo
   (NocoBase field-level ACL), integradas à política de mascaramento (`adr-0023`).
3. **Ativos têm dono e procedência** — certificação, ownership e tags em
   datasets/queries/dashboards (Superset); responde "qual número usar?".
4. **Tudo auditável, trilha imutável** — toda ação sensível gera registro
   append-only (Airbyte timeline; `adr-0018`); metadados sanitizados (`adr-0020`).
5. **Definições versionadas** — mudanças em definições têm histórico, diff e
   rollback sem depender de git (Lightdash/Evidence/Wren).
6. **IA é sujeito de ACL, não bypass** — um agente de IA tem papel próprio,
   permissões e trilha de auditoria, sob a mesma governança que humanos (NocoBase
   AI Employees).

---

## Ondas do roadmap

### Onda 0 — Fundação de governança já entregue

- `auth` com chave temporária `x-delfos-admin-key` (`adr-0016`).
- `audit` com estratégia segura (`adr-0018`); `sanitize-metadata.ts` e detecção de
  forbidden fields (`adr-0020`).
- Invariante `tenantId` aplicada em todas as queries multi-tenant.
- `credentialRef` como referência segura; criptografia/rotação modeladas
  (`adr-0019`); decifração futura gated (`adr-0021`).
- Modelo de roles e permissões definido (`adr-0017`); política de mascaramento
  definida (`adr-0023`).

### Onda 1 — Governança de ativos e metadados (foundation declarativa)

Puramente declarativa; alto valor, baixo custo.

- **Certificação e ownership de ativos** — metadados de governança em
  datasets/queries/dashboards: dono, selo de fonte confiável, tags pesquisáveis
  (Superset). Quem certifica é definido pelo modelo de roles.
- **Catálogo com pastas e tagging** — organizar ativos em grupos navegáveis com
  busca (Superset folders/tags).
- **Sanitização de metadados consolidada** — reforçar `adr-0020`: nenhum log,
  erro ou export carrega forbidden fields.
- **Security context unificado** — formalizar o objeto (tenant, actor, role) do
  qual o filtro de tenant é derivado; estende `request-context.interceptor`.

### Onda 2 — RBAC e permissões granulares (foundation de modelo)

Modela o RBAC completo; aplicação a usuários finais depende de auth real.

- **Modelo de roles e permissões completo** — operacionalizar `adr-0017`: papéis,
  permissões por recurso, herança; modelado agora, aplicado a usuários finais sob
  `adr-0006`.
- **Permissões field-level** — papéis com visibilidade/uso restrito por campo de
  dataset (NocoBase ACL), integradas a `field-mappings` e ao mascaramento.
- **Contrato de row/column-level security** — declarar regras de RLS/CLS por papel
  e tenant (Cube `queryRewrite`, Wren/Lightdash RLS). Apenas o contrato — a
  aplicação a dados reais é Onda 4.
- **Política de field-level masking** — operacionalizar `adr-0023` como metadado:
  quais campos são mascarados, para quais papéis, com qual estratégia.

### Onda 3 — Versionamento e linhagem (foundation declarativa)

- **Versionamento de definições** — `query`/`dashboard`/`report-definitions` com
  histórico, diff e rollback sem git (Lightdash/Evidence/Wren).
- **Validação de integridade de definições** — checagem declarativa de que uma
  definição é consistente com datasets/field-mappings (Lightdash validation,
  Wren dry-plan).
- **Explainability / linhagem** — rastrear todo número até sua definição, dataset
  e dependências (Cube/Lightdash/Vanna proveniência); base de confiança e
  auditoria, alinhada a `adr-0018`.
- **Timeline imutável de mudanças** — histórico append-only de alterações de
  definição e configuração por tenant (Airbyte connection timeline).

### Onda 4 — Governança em execução e IA (Fase 2 — gated por ADR)

**Nada aqui é autorizado.** Depende de runtime real, auth real ou IA.

- **RBAC aplicado a usuários finais** — enforcement das permissões em endpoints;
  exige `adr-0006` (JWT).
- **RLS/CLS aplicada a dados** — regras de row/column-level injetadas na execução
  real de query; exige runtime real (`adr-0014`).
- **Mascaramento em resultados** — `adr-0023` aplicada aos dados retornados pela
  execução; depende de runtime real.
- **Observability e cost tracking** — métricas de uso, auditoria de execução e —
  para IA — rastreio de custo/tokens por tenant (Vanna LLM observability).
- **IA como sujeito de ACL auditado** — o AI assistant futuro é um ator com papel,
  permissões e trilha de auditoria próprios (NocoBase AI Employees); gated por
  `adr-0025`.
- **Auditoria de uso como insight** — agregar a trilha de auditoria em métricas de
  adoção e ativos mais usados (Metabase usage analytics).

---

## Tabela de roadmap

| Item | Onda | Prioridade | Complexidade | Maturidade | Módulos | Foundation vs futuro | ADRs |
|---|---|---|---|---|---|---|---|
| Certificação e ownership de ativos | 1 | Alta | Baixa | `Research` | `datasets`, `query-definitions`, `dashboard-definitions` | Foundation declarativa | nova (asset governance), adr-0017 |
| Catálogo com pastas e tagging | 1 | Média | Baixa | `Research` | `datasets`, `field-mappings` | Foundation declarativa | — |
| Sanitização de metadados consolidada | 1 | Alta | Baixa | `Research` | `core/utils`, `audit` | Foundation declarativa | **adr-0020** |
| Security context unificado | 1 | Alta | Média | `Research` | `auth`, `users`, `query-definitions` | Foundation declarativa | adr-0017 |
| Modelo de roles completo | 2 | Alta | Média | `Research` | `users`, `auth` | Modelo agora · enforcement gated | **adr-0017**, adr-0006 |
| Permissões field-level | 2 | Alta | Alta | `Research` | `users`, `datasets`, `field-mappings`, `audit` | Foundation de modelo | adr-0017, adr-0023 |
| Contrato de RLS/CLS | 2 | Alta | Alta | `Research` | `query-definitions`, `users` | Contrato agora · aplicação Onda 4 | nova (RLS/CLS), adr-0017 |
| Política de field-level masking | 2 | Alta | Média | `Research` | `field-mappings`, `datasets` | Foundation declarativa | **adr-0023** |
| Versionamento de definições | 3 | Alta | Média | `Research` | `query-definitions`, `dashboard-definitions`, `report-definitions` | Foundation declarativa | nova (definition versioning) |
| Validação de integridade | 3 | Média | Média | `Research` | `query-definitions`, `datasets`, `field-mappings` | Foundation declarativa | nova (definition validation) |
| Explainability / linhagem | 3 | Média | Média | `Research` | `query-definitions`, `field-mappings`, `audit` | Foundation declarativa | adr-0018 (extensão) |
| Timeline imutável de mudanças | 3 | Média | Média | `Research` | `audit` | Foundation declarativa | adr-0018 (extensão) |
| RBAC aplicado a usuários finais | 4 | Alta | Alta | `Idea` | `auth`, `users` | Futuro gated | **adr-0006**, adr-0017 |
| RLS/CLS aplicada a dados | 4 | Alta | Alta | `Idea` | `runtime`, `query-definitions` | Futuro gated | adr-0014, adr-0017 |
| Mascaramento em resultados | 4 | Alta | Alta | `Idea` | `runtime`, `field-mappings` | Futuro gated | **adr-0023**, adr-0014 |
| Observability e cost tracking | 4 | Média | Média | `Idea` | `runtime`, `audit`, `health` | Futuro gated | nova (observability) |
| IA como sujeito de ACL auditado | 4 | Média | Média | `Idea` | `users`, `auth`, `audit`, IA futura | Futuro gated | **adr-0025**, adr-0017, adr-0018 |
| Auditoria de uso como insight | 4 | Baixa | Média | `Idea` | `audit` | Futuro gated | adr-0018 (extensão) |

---

## Riscos e guard-rails

- **`tenantId` é fronteira, não filtro.** Toda query multi-tenant é tenant-scoped;
  o isolamento é derivado do security context, jamais opcional.
- **`credentialRef` nunca é o segredo.** Nenhuma onda permite o segredo no control
  plane; decifração só sob `adr-0021`, em plano isolado.
- **Modelar RBAC ≠ aplicar RBAC.** O modelo de roles e os contratos de RLS/CLS são
  foundation; o enforcement em endpoints e em dados depende de `adr-0006` e de
  runtime real (`adr-0014`).
- **Sanitização é inegociável** (`adr-0020`) — nenhum log, erro ou export carrega
  forbidden fields; vale também para a trilha de auditoria.
- **IA sob a mesma governança que humanos** — o AI assistant nunca é bypass de
  ACL; tem papel, permissões e auditoria próprios (`adr-0025`).
- **Auditoria append-only** — a trilha (`adr-0018`) é imutável; mudanças de
  definição entram no histórico versionado.
- **Compliance LGPD** orienta mascaramento, RLS/CLS e isolamento físico futuro
  (control plane / data plane).

---

## Relacionado

- [../nocobase/ideas-for-delfos.md](../nocobase/ideas-for-delfos.md)
- [../superset/premium-features.md](../superset/premium-features.md)
- [../cube/architecture.md](../cube/architecture.md)
- [../wren-ai/ideas-for-delfos.md](../wren-ai/ideas-for-delfos.md)
- [../lightdash/ideas-for-delfos.md](../lightdash/ideas-for-delfos.md)
- [../vanna/ideas-for-delfos.md](../vanna/ideas-for-delfos.md)
- [../airbyte/architecture.md](../airbyte/architecture.md)
- [./connectors-roadmap.md](./connectors-roadmap.md)
- [./embedded-analytics-roadmap.md](./embedded-analytics-roadmap.md)
- [./builder-and-ux-roadmap.md](./builder-and-ux-roadmap.md)
- [../../adr/adr-0006-jwt-self-managed-auth.md](../../adr/adr-0006-jwt-self-managed-auth.md)
- [../../adr/adr-0016-temporary-admin-key-auth.md](../../adr/adr-0016-temporary-admin-key-auth.md)
- [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md)
- [../../adr/adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- [../../adr/adr-0019-credential-encryption-and-rotation.md](../../adr/adr-0019-credential-encryption-and-rotation.md)
- [../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md](../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md)
- [../../adr/adr-0023-data-masking-policy.md](../../adr/adr-0023-data-masking-policy.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [../maturity-taxonomy.md](../maturity-taxonomy.md)
