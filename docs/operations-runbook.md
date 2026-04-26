# Runbook Operacional — delfos-api

Orienta diagnóstico e resposta a incidentes comuns.

## Princípios

- Priorizar segurança e integridade.
- Registrar causa raiz, impacto e correção.
- Não executar comandos destrutivos sem autorização explícita.
- Não compartilhar dados reais de cliente sem necessidade e autorização.

## API indisponível

1. Verificar processo/container.
2. Conferir logs por `requestId`.
3. Validar variáveis obrigatórias.
4. Testar conexão com MongoDB.
5. Conferir último deploy.
6. Fazer rollback se o problema começou após deploy.

## MongoDB indisponível

1. Verificar rede e credenciais.
2. Conferir disponibilidade do servidor/cluster.
3. Validar `DELFOS_DATABASE_URL`.
4. Avaliar disco/volume quando aplicável.

## Erros 401/403 em massa

- Verificar alteração de JWT secret.
- Conferir validação de permissão.
- Validar fluxo de login em ambiente controlado.
- Reverter se houver impacto generalizado.

## Falha em API de cliente

Na Fase 1, dados operacionais vêm de APIs expostas pelos clientes. Registre status code, endpoint lógico e `requestId`, sem logar payload sensível.

## Erro em query definitions

Query definitions sao configuracao declarativa. Se houver erro em `/api/v1/query-definitions`,
verifique `tenantId`, `datasetId`, `queryKey`, status, type e `requestId`. Nao deve haver
tentativa de execucao de query, conexao externa, cache, worker, scheduler ou fila nesse fluxo.
Para incidentes de vazamento, conferir auditoria e confirmar que apenas `queryKey`, `status`,
`type` e `datasetId` foram registrados.

## Incidente de segurança

1. Isolar impacto.
2. Preservar evidências.
3. Revogar secrets/tokens suspeitos.
4. Verificar logs e auditoria.
5. Registrar plano de correção.
