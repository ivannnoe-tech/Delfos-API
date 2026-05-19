# Plano de Migração de Auth — admin-key → JWT

> **Status: planejamento / futuro. Sem implementação atual.**
> Este documento é um plano. Ele **não autoriza** implementar JWT, login,
> refresh token, RBAC real ou remover o `x-delfos-admin-key`. A implementação
> de auth real é capacidade de **Fase 2** (ADR-0024) e exige escopo explícito
> por fase.

---

## 1. Contexto atual

- A foundation usa **autenticação temporária por `x-delfos-admin-key`**
  (ADR-0016). Endpoints administrativos exigem o header; `GET /health` é
  público.
- O contexto de tenant/actor/role hoje vem de headers temporários
  (`x-delfos-tenant-id`, `x-delfos-actor-id`, `x-delfos-actor-role`) — base de
  desenvolvimento, não autoridade final (`docs/foundation-auth-and-errors.md`).
- **JWT real ainda não existe**: sem login, senha, refresh token, MFA, OAuth ou
  provedor externo.
- Documentos de referência:
  - **ADR-0006** — decisão de auth JWT self-managed (sem Auth0/Clerk);
  - **ADR-0016** — admin-key temporário como auth da foundation;
  - **ADR-0017** — matriz de roles e permissões (`owner`, `admin`, `operator`,
    `viewer`);
  - **ADR-0019/0020** — criptografia de credenciais e sanitização (auth não
    pode afrouxar essas fronteiras);
  - `docs/foundation-auth-and-errors.md` — regras transversais vigentes.
- `ENCRYPTION_KEY_BASE64` já existe; `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
  `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` já aparecem em `docs/env-reference.md`
  como **variáveis futuras**, não consumidas pelo bootstrap.

## 2. Objetivos

- **Login seguro** com senha (hash forte, ex.: bcrypt/argon2 — decisão de fase).
- **Refresh token** rotacionável e revogável.
- **RBAC final** sobre a matriz da ADR-0017, substituindo a role por header.
- **Isolamento de tenant** derivado do token autenticado, não de header livre.
- **Auditoria** de login/logout/refresh/falha (alinhada à ADR-0018).
- **Remoção gradual do `x-delfos-admin-key`** dos ambientes não-dev.

## 3. Fases

> Cada fase exige escopo explícito. Nenhuma fase é autorizada por este plano.

### Fase A — Contratos e threat model
- Definir contratos de `login`, `refresh`, `logout` (request/response, erros)
  no envelope de erro vigente.
- Threat model dedicado de auth (token leak, replay, CSRF, fixation,
  cross-tenant, brute force).
- Decidir armazenamento de token no cliente (com o Dev 3).
- Saída: contratos revisados + threat model aprovado. Sem código.

### Fase B — Modelo de usuário / autenticação
- Campo de senha (hash), estados de conta, `last_login_at`.
- Modelo de refresh token (store, rotação, revogação) — sem expor segredo.
- Alinhar com a migração de banco (ADR-0035): o modelo nasce no banco vigente.
- Saída: schema/modelo de auth definido. Sem endpoints ativos.

### Fase C — Login / logout / refresh
- Implementar emissão de access token e refresh token.
- Rotação de refresh token; revogação em logout.
- Rate limit em login (coordenado com observability/segurança — Dev 4).
- Saída: fluxo de auth funcional, **convivendo** com o admin-key.

### Fase D — Guards finais e RBAC
- Guards de autenticação JWT e de autorização por papel/permibão (ADR-0017).
- Substituir a role-por-header pela role do token.
- Tenant boundary derivado do token.
- Saída: guards JWT disponíveis, ainda não obrigatórios em todos os endpoints.

### Fase E — Migração dos endpoints admin-key → JWT
- Migrar endpoint a endpoint para exigir JWT, mantendo o contrato REST.
- Período de convivência: endpoint aceita JWT; admin-key vira fallback restrito.
- Saída: todos os endpoints administrativos aceitando JWT.

### Fase F — Desativação gradual do admin-key
- Remover o `x-delfos-admin-key` dos ambientes de produção/staging.
- Manter o admin-key **apenas** em dev/test/foundation, atrás de flag explícita.
- Saída: produção sem admin-key; admin-key restrito a dev/test.

### Fase G — Hardening, auditoria, testes e doc operacional
- Auditoria completa de eventos de auth (ADR-0018).
- Testes de regressão de segurança e anti-secret.
- Runbook de incidentes de auth; rotação de `JWT_*` secrets.
- Atualizar `docs/foundation-auth-and-errors.md`, `env-reference.md`,
  `security-checklist.md`.
- Saída: auth real endurecida e documentada.

## 4. Matriz admin-key → JWT

| Grupo de endpoints | Auth hoje | Migração | Pós-migração |
|---|---|---|---|
| `GET /health` | público | nenhuma | continua público |
| `tenants`, `users` | admin-key + role header | JWT + RBAC; tenant do token | JWT obrigatório |
| `connections`, `datasets`, `field-mappings` | admin-key + role header | JWT + RBAC | JWT obrigatório |
| `credentials` (operações sensíveis) | admin-key + role `owner`/`admin` | JWT + RBAC estrito; sem afrouxar ADR-0019 | JWT obrigatório |
| `query-definitions`, `dashboard-definitions`, `report-definitions` | admin-key + role header | JWT + RBAC | JWT obrigatório |
| `semantic-models` | admin-key + role header | JWT + RBAC | JWT obrigatório |
| `runtime/execution-requests` (foundation) | admin-key + role header | JWT + RBAC | JWT obrigatório |
| `execution-preview` (demo) | admin-key | JWT | JWT obrigatório |
| Ferramentas de dev/seed/e2e | admin-key | mantêm admin-key atrás de flag | **só dev/test** |

Regra: o contrato REST (rotas, payloads, status, envelope de erro) **não muda**
na migração; muda apenas o mecanismo de auth e a origem do contexto de tenant.

## 5. Riscos

- **Vazamento de token** — token em log, URL, storage inseguro do cliente.
- **Refresh token inseguro** — sem rotação/revogação, reuso indevido.
- **Cross-tenant** — token de um tenant acessando recurso de outro.
- **Bypass de roles** — endpoint sem guard ou guard com matriz errada.
- **Logs com token/secret** — violação de ADR-0020 e da política de logs.
- **Janela de convivência** — admin-key e JWT ativos ao mesmo tempo aumentam a
  superfície; manter a janela curta e auditada.
- **Acoplamento com a migração de banco** (ADR-0035) — coordenar a ordem.

## 6. Testes esperados

- **Unit** — guards, emissão/validação de token, rotação de refresh, RBAC.
- **E2E** — fluxo login → acesso → refresh → logout; negação por role; negação
  cross-tenant.
- **Security regression** — token expirado/forjado/cross-tenant rejeitado;
  brute force limitado.
- **Anti-secret** — nenhum token, senha ou secret em log, resposta ou fixture.

## 7. Fora de escopo

- OAuth, SAML, SSO e provedores externos — só por fase futura própria
  (consistente com ADR-0006, que decidiu auth self-managed).
- MFA — fase futura própria.
- **Auth UI real no `delfos-web`** — só depois do backend JWT existir; é
  entrega do Dev 3 e depende deste plano (ver `docs/team-work-split.md`).
- Implementação de qualquer fase deste plano.

## 8. Stop conditions

Parar e pedir validação humana antes de:
- alterar contrato público de API (rotas, DTOs, payloads, status, headers);
- armazenar token ou secret de forma insegura;
- enfraquecer o tenant boundary;
- promover ADR `Proposed` ou alterar ADR-0006/0016/0017/0019;
- remover o admin-key sem a Fase F concluída.

(Ver `AGENTS.md` §9 e `docs/agent-stop-conditions.md`.)

## 9. Definition of Done

Cada fase só é concluída quando:
- contratos/threat model revisados (Fase A) antes de qualquer código;
- `lint`, `test`, `build` verdes; E2E e security regression verdes;
- nenhum token/secret em log, resposta, fixture ou doc;
- tenant boundary preservado e auditado;
- documentação de auth atualizada;
- DoD canônica de `docs/quality-checklist.md` respeitada.

## Relação com outros documentos

- ADR-0006, ADR-0016, ADR-0017, ADR-0018, ADR-0019, ADR-0020, ADR-0024.
- `docs/foundation-auth-and-errors.md` — auth temporária vigente.
- `docs/env-reference.md` — variáveis `JWT_*` futuras.
- `docs/team-work-split.md` — Dev 1 dono do backend de auth; Dev 3 da Auth UI.
- `docs/observability-plan.md` — auditoria/alertas de eventos de auth.
- `docs/roadmap.md` — posição no roadmap.
