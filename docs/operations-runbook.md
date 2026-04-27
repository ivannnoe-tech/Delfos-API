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

## Erro no seed local de desenvolvimento

O comando `npm run seed:dev` e exclusivo para ambiente local. Se falhar, verifique:

1. MongoDB local acessivel em `DELFOS_DATABASE_URL`.
2. Variaveis obrigatorias do `.env`, principalmente `ENCRYPTION_KEY_BASE64`.
3. Ausencia de dados reais no banco local usado para validacao.
4. Mensagem de erro do terminal sem expor secrets.

O seed deve apenas criar ou atualizar configuracoes ficticias da foundation. Ele nao deve
executar query, chamar API externa, conectar em banco de cliente, criar cache, worker,
scheduler ou fila.

## Incidente de seguranca

1. Isolar impacto.
2. Preservar evidencias.
3. Revogar secrets/tokens suspeitos.
4. Verificar logs e auditoria.
5. Registrar plano de correcao.
