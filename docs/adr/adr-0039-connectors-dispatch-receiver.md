# ADR-0039 — Receiver de dispatch (HTTP + mTLS) no `delfos-connectors`

- **Status**: Proposed
- **Data**: 2026-06-21
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-connectors (impacto primário); delfos-api (cliente já existente)
- **Fase impactada**: Fase 2
- **Implementação**: não iniciada

---

> **Proposta para ratificação humana.** O `delfos-connectors` é hoje uma
> biblioteca/skeleton (sem serviço rodando). Esta ADR é o **gate** (CLAUDE.md:
> "Real connectors ... must NOT be implemented without explicit authorization
> and an ADR where required") para torná-lo um **serviço HTTP** que recebe o
> dispatch do `delfos-api`. A aceitação autoriza apenas o **lado receptor +
> validação + `not_supported`** — **nenhuma execução real de fonte** (SQL/API do
> cliente, export) é liberada aqui; isso exige ADR/incremento posterior.

## Contexto

A [ADR-0038](adr-0038-connector-dispatch-transport-sync-http.md) escolheu **HTTP
síncrono + mTLS** como transporte de dispatch e já está implementada do lado
**cliente** no `delfos-api` (`HttpConnectorDispatchAdapter`, **gated OFF** por
`CONNECTOR_DISPATCH_ENABLED`). Falta o **lado receptor**: o `delfos-connectors`
não expõe servidor HTTP — só contratos (`src/contracts/`), security helpers e um
`FakeConnectorAdapter` cujos modos `execute`/`export` retornam `not_supported`.

Sem um receiver não há e2e real possível: o cliente não tem alvo. A
[ADR-0004](adr-0004-two-repos-strategy.md) mantém os dois repositórios
separados; a [ADR-0008](adr-0008-connectors-and-integration-execution.md) e a
[ADR-0015](adr-0015-runtime-connectors-command-envelope-bridge.md) definem o
contrato de comando; a [ADR-0037](adr-0037-credential-decryption-via-delfos-api-broker.md)
fixa o manuseio do segredo.

## Decisão

O `delfos-connectors` passa a expor um **receiver HTTP** (servidor mTLS) que,
quando (e somente quando) esta ADR for `Accepted` e o incremento for liberado:

1. **Endpoint único** `POST /dispatch` (chamadas curtas, coerente com ADR-0038).
2. **mTLS server-side**: `requestCert: true` + verificação do certificado do
   cliente contra a CA combinada; TLS em todo o tráfego. Espelha o lado cliente
   do `delfos-api`.
3. **Validação**: aplica os helpers já existentes
   (`validate-execution-command`, `assert-safe-command`, sanitização) ao
   `ConnectorExecutionCommand` recebido antes de qualquer ação.
4. **Idempotência** por `tenantId + executionRequestId` (header `Idempotency-Key`),
   coerente com ADR-0038.
5. **Isolamento por tenant**: sem dispatch sem `tenantId`; sem reuso cross-tenant
   de canal/estado.
6. **Manuseio do segredo (ADR-0037)**: o segredo chega **apenas** no corpo deste
   request mTLS, é usado **just-in-time**, **nunca** é logado, persistido ou
   devolvido na resposta; vive o mínimo e é descartado após o uso.
7. **Execução**: delega ao adapter de execução. **No 1º incremento o adapter é o
   `FakeConnectorAdapter`** → `execute`/`export` retornam `not_supported`
   (mantém a fronteira: nenhuma fonte real é tocada). Capabilities curtas
   declarativas podem responder com resultado fictício seguro, como já fazem
   hoje.
8. **Resposta**: `ConnectorExecutionResult` seguro (status + `safeMetadata`),
   sem dado bruto, sem segredo, sem payload de fonte.

### Requisitos obrigatórios (espelham ADR-0038, lado servidor)

- autenticação mútua (mTLS) + TLS em todo o tráfego;
- idempotência `tenantId + executionRequestId`;
- timeout explícito por request (curto);
- propagação de `correlationId` e `requestId` fim-a-fim;
- isolamento por tenant; redação do segredo (ADR-0037/0019).

## Alternativas consideradas

- **Manter sem receiver** — bloqueia e2e real indefinidamente; preterido.
- **gRPC** — tipado/eficiente, mas +stubs/infra sem ganho no volume atual.
- **Fila/worker como transporte** — durável p/ jobs longos, mas exige ADR de
  promoção de fila/worker ([ADR-0033](adr-0033-no-cache-redis-phase-1.md) proíbe
  hoje); é o transporte de um incremento futuro, não deste.
- **Receiver que já executa fonte real** — rejeitado: cruza a fronteira de
  "connector real" sem o threat model/ADR de execução de fonte.

## Consequências

### Positivas
- Habilita o e2e real do caminho de dispatch (cliente mTLS ⇄ receiver mTLS) com
  `not_supported`, sem tocar fonte real.
- Reaproveita os contratos e helpers de segurança já existentes no connectors.

### Negativas / trade-offs aceitos
- Torna o `delfos-connectors` um **serviço a operar** (deploy, certs, lifecycle),
  não mais só biblioteca. Mitigação: escopo mínimo (1 endpoint, sem fonte real),
  certs/lifecycle tratados como infra de Fase 2.

### Neutras
- Não altera os contratos atuais; o `delfos-api` cliente já existe (gated OFF).

## Escopo atual
- Registrar a escolha (receiver HTTP + mTLS + validação + `not_supported`), como
  `Proposed`, para ratificação humana.

## Fora de escopo
- **Qualquer implementação** (servidor, handler, mTLS server-side) até aceitação.
- Adapters reais de fonte (SQL/API do cliente), export real.
- Fila/broker/worker; persistência no `delfos-connectors`.
- Jobs longos de ingestão (ADR de transporte durável futura).

## Impacto futuro / Fase 2
- Quando `Accepted` por um humano, libera o **menor incremento** do receiver:
  servidor mTLS + validação + delegação ao `FakeConnectorAdapter`
  (`not_supported`), com TDD e os controles do threat model. A execução real de
  fonte permanece gated atrás de uma ADR/incremento posterior.

## Relação com outros documentos
- **ADR-0038** — transporte/cliente de dispatch (mTLS) que chama este receiver.
- **ADR-0037** — broker de segredo cujo valor trafega só por este canal mTLS.
- **ADR-0008 / ADR-0015** — execução de connectors e command envelope/bridge.
- **ADR-0004** — estratégia de dois repositórios.
- **ADR-0024** — modelo de fases e gate humano.
- **ADR-0033** — proíbe fila/worker hoje; uma fila futura exige promoção própria.
- **CLAUDE.md** — gate de "real connectors" exige autorização explícita + ADR.
