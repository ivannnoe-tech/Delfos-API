# Filosofia de Execução e Runtime do Delfos

> Tipo: filosofia de produto · Status: princípios orientadores — não autoriza implementação

Este documento declara **como o Delfos pensa execução e runtime**: a passagem de uma
*definição* (query, dashboard, relatório) para um *resultado* obtido executando essa
definição contra uma fonte de dados real. Ele deriva dos [12 princípios](./principles.md)
e não pode contradizê-los.

Execução **real ainda não existe** no Delfos. Os módulos `runtime` e `execution-preview`
são *foundation declarativa*: modelam execution requests, validam-nas e as auditam — sem
jamais chamar uma fonte de dados, sem connector real, sem worker, sem fila. Este
documento descreve a **postura** que governará o runtime quando ele for construído.
Execução real é gated por escopo aprovado e pelas ADRs Proposed adr-0015, adr-0021 e
adr-0022.

---

## A tese: definição e execução são coisas diferentes

A decisão arquitetural central do Delfos sobre runtime é uma **separação rígida**:

- **Definição** é dado declarativo (Princípio 2): uma `query-definition`, uma
  `dashboard-definition`, um `report-definition`. É versionável, inspecionável,
  diffável, revisável. Não tem efeito colateral. Não toca a rede.
- **Execução** é um evento: pegar uma definição, resolver credenciais e parâmetros,
  despachar para um connector, obter resultado. Tem efeito colateral. Toca a rede. Pode
  falhar, demorar, custar.

Misturar os dois é o erro que o Delfos recusa. Uma definição que "se executa sozinha" ao
ser salva é imprevisível, difícil de auditar e impossível de revisar com segurança. No
Delfos, **definir nunca executa**; executar sempre parte de uma definição já estável.

Essa separação é o que torna possível: revisar uma query antes de ela tocar dados de
produção; versionar um dashboard sem disparar carga; e — crucialmente — construir toda a
*foundation* de runtime antes de existir runtime real (Princípio 1).

---

## Execução é entidade de primeira classe

No Delfos, uma execução **não é uma chamada de função anônima** — é uma **entidade
modelada**: o *execution request*. Esse é o cerne da foundation de runtime entregue
(adr-0014).

Um execution request é, ele próprio, declarativo:

- Tem identidade, tenant, ator, definição de origem, parâmetros e estado.
- É **inspecionável** antes, durante e depois — não é um efeito colateral opaco.
- É **auditável** (Princípio 7): toda execução deixa rastro associado a tenant e ator.
- É **rastreável** até a definição que a originou e até a fonte que consultará.

Tratar execução como entidade — e não como chamada — é o que permite que o Delfos
modele, valide e audite execução **antes** de executar de verdade. A foundation de
`runtime` existe hoje precisamente para isso: o request existe, é validado, é persistido
e é auditado; só o despacho real está ausente. Honestidade de estado (Princípio 8): a
foundation é chamada de foundation.

---

## Foundation antes de runtime real

O Princípio 1 — *foundation antes de execução* — não é slogan; é a ordem de construção
literal do runtime do Delfos. A sequência é:

1. **Modelar o execution request** como schema declarativo, com tenant, validação e
   auditoria — *feito* (adr-0014).
2. **Validar declarativamente** a execução antes de qualquer despacho — papel do
   `execution-preview`.
3. **Definir o contrato plataforma↔connector** — o command envelope versionado
   (adr-0015, *Proposed*).
4. **Definir transporte e segredos** — despacho de connector (adr-0022, *Proposed*) e
   decifragem de credencial no momento da execução (adr-0021, *Proposed*).
5. **Só então** construir despacho real, connectors reais e obtenção de resultado.

Pular da etapa 1 para a 5 — "fazer o runtime funcionar logo" — é exatamente o que o
Delfos recusa. Cada etapa é foundation testada e estável da seguinte.

---

## `execution-preview`: validar antes de executar

O módulo `execution-preview` encarna a tese de separação. Ele responde, de forma
puramente declarativa, à pergunta *"esta execução está bem formada e seria permitida?"*
— **sem executá-la**.

O preview valida, antes de qualquer despacho real:

- Que a definição existe e está coerente.
- Que o `tenantId` é consistente entre request, definição, conexão e credencial.
- Que os parâmetros respeitam o contrato da definição.
- Que as referências (`connectionId`, `credentialRef`) apontam para recursos válidos do
  tenant.

O preview é a aplicação do Princípio 2 ao runtime: tornar a execução **inspecionável
como dado** antes de ela virar **evento com efeito colateral**. É a rede de segurança
que separa "definir" de "fazer" — e permite que erros sejam pegos no plano declarativo,
barato e auditável, e não no plano de runtime, caro e arriscado.

---

## Command envelope: o contrato versionado plataforma↔connector

Quando a execução real existir, a plataforma não chamará o connector por acoplamento
direto. Ela emitirá um **command envelope**: um contrato versionado que descreve *o que*
executar, *para qual tenant*, *com quais parâmetros* — sem que a plataforma conheça o
dialeto interno do connector (Princípio 9 — pluralidade de fontes, contratos
versionados).

O envelope é a fronteira entre dois mundos:

- A **plataforma** (`delfos-api`) produz envelopes declarativos, tenant-scoped,
  validados.
- Os **connectors** (`delfos-connectors`, hoje skeleton) consomem envelopes e devolvem
  resultados ou erros sanitizados.

Esse contrato é versionado por desenho: connector e plataforma evoluem de forma
independente, sem que uma mudança interna de um quebre o outro. É o que evita o
acoplamento a um produto, dialeto ou fornecedor — e o que mantém o runtime plural. O
desenho do envelope é o objeto da adr-0015 (*Proposed*); enquanto Proposed, ele
**descreve o contrato pretendido, não autoriza o bridge real**.

---

## Segredos só no momento e no lugar certos

O Princípio 4 — *segurança por construção* — tem uma consequência precisa no runtime:
**segredo não circula como dado de definição**. Em toda a foundation declarativa,
`credentialRef` é referência e `connectionId` é referência de configuração — nunca o
segredo, nunca a connection string.

A decifragem de credencial é tratada como o ponto mais sensível do runtime futuro
(adr-0021, *Proposed*). A postura do Delfos:

- O segredo é decifrado **no momento exato da execução** — não ao definir, não ao
  validar, não ao fazer preview, não ao auditar.
- O segredo é decifrado **no lugar exato** que precisa dele — o componente que despacha
  ao connector — e não antes, não em trânsito por camadas que não o usam.
- O segredo decifrado tem **vida mínima**: existe pelo tempo do despacho e não persiste,
  não vai para log, não entra em metadado, não aparece em resultado (sanitização de
  metadados, adr-0020).
- A trilha de auditoria registra *que houve* uso de credencial — nunca o **valor** da
  credencial.

Decifrar cedo demais, ou em camada demais, é ampliar a superfície de exposição sem
necessidade. O Delfos recusa isso.

---

## Runtime futuro respeita tenant e auditoria — sem exceção

O runtime real, quando existir, não ganha dispensas. Ele herda integralmente a
governança da foundation:

- **`tenantId` é fronteira também na execução** (Princípio 3): todo execution request,
  todo command envelope e todo resultado são tenant-scoped. Não há execução
  "cross-tenant" nem execução sem tenant.
- **Toda execução é auditada** (Princípio 7): início, fim, falha, ator e definição de
  origem deixam rastro imutável.
- **Erros e metadados são sanitizados** antes de cruzar qualquer fronteira de log,
  resposta ou auditoria (adr-0020).
- **Estado é honesto** (Princípio 8): uma execução pendente é pendente, uma falha é
  falha; o runtime nunca finge sucesso.

---

## O que o Delfos recusa no runtime

- **Execução acoplada à definição.** Salvar uma definição jamais a executa. Não há
  "definição que se dispara sozinha".
- **Runtime distribuído prematuro.** Fila, worker pool, scheduler, cache de resultado e
  orquestração distribuída só entram quando o problema real os exigir (Princípio 12;
  adr-0007 — sem cache/Redis na fase 1). Antecipar essa complexidade é recusado.
- **Segredo fora de hora.** Credencial decifrada antes do momento de despacho, ou em
  camada que não a usa, é defeito de desenho — não otimização.
- **Execução sem rastro.** Runtime que executa sem auditar, ou que loga dado sensível,
  não é aceitável.
- **Execução sem tenant.** Nenhum command envelope, nenhum execution request, nenhum
  resultado existe fora de um `tenantId`.
- **Pular a foundation.** Construir despacho real antes de envelope, preview e contrato
  de segredo estarem prontos e testados viola o Princípio 1 — e não será feito.
- **Connector real sem ADR.** Connectors reais e despacho real são gated por adr-0015,
  adr-0021 e adr-0022; enquanto *Proposed*, descrevem intenção, não autorização.

---

## Estado atual e o que vem depois

Hoje o Delfos tem **foundation declarativa de runtime**: `runtime` modela e audita
execution requests sem executar; `execution-preview` valida execuções de forma
declarativa; `connections`, `credentials`, `datasets`, `field-mappings` e
`query-definitions` fornecem as referências que uma execução consumiria. Tudo isso
existe, é testado e é estável — e nada disso chama uma fonte de dados real.

> **Nota honesta:** além dos módulos acima, já existe código de foundation de
> bridge/resolver/adapter sob `src/modules/runtime/bridge/`. Esse código é
> **tests-only e não operacional**: classes puras, sem provider NestJS, sem
> registro no `RuntimeModule`, sem endpoint, sem dispatch e sem chamada externa.
> Ele está congelado nesse estado até a **ADR-0015** estar `Accepted`.

O que **ainda não existe** e é gated por escopo aprovado e ADR: command envelope real
(adr-0015), decifragem de credencial em execução (adr-0021), transporte de despacho de
connector (adr-0022), connectors reais e obtenção de resultado real. O caminho de
evolução está descrito no
[`connectors-roadmap.md`](../references/consolidated/connectors-roadmap.md); o roadmap
**descreve**, não autoriza.

---

## Relacionado

- [`./principles.md`](./principles.md) — keystone: os 12 princípios do Delfos
- [`./README.md`](./README.md) — índice da camada de filosofia de produto
- [`./embedded-analytics-philosophy.md`](./embedded-analytics-philosophy.md) — como o Delfos pensa analytics embarcado
- [`./semantic-layer-vision.md`](./semantic-layer-vision.md) — para onde vai a camada semântica
- [`./dashboard-philosophy.md`](./dashboard-philosophy.md) — dashboards e composição visual
- [`../references/consolidated/connectors-roadmap.md`](../references/consolidated/connectors-roadmap.md) — roadmap de connectors
- [`../references/consolidated/strategic-product-vision.md`](../references/consolidated/strategic-product-vision.md) — visão estratégica de produto
- [`../adr/adr-0014-runtime-execution-requests-foundation.md`](../adr/adr-0014-runtime-execution-requests-foundation.md) — foundation de execution requests
- [`../adr/adr-0015-runtime-connectors-command-envelope-bridge.md`](../adr/adr-0015-runtime-connectors-command-envelope-bridge.md) — command envelope bridge (Proposed)
- [`../adr/adr-0021-credential-decryption-in-future-execution.md`](../adr/adr-0021-credential-decryption-in-future-execution.md) — decifragem de credencial em execução (Proposed)
- [`../adr/adr-0022-connector-dispatch-transport.md`](../adr/adr-0022-connector-dispatch-transport.md) — transporte de despacho de connector (Proposed)
- [`../adr/adr-0007-no-cache-redis-phase-1.md`](../adr/adr-0007-no-cache-redis-phase-1.md) — sem cache/Redis na fase 1
- [`../adr/adr-0008-connectors-and-integration-execution.md`](../adr/adr-0008-connectors-and-integration-execution.md) — connectors e execução de integração
