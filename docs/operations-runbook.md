# Runbook Operacional - delfos-api

Orienta diagnostico e resposta a incidentes comuns da foundation administrativa/declarativa.

## Principios

- Priorizar seguranca e integridade.
- Registrar causa raiz, impacto e correcao.
- Nao executar comandos destrutivos sem autorizacao explicita.
- Nao compartilhar dados reais de cliente sem necessidade e autorizacao.
- Nao tratar procedimentos futuros como operacionais no estado atual.

## Estado operacional atual

O estado atual cobre:

- `GET /health`;
- MongoDB usado como store de configuracao/metadados;
- auth temporaria por `x-delfos-admin-key`;
- headers temporarios de tenant, actor e role;
- seed/dev local com dados ficticios;
- catalogos foundation declarativos;
- report-definitions declarativas;
- `execution-preview` demo em memoria;
- `runtime/execution-requests` foundation, apenas registro administrativo de solicitacoes futuras
  e eventos administrativos seguros de ciclo de vida;
- Swagger em `/docs` conforme `SWAGGER_ENABLED`.

Nao existe procedimento operacional atual para JWT/login, conectores reais, teste real de API de
cliente, cache, fila, scheduler, worker real, dashboard runtime ou query builder.

## API indisponivel

1. Verificar processo/container.
2. Conferir logs por `requestId` ou `correlationId`.
3. Validar variaveis obrigatorias: `DELFOS_DATABASE_URL`, `DELFOS_ADMIN_KEY` e
   `ENCRYPTION_KEY_BASE64`.
4. Testar conexao com MongoDB.
5. Conferir ultimo deploy ou ultima alteracao local.
6. Fazer rollback apenas com autorizacao quando o problema tiver comecado apos deploy.

## Healthcheck

1. Chamar `GET /health`.
2. Confirmar status HTTP `200`.
3. Confirmar envelope esperado do healthcheck.
4. Se falhar, verificar processo, porta `PORT` e conectividade com MongoDB.

## MongoDB indisponivel

1. Verificar rede e credenciais.
2. Conferir disponibilidade do servidor/container.
3. Validar `DELFOS_DATABASE_URL`.
4. Avaliar disco/volume quando aplicavel.
5. Confirmar que o banco usado para desenvolvimento local nao contem dado real de cliente.

## Swagger

Swagger UI fica em `/docs` quando `SWAGGER_ENABLED=true`.

Se Swagger nao abrir:

1. Confirmar `SWAGGER_ENABLED`.
2. Confirmar `NODE_ENV`; o default e habilitado em desenvolvimento/teste e desabilitado em
   producao.
3. Confirmar que a API esta respondendo em `http://localhost:3000`.

Nao colocar valores reais de secrets em exemplos do Swagger ou documentos.

## Erros 401/403 atuais

No estado atual, endpoints administrativos protegidos usam `x-delfos-admin-key` e roles
temporarias.

Verificar:

1. Header `x-delfos-admin-key` presente.
2. Valor igual ao `DELFOS_ADMIN_KEY` do ambiente, sem imprimir a chave em logs.
3. Headers temporarios de actor/role quando a rota exigir mutacao.
4. Role permitida para a operacao (`owner`, `admin`, `operator` ou `viewer` conforme contrato).
5. `tenantId` informado quando o recurso for tenant-scoped.

JWT, login, refresh token e OAuth sao futuros e nao fazem parte do procedimento atual.

## Erro em catalogos foundation

Aplica-se a `tenants`, `users`, `connections`, `credentials`, `datasets`, `field-mappings`,
`query-definitions`, `dashboard-definitions` e `report-definitions`.

Verificar:

1. `x-delfos-admin-key`.
2. `tenantId` quando exigido.
3. Payload conforme DTO/documentacao.
4. Metadata/settings sem secrets, tokens, connection strings reais ou payload sensivel.
5. `requestId` e `correlationId` no envelope de erro.

Esses fluxos sao declarativos. Nao deve haver chamada externa, query real, cache, worker,
scheduler, fila, staging ou snapshot.

## Erro em query definitions

Query definitions sao configuracao declarativa. Se houver erro em `/api/v1/query-definitions`,
verifique `tenantId`, `datasetId`, `queryKey`, status, type e `requestId`.

Nao deve haver tentativa de execucao de query, conexao externa, cache, worker, scheduler ou fila
nesse fluxo.

## Erro em dashboard definitions

Dashboard definitions sao configuracao declarativa. Se houver erro em
`/api/v1/dashboard-definitions`, verifique `tenantId`, `dashboardKey`, status, visibility e
`requestId`.

Nao deve haver tentativa de renderizacao final, execucao de query, conexao externa, cache, worker,
scheduler ou fila nesse fluxo.

## Erro em report definitions

Report definitions sao configuracao declarativa. Se houver erro em
`/api/v1/report-definitions`, verifique `tenantId`, `reportKey`, status, visibility e `requestId`.

Nao deve haver tentativa de geracao de PDF/Excel/CSV, execucao de query, envio de e-mail,
agendamento, conexao externa, cache, worker, scheduler ou fila nesse fluxo.

## Erro em preview/demo execution

Os endpoints de preview demo sao:

- `POST /api/v1/query-definitions/:id/preview?tenantId=...`
- `POST /api/v1/dashboard-definitions/:id/preview?tenantId=...`

Se houver erro, verifique:

1. `x-delfos-admin-key` presente e valido.
2. `tenantId` informado e valido.
3. Recurso raiz existente para o mesmo `tenantId`.
4. `queryDefinitionId` de widgets, quando houver.
5. `requestId` e `correlationId` no envelope de erro.

Esse fluxo deve gerar apenas dados ficticios em memoria com `mode: "demo"`. Nao deve haver
chamada externa, SQL, Mongo aggregation analitico, conector, cache, fila, scheduler, worker,
staging ou snapshot persistido.

Para incidentes de vazamento, conferir que:

- respostas nao incluem metadata/settings/options nem filtros livres usados como segredo;
- auditoria de `execution_preview.query.generated` contem apenas `tenantId`,
  `queryDefinitionId`, `queryKey` e `mode`;
- auditoria de `execution_preview.dashboard.generated` contem apenas `tenantId`,
  `dashboardDefinitionId`, `dashboardKey`, `mode`, `widgetsCount` e `readyWidgetsCount`;
- auditoria nunca contem `rows`, valores gerados, payload operacional, default values ou
  allowed values.

## Erro em runtime execution requests foundation

Os endpoints foundation de solicitacao futura sao:

- `POST /api/v1/runtime/execution-requests`
- `GET /api/v1/runtime/execution-requests?tenantId=...`
- `GET /api/v1/runtime/execution-requests/:id?tenantId=...`
- `GET /api/v1/runtime/execution-requests/:id/events?tenantId=...`
- `POST /api/v1/runtime/execution-requests/:id/events`
- `POST /api/v1/runtime/execution-requests/:id/dry-run?tenantId=...`
- `POST /api/v1/runtime/execution-requests/:id/demo-execute?tenantId=...`

Se houver erro, verifique:

1. `x-delfos-admin-key` presente e valido.
2. `tenantId` informado e valido.
3. Role temporaria `owner`, `admin` ou `operator` no `POST`; `viewer` nao cria solicitacao,
   evento, dry-run nem demo-execute.
4. `kind` informado como `query`, `dashboard` ou `report`.
5. Referencia obrigatoria conforme o kind: `queryDefinitionId`, `dashboardDefinitionId` ou
   `reportDefinitionId`.
6. Ausencia de campos fora do contrato, como `filters`, `parameters`, `settings`, `secretValue`,
   tokens, senhas, headers sensiveis, connection strings ou payload operacional bruto.
7. Para eventos, `eventType` permitido e `nextStatus` coerente com a transicao foundation.
8. Para dry-run e demo-execute, a execution request pertence ao tenant e as referencias declarativas existem
   conforme o `kind`.
9. `requestId` e `correlationId` no envelope de erro.

Esse fluxo deve apenas persistir metadados administrativos com status foundation, normalmente
`accepted` e `reason: "runtime_foundation_only"`. Nao deve haver runtime real, connector real,
`delfos-connectors`, local agent, query real, PDF/Excel/CSV real, envio de e-mail, teste real de
conexao, discovery real de schema, chamada externa, cache, fila, scheduler, worker, staging,
snapshot ou materializacao.

Eventos de ciclo de vida tambem sao foundation administrativa. Um evento inicial `accepted` e
registrado quando a execution request e criada. `POST /:id/events` pode registrar nota ou transicao
de status administrativo, mas isso nao dispara runtime, conector, worker, fila, scheduler, cache,
query, exportacao, e-mail ou qualquer chamada externa.

Dry-run/readiness tambem e foundation administrativa. `POST /:id/dry-run` le apenas contratos
declarativos ja persistidos no Mongo administrativo do Delfos, retorna checks/warnings/blockers,
registra evento `accepted` ou `blocked` na timeline com `reason:
"dry_run_readiness_checked"` e pode atualizar o status administrativo para `accepted` ou
`blocked`. Ele nao executa runtime real, query, dashboard, report, export, conector, worker, fila,
cache, scheduler, credential decrypt, chamada externa, teste de conexao ou acesso a fonte de
cliente.

Demo-execute tambem e foundation administrativa. `POST /:id/demo-execute` le apenas contratos
declarativos via readiness, retorna resultado ficticio limitado quando pronto, registra evento
`completed_demo` ou `blocked` na timeline com `reason:
"demo_runtime_executor_foundation"` e atualiza o status administrativo para `completed_demo` ou
`blocked`. Ele nao aceita body e nao executa runtime real, query, dashboard, report, export,
conector, worker, fila, cache, scheduler, credential decrypt, chamada externa, teste de conexao ou
acesso a fonte de cliente. O `demoResult` nunca deve ser tratado como dado real nem auditado
integralmente.

Para incidentes de vazamento, conferir que:

- respostas nao incluem payload bruto, rows, segredo, credentialRef, token, senha, authorization
  header, connection string, filters, parameters ou settings livres;
- `metadata` da execution request e dos eventos foi sanitizado;
- `message` e `reason` de eventos nao contem segredo;
- auditoria de `execution_request.created` contem apenas `tenantId`, `kind`, `status`, references
  declarativas e ator/role;
- auditoria de `execution_request.event.created` e `execution_request.status_changed` contem apenas
  `tenantId`, `executionRequestId`, `requestKey`, `eventType`, `previousStatus`, `nextStatus` e
  ator/role;
- auditoria de `execution_request.dry_run_checked` contem apenas `tenantId`,
  `executionRequestId`, `requestKey`, `kind`, `ready`, `blockersCount`, `warningsCount` e
  `nextStatus`;
- auditoria de `execution_request.demo_executed` contem apenas `tenantId`, `executionRequestId`,
  `requestKey`, `kind`, `status`, `ready`, `blockersCount` e `warningsCount`;
- auditoria nunca contem metadata livre, payload bruto ou campos sensiveis.

## Erro no seed local de desenvolvimento

O comando `npm run seed:dev` e exclusivo para ambiente local. Se falhar, verifique:

1. MongoDB local acessivel em `DELFOS_DATABASE_URL`.
2. Variaveis obrigatorias do `.env`, principalmente `ENCRYPTION_KEY_BASE64`.
3. Ausencia de dados reais no banco local usado para validacao.
4. Mensagem de erro do terminal sem expor secrets.

O output esperado deve listar IDs, chaves logicas e nomes de datasets, query definitions e
dashboard definitions, alem de comandos PowerShell de preview. Esses comandos devem referenciar
`$env:DELFOS_ADMIN_KEY` literalmente e nunca imprimir o valor da chave ou `secretValue`.

O seed deve apenas criar ou atualizar configuracoes ficticias da foundation. Ele nao deve executar
query, chamar API externa, conectar em banco de cliente, criar cache, worker, scheduler ou fila.

## Rotacao de DELFOS_ADMIN_KEY

A `DELFOS_ADMIN_KEY` e uma autenticacao temporaria da foundation. Deve ser rotacionada
proativamente a cada 90 dias, apos troca de responsavel operacional com acesso ao ambiente, e
imediatamente apos suspeita de comprometimento.

Procedimento:

1. Gerar novo valor com comprimento minimo de 32 caracteres e alta entropia.
   Exemplo local, nao usar em producao: `openssl rand -hex 32`.
2. Atualizar `DELFOS_ADMIN_KEY` no `.env` ou secret store do ambiente de destino.
3. Reiniciar a aplicacao para carregar o novo valor.
4. Verificar que endpoints protegidos por `x-delfos-admin-key` respondem com a nova chave.
5. Invalidar o valor antigo no ambiente.
6. Registrar em log operacional, ticket ou trilha de audit a data, motivo, ambiente e
   responsavel pela rotacao.

Em incidente de vazamento confirmado ou suspeito, a rotacao deve ser imediata. Nunca registrar o
valor real da chave em log, auditoria, documento, PR ou historico versionado.

## Rotacao de ENCRYPTION_KEY_BASE64

A `ENCRYPTION_KEY_BASE64` protege `secretValue` das credenciais armazenadas via AES-256-GCM local,
conforme `foundation-credentials-and-security.md` secao 1. Perda dessa chave torna as
credenciais armazenadas irrecuperaveis.

Na Fase 1, o Delfos usa **chave unica por ambiente** como mecanismo atual (decisao fechada,
ADR-0019). A chave nunca e versionada e a rotacao abaixo e um **procedimento controlado**. Chave
por tenant, envelope encryption por tenant e KMS/Vault sao evolucao futura e dependem de ADR
propria; nao implementar sem essa ADR.

Backup recomendado:

1. Guardar a chave em cofre/secret manager fora do repositorio e fora de documentos versionados.
2. Restringir acesso por menor privilegio e registrar quem consultou ou alterou o segredo.
3. Manter copia de recuperacao no mesmo padrao de cofre usado para outros secrets criticos.

Procedimento:

1. Gerar nova chave de 32 bytes em base64. Exemplo local: `openssl rand -base64 32`.
2. Criar pipeline de re-criptografia em ambiente seguro que descriptografe com a chave atual,
   re-criptografe com a nova chave e salve o novo `protectedSecretValue` para todas as
   credenciais existentes.
3. Somente apos migracao bem-sucedida, atualizar `ENCRYPTION_KEY_BASE64`.
4. Reiniciar a aplicacao e validar que credenciais existentes ainda funcionam.
5. Registrar em log operacional, ticket ou trilha de audit a data, motivo, ambiente e
   responsavel pela rotacao.

Nao substituir a variavel sem a migracao; todas as credenciais existentes ficarao ilegíveis.

O pipeline de rotacao real permanece **[futuro]** enquanto nao houver Vault/KMS/Secrets Manager ou
mecanismo equivalente. A implementacao atual ja fica isolada em service proprio para troca futura
por Vault/KMS/Secrets Manager, conforme `foundation-credentials-and-security.md` secao 1.

## Procedimentos futuros/deferidos

Os itens abaixo nao sao operacionais no estado atual:

- JWT/login/refresh/OAuth;
- teste real de connection;
- falha em API de cliente;
- conectores reais;
- servico/runtime `delfos-connectors` e local agent (foundation documental existe via ADR-0013);
- cache, fila, worker, scheduler, staging ou snapshot;
- runtime real de execution requests ou seus eventos foundation;
- dashboard runtime final e query builder.

Quando essas capacidades forem aprovadas e implementadas, este runbook deve ganhar secoes
operacionais especificas antes de uso em ambiente real.

## Incidente de seguranca

1. Isolar impacto.
2. Preservar evidencias.
3. Revogar secrets/tokens suspeitos quando aplicavel.
4. Verificar logs e auditoria.
5. Registrar plano de correcao.
