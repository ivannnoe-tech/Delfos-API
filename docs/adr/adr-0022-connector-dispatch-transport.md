# ADR-0022 — Transporte de dispatch para connectors

- **Status**: Proposed
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 2

---

## Contexto

> **Decisão de governança (2026-05-15):** por decisão humana explícita, esta ADR
> **permanece `Proposed`**. Ela **deixa de ser pendência da Fase 1** e passa a
> ser um **gate formal de entrada da Fase 2**. Nenhum agente pode promovê-la
> para `Accepted`. A revisão e a aceitação/substituição desta ADR exigem decisão
> humana explícita no início da Fase 2 — ver ADR-0024.

Quando a execução real de integrações começar, o `delfos-api` precisará
**despachar** um comando de execução de connector para o futuro executor
`delfos-connectors`. Hoje esse dispatch **não existe**.

O estado atual é foundation:

- o `runtime/execution-requests` é foundation administrativa/declarativa
  (ADR-0014): registra solicitações, estados, eventos seguros, dry-run de
  readiness e demo-execute fictício;
- a bridge runtime/connectors é **foundation-only** (ADR-0015 e
  `docs/runtime-connectors-bridge-plan.md`): existe como contrato documental e,
  no `delfos-connectors`, como tipos TypeScript e testes — sem provider, sem
  dispatch, sem transporte;
- o `delfos-connectors` possui apenas Skeleton Foundation: contratos,
  sanitização, validação e `FakeConnectorAdapter` determinístico, sem servidor
  HTTP, client HTTP, worker, fila ou cache (ADR-0013).

A ADR-0008 já estabelece que a execução pesada de integrações é
responsabilidade do futuro `delfos-connectors`, e a ADR-0015 lista o plano da
bridge mantendo o item "decidir transporte" explicitamente em aberto e
condicionado a uma ADR própria. Esta ADR registra essa decisão pendente: **qual
mecanismo de transporte o `delfos-api` usará para entregar um
`ConnectorExecutionCommand` ao executor**.

Era necessário registrar formalmente o problema antes que qualquer fase futura
escolhesse um transporte de forma implícita ou apressada, sem avaliar
acoplamento, durabilidade, custo de infraestrutura e segurança.

## Decisão

**A escolha do transporte de dispatch é adiada para uma ADR futura.** Esta ADR
**não** decide, **não** autoriza e **não** implementa transporte algum.

A decisão proposta para o estado atual é:

- manter o **dispatch como fronteira conceitual documentada** — uma "porta"
  (port) descrita em contrato, sem implementação, sem adapter, sem cliente de
  rede;
- registrar os **requisitos obrigatórios** que qualquer transporte futuro
  deverá satisfazer;
- registrar os **critérios de decisão** que a ADR de transporte deverá usar;
- exigir **nova ADR** (a ser elaborada na transição para a Fase 2) para
  selecionar e autorizar um transporte concreto.

Requisitos obrigatórios para qualquer transporte futuro:

- **autenticação mútua** entre `delfos-api` e `delfos-connectors`;
- **TLS** em todo o tráfego;
- **idempotência**, com chave derivada de `tenantId + executionRequestId`
  (alinhada ao `idempotency key` conceitual do bridge plan);
- **retries com backoff** controlado;
- **timeout** explícito por dispatch;
- propagação de **`correlationId`** e `requestId` para rastreabilidade
  fim-a-fim;
- **isolamento por tenant**: nenhum dispatch pode operar sem `tenantId`, e
  nenhum reaproveitamento cross-tenant de conexão, fila ou canal é permitido.

Critérios que a ADR de transporte futura deverá considerar:

- perfil de duração dos jobs (chamadas curtas de validação vs. jobs longos de
  ingestão);
- necessidade de durabilidade e de sobreviver a reinício de processo;
- custo de infraestrutura adicional;
- complexidade operacional (deploy, observabilidade, resposta a incidentes);
- segurança de transporte e superfície de ataque.

## Alternativas consideradas

- **Chamada HTTP interna síncrona (request/response)** — simples de implementar
  e de depurar, sem broker. Porém cria acoplamento forte entre os dois serviços
  e é fraca para jobs longos (timeouts, conexões presas, falha de retry
  durável). Não escolhida agora; permanece candidata para capabilities curtas.
- **Fila de mensagens (broker)** — assíncrona, durável, desacoplada, boa para
  jobs longos, retries e isolamento de falha. Porém exige infraestrutura de
  broker, que **conflita diretamente com o escopo atual sem fila/worker
  definido pela ADR-0007**. Não escolhida agora; exigiria ADR de promoção de
  fila além desta ADR de transporte.
- **gRPC** — transporte tipado e eficiente, bom para contrato forte entre
  serviços. Porém adiciona infraestrutura, geração de stubs e complexidade
  operacional sem ganho claro no volume atual. Não escolhida agora.
- **Worker pull-based (polling seguro)** — o executor puxa trabalho em vez de
  receber push, reduzindo o acoplamento do `delfos-api` ao executor. Porém
  exige contrato de polling, locks, idempotência e segurança operacional
  próprios. Não escolhida agora; permanece candidata.
- **Decidir o transporte nesta ADR** — rejeitada. Escolher transporte hoje
  implicaria runtime real antes de definir credenciais reais (ADR-0021),
  threat model e infraestrutura, contrariando o estado foundation-only descrito
  em ADR-0014 e ADR-0015.

## Consequências

### Positivas

- Evita escolher um transporte antes de existir necessidade real e antes de
  conhecer o perfil de carga.
- Mantém a foundation alinhada com ADR-0007 (sem fila/worker), ADR-0014 e
  ADR-0015 (runtime e bridge foundation-only).
- Documenta requisitos de segurança e critérios de decisão com antecedência,
  reduzindo o risco de uma escolha apressada na Fase 2.
- Preserva a fronteira conceitual de dispatch sem introduzir acoplamento entre
  repositórios.

### Negativas / trade-offs aceitos

- A bridge real continua bloqueada: sem transporte decidido não há dispatch
  real.
- A decisão de transporte permanece como item pendente que precisará de ADR
  própria antes da execução real.
- Equipe e operadores precisam entender que o "dispatch" atual é apenas um
  conceito documentado, não um caminho de código.

### Neutras

- Esta ADR não altera contratos HTTP, schemas, DTOs ou controllers existentes.
- Esta ADR não cria dependência entre `delfos-api` e `delfos-connectors`.
- Esta ADR não cria broker, fila, worker, cliente HTTP ou endpoint.

## Escopo atual

- Registrar o problema do transporte de dispatch como decisão pendente.
- Manter o dispatch apenas como **fronteira conceitual documentada**.
- Listar requisitos obrigatórios e critérios de decisão para a ADR futura.

## Fora de escopo

Esta ADR não autoriza nem implementa:

- transporte real (HTTP, fila, gRPC, polling ou outro);
- broker, fila, worker, cache ou scheduler;
- cliente HTTP ou servidor de execução no `delfos-connectors`;
- chamada do `delfos-api` ao `delfos-connectors`;
- dependência entre repositórios ou package compartilhado;
- endpoint novo, alteração de controller, schema ou DTO;
- conector real, SQL/API externa ou descriptografia de credenciais;
- escolha definitiva do transporte.

## Impacto na Fase 1

- Nenhuma mudança de comportamento, código ou contrato na Fase 1.
- O `runtime/execution-requests` permanece foundation administrativa e o
  demo-execute permanece fictício.
- Documenta, desde já, que o dispatch é apenas conceito — não há transporte a
  implementar nesta fase.

## Impacto futuro / Fase 2

- Habilita a elaboração de uma ADR de transporte dedicada como pré-requisito da
  bridge real.
- A ADR de transporte futura deverá escolher o mecanismo usando os critérios
  aqui registrados e respeitando os requisitos obrigatórios de segurança.
- A escolha de fila como transporte exigirá, adicionalmente, uma ADR de
  promoção de fila/worker (alinhada com ADR-0007), por adicionar
  infraestrutura.
- Após o transporte aprovado, a bridge real deverá iniciar como command
  preparation + validation, conforme o plano de fases do
  `runtime-connectors-bridge-plan.md`.

## Relação com outros documentos

- ADR-0007 — define que não há fila, cache ou scheduler no escopo atual; uma
  fila como transporte exigiria ADR de promoção própria.
- ADR-0008 — define o `delfos-connectors` como executor futuro de integrações
  pesadas; esta ADR trata de como o comando chegaria a esse executor.
- ADR-0013 — define o boundary multitenant e o command envelope do
  `delfos-connectors`; o transporte futuro deve preservar esse isolamento.
- ADR-0014 — define o `runtime/execution-requests` como foundation
  administrativa; esta ADR não altera essa decisão.
- ADR-0015 — planeja a bridge runtime/connectors e mantém o transporte como
  item pendente; esta ADR formaliza esse item como decisão futura.
- ADR-0021 — define a fronteira de descriptografia de credenciais, também
  bloqueante para a execução real; o transporte deve coexistir com essa
  fronteira sem trafegar segredo bruto.
- `docs/runtime-connectors-bridge-plan.md` — plano conceitual da bridge, com a
  `idempotency key` e os limites default que o transporte futuro deverá
  respeitar.
