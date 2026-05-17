# Roadmap consolidado — Embedded Analytics

> Tipo: roadmap estratégico consolidado · Status: conceitual/futuro — não autoriza implementação

---

## Escopo e premissas

Este roadmap consolida as ideias de **embedded analytics** — distribuir dashboards
e widgets do Delfos dentro de produtos externos de clientes — destiladas de quatro
estudos: **Cube** (referência principal — security context, APIs de consumo
REST/GraphQL/SQL, embedded forte), **Metabase** (embedding signed, X-rays como
gancho de descoberta), **Superset** (guest tokens com escopo de tenant, embedded
SDK) e **Chartbrew** (tokens de embed escopados por tenant, client accounts).

Premissa que governa todo o documento: **embedded analytics é Fase 2+**. O embed
depende de **auth real** (`adr-0006` — JWT self-managed, ainda futuro) e de
**isolamento de tenant** consolidado (`adr-0009`). A auth atual é a chave
temporária `x-delfos-admin-key` — inadequada para tokens públicos de embed. Nada
neste roadmap autoriza implementação; cada item exige ADR aprovada.

A foundation declarativa **pode**, contudo, preparar o terreno: modelar o conceito
de "embeddable", definir o contrato do token e desenhar as APIs de consumo como
contrato — sem expor nenhum endpoint público nem emitir nenhum token.

---

## Princípios arquiteturais

1. **Token carrega o tenant, não o cliente** — inspiração guest tokens do Superset
   e security context do Cube. O `tenantId` é derivado do token assinado, nunca
   informado pelo embed host. O isolamento multi-tenant é propriedade do token.
2. **Security context unificado** — o mesmo objeto verificado (tenant, actor, role)
   que governa queries internas governa o embed; filtros obrigatórios de tenant
   são derivados do contexto, não escritos à mão (Cube `queryRewrite`).
3. **APIs de consumo como contrato** — Cube expõe dados via REST/GraphQL/SQL. O
   Delfos define um contrato de API de consumo de `dashboard-definitions`/widgets
   estável e versionado, separado da API administrativa.
4. **Embed escopado por artefato** — o token é escopado a um dashboard/widget e a
   um conjunto de parâmetros; nunca dá acesso amplo ao tenant.
5. **Signed URLs com expiração** — toda referência de embed é assinada, expira e é
   auditável; nenhuma URL de embed é adivinhável ou perpétua.

---

## Ondas do roadmap

### Onda 0 — Estado atual (foundation já entregue)

- `dashboard-definitions` e `report-definitions` declarativos e tenant-scoped.
- `tenants` com isolamento `tenantId` como invariante.
- `chart_renderer` abstrato no `delfos-web` (`adr-0003`) — base para renderizar
  widgets fora do shell principal.
- Auth temporária por `x-delfos-admin-key`; **não** serve para embed.

### Onda 1 — Modelagem de "embeddable" (foundation declarativa)

Puramente declarativa: descreve o que pode ser embedado, sem expor nada.

- **Flag e metadados de "embeddable"** — `dashboard-definitions` ganham metadados
  declarativos: pode ser embedado? quais widgets? quais parâmetros aceita?
- **Contrato de parâmetros de embed** — definir os parâmetros que um embed host
  pode passar (filtros, período, segmento), reutilizando o sistema de variáveis
  nomeadas de query (Chartbrew). Apenas o contrato.
- **Catálogo de widgets embedáveis** — distinguir widget standalone (embedável
  isolado) de widget só-dashboard; metadado declarativo.

### Onda 2 — Contrato de token e API de consumo (foundation de contrato)

Define os contratos sem emitir tokens nem abrir endpoints.

- **Contrato do token de embed** — formato do payload: `tenantId`, artefato
  escopado, parâmetros permitidos, expiração, role do guest. Modelado como tipo,
  não emitido (depende de `adr-0006`).
- **Contrato da API de consumo** — desenhar a superfície de leitura de
  `dashboard-definitions`/widgets para embed (REST como contrato; GraphQL/SQL como
  visão futura, inspiração Cube). Separada da API administrativa.
- **Security context para embed** — formalizar como o security context unificado
  (tenant, role guest) é derivado do token e aplicado às query-definitions.

### Onda 3 — White-label e personalização (declarativo + UI)

- **Tema e branding por tenant** — `delfos-web` aplica tema/branding do tenant ao
  embed via `tokens.dart`; cores nunca hardcoded (regra do `delfos-web`).
- **Modos de embed** — dashboard completo, widget único, modo interativo vs.
  read-only; configuração declarativa.
- **Estados no embed** — embed respeita `DelfosLoadingState`, `DelfosEmptyState`,
  `DelfosErrorState`, `DelfosPermissionState` (regra 5 do `delfos-web`).

### Onda 4 — Embed real e signed URLs (Fase 2 — gated por ADR)

**Nada aqui é autorizado.** Cada item exige ADR aprovada e auth real.

- **Emissão de guest tokens** — endpoint que emite token assinado e escopado;
  exige `adr-0006` (JWT) aprovada.
- **Endpoints públicos de consumo** — superfície de leitura para embed hosts, com
  rate limiting e isolamento de tenant verificado no token.
- **Signed URLs com expiração** — referências de embed assinadas, expiráveis,
  auditadas via `adr-0018`.
- **Embedded SDK / iframe helper** — biblioteca cliente para integrar o embed em
  produtos externos (inspiração embedded SDK do Superset).
- **Cross-filtering no embed** — interação entre widgets embedados, dependente de
  runtime real e do modelo de interação declarativo.
- **X-rays / descoberta como gancho de embed** — geração automática de uma vista
  inicial a partir de um dataset, útil como onboarding do embed (Metabase).

---

## Tabela de roadmap

| Item | Onda | Prioridade | Complexidade | Maturidade | Módulos | Foundation vs futuro | ADRs |
|---|---|---|---|---|---|---|---|
| Flag/metadados de embeddable | 1 | Alta | Baixa | `Research` | `dashboard-definitions` | Foundation declarativa | adr-0011 (extensão) |
| Contrato de parâmetros de embed | 1 | Alta | Média | `Research` | `dashboard-definitions`, `query-definitions` | Foundation declarativa | nova (embed params) |
| Catálogo de widgets embedáveis | 1 | Média | Baixa | `Research` | `dashboard-definitions` | Foundation declarativa | adr-0011 (extensão) |
| Contrato do token de embed | 2 | Alta | Média | `Research` | `auth`, `tenants` | Contrato agora · emissão Onda 4 | adr-0006 (depende) |
| Contrato da API de consumo | 2 | Alta | Média | `Research` | `dashboard-definitions`, `runtime` | Foundation de contrato | nova (consumption API) |
| Security context para embed | 2 | Alta | Média | `Research` | `auth`, `query-definitions` | Foundation de contrato | adr-0017, adr-0009 |
| Tema/branding por tenant | 3 | Média | Média | `Research` | `delfos-web`, `tenants` | Foundation declarativa + UI | adr-0003 (ref.) |
| Modos de embed | 3 | Média | Baixa | `Research` | `dashboard-definitions`, `delfos-web` | Foundation declarativa | adr-0011 (extensão) |
| Estados no embed | 3 | Alta | Baixa | `Research` | `delfos-web` | Foundation (UI) | — |
| Emissão de guest tokens | 4 | Alta | Alta | `Idea` | `auth`, `tenants` | Futuro gated | **adr-0006** |
| Endpoints públicos de consumo | 4 | Alta | Alta | `Idea` | `dashboard-definitions`, `runtime` | Futuro gated | adr-0006, adr-0009 |
| Signed URLs com expiração | 4 | Alta | Média | `Idea` | `auth`, `audit` | Futuro gated | adr-0006, adr-0018 |
| Embedded SDK / iframe helper | 4 | Média | Alta | `Idea` | novo pacote cliente | Futuro gated | nova (embedded SDK) |
| Cross-filtering no embed | 4 | Média | Alta | `Idea` | `dashboard-definitions`, `runtime` | Futuro gated | nova (interaction model) |
| X-rays como onboarding de embed | 4 | Baixa | Alta | `Idea` | `datasets`, `dashboard-definitions` | Futuro gated | nova (auto-exploration) |

---

## Riscos e guard-rails

- **Sem auth real, sem embed real.** O embed expõe analytics fora do perímetro
  administrativo; depende de `adr-0006` (JWT). A chave `x-delfos-admin-key` é
  admin-only e jamais pode vazar para um embed host.
- **Isolamento de tenant é não-negociável.** O `tenantId` vem sempre do token
  assinado e verificado no servidor; nunca de um parâmetro do embed host. Um token
  de um tenant nunca pode ler dados de outro.
- **Escopo mínimo no token.** O token de embed é escopado a artefato + parâmetros;
  nunca concede acesso amplo nem privilégios administrativos.
- **Tudo auditável.** Emissão de token e acesso via embed entram na trilha de
  auditoria (`adr-0018`); signed URLs expiram.
- **Sem cores hardcoded no white-label** — branding por tenant via `tokens.dart`;
  light e dark validados (regras do `delfos-web`).
- **Endpoints de consumo são read-only** e separados da API administrativa.

---

## Relacionado

- [../cube/architecture.md](../cube/architecture.md)
- [../cube/ideas-for-delfos.md](../cube/ideas-for-delfos.md)
- [../metabase/ideas-for-delfos.md](../metabase/ideas-for-delfos.md)
- [../superset/ideas-for-delfos.md](../superset/ideas-for-delfos.md)
- [../chartbrew/ideas-for-delfos.md](../chartbrew/ideas-for-delfos.md)
- [./connectors-roadmap.md](./connectors-roadmap.md)
- [./builder-and-ux-roadmap.md](./builder-and-ux-roadmap.md)
- [./enterprise-governance-roadmap.md](./enterprise-governance-roadmap.md)
- [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- [../../adr/adr-0006-jwt-self-managed-auth.md](../../adr/adr-0006-jwt-self-managed-auth.md)
- [../../adr/adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md)
- [../../adr/adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [../maturity-taxonomy.md](../maturity-taxonomy.md)
- [Índice da biblioteca de referências](../README.md)
