# Análise de prontidão para entrada na Fase 2

> **Status: análise / proposta de governança — NÃO autoriza implementação.**
> Este documento **não** promove ADR alguma, **não** muda escopo e **não**
> autoriza execução real, descriptografia, dispatch ou JWT. A entrada na Fase 2 é
> **decisão humana explícita** ([ADR-0024](adr/adr-0024-phase-1-and-phase-2-definition.md)):
> nenhum agente pode promover ADR-0021/0022 nem iniciar capacidade de Fase 2.
> Objetivo aqui: mapear, de forma fiel às ADRs, o que falta para o gate abrir e
> quais decisões só o humano pode tomar.

- **Base**: [ADR-0024](adr/adr-0024-phase-1-and-phase-2-definition.md) (modelo de fases),
  [ADR-0021](adr/adr-0021-credential-decryption-in-future-execution.md) (descriptografia),
  [ADR-0022](adr/adr-0022-connector-dispatch-transport.md) (transporte de dispatch).
- **Data**: 2026-06-21. **Estado**: foundation Fase 1 completa (P1–P7 + P5 da migração PostgreSQL concluídos).

---

## 1. Critérios formais de entrada (ADR-0024 §Critérios)

| Critério de entrada na Fase 2 | Estado hoje |
|---|---|
| **ADR-0021** (fronteira de descriptografia) `Accepted` | ❌ `Proposed` (gate deliberado) |
| **ADR-0022** (transporte de dispatch) `Accepted` | ❌ `Proposed` (gate deliberado) |
| **Revisão de segurança / threat model** da execução real concluída | ❌ `threat-model.md` cobre só a Fase 1 (Delfos não acessa fonte do cliente) |
| **Validação comercial e técnica da Fase 1** (`phase-2-vision.md`) | ⚠️ decisão humana — não verificável por código |

Enquanto os quatro não forem atendidos, **nenhuma** capacidade marcada "Fase 2"
deve ser implementada (ADR-0024 §Tabela permitido/proibido).

---

## 2. Gate ADR-0021 — descriptografia de credenciais

É o **maior risco de segurança do roadmap**. A ADR atual só enquadra o problema;
uma **ADR final** precisa decidir, antes de qualquer linha de código:

1. **Quem resolve o segredo** — escolher entre os 4 candidatos (não decididos):
   - `delfos-api` como **credential broker** (descriptografa sob demanda, segredo de curtíssima duração);
   - **worker seguro dedicado** (menor privilégio, +1 serviço para operar);
   - **KMS / HashiCorp Vault** (custódia gerenciada, rotação/auditoria fortes, +dependência/custo);
   - **local agent** para fontes on-premise (depende de ADR-0012, inexistente hoje).
2. **Tempo de vida e transporte** do segredo entregue ao executor.
3. **Threat model** do manuseio do segredo (replay, vazamento em memória/logs).
4. **Interação com a rotação de chave** (ADR-0019).

**Fronteira inegociável (vale para qualquer solução):** o segredo real NUNCA vai
ao `delfos-web`, NUNCA aparece em resposta/log/auditoria; `delfos-api` é dono da
criptografia (ADR-0019); o `delfos-connectors` recebe só o necessário, idealmente
nunca segredo em texto plano de longa duração.

---

## 3. Gate ADR-0022 — transporte de dispatch

A ADR final de transporte deve **escolher um mecanismo** usando os critérios
registrados, respeitando os requisitos obrigatórios.

**Opções (não decididas):** HTTP síncrono request/response · fila de mensagens
(broker) · gRPC · worker pull-based (polling seguro).

**Requisitos obrigatórios de qualquer transporte:** autenticação mútua · TLS ·
idempotência com chave de `tenantId + executionRequestId` · retries com backoff ·
timeout por dispatch · propagação de `correlationId`/`requestId` · isolamento por
tenant (sem reuso cross-tenant de conexão/fila/canal).

**Critérios de decisão:** perfil de duração dos jobs · durabilidade/sobreviver a
restart · custo de infra · complexidade operacional · superfície de ataque.

> ⚠️ Escolher **fila** como transporte exige **ADR de promoção de fila/worker**
> adicional (ADR-0033 hoje define "sem fila/worker"). Ou seja: fila = 2 decisões,
> não 1.

---

## 4. Outras capacidades de Fase 2 (fora dos 2 gates, mas parte da fase)

- **Auth real JWT** (ADR-0006) substituindo a admin-key (ADR-0016) — tem ADR própria, ainda não iniciada.
- **Adapters reais** de fonte (SQL/REST/file) — bloqueados por ADR-0021.
- **Cache/storage** — só mediante ADR de promoção própria.

---

## 5. Sequência recomendada de entrada (decisão antes de código)

A primeira "entrega" da Fase 2 é **decisão**, não implementação:

1. **Validar Fase 1** (comercial + técnica) — confirmação humana (`phase-2-vision.md`).
2. **Threat model da Fase 2** — estender `threat-model.md` para execução real + manuseio de segredo (pré-requisito de ADR-0021 e da revisão de segurança do ADR-0024).
3. **ADR final de descriptografia** — promove/substitui ADR-0021 com as 4 decisões do §2.
4. **ADR final de transporte** — promove/substitui ADR-0022 com a escolha do §3 (+ ADR de fila se aplicável).
5. **Plano de JWT** (ADR-0006) para a troca da admin-key.
6. **Só então**, o **menor incremento seguro de código**: a bridge real começa como *command preparation + validation* (já existe como skeleton em `delfos-connectors` + `runtime-connectors-bridge-plan.md`), **sem** transporte real e **sem** segredo real, evoluindo atrás dos gates já aprovados.

> Ordem importa: 1→2 destravam 3 e 4; 3 e 4 (`Accepted`) + 2 concluído destravam 6. Nenhum passo de código antes do 3/4 aprovados.

---

## 6. Riscos

- **Descriptografia (top risco):** decidir cedo/errado sem threat model = exposição de segredo de cliente. Mitigação: ADR final + threat model antes de qualquer código (ADR-0021).
- **Acoplamento de transporte:** HTTP síncrono é simples mas frágil para jobs longos; fila resolve durabilidade mas puxa infra + ADR extra. Decidir pelo perfil real de carga, não por conveniência.
- **Escopo creep:** "Fase 2" puxa JWT + adapters + cache juntos. Recomendado fatiar por ADR e entregar o menor incremento por vez.
- **Drift de docs:** `threat-model.md` ainda descreve fronteira Fase 1 (e cita MongoDB, pré-P5) — precisa ser atualizado/estendido ao abrir a Fase 2.

---

## 7. Decisões que dependem de ti (gate humano)

Nenhuma destas pode ser tomada por agente:

1. **Abrir ou não a Fase 2** agora (Fase 1 validada comercial/tecnicamente?).
2. Para ADR-0021: **qual broker de segredo** (api / worker / KMS-Vault / local agent) + tempo de vida/transporte.
3. Para ADR-0022: **qual transporte** (HTTP / fila / gRPC / polling) — e, se fila, autorizar a ADR de promoção de fila/worker.
4. Promover/substituir ADR-0021 e ADR-0022 para `Accepted` (ato humano explícito, ADR-0024).

**Próximo passo autônomo que posso fazer (sem cruzar o gate):** redigir os
**rascunhos** das ADRs finais (descriptografia e transporte) e a **extensão do
threat model** como *Proposed*, deixando as escolhas em aberto para tua decisão —
nada disso promove ADR nem escreve código de execução. Só com tua escolha
explícita as ADRs viram `Accepted` e o código começa.
