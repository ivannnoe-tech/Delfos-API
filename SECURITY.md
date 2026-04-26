# Security Policy — delfos-api

Segurança é parte da arquitetura do Delfos Analytics. Vulnerabilidades devem ser tratadas em canal privado, nunca em issue pública.

## Como reportar

Use GitHub Security Advisory, canal interno da equipe ou contato direto com o mantenedor do repositório.

Inclua, se possível:

- descrição objetiva;
- componente afetado;
- passos para reproduzir;
- impacto estimado;
- commit, branch ou versão afetada;
- evidências sanitizadas, sem dados reais de cliente.

## Regras obrigatórias

- Nunca versionar `.env` real, tokens, senhas, chaves privadas ou credenciais.
- Nunca usar payload real de cliente em fixture, print, prompt ou documentação pública.
- Nunca logar secrets ou dados pessoais desnecessários.
- Nunca criar bypass de autenticação ou permissão para facilitar teste.
- Toda mudança sensível deve considerar LGPD, tenant, menor privilégio e auditoria.
- Comandos destrutivos exigem autorização explícita.

## Fora de escopo

- engenharia social;
- DoS/DDoS;
- vulnerabilidade de dependência sem impacto demonstrado;
- testes em dados reais de cliente sem autorização.

## Documentos relacionados

- `docs/security-lgpd.md`
- `docs/security-checklist.md`
- `docs/data-access-policy.md`
- `docs/destructive-commands-policy.md`
- `.agents/skills/security-lgpd-review/SKILL.md`

## Divulgação responsável

Aguarde correção e autorização antes de divulgar publicamente. A equipe poderá reconhecer a contribuição após a correção, se a pessoa reportante desejar.
