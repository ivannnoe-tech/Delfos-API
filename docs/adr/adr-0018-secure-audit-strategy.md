# ADR-0018 — Estratégia de auditoria segura

- **Status**: Accepted
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: ambas

---

## Contexto

O Delfos é uma plataforma multi-tenant que manipula configurações sensíveis
(tenants, usuários, conexões, credenciais, datasets, definições declarativas) e,
mesmo na foundation, registra solicitações e transições de runtime/execution-requests
(ADR-0014). O `docs/security-lgpd.md` exige auditoria de ações sensíveis, logs
seguros e coleta mínima.

A foundation já trata o módulo de audit como **service interno**, sem rota pública.
Faltava registrar formalmente:

- o que deve ser auditado;
- o que **nunca** deve entrar em um registro de auditoria;
- como os registros são correlacionados e isolados por tenant;
- como o modelo se alinha à LGPD e à retenção mínima.

A auth real ainda não existe (ADR-0006) e o contexto de ator/tenant chega por
headers temporários (ADR-0016). Ainda assim, a estratégia de auditoria precisa ser
definida desde já, porque toda mutação e toda transição de runtime devem deixar
trilha segura.

## Decisão

Adotamos uma estratégia de **auditoria segura, metadata-only e escopada por
`tenantId`**: toda mutação administrativa e toda transição de runtime emite um
evento de auditoria sanitizado.

**O que auditar:**

- **Eventos administrativos** — criação, atualização, exclusão e rotação de
  tenants, usuários, conexões, credenciais, datasets e definições declarativas
  (query/dashboard/report definitions, field-mappings).
- **Eventos de runtime** — transições de estado de execution-requests, dry-run de
  readiness e demo-execute fictício (conforme ADR-0014).

Eventos administrativos e eventos de runtime são **distinguidos** no registro, por
classe/tipo, para permitir trilhas separadas.

**O que NUNCA auditar:**

- segredos, credenciais brutas, connection strings e tokens;
- payloads brutos vindos do cliente;
- PII além de identificadores mínimos.

Apenas `safeMetadata` é registrado, contendo informação segura e acionável, por
exemplo: contadores, duração, capability, modo (`mode`), `sourceType`, limites
aplicados, flags booleanas e códigos de warning/blocker.

Cada evento carrega `requestId`/`correlationId` para rastreio fim-a-fim e
`tenantId` para **isolamento de auditoria por tenant**. Os registros são
**metadata-only**: descrevem a ação e o contexto, nunca o segredo ou o payload.

### Política de retenção (decisão inicial)

Adotamos como **política técnica inicial padrão** de retenção, aprovada como
decisão humana em 2026-05-15:

- **Logs de auditoria e de segurança seguros** — retenção padrão de **365 dias**.
- **Eventos de runtime / eventos de execution-requests** — retenção padrão de
  **180 dias**.
- **Logs técnicos, de debug e de diagnóstico** — retenção padrão de **30 dias**.
- **Raw payloads, secrets, request/response bodies completos, connection
  strings e credenciais reais** — **nunca** são persistidos, em nenhum prazo.
- `safeMetadata` é o **padrão obrigatório** para logs, auditoria e eventos.

Regras de aplicação:

- Retenção **maior** que o padrão só é permitida por obrigação legal,
  regulatória, contratual, investigação formal ou *legal hold*.
- Retenção **menor** pode ser aplicada por tenant no futuro, desde que **não
  quebre a auditoria mínima** exigida por esta ADR.
- Ao fim do prazo, os dados devem ser **eliminados, anonimizados ou
  compactados**, conforme política operacional futura.
- Esta é uma **política técnica inicial**: deve ser **validada juridicamente**
  antes do uso em produção regulada.

## Alternativas consideradas

- **Auditoria com payload completo da requisição** — rejeitada: violaria
  `docs/security-lgpd.md` (coleta mínima, logs seguros) e poderia persistir PII e
  segredos.
- **Não auditar runtime/execution-requests na foundation** — rejeitada: ADR-0014
  exige trilha administrativa e auditável das transições, mesmo sem executor real.
- **Expor uma rota pública de consulta de auditoria já na foundation** — rejeitada:
  o módulo de audit é, por enquanto, service interno; rota pública exigiria auth
  real e revisão de autorização.
- **Auditoria sem `tenantId`** — rejeitada: quebraria o isolamento multi-tenant,
  que é fronteira obrigatória do Delfos.

## Consequências

### Positivas

- Trilha consistente de quem fez o quê, sem expor segredos nem PII.
- Alinhamento direto com `docs/security-lgpd.md` (auditoria de ações sensíveis,
  logs seguros, coleta mínima).
- Correlação fim-a-fim via `requestId`/`correlationId` facilita diagnóstico.
- Isolamento por `tenantId` mantém a fronteira multi-tenant também na auditoria.

### Negativas / trade-offs aceitos

- Registros metadata-only não permitem reconstruir o conteúdo exato de uma
  operação; é uma limitação **deliberada** por segurança.
- Na foundation, o ator vem de headers temporários (ADR-0016), então a
  responsabilização por pessoa só fica completa com a auth real (ADR-0006).
- A política de retenção é uma **decisão técnica inicial** e ainda **depende de
  validação jurídica** antes do uso em produção regulada.

### Neutras

- O módulo de audit permanece como service interno; esta ADR não cria rota pública.
- A sanitização do `safeMetadata` reaproveita as regras de ADR-0020.

## Escopo atual

- Emissão de eventos de auditoria sanitizados, metadata-only, escopados por
  `tenantId`, para mutações administrativas e transições de runtime.
- `safeMetadata` limitado a campos seguros: contadores, duração, capability,
  `mode`, `sourceType`, limites aplicados, flags booleanas e códigos de
  warning/blocker.
- Correlação por `requestId`/`correlationId`.
- Distinção explícita entre eventos administrativos e eventos de runtime.

## Fora de escopo

- Rota pública de consulta de auditoria.
- Persistência de payloads, segredos, credenciais ou PII além de identificadores
  mínimos.
- Implementação automatizada de expurgo/anonimização/compactação ao fim do
  prazo de retenção e processos de direito do titular já implementados.
- Exportação de trilhas de auditoria.

## Impacto na Fase 1

- Toda mutação administrativa e toda transição de runtime/execution-requests emite
  um evento de auditoria sanitizado via o service interno de audit.
- Garantir que nenhum segredo, credencial bruta, connection string, token ou
  payload bruto chegue ao registro — apenas `safeMetadata`.
- Manter `tenantId` em todo evento para isolamento de auditoria por tenant.
- A documentação reforça que a auditoria é metadata-only e sem rota pública.

## Impacto futuro / Fase 2

- A **política de retenção inicial** (365/180/30 dias) já está definida nesta
  ADR. O trabalho futuro é a **validação jurídica** antes de produção regulada
  e a **implementação automatizada** de expurgo/anonimização/compactação ao fim
  do prazo, alinhada à LGPD (minimização, atendimento a pedidos de titular),
  conforme `docs/security-lgpd.md`.
- Retenção menor por tenant, quando necessária, deve ser introduzida sem quebrar
  a auditoria mínima exigida por esta ADR.
- Com a auth real (ADR-0006), o ator passa a ser verificado, completando a
  responsabilização por pessoa nos registros.
- Uma rota de consulta de auditoria, se necessária, exigirá ADR/revisão de
  autorização própria.

## Relação com outros documentos

- ADR-0016 — auth temporária; hoje o contexto de ator/tenant dos eventos vem de
  headers temporários.
- ADR-0017 — modelo de roles; o papel do ator faz parte do contexto auditado.
- ADR-0020 — sanitização aplicada ao `safeMetadata` dos eventos.
- ADR-0014 — runtime/execution-requests, cujas transições são auditadas.
- ADR-0006 — auth real que tornará o ator verificado.
- `docs/security-lgpd.md` — auditoria de ações sensíveis, logs seguros, retenção e
  direitos do titular.
