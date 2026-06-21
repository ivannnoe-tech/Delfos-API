# ADR-0038 — Transporte de dispatch via HTTP síncrono (mTLS)

- **Status**: Proposed
- **Data**: 2026-06-21
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 2
- **Implementação**: não iniciada

---

> **Esta ADR registra uma decisão humana, mas permanece `Proposed`.** Ela **não
> autoriza implementação**. Por ADR-0024, a promoção para `Accepted` é **ato
> humano explícito** — nenhum agente pode mudar este status. **Nada** de
> transporte real, cliente HTTP, servidor de execução ou dispatch pode ser
> construído enquanto esta ADR não for `Accepted` por um humano. Ao ser aceita,
> **supersede a ADR-0022** (que enquadrou o problema sem decidir).

## Contexto

A [ADR-0022](adr-0022-connector-dispatch-transport.md) registrou que o
`delfos-api` precisará **despachar** um `ConnectorExecutionCommand` ao executor
`delfos-connectors`, manteve o dispatch como **fronteira conceitual** e listou
requisitos obrigatórios e critérios, sem escolher transporte. A
[ADR-0024](adr-0024-phase-1-and-phase-2-definition.md) tornou essa escolha um
**gate de entrada da Fase 2**.

Por decisão humana de **2026-06-21** (ver
[`phase-2-entry-readiness.md`](../phase-2-entry-readiness.md)), foi escolhido o
**HTTP síncrono (request/response)** para o **primeiro incremento** da Fase 2.

## Decisão

O transporte de dispatch é **HTTP síncrono** do `delfos-api` para o
`delfos-connectors`, **escopado a chamadas curtas** (preparação/validação de
comando e capabilities curtas — o 1º incremento da bridge). Jobs longos de
ingestão **não** usam este transporte e ficam adiados para uma **ADR de transporte
durável (fila) futura**, que exigirá também a ADR de promoção de fila/worker
(ADR-0033 hoje proíbe fila).

### Requisitos obrigatórios (herdados da ADR-0022, todos exigidos)

- **Autenticação mútua** entre `delfos-api` e `delfos-connectors` (mTLS ou tokens assinados de curta duração);
- **TLS** em todo o tráfego;
- **Idempotência** com chave derivada de `tenantId + executionRequestId`;
- **Retries com backoff** controlado (limitado, com jitter);
- **Timeout explícito** por dispatch (curto, coerente com chamadas de validação);
- propagação de **`correlationId`** e `requestId` fim-a-fim;
- **isolamento por tenant**: sem dispatch sem `tenantId`; sem reuso cross-tenant de conexão/canal.

### Interação com o segredo (ADR-0037)

O segredo resolvido pelo broker (ADR-0037) trafega **apenas** por este canal
(mTLS), **somente** para o dispatch corrente, **nunca** no command envelope
persistido. O envelope persistido carrega `credentialRef`, não o segredo.

## Alternativas consideradas

- **Fila de mensagens (broker)** — durável e boa p/ jobs longos, mas exige
  infra de broker + **ADR de promoção de fila/worker** (ADR-0033). Adiada para
  quando houver jobs longos reais; será o transporte do 2º incremento, não do 1º.
- **gRPC** — tipado/eficiente, mas +stubs/infra/complexidade sem ganho no volume atual.
- **Worker pull-based (polling)** — menos acoplamento, mas exige contrato de
  polling, locks e idempotência próprios; candidato futuro.
- **Decidir transporte único p/ tudo agora** — rejeitado: chamadas curtas e jobs
  longos têm perfis diferentes; forçar um só transporte cedo arrisca má escolha.

## Consequências

### Positivas
- Simples de implementar/depurar, sem infra extra; casa com o 1º incremento
  (command-prep + validation), que é de chamadas curtas.

### Negativas / trade-offs aceitos
- **Fraco para jobs longos** (timeouts, conexões presas, retry durável). Aceito
  porque jobs longos estão fora do 1º incremento; quando surgirem, exigem a ADR
  de fila. Acoplamento síncrono entre os dois serviços é assumido para o início.

### Neutras
- Não altera contratos/schemas/DTOs/controllers atuais. Nada muda até a aceitação humana.

## Escopo atual
- Registrar a escolha (HTTP síncrono, chamadas curtas) e os requisitos
  obrigatórios, como `Proposed`, para ratificação humana.

## Fora de escopo
- **Qualquer implementação** (cliente HTTP, servidor de execução, dispatch real).
- Fila/broker/worker (ADR futura de fila + promoção, ADR-0033).
- Jobs longos de ingestão.
- Descriptografia de credenciais em si (ADR-0037).
- Conector real, SQL/API externa, export real.

## Impacto futuro / Fase 2
- Quando `Accepted` por um humano, **supersede a ADR-0022** e, junto com a
  ADR-0037 aceita + threat model concluído (ADR-0024), libera o **menor
  incremento**: a bridge real começa como command preparation + validation sobre
  este transporte, sem adapters reais ainda.
- Jobs longos exigirão uma ADR de transporte durável (fila) + ADR de promoção de
  fila/worker, em incremento posterior.

## Relação com outros documentos
- **ADR-0022** — superseded por esta ADR ao ser aceita.
- **ADR-0037** — broker de segredo cujo valor trafega só por este canal mTLS.
- **ADR-0033** — proíbe fila/worker hoje; uma fila futura exige promoção própria.
- **ADR-0013/0015** — boundary multitenant e command envelope preservados.
- **ADR-0024** — modelo de fases e gate humano.
- [`runtime-connectors-bridge-plan.md`](../runtime-connectors-bridge-plan.md) — `idempotency key` e limites default que o transporte respeita.
- [`phase-2-entry-readiness.md`](../phase-2-entry-readiness.md) — análise que originou esta decisão.
