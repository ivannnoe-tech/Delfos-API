# Prompt — Revisão de segurança

> **Este prompt foi substituído por uma skill canônica.**
> Para revisar segurança, LGPD e multi-tenant, use a skill `security-lgpd-review`
> (`delfos-api/.agents/skills/security-lgpd-review/SKILL.md`).
> Consulte também `docs/security-checklist.md` e `docs/security-lgpd.md`.
> A skill contém o fluxo, as regras obrigatórias, o checklist e a saída esperada — não duplique aqui.

---

## Notas específicas

Pontos a confirmar que complementam o checklist da skill:

- API externa de cliente com timeout e rate limit configurados.
- Cache (quando existir) isolado por tenant.
- Exportações de dados sensíveis devidamente auditadas.
