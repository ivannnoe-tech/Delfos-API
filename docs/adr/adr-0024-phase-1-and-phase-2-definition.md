# ADR-0024 — Definição formal de Fase 1 e Fase 2

- **Status**: Accepted
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: ambas
- **Implementação**: implementado

---

## Contexto

Praticamente toda a documentação e todas as ADRs do Delfos Analytics referenciam
"Fase 1" e "Fase 2": ADRs marcam **Fase impactada**, `docs/phase-1-scope.md` e
`docs/phase-2-vision.md` detalham escopo e visão, e `docs/out-of-scope.md`
delimita o que fica de fora. Porém **nenhuma ADR define formalmente o modelo de
fases**. Os termos são usados como referência implícita e compartilhada, sem um
ponto canônico de decisão.

Isso cria risco de interpretação: sem uma definição formal, decisões de escopo
podem divergir sobre o que é "Fase 1", sobre o que separa a Fase 1 da Fase 2 e
sobre quais são os critérios objetivos de transição.

O estado atual do projeto é **foundation administrativa/declarativa**: o
`delfos-api` expõe contratos administrativos, catálogos declarativos,
referências seguras de credenciais, auditoria, dry-run de readiness e
demo-execute fictício; não há conector real, dispatch, execução real de query,
cache, fila ou scheduler. Era necessário registrar formalmente esse modelo de
fases como referência canônica de escopo.

## Decisão

Adotamos a definição formal abaixo como **referência canônica** do modelo de
fases do Delfos Analytics. Os documentos `docs/phase-1-scope.md` e
`docs/phase-2-vision.md` permanecem como **companheiros detalhados** desta ADR.

### Fase 1 — foundation declarativa/administrativa

A Fase 1 é a foundation que **descreve, cataloga e governa** sem executar:

- armazena configuração e catálogos: tenants, users, connections, datasets,
  field-mappings, query/dashboard/report definitions;
- mantém **referências seguras** de credenciais (`credentialRef`), sem expor
  segredo;
- mantém definições declarativas de query, dashboard e relatório;
- registra auditoria segura, metadata-only;
- oferece **readiness via dry-run** sobre contratos declarativos já
  persistidos;
- oferece **demo-execute** com dados fictícios em memória;
- usa **autenticação temporária** por `x-delfos-admin-key` (ADR-0016).

A Fase 1 **explicitamente não** executa connectors reais, **não** tem execução
real de query, **não** tem JWT, e **não** tem cache, fila, worker ou scheduler.

### Fase 2 — preparação e habilitação da execução real

A Fase 2 **prepara e habilita** a execução real:

- autenticação real via JWT (ADR-0006), substituindo a admin-key;
- connectors reais e dispatch para o `delfos-connectors`;
- fluxo de descriptografia de credenciais (sob a fronteira da ADR-0021);
- adapters reais de fonte de dados;
- possivelmente cache e/ou storage, mediante ADR de promoção próprios.

### Tabela — permitido vs. proibido por fase

| Capacidade | Fase 1 | Fase 2 |
|---|---|---|
| Contratos administrativos / catálogos declarativos | Permitido | Permitido |
| Referências de credenciais (`credentialRef`) | Permitido | Permitido |
| Auditoria metadata-only | Permitido | Permitido |
| Dry-run de readiness declarativa | Permitido | Permitido |
| Demo-execute com dados fictícios | Permitido | Permitido |
| Auth temporária por admin-key (ADR-0016) | Permitido | Substituída por JWT |
| Auth real JWT (ADR-0006) | Proibido | Permitido |
| Connectors reais e dispatch | Proibido | Permitido (após ADRs bloqueantes) |
| Descriptografia real de credenciais | Proibido | Permitido (sob ADR-0021) |
| Execução real de query / acesso a fonte de cliente | Proibido | Permitido (após ADRs bloqueantes) |
| Cache, fila, worker, scheduler | Proibido | Mediante ADR de promoção |

### Critérios de entrada e saída

A **saída da Fase 1 / entrada da Fase 2** exige, no mínimo:

- que as **ADRs bloqueantes** estejam `Accepted`:
  - ADR-0021 — fronteira de descriptografia de credenciais;
  - ADR-0022 — transporte de dispatch para connectors;
- **revisão de segurança** (threat model) concluída;
- validação comercial e técnica da Fase 1, conforme `docs/phase-2-vision.md`.

Enquanto esses critérios não forem atendidos, nenhuma capacidade marcada como
"Fase 2" deve ser implementada.

Por decisão humana de 2026-05-15, **ADR-0021 e ADR-0022 permanecem `Proposed`
deliberadamente** e constituem o **gate formal de entrada da Fase 2**. Elas
**deixam de ser pendências da Fase 1**: a Fase 1 está completa sem promovê-las.
A promoção, revisão ou substituição dessas ADRs é decisão humana explícita,
tomada no início da Fase 2. Nenhum agente pode alterar o status delas.

## Alternativas consideradas

- **Manter o modelo de fases apenas em `phase-1-scope.md` e
  `phase-2-vision.md`** — rejeitada: esses documentos detalham escopo e visão,
  mas não constituem uma decisão arquitetural canônica; ADRs precisam de um
  ponto formal para referenciar.
- **Não formalizar fases e decidir escopo caso a caso** — rejeitada: sem
  definição formal, decisões de escopo divergem e o limite entre fases fica
  ambíguo.
- **Definir mais de duas fases (Fase 1, 1.5, 2, 3...)** — rejeitada nesta etapa:
  granularidade adicional não traz clareza enquanto a Fase 2 sequer começou;
  subdivisões podem ser criadas por ADR futura quando houver necessidade real.
- **Tratar a foundation como parte da Fase 2** — rejeitada: a foundation já está
  implementada e em validação; ignorá-la como fase própria contradiz o estado
  atual do projeto.

## Consequências

### Positivas

- Cria um ponto canônico e formal para o modelo de fases que todas as ADRs já
  referenciam.
- Elimina ambiguidade sobre o que é Fase 1, o que é Fase 2 e o que separa as
  duas.
- Define critérios objetivos de transição, incluindo as ADRs bloqueantes.
- Reforça que a foundation atual não autoriza execução real por interpretação.

### Negativas / trade-offs aceitos

- A definição precisa ser mantida em sincronia com `phase-1-scope.md` e
  `phase-2-vision.md`; divergências entre os documentos precisam ser
  reconciliadas.
- Um modelo de duas fases pode ficar apertado se a Fase 2 crescer muito; nesse
  caso, uma ADR futura poderá subdividir.

### Neutras

- Esta ADR não altera contratos, schemas, DTOs ou comportamento da API.
- Esta ADR não cria, remove ou modifica módulos.
- Esta ADR consolida decisões já existentes; não introduz nova capacidade.

## Escopo atual

- Formalizar as definições de Fase 1 e Fase 2 como referência canônica.
- Registrar a tabela de permitido vs. proibido por fase.
- Registrar os critérios de entrada/saída, incluindo as ADRs bloqueantes
  (ADR-0021 e ADR-0022) e a revisão de segurança.

## Fora de escopo

Esta ADR não autoriza nem implementa:

- qualquer capacidade marcada como Fase 2;
- conector real, dispatch, execução real ou descriptografia de credenciais;
- JWT real, cache, fila, worker ou scheduler;
- alteração de `phase-1-scope.md`, `phase-2-vision.md` ou `out-of-scope.md`;
- alteração de contratos, schemas ou código.

## Impacto na Fase 1

- O modelo de fases passa a ter um ponto canônico de referência para decisões
  de escopo.
- Toda nova ADR pode citar esta ADR ao declarar **Fase impactada**.
- Reforça que a foundation atual permanece declarativa/administrativa e que
  nada nesta ADR autoriza execução real.

## Impacto futuro / Fase 2

- A transição para a Fase 2 fica condicionada aos critérios aqui registrados:
  ADR-0021 e ADR-0022 `Accepted` e revisão de segurança concluída.
- A ADR serve de checklist de governança para avaliar quando a Fase 2 pode
  começar.
- Caso a Fase 2 cresça além do previsto, uma ADR futura poderá subdividir o
  modelo de fases.

## Relação com outros documentos

- ADR-0001 → supersedida pela ADR-0032 — define a fonte de dados conceitual da Fase 1 (APIs custom de
  clientes); esta ADR formaliza a fase em que essa decisão se enquadra.
- ADR-0006 — define a auth real via JWT, uma capacidade de Fase 2.
- ADR-0008 — define o `delfos-connectors` como executor futuro; sua execução
  real pertence à Fase 2.
- ADR-0014 — define o `runtime/execution-requests` como foundation
  administrativa da Fase 1.
- ADR-0021 — fronteira de descriptografia de credenciais; ADR bloqueante para a
  entrada na Fase 2.
- ADR-0022 — transporte de dispatch para connectors; ADR bloqueante para a
  entrada na Fase 2.
- `docs/phase-1-scope.md` — companheiro detalhado do escopo da Fase 1.
- `docs/phase-2-vision.md` — companheiro detalhado da visão da Fase 2.
- `docs/out-of-scope.md` — limites normativos do que fica fora da Fase 1.
