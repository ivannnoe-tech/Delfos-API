# ADR-0037 — Descriptografia de credenciais via `delfos-api` credential broker

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
> descriptografia, broker, adapter ou dispatch real pode ser construído enquanto
> esta ADR não for `Accepted` por um humano. Ao ser aceita, **supersede a
> ADR-0021** (que enquadrou o problema sem decidir).

## Contexto

A [ADR-0021](adr-0021-credential-decryption-in-future-execution.md) enquadrou o
maior risco de segurança do roadmap — transformar um `credentialRef` em segredo
real para conectar à fonte do cliente — e listou os candidatos sem escolher.
A [ADR-0024](adr-0024-phase-1-and-phase-2-definition.md) tornou essa decisão um
**gate de entrada da Fase 2**.

Por decisão humana de **2026-06-21** (ver
[`phase-2-entry-readiness.md`](../phase-2-entry-readiness.md)), foi escolhido,
entre os quatro candidatos da ADR-0021, o **`delfos-api` como credential broker**
para o **primeiro incremento** da Fase 2. Esta ADR registra essa escolha e define
o boundary de manuseio do segredo, para ratificação humana.

## Decisão

O **`delfos-api` é o credential broker**. Quando (e somente quando) esta ADR for
`Accepted` e a execução real iniciar:

1. **Quem resolve o segredo:** o `delfos-api` descriptografa o `credentialRef`
   sob demanda (just-in-time), usando a chave de ADR-0019 que ele já possui. A
   criptografia e o store permanecem com quem já é dono — nenhum outro serviço
   recebe a chave nem o ciphertext.
2. **Tempo de vida do segredo:** **request-scoped e somente em memória**. O
   segredo descriptografado existe apenas durante o dispatch que o usa, é zerado
   após o uso, **nunca é persistido**, **nunca entra em cache**, fila ou disco.
3. **Transporte do segredo:** entregue ao executor **exclusivamente** pelo canal
   de dispatch de [ADR-0038](adr-0038-connector-dispatch-transport-sync-http.md)
   (HTTP síncrono com autenticação mútua + TLS), apenas para aquele dispatch.
   **Nunca** trafega no command envelope persistido (que carrega `credentialRef`,
   nunca o segredo — ADR-0013/ADR-0015).
4. **Threat model do manuseio** (mínimo a garantir): ver §Threat model.
5. **Rotação de chave (ADR-0019):** o broker descriptografa com a chave corrente;
   a rotação re-criptografa o store sem expor o segredo; o broker nunca cacheia
   material derivado de chave antiga.

### Fronteira inegociável (herdada da ADR-0021, mantida)

- o segredo real **NUNCA** vai ao `delfos-web`;
- o segredo real **NUNCA** aparece em resposta de API, log, auditoria ou timeline
  (invariante de redação — ADR-0019);
- o `delfos-api` é o dono da criptografia/store;
- o `delfos-connectors` recebe **apenas o necessário**, just-in-time, sem segredo
  de longa duração.

### Threat model (manuseio do segredo)

| Ameaça | Controle |
|---|---|
| **Replay** de dispatch | Idempotência por `tenantId + executionRequestId` (ADR-0038) + TTL curto do segredo |
| **Vazamento em memória** | Lifetime mínimo, zeragem pós-uso, sem cache, sem log do valor |
| **Vazamento em log/auditoria** | Invariante de redação (ADR-0019); o valor nunca é serializado |
| **Exposição cross-tenant** | Isolamento por `tenantId` no broker e no transporte (ADR-0038) |
| **Chave comprometida / rotação** | Re-criptografia no store (ADR-0019); broker sem cache de chave |

## Alternativas consideradas

- **Worker seguro dedicado** — menor superfície, mas +1 serviço para operar;
  preterido p/ o 1º incremento, candidato de evolução.
- **KMS / HashiCorp Vault** — rotação/auditoria fortes, mas +dependência e custo;
  **caminho de migração futuro recomendado** se o volume/risco crescer.
- **Local agent (on-premise)** — depende de ADR-0012 (inexistente); não viável agora.
- **Segredo no command envelope** — rejeitado pela ADR-0021 (violaria a fronteira).
- **`delfos-connectors` lê/descriptografa direto do store** — rejeitado (quebra a
  posse da criptografia, ADR-0019).

## Consequências

### Positivas
- Caminho mais simples e de menor infra para o 1º incremento; mantém a
  criptografia concentrada em quem já é dono.
- Threat model explícito antes de qualquer código.

### Negativas / trade-offs aceitos
- Coloca manuseio de segredo no **caminho de orquestração** do `delfos-api` —
  exige disciplina de lifetime/redação. Mitigação: §Threat model + migração
  futura a worker/KMS se necessário.

### Neutras
- Não altera contratos/schemas/DTOs atuais. Nada muda até a aceitação humana.

## Escopo atual
- Registrar a escolha do broker (`delfos-api`) e o boundary do segredo, como
  `Proposed`, para ratificação humana.

## Fora de escopo
- **Qualquer implementação** (broker, descriptografia, adapter, dispatch).
- Escolha de transporte (ADR-0038).
- Adapters reais, worker, fila, cache, scheduler, local agent.
- Rotação de chave em si (ADR-0019).

## Impacto futuro / Fase 2
- Quando `Accepted` por um humano, **supersede a ADR-0021** e, junto com a
  ADR-0038 aceita + threat model concluído (ADR-0024), libera o **menor
  incremento**: command preparation + validation da bridge, evoluindo até a
  resolução real de segredo sob este boundary.

## Relação com outros documentos
- **ADR-0021** — superseded por esta ADR ao ser aceita.
- **ADR-0019** — dono da criptografia/rotação; consumida aqui.
- **ADR-0038** — transporte que entrega o segredo just-in-time.
- **ADR-0024** — modelo de fases e gate humano.
- **ADR-0013/0015** — boundary e command envelope (carrega `credentialRef`, nunca segredo).
- [`phase-2-entry-readiness.md`](../phase-2-entry-readiness.md) — análise que originou esta decisão.
