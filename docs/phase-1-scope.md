# Escopo da Fase 1 - Delfos Analytics

> Status: documento normativo.
> Objetivo: delimitar o estado atual da foundation e o que fica planejado para etapas futuras.

A etapa atual da Fase 1 valida a foundation administrativa/declarativa do Delfos Analytics. O foco agora e consolidar contratos, seguranca, catalogos, governanca e preview demo, sem execucao real e sem conexao com banco/API de cliente.

O consumo real de APIs custom, conectores, cache, fila, scheduler, dashboard runtime, query builder e execucao real permanecem visao futura e dependem de autorizacao explicita, ADR quando necessario e alinhamento com ADR-0008 e ADR-0012.

---

## Estado atual implementado

**Implementado (foundation):**

| Modulo | Status |
|---|---|
| health | Implementado |
| auth (admin-key temporario) | Implementado - sem JWT real |
| audit | Implementado |
| tenants | Implementado |
| users | Implementado |
| connections | Implementado - declarativo, sem chamada externa |
| credentials | Implementado - protecao local, `credentialRef` |
| datasets | Implementado - declarativo |
| field-mappings | Implementado - declarativo |
| query-definitions | Implementado - declarativo |
| dashboard-definitions | Implementado - declarativo |
| report-definitions | Implementado - declarativo |
| runtime/execution-requests | Implementado - foundation de contratos/estados, sem execucao real |
| execution-preview | Implementado - demo em memoria, sem execucao real |
| seed/dev local | Implementado - dados ficticios |

**Nao implementado e nao autorizado sem decisao explicita:**

- JWT auth real, login, refresh, bcrypt, OAuth ou MFA.
- Conectores reais.
- Servico/runtime `delfos-connectors` ou local agent (o repositorio `delfos-connectors` existe
  apenas como foundation documental/governanca, autorizada via ADR-0013).
- Teste real de conexao.
- Cache real, fila, worker ou scheduler.
- Execucao real de query.
- Conexao com banco, API, arquivo ou sistema de cliente.
- Dashboard runtime final, widget builder final ou query builder guiado.
- Runtime de relatorios, exportacoes reais, white-label e preferencias finais.

---

## 1. Objetivo atual da Fase 1

Entregar uma foundation capaz de:

- expor contratos administrativos protegidos por `x-delfos-admin-key`;
- separar recursos por tenant;
- cadastrar tenants, usuarios administrativos, connections declarativas e credentials protegidas;
- cadastrar datasets, field-mappings, query-definitions, dashboard-definitions e report-definitions declarativos;
- registrar execution requests foundation com references e estados seguros para runtime futuro;
- gerar `execution-preview` demo em memoria, sempre ficticio;
- popular ambiente local com seed/dev ficticio;
- auditar mutacoes sensiveis sem gravar payloads ou secrets.

---

## 2. Premissa principal atual

O Delfos nao armazena dados operacionais reais dos clientes na etapa atual.

Tambem nao busca dados reais em APIs, bancos, arquivos ou sistemas de clientes. Dados como vendas, produtos, pedidos, clientes finais, estoque, financeiro ou transacoes so podem aparecer como fixtures/demo explicitamente ficticias.

---

## 3. Incluido no estado atual

### 3.1 Autenticacao temporaria e usuarios administrativos

- Auth temporaria por `x-delfos-admin-key`.
- Headers temporarios de contexto (`tenantId`, `actorId`, `actorRole`) conforme contratos foundation.
- Cadastro e gestao de usuarios administrativos.
- Vinculo usuario/tenant.
- Sem login, senha, JWT, refresh token, OAuth ou MFA.

### 3.2 Tenants e roles administrativas

- Cadastro de tenants.
- Isolamento por tenant em recursos tenant-scoped.
- Roles administrativas temporarias: `owner`, `admin`, `operator`, `viewer`.
- Auditoria de acoes sensiveis.

### 3.3 Connections e credentials declarativas

- Cadastro declarativo de connection.
- Tipo de autenticacao planejado/declarativo.
- `credentialRef`.
- Credentials protegidas localmente.
- Status da connection.
- Sem teste real de conexao.
- Sem chamada externa.

### 3.4 Catalogos declarativos

- Datasets logicos.
- Field mappings.
- Query definitions ligadas a dataset.
- Dashboard definitions ligadas a queryDefinition por widget.
- Metadata/settings sanitizados.
- Soft delete/arquivamento quando aplicavel.

### 3.5 Preview demo

- Preview demo de query definition.
- Preview demo de dashboard definition.
- Respostas com `mode: "demo"`.
- Sem execucao real de query.
- Sem persistencia de resultado analitico.
- Sem cache, fila, worker, scheduler ou conector.

### 3.6 Design System

Aplicavel principalmente ao `delfos-web`. Componentes e tokens atuais devem ser usados sem redesign nao solicitado.

---

## 4. Fora do escopo atual

Fora do escopo imediato:

- ETL proprio.
- Ingestao recorrente de dados operacionais.
- Data warehouse proprio.
- Historico analitico persistente.
- Cache real ou Redis.
- Filas, workers ou scheduler.
- Motor de alertas.
- IA generativa embarcada no produto.
- Criacao automatica de APIs para clientes.
- Acesso direto ao banco de dados do cliente.
- Consumo direto de API, banco, arquivo ou sistema de cliente.
- Conector real.
- Servico/runtime `delfos-connectors` (foundation documental existe; ver ADR-0013).
- Local agent.
- Login/JWT/OAuth real.
- Dashboard runtime final.
- App mobile nativo.
- Marketplace de conectores.

Detalhes em `docs/out-of-scope.md`.

---

## 5. Criterio de sucesso da etapa atual

Esta etapa da Fase 1 e considerada bem-sucedida quando:

- tenants, usuarios administrativos, connections e credentials podem ser cadastrados com seguranca;
- datasets podem ser cadastrados como catalogo declarativo;
- campos podem ser mapeados por De/Para;
- query-definitions, dashboard-definitions e report-definitions podem ser cadastradas e consultadas por tenant;
- execution requests foundation podem ser criadas e consultadas por tenant sem disparar runtime real;
- previews demo deixam claro que os dados sao ficticios;
- permissoes temporarias impedem mutacoes indevidas;
- contratos de erro incluem `requestId`/`correlationId`;
- audit interno nao grava segredo ou payload sensivel;
- a arquitetura permanece pronta para evoluir para `delfos-connectors`, local agent e execucao real futura.

---

## 6. Limitacoes aceitas

Sao limitacoes conscientes do estado atual:

- nao ha dado real de cliente;
- nao ha teste real de conexao;
- nao ha execucao real;
- nao ha cache/fila/scheduler;
- nao ha login/JWT/OAuth real;
- nao ha dashboard runtime final;
- o preview e apenas demo em memoria.

---

## 7. Quando criar ADR

Criar ADR quando houver proposta de:

- armazenar dado operacional do cliente;
- adicionar Redis, cache, fila, worker ou scheduler;
- acessar banco de cliente diretamente;
- consumir API, banco, arquivo ou sistema de cliente;
- criar conector real, servico/runtime `delfos-connectors` ou local agent;
- mudar mecanismo de autenticacao;
- criar execucao real de query;
- adicionar biblioteca paga ou restritiva;
- alterar estrategia de repositorios;
- mudar motor de graficos;
- alterar isolamento multi-tenant.
