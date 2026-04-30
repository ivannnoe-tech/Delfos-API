# Runbook Operacional - delfos-api

Orienta diagnostico e resposta a incidentes comuns.

## Principios

- Priorizar seguranca e integridade.
- Registrar causa raiz, impacto e correcao.
- Nao executar comandos destrutivos sem autorizacao explicita.
- Nao compartilhar dados reais de cliente sem necessidade e autorizacao.

## API indisponivel

1. Verificar processo/container.
2. Conferir logs por `requestId`.
3. Validar variaveis obrigatorias.
4. Testar conexao com MongoDB.
5. Conferir ultimo deploy.
6. Fazer rollback se o problema comecou apos deploy.

## MongoDB indisponivel

1. Verificar rede e credenciais.
2. Conferir disponibilidade do servidor/cluster.
3. Validar `DELFOS_DATABASE_URL`.
4. Avaliar disco/volume quando aplicavel.

## Erros 401/403 em massa

- Verificar alteracao de JWT secret.
- Conferir validacao de permissao.
- Validar fluxo de login em ambiente controlado.
- Reverter se houver impacto generalizado.

## Falha em API de cliente

Na Fase 1, dados operacionais vem de APIs expostas pelos clientes. Registre status code,
endpoint logico e `requestId`, sem logar payload sensivel.

## Erro em query definitions

Query definitions sao configuracao declarativa. Se houver erro em `/api/v1/query-definitions`,
verifique `tenantId`, `datasetId`, `queryKey`, status, type e `requestId`. Nao deve haver
tentativa de execucao de query, conexao externa, cache, worker, scheduler ou fila nesse fluxo.
Para incidentes de vazamento, conferir auditoria e confirmar que apenas `queryKey`, `status`,
`type` e `datasetId` foram registrados.

## Erro em dashboard definitions

Dashboard definitions sao configuracao declarativa. Se houver erro em
`/api/v1/dashboard-definitions`, verifique `tenantId`, `dashboardKey`, status, visibility e
`requestId`. Nao deve haver tentativa de renderizacao, execucao de query, conexao externa,
cache, worker, scheduler ou fila nesse fluxo. Para incidentes de vazamento, conferir
auditoria e confirmar que apenas `dashboardKey`, `status`, `visibility`, quantidade de
secoes e quantidade de widgets foram registrados.

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

## Erro no seed local de desenvolvimento

O comando `npm run seed:dev` e exclusivo para ambiente local. Se falhar, verifique:

1. MongoDB local acessivel em `DELFOS_DATABASE_URL`.
2. Variaveis obrigatorias do `.env`, principalmente `ENCRYPTION_KEY_BASE64`.
3. Ausencia de dados reais no banco local usado para validacao.
4. Mensagem de erro do terminal sem expor secrets.

O output esperado deve listar IDs, chaves logicas e nomes de datasets, query definitions
e dashboard definitions, alem de comandos PowerShell de preview. Esses comandos devem
referenciar `$env:DELFOS_ADMIN_KEY` literalmente e nunca imprimir o valor da chave ou
`secretValue`.

O seed deve apenas criar ou atualizar configuracoes ficticias da foundation. Ele nao deve
executar query, chamar API externa, conectar em banco de cliente, criar cache, worker,
scheduler ou fila.

## Rotacao de DELFOS_ADMIN_KEY

A `DELFOS_ADMIN_KEY` e uma autenticacao temporaria da foundation. Deve ser rotacionada
proativamente e imediatamente apos suspeita de comprometimento.

**Procedimento:**

1. Gerar novo valor com comprimento minimo de 32 caracteres e alta entropia.
   Exemplo local (nao usar em producao): `openssl rand -hex 32`
2. Atualizar a variavel no ambiente de destino (secret manager, pipeline, env seguro).
3. Reiniciar a aplicacao para carregar o novo valor.
4. Verificar que endpoints protegidos por `x-delfos-admin-key` respondem com a nova chave.
5. Invalidar o valor antigo no ambiente (remover do secret manager ou sobrescrever).
6. Registrar o incidente de rotacao com data, motivo e responsavel.

Nunca registrar o valor real da chave em log, auditoria, documento ou PR.
A chave antiga nao deve continuar ativa apos confirmacao da nova.

## Rotacao de ENCRYPTION_KEY_BASE64

A `ENCRYPTION_KEY_BASE64` protege `secretValue` das credenciais armazenadas.
A rotacao exige re-criptografia de todos os segredos ativos — nao e uma troca simples de variavel.

**Procedimento:**

1. Gerar nova chave de 32 bytes em base64.
   Exemplo local: `openssl rand -base64 32`
2. Criar rotina de migracao que:
   a. Descriptografe cada credencial com a chave atual.
   b. Re-criptografe com a nova chave.
   c. Salve o novo `protectedSecretValue`.
   Essa rotina deve ser executada em ambiente seguro, sem expor `secretValue` em log.
3. Somente apos migracao bem-sucedida, atualizar `ENCRYPTION_KEY_BASE64` no ambiente.
4. Reiniciar a aplicacao e validar que credenciais existentes ainda funcionam.
5. Registrar o incidente com data, motivo e responsavel.

Nao substituir a variavel sem a migracao — todas as credenciais existentes ficarao ilegíveis.

## Incidente de seguranca

1. Isolar impacto.
2. Preservar evidencias.
3. Revogar secrets/tokens suspeitos (ver rotacao acima).
4. Verificar logs e auditoria.
5. Registrar plano de correcao.
