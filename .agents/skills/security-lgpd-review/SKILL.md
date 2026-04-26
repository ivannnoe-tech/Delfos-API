---
name: delfos-api-security-lgpd-review
description: Use para revisar autenticação, autorização, multi-tenant, LGPD, logs, secrets, permissões, tratamento de dados pessoais e segurança de endpoints no delfos-api.
---

# Skill — Revisão de Segurança e LGPD

Use esta skill sempre que a tarefa envolver autenticação, autorização, tenants, usuários, permissões, logs, credenciais, payloads externos, dados pessoais ou integrações sensíveis.

## Leitura obrigatória antes de agir

- `AGENTS.md`
- `docs/security-lgpd.md`
- `docs/security-checklist.md`
- `docs/data-access-policy.md`
- `docs/agent-tooling-policy.md`
- `docs/destructive-commands-policy.md`

## Objetivo

Garantir menor privilégio, isolamento por empresa, proteção de secrets e tratamento adequado de dados pessoais.

## Regras obrigatórias

- Todo acesso precisa considerar `tenantId`.
- Todo endpoint protegido precisa validar autenticação e permissão.
- Nunca confiar em `tenantId`, `userId`, role ou permissão enviados livremente pelo frontend.
- Secrets não podem aparecer em código, log, commit, prompt ou documentação pública.
- `.env` real nunca deve ser versionado.
- Logs devem ser estruturados e sanitizados.
- Dados pessoais devem ser minimizados.
- Payload real de cliente não deve ser usado como exemplo.
- Comandos destrutivos exigem autorização explícita.

## Proibido

- Logar token, senha, chave privada ou credencial.
- Retornar stack trace ao usuário.
- Expor erro cru de API de cliente.
- Usar permissão ampla por conveniência.
- Criar bypass de autenticação para "facilitar teste".
- Misturar dados entre tenants.
- Copiar dado real de cliente para prompt, fixture ou documentação.

## Checklist de revisão

- Há validação de tenant em todas as consultas?
- Há validação de permissão por ação?
- O usuário consegue acessar dado de outra empresa?
- Algum log contém secret ou payload sensível?
- Alguma resposta revela detalhes internos?
- Há rate limit ou proteção equivalente onde necessário?
- Os dados coletados são necessários para a finalidade?
- Existe trilha de auditoria para ações sensíveis?
- A alteração respeita LGPD e minimização de dados?
