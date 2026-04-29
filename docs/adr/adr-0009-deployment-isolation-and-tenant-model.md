# ADR-0009 - Deployment isolation and tenant model

- **Status**: Accepted
- **Data**: 2026-04-29
- **Fase impactada**: Fase 1 e Fase 2

---

## Status

Esta ADR registra uma decisao arquitetural sobre modelo de implantacao e modelo de tenant. Ela
nao implementa mudanca de schema, deploy, endpoint, contrato publico, servico novo ou migracao de
dados nesta fase.

## Contexto

O Delfos Analytics esta separado em dois repositorios principais:

- `delfos-api`, backend NestJS responsavel por contratos, autenticacao/autorizacao, governanca,
  tenants, catalogos, credenciais, auditoria e orquestracao.
- `delfos-web`, frontend Flutter Web responsavel pela interface do usuario.

A ADR-0008 tambem registra o papel futuro do `delfos-connectors` para execucao de integracoes.

A foundation atual do `delfos-api` usa `tenantId` em recursos tenant-scoped e ja possui recursos
administrativos para tenants, users, connections, credentials, field-mappings, datasets,
query-definitions, dashboard-definitions e audit interno. Esses recursos continuam declarativos e
nao exigem mudanca de deploy para esta ADR.

O produto pode ser implantado inicialmente em ambiente separado por cliente ou grupo contratante.
Mesmo nesse modelo, um cliente/grupo pode conter varias empresas, unidades, estabelecimentos ou
divisoes operacionais dentro do mesmo ambiente. Tambem e possivel que, no futuro, exista um modelo
compartilhado com varios clientes/grupos no mesmo servidor ou ambiente.

## Decisao

O Delfos podera adotar inicialmente implantacao isolada por cliente/grupo contratante.

Um ambiente isolado pode ter seus proprios componentes:

- `delfos-api`;
- `delfos-web`;
- MongoDB de configuracao/metadados;
- futuramente, `delfos-connectors`;
- futuramente, outros componentes aprovados por ADR, como fila, cache ou staging.

Mesmo em ambiente isolado, o sistema continuara tenant-aware. O `tenantId` representa o escopo
logico de empresa, unidade, estabelecimento ou divisao operacional dentro daquele cliente/grupo.

Recursos como users, connections, credentials, field-mappings, datasets, query-definitions,
dashboard-definitions e audit continuam tenant-scoped quando aplicavel. O isolamento fisico do
ambiente nao substitui o isolamento logico por `tenantId`.

Esta decisao mantem o Delfos preparado para hospedagem compartilhada futura. Antes de hospedar
multiplos clientes/grupos no mesmo ambiente, deve ser avaliada a necessidade de um nivel acima de
tenant, como `accountId`, `customerId`, `workspaceId` ou `organizationId`.

## Modelo conceitual

### Cliente/grupo contratante

Representa a organizacao que contrata ou opera uma instancia do Delfos. Pode ser uma empresa
unica, um grupo economico, uma rede de lojas, um parceiro white label ou uma unidade de negocio
com autonomia operacional.

No modelo inicial isolado, normalmente ha um ambiente dedicado para esse cliente/grupo.

### Ambiente/servidor

Representa o conjunto tecnico onde o Delfos roda: API, Web, MongoDB e componentes futuros. Um
ambiente pode ser dedicado a um unico cliente/grupo ou, futuramente, compartilhado por varios
clientes/grupos.

Ambiente isolado melhora a separacao operacional, mas nao elimina a necessidade de validacao de
tenant, permissao e auditoria dentro da aplicacao.

### Tenant/empresa/unidade

Representa o escopo logico usado pelo produto para separar configuracoes, catalogos, credenciais,
dashboards, query definitions, field mappings e auditoria.

Em um ambiente isolado, o `tenantId` pode representar:

- uma empresa juridica dentro de um grupo;
- uma matriz;
- uma filial;
- uma loja;
- um estabelecimento;
- uma divisao operacional;
- outro recorte de negocio aprovado para aquele cliente/grupo.

### Usuario

Representa uma pessoa ou ator administrativo que usa o Delfos. Um usuario deve acessar apenas os
tenants aos quais estiver autorizado. O modelo futuro de autenticacao/autorizacao deve continuar
validando tenant server-side, sem confiar em `tenantId`, role ou permissao enviados livremente pelo
frontend.

## Exemplos de implantacao

### Ambiente isolado para Grupo ABC

O Grupo ABC possui um ambiente dedicado:

```text
Ambiente Grupo ABC
  delfos-web
  delfos-api
  MongoDB do Grupo ABC
  delfos-connectors futuro
```

Dentro desse ambiente existem varios tenants:

```text
tenant: Matriz
tenant: Loja 01
tenant: Loja 02
```

Cada tenant possui suas proprias configuracoes tenant-scoped, como users autorizados,
connections, credentials, datasets, field-mappings, query-definitions, dashboard-definitions e
audit. Uma connection ou credential da Loja 01 nao deve ser lida por buscas da Loja 02.

### Ambiente compartilhado futuro

No futuro, um unico ambiente pode hospedar varios clientes/grupos:

```text
Ambiente compartilhado
  Cliente/Grupo ABC
    tenant: Matriz
    tenant: Loja 01
  Cliente/Grupo XYZ
    tenant: Unidade Norte
    tenant: Unidade Sul
```

Nesse modelo, apenas `tenantId` pode nao ser suficiente para representar todos os limites de
governanca, billing, operacao, suporte, backup, restore e segregacao entre clientes/grupos. Antes
de adotar hospedagem compartilhada, o Delfos deve avaliar uma camada acima de tenant, como
`accountId`, `customerId`, `workspaceId` ou `organizationId`, com ADR propria e revisao de
seguranca.

## Seguranca e governanca

- `tenantId` continua obrigatorio para recursos tenant-scoped.
- Buscas por ID em recursos tenant-scoped devem incluir e validar `tenantId`.
- Listagens tenant-scoped devem filtrar por `tenantId` e permissao do usuario.
- Auditoria deve registrar `tenantId` quando a acao afetar recurso tenant-scoped.
- Chaves unicas permanecem por tenant quando aplicavel, como `tenantId + datasetKey`,
  `tenantId + queryKey`, `tenantId + dashboardKey` e combinacoes equivalentes.
- Credenciais permanecem tenant-scoped e nao devem ser retornadas em valor real ao frontend.
- `credentialRef` deve continuar associado ao tenant e ao contexto de connection quando
  aplicavel.
- Logs e erros devem usar contexto minimo, sem segredo real, payload operacional bruto ou dado
  pessoal desnecessario.
- Isolamento fisico por ambiente nao deve ser tratado como unica barreira de seguranca.
- O backend deve validar autorizacao e tenant server-side, mesmo quando houver ambiente dedicado.
- Backups e restores por cliente/grupo ficam mais simples em ambientes isolados, mas devem
  continuar protegidos, criptografados quando aplicavel e operados com menor privilegio.
- Hospedagem compartilhada futura exige revisao explicita de LGPD, isolamento, auditoria,
  retencao, backup/restore e observabilidade.

## Consequencias

### Positivas

- Melhor isolamento operacional por cliente/grupo na fase inicial.
- Backups e restores mais simples por cliente/grupo quando o ambiente for dedicado.
- Menor risco operacional de mistura entre clientes/grupos em banco, deploy e configuracao.
- Customizacoes controladas por cliente/grupo sem transformar tenant em fronteira de deploy.
- Suporte a multiplas empresas, unidades ou estabelecimentos dentro do mesmo cliente/grupo.
- Continuidade do modelo tenant-aware ja usado pela foundation.
- Caminho preservado para hospedagem compartilhada futura, se houver necessidade comercial e
  tecnica.

### Trade-offs

- Mais ambientes para operar quando a implantacao for isolada por cliente/grupo.
- Menor densidade de infraestrutura e possivel aumento de custo operacional.
- Deploy, monitoramento e backup podem se repetir por cliente/grupo.
- Customizacoes por ambiente podem divergir se nao houver governanca de produto.
- Hospedagem compartilhada futura pode exigir um novo identificador acima de tenant, como
  `accountId`, `customerId`, `workspaceId` ou `organizationId`.
- A migracao de um modelo isolado para compartilhado exigira planejamento de dados, identidade,
  auditoria, backups e contratos internos.

## Fora de escopo nesta fase

Esta ADR nao autoriza nem implementa:

- implementar `accountId`, `customerId`, `workspaceId` ou `organizationId` agora;
- mudar schemas atuais;
- criar novo servico;
- alterar endpoints;
- alterar contratos publicos;
- migrar dados;
- alterar deploy real;
- implementar SaaS multi-tenant compartilhado agora;
- alterar codigo TypeScript;
- adicionar dependencias;
- criar fila, cache, scheduler, staging ou `delfos-connectors`;
- documentar ou versionar segredo real.

## Referencias

- `AGENTS.md`
- `SECURITY.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/phase-2-vision.md`
- `docs/data-access-policy.md`
- `docs/database-model.md`
- `docs/api-foundation-contracts.md`
- `docs/foundation-auth-and-errors.md`
- `docs/foundation-data-catalog.md`
- `docs/foundation-credentials-and-security.md`
- `docs/foundation-tenancy-and-admin-resources.md`
- `docs/operations-runbook.md`
- ADR-0004
- ADR-0005
- ADR-0008
