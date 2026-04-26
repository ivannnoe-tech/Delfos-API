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
3. Validar `MONGODB_URI` e `MONGODB_DB_NAME`.
4. Avaliar disco/volume quando aplicável.

## Erros 401/403 em massa

- Verificar alteração de JWT secret.
- Conferir validação de permissão.
- Validar fluxo de login em ambiente controlado.
- Reverter se houver impacto generalizado.

## Falha em API de cliente

Na Fase 1, dados operacionais vêm de APIs expostas pelos clientes. Registre status code, endpoint lógico e `requestId`, sem logar payload sensível.

## Incidente de segurança

1. Isolar impacto.
2. Preservar evidências.
3. Revogar secrets/tokens suspeitos.
4. Verificar logs e auditoria.
5. Registrar plano de correção.
