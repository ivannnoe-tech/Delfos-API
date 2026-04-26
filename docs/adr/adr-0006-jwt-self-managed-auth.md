# ADR-0006 — Self-managed JWT auth (no Auth0/Clerk)

- **Status**: Accepted
- **Data**: 2026-04-25
- **Fase impactada**: Fase 1

---

## Contexto

A autenticação dos usuários **do Delfos** (login no app, não das APIs dos clientes) precisa cobrir:

- login/logout/refresh
- recuperação de senha
- multi-tenant (um usuário pode pertencer a uma ou mais empresas)
- RBAC (papéis e permissões granulares)
- auditoria de login
- preparação para SSO/SAML em white label (Fase 2)

Existem três grandes caminhos:

1. **Provedor SaaS** (Auth0, Clerk, WorkOS) — rápido, MFA pronto, SSO pronto.
2. **Self-hosted IDP** (Keycloak, Authentik, Ory Kratos) — open source, full controle, complexo de operar.
3. **Auth próprio** com JWT (access + refresh) — leve, controle total, sem custo recorrente, exige cuidado.

Auth0 e Clerk caem na regra do ADR-0002 (componentes pagos): são gratuitos até X usuários ativos por mês, depois viram custo recorrente — e em white label podem ter restrições adicionais.

Keycloak entrega muito, mas o custo operacional é alto: cluster, upgrades, customização de telas, Java na stack, etc. Não compensa para o escopo da Fase 1.

---

## Decisão

Implementaremos autenticação própria baseada em **JWT** com par **access token + refresh token**, gerenciada pelo `delfos-api`.

- Access token: curto (15 min), assinado com `JWT_ACCESS_SECRET`, contém `userId`, `tenantId`, `roles`, `permissions`
- Refresh token: longo (7 dias), assinado com `JWT_REFRESH_SECRET`, armazenado **rotacionado** no banco (uma linha por refresh ativo, com `expiresAt`, `userAgent`, `ip`, `createdAt`, `revokedAt`)
- Senhas com **bcrypt** (`BCRYPT_ROUNDS=12` em produção)
- Refresh com **rotação obrigatória** (cada uso emite novo refresh e revoga o anterior)
- Logout revoga o refresh atual; "logout de todos os dispositivos" revoga todos os refresh do usuário
- Login com falhas excessivas dispara backoff/lockout temporário (configurável)
- MFA fica preparado mas **não obrigatório** na Fase 1 (avaliar TOTP em ADR futuro)

---

## Alternativas consideradas

- **Auth0** — pago após threshold; conflita com ADR-0002 e com white label
- **Clerk** — mesmas restrições
- **WorkOS** — focado em SSO empresarial, faria sentido na Fase 2 quando o foco for grandes contas
- **Keycloak** — overkill operacional para Fase 1
- **Sessão server-side com cookie** (sem JWT) — viável; trocaríamos um conjunto de problemas (revogação fácil) por outro (escalabilidade horizontal exige store de sessão). JWT com refresh rotacionado é o equivalente moderno e padrão

---

## Consequências

### Positivas

- Sem custo recorrente
- Sem lock-in com IDP
- Controle total sobre claims, multi-tenant e permissões
- Compatível com white label sem licença extra
- Refresh rotacionado mitiga o ponto fraco clássico do JWT (revogação)

### Negativas / trade-offs aceitos

- Implementação e manutenção da camada de auth são responsabilidade da equipe (cuidados com tempo de expiração, rotação de chave, replay, refresh reuse detection, etc.)
- MFA, SSO/SAML, social login, password reset com link assinado — tudo precisa ser implementado se/quando virar requisito
- Auditoria de eventos (login, logout, refresh, falha) precisa ser projetada — vai para o módulo `audit`

### Neutras

- Refresh tokens guardados no Mongo (coleção `refreshTokens`) com index TTL para limpeza automática

---

## Impacto na Fase 1

- Módulo `src/modules/auth/` com:
  - `controllers/auth.controller.ts` — `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/me`, `/auth/recover`, `/auth/reset`
  - `services/auth.service.ts` — orquestra login, emissão e rotação
  - `services/password.service.ts` — bcrypt + verificações
  - `services/refresh-token.service.ts` — emite, valida, rotaciona, revoga; detecta reuso
  - `strategies/jwt.strategy.ts` — passport-jwt
  - `guards/jwt.guard.ts` + `guards/roles.guard.ts` + `guards/tenant.guard.ts`
  - `dto/login.dto.ts`, `dto/refresh.dto.ts`, `dto/recover.dto.ts`, `dto/reset.dto.ts`
- Coleção `refreshTokens` com index TTL em `expiresAt`
- Detecção de **refresh reuse**: se um refresh já revogado for apresentado, todos os refreshes do usuário são revogados (sinal de roubo de token)
- Auditoria de login emite evento via `audit` module
- Variáveis em `.env`: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_ROUNDS`

## Impacto futuro / Fase 2

- MFA TOTP — ADR futuro
- SSO/SAML para white label enterprise — ADR futuro (pode usar `@node-saml/passport-saml`)
- Migração para IDP externo se a base de clientes pedir — possível, isolando interface de auth

---

## Referências

- `docs/security-checklist.md`
- `docs/security-lgpd.md`
- ADR-0002 (sem componentes pagos)
- [OWASP — JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Refresh Token Rotation — Auth0 docs (referência conceitual)](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
