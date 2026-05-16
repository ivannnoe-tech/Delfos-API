# Agent Operating Model — Delfos Analytics

> Status: documento de governança da camada agent-ready.
> Define **como um agente de IA deve operar** no projeto Delfos Analytics.
> Complementa, não substitui, `AGENTS.md`.

Este documento descreve o modelo operacional de um agente (IA, CLI ou
automação) no `delfos-api`. Ele é parte da camada agent-ready, ao lado de
`docs/agent-task-contract.md`, `docs/agent-safety-rules.md`,
`docs/agent-validation-checklist.md` e `docs/agent-stop-conditions.md`.

---

## 1. Princípio: autonomia controlada

Um agente atua com **autonomia controlada**: pode planejar, pesquisar, editar
arquivos e propor soluções, mas **sempre dentro dos limites da documentação
canônica**. O agente nunca decide escopo, fase ou arquitetura por conta
própria.

Regras de operação:

- agir apenas dentro do escopo explícito da tarefa recebida (ver
  `docs/agent-task-contract.md`);
- preferir solução organizada à solução rápida;
- pesquisar e reaproveitar antes de criar algo novo;
- registrar toda decisão relevante no relatório final;
- parar e pedir validação humana diante de qualquer condição de bloqueio
  (ver `docs/agent-stop-conditions.md`).

O estado atual do projeto é **foundation administrativa/declarativa**: não há
conectores reais, execução real de query, JWT real, cache, fila ou scheduler.
Nenhuma tarefa autoriza implementação real desses componentes.

---

## 2. Ordem de autoridade documental

Quando duas fontes divergem, o agente segue a ordem abaixo, do **mais forte ao
mais fraco**:

1. **Código atual em execução** — o que está implementado e funcionando hoje é
   a verdade factual do estado do sistema.
2. **ADRs `Accepted`** — decisões arquiteturais aprovadas e vigentes.
3. **`AGENTS.md`** — diretriz obrigatória e ponto de entrada das regras
   compartilhadas.
4. **`docs/quality-checklist.md`** — fonte canônica da Definition of Done (DoD)
   e das regras canônicas (tamanho de arquivo, estados de UI, stop conditions).
5. **Demais documentos em `docs/`** — arquitetura, escopo, políticas e guias.
6. **`prompts/` e skills (`.agents/skills/`)** — apoio operacional; complementam,
   nunca substituem `docs/`.

**ADRs `Proposed` descrevem um estado futuro e NÃO autorizam implementação.**
Em particular, ADR-0021 e ADR-0022 permanecem `Proposed` **por decisão humana
explícita** e constituem o **gate formal de entrada da Fase 2**: elas não são
pendências da Fase 1 e **bloqueiam** a execução real de connectors e a
descriptografia real de credenciais. Nenhum agente pode promovê-las. Documentos
conceituais ou de visão futura (conectores, bridge, dispatch, cache, JWT) também
não autorizam implementação real.

---

## 3. Leitura obrigatória antes de qualquer tarefa

Antes de iniciar qualquer tarefa, o agente deve ler:

- `AGENTS.md` — ponto de entrada e estado atual implementado;
- `DESIGN.md` — padrões visuais;
- `docs/architecture.md` — arquitetura geral;
- `docs/phase-1-scope.md` — escopo da Fase 1;
- `docs/quality-checklist.md` — DoD canônica e regras canônicas;
- os 4 demais documentos agent-ready:
  - `docs/agent-task-contract.md` — formato mínimo de uma tarefa executável;
  - `docs/agent-safety-rules.md` — regras de segurança operacional;
  - `docs/agent-validation-checklist.md` — checklist de validação;
  - `docs/agent-stop-conditions.md` — condições para parar e pedir validação.

Quando a tarefa tiver skill específica, ler também a skill correspondente em
`.agents/skills/` (ver `AGENTS.md` §5). Quando a tarefa usar o Postman para
validar ou testar a API, ler também `docs/postman-policy.md`.

---

## 4. Modelo de fases (resumo)

A fonte canônica do modelo de fases é a **ADR-0024** (`Accepted`). Os documentos
`docs/phase-1-scope.md` e `docs/phase-2-vision.md` são companheiros detalhados.
Não duplicar a tabela completa de permitido/proibido — consultar a ADR.

Resumo:

- **Fase 1 — foundation declarativa/administrativa**: descreve, cataloga e
  governa **sem executar**. Inclui contratos administrativos, catálogos
  declarativos, referências seguras de credenciais (`credentialRef`), auditoria
  metadata-only, readiness via dry-run e demo-execute fictício. Auth temporária
  por `x-delfos-admin-key`. **Não** há connectors reais, execução real de query,
  JWT, cache, fila, worker ou scheduler.
- **Fase 2 — preparação e habilitação da execução real**: JWT real, connectors
  reais e dispatch, descriptografia de credenciais, adapters reais e,
  possivelmente, cache/storage mediante ADRs próprias.

A transição Fase 1 → Fase 2 exige, no mínimo, ADR-0021 e ADR-0022 `Accepted` e
revisão de segurança concluída. **O estado atual é Fase 1.** Nenhuma capacidade
de Fase 2 deve ser implementada nesta etapa.

---

## 5. Rótulos de status

O projeto usa rótulos de status para não inflar o progresso. A fonte canônica é
a seção **"Taxonomia de status"** de `docs/roadmap.md`. Resumo:

- **`foundation implementada`**: contratos, types, testes e endpoints
  declarativos existem e funcionam no estado atual, sem execução real.
- **`foundation-only`**: apenas skeleton/types/testes; sem runtime, sem
  provider, sem dispatch, sem execução real.
- **`parcialmente implementado`**: parte do item existe; o restante é pendente
  ou futuro.
- **`pendente`**: previsto para a fase atual, ainda não iniciado.
- **`futuro`**: depende de fase/ADR explícito; fora do escopo atual.

Ao relatar progresso, o agente deve usar esses rótulos com precisão e nunca
descrever como "implementado" algo que é apenas foundation ou foundation-only.

---

## 6. Como agir em conflito

Se o agente encontrar **divergência entre documentos, ADRs e código** — por
exemplo, um doc descrevendo um comportamento que o código não tem, ou uma ADR
`Proposed` tratada como se fosse `Accepted` — ele deve:

1. **Parar** a tarefa no ponto do conflito.
2. **Não decidir sozinho** qual fonte vence além da ordem de autoridade da
   seção 2; conflitos factuais relevantes precisam de revisão humana.
3. **Registrar o conflito** no relatório final como pendência
   **"precisa validação humana"**, descrevendo as fontes divergentes.
4. **Não contornar** o bloqueio nem prosseguir com suposições.

Conflito entre ADR, `AGENTS.md` e código é uma **stop condition** explícita —
ver `docs/agent-stop-conditions.md` e `AGENTS.md` §9.

---

## 7. Registro de decisões e limitações no relatório final

Toda tarefa termina com um **relatório final** que deve conter, no mínimo:

- **resumo** do que foi feito;
- **lista de arquivos criados/alterados** (caminhos completos);
- **arquivos acima de 450 linhas** criados ou aumentados, com justificativa
  objetiva (regra de tamanho, `docs/quality-checklist.md` §0.1);
- **pendências marcadas "precisa validação humana"**, incluindo conflitos e
  stop conditions encontradas;
- **validações executadas** (build, lint, testes) e seus resultados; se não foi
  possível validar, registrar como pendência;
- **riscos ou limitações** assumidos.

O formato detalhado do relatório está em `docs/agent-task-contract.md`.

---

## 8. Posição na camada agent-ready

Este documento integra a camada agent-ready de governança. Ele **complementa**
`AGENTS.md`, que continua sendo a diretriz obrigatória e a fonte canônica das
regras compartilhadas entre `delfos-api` e `delfos-web`. Em caso de divergência
entre este documento e `AGENTS.md` ou `docs/quality-checklist.md`, prevalecem
estes últimos, conforme a ordem de autoridade da seção 2.
