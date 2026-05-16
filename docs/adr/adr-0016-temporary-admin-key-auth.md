# ADR-0016 — Autenticação temporária por admin-key

- **Status**: Accepted
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1

---

## Contexto

O `delfos-api` está em estado de foundation: existem contratos administrativos e
declarativos (tenants, users, connections, credentials, datasets, query/dashboard
definitions, field-mappings, runtime/execution-requests), mas ainda **não existe
autenticação real**. O ADR-0006 define a estratégia final de auth própria via JWT
(access + refresh, bcrypt, rotação, lockout), porém essa camada **ainda não foi
implementada**.

Mesmo sem JWT, os endpoints administrativos da foundation não podem ficar abertos.
Era necessário um portão de acesso explícito que reduzisse o estado inseguro da
foundation sem antecipar a implementação completa de auth descrita no ADR-0006.

Era preciso registrar formalmente:

- por que existe um mecanismo de auth temporário;
- quais são seus limites deliberados;
- que ele não autoriza nem substitui a auth real;
- como ele se relaciona com os headers temporários de tenant/actor/role.

## Decisão

Adotamos, **estritamente como portão de Fase 1 / foundation**, a autenticação
temporária por header `x-delfos-admin-key`.

- A chave é um **segredo único, estático e compartilhado**, lido da variável de
  ambiente `DELFOS_ADMIN_KEY`.
- A validação é feita por um único guard, o `AdminKeyGuard`, aplicado aos endpoints
  administrativos (`tenants`, `users`, `connections`, `credentials`, `datasets`,
  `query-definitions`, `dashboard-definitions`, `field-mappings` e runtime
  administrativo).
- `GET /health` permanece público e não exige a chave.
- A API **não loga** o valor da chave e não revela se a chave existe, seu tamanho ou
  o valor esperado.
- Ausência ou valor inválido da chave resulta em `401 Unauthorized`, seguindo o
  envelope de erro padrão da foundation.

A admin-key é tratada como **base explícita de desenvolvimento/foundation**, nunca
como auth de produção. O deploy de produção das funcionalidades reais permanece
**bloqueado** até que a auth real (ADR-0006) substitua este mecanismo.

## Alternativas consideradas

- **Deixar os endpoints administrativos sem qualquer auth** — rejeitada: mantinha a
  foundation em estado inseguro e dava margem para uso indevido durante o
  desenvolvimento.
- **Implementar o JWT real agora (ADR-0006)** — rejeitada nesta etapa: o JWT real
  exige usuários, senhas, refresh tokens rotacionados, detecção de reuso, lockout e
  auditoria de login; é trabalho de escopo próprio e não deve ser apressado apenas
  para destravar a foundation.
- **Basic Auth / IP allowlist** — rejeitada: não traz vantagem real sobre uma chave
  única e adiciona configuração sem benefício de identidade por usuário.
- **Chave por ambiente com múltiplos segredos** — rejeitada: aumenta a superfície de
  gestão de segredos sem entregar identidade por ator, que só a auth real resolve.

## Consequências

### Positivas

- Reduz o estado inseguro da foundation com um único guard simples e auditável.
- Não antecipa nem conflita com a implementação de JWT planejada no ADR-0006.
- Mantém `GET /health` público e o resto dos endpoints administrativos protegidos.
- Deixa explícito, em código e documentação, o caráter temporário do mecanismo.

### Negativas / trade-offs aceitos

- **Segredo único e compartilhado**: qualquer vazamento da chave concede acesso
  administrativo total.
- **Sem identidade por usuário**: a chave não diz quem é o ator; não há login.
- **Sem sessão**: não há conceito de sessão, logout ou expiração de acesso.
- **Sem granularidade de revogação**: revogar acesso significa rotacionar a chave
  para todos de uma vez.
- **Sem expiração**: a chave vale enquanto estiver na variável de ambiente.
- **Accountability limitado**: a responsabilização por ator depende apenas de
  headers temporários (`x-delfos-actor-id`, `x-delfos-actor-role`), que são
  confiáveis por convenção e não verificados.

### Neutras

- O mecanismo vive em um único guard (`AdminKeyGuard`) e é facilmente removível
  quando a auth real entrar.
- Os headers temporários de contexto (`x-delfos-tenant-id`, `x-delfos-actor-id`,
  `x-delfos-actor-role`) coexistem com a admin-key, mas têm finalidade diferente:
  carregam contexto, não autorizam.

## Escopo atual

- Validação de `x-delfos-admin-key` contra `DELFOS_ADMIN_KEY` via `AdminKeyGuard`.
- Aplicação do guard nos endpoints administrativos da foundation.
- Headers temporários de contexto **acompanham** a chave, mas são **confiáveis por
  convenção, não verificados**:
  - `x-delfos-tenant-id` — contexto de tenant (opcional na foundation; quando
    enviado, deve ser um ObjectId válido);
  - `x-delfos-actor-id` — identificador técnico simples do ator;
  - `x-delfos-actor-role` — aceita apenas `owner`, `admin`, `operator` ou `viewer`.
- Respostas de erro `401`/`403`/`400` seguem o envelope padrão da foundation.

## Fora de escopo

- Login, senha, JWT, refresh token, MFA, OAuth/OIDC ou provedor externo.
- Identidade real de usuário, sessão e revogação granular.
- Verificação criptográfica dos headers de tenant/actor/role.
- Qualquer tratamento da admin-key como auth de produção.

## Impacto na Fase 1

- O `AdminKeyGuard` permanece como portão obrigatório dos endpoints administrativos.
- A variável `DELFOS_ADMIN_KEY` é obrigatória para subir a API administrativa.
- Documentação e código devem reforçar o caráter temporário do mecanismo.
- Os headers de tenant/actor/role continuam sendo tratados como contexto de
  desenvolvimento, nunca como autoridade final.

## Impacto futuro / Fase 2

- A auth real (ADR-0006) substitui a admin-key: login, JWT access/refresh, bcrypt,
  rotação e detecção de reuso passam a fornecer identidade e contexto verificados.
- Para white label, SSO/SAML pode ser avaliado em ADR futuro, conforme ADR-0006.
- Quando a auth real entrar, o `AdminKeyGuard` e o header `x-delfos-admin-key` são
  **removidos**, e os headers temporários de tenant/actor/role deixam de existir,
  substituídos por claims verificadas do token.

## Relação com outros documentos

- ADR-0006 — estratégia final de auth própria via JWT (substitui este mecanismo).
- ADR-0017 — modelo de roles e permissões, que hoje depende do header temporário
  `x-delfos-actor-role`.
- ADR-0018 — estratégia de auditoria segura, que registra eventos com base no
  contexto de ator/tenant.
- `docs/foundation-auth-and-errors.md` — contrato vigente da auth temporária,
  headers e envelope de erro.
- `docs/security-lgpd.md` — princípios de menor privilégio e logs seguros.
