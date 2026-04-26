# Prompt — Revisão de segurança

Revise a alteração com foco em segurança, LGPD e multi-tenant.

---

## Fontes obrigatórias

- `docs/security-checklist.md`
- `docs/security-lgpd.md`
- `docs/data-access-policy.md`
- `docs/destructive-commands-policy.md`
- `docs/api-connectors.md`

---

## Verificar

- Autenticação correta.
- Permissão validada no backend.
- Tenant isolado.
- Inputs validados.
- Secrets fora de logs e respostas.
- Credenciais criptografadas.
- Erros sanitizados.
- API externa com timeout/rate limit.
- Cache isolado por tenant.
- Exportações auditadas quando sensíveis.
- Nenhum dado operacional persistido indevidamente.

---

## Saída esperada

Classifique achados por severidade:

- crítico
- alto
- médio
- baixo
- melhoria

Finalize com veredito: seguro / seguro com ajustes / bloquear.
