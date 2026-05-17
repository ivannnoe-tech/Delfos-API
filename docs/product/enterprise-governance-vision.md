# Visão de Governança Enterprise do Delfos Analytics

> Tipo: visão de produto · Status: conceitual/futuro — não autoriza implementação

Este documento descreve **para onde vai a governança enterprise do Delfos**. Ele
deriva diretamente dos [princípios do Delfos](./principles.md) — em especial
*Segurança e privacidade por construção* (4), *Multi-tenancy é fronteira, não
filtro* (3), *Foundation antes de execução* (1), *Declarativo por padrão* (2) e
*Disciplina de fases* (6) — e os traduz num programa de governança coerente.

Visão não é roadmap autorizado. Os horizontes aqui descritos são **gated por
ADR**: a foundation atual já existe, o curto prazo declarativo é viável mas
ainda não implementado, e a Fase 2 depende de runtime real e de auth real (JWT)
— nada neste documento autoriza escrever código. O detalhamento operacional vive
em [`../references/consolidated/enterprise-governance-roadmap.md`](../references/consolidated/enterprise-governance-roadmap.md).

---

## A tese de governança do Delfos

A maioria das plataformas de BI trata governança como um pacote *enterprise*:
algo vendido à parte, ativado num plano caro, parafusado sobre um produto que
nasceu sem ela. O Delfos recusa esse modelo. Aqui, **governança é uma
propriedade do desenho, não uma camada adicionada depois** — e isso é uma
decisão de produto, não uma promessa de marketing.

Concretamente, isso significa:

- Governança não é uma *feature*. É a forma como os módulos são construídos:
  `tenantId` como fronteira, `credentialRef` como referência, metadados
  sanitizados na origem. Quando a governança falha, é o desenho que está errado.
- Governança não espera o runtime. A maior parte do que torna uma plataforma
  governável — ACL, certificação, versionamento, política de mascaramento — é
  **declarativa** e pode existir na foundation. O Delfos constrói essa parte
  primeiro (Princípio 1), e só *aplica* o que depende de execução depois.
- Governança é honesta. O Delfos não chama de "seguro" o que ainda não foi
  aplicado. Um contrato de RLS modelado não é RLS em produção; um modelo de RBAC
  não é RBAC com enforcement. O documento distingue os dois o tempo todo.

O que o Delfos **persegue**: isolamento impossível de burlar por omissão, ativos
com dono e procedência, trilha imutável de tudo que importa, IA sob as mesmas
regras que humanos.

O que o Delfos **recusa**: governança como upsell, segredo no control plane,
permissão implícita ("se não negou, pode"), auditoria editável, IA com bypass
de ACL, e antecipar enforcement de fase futura sem ADR.

---

## Horizontes

A governança evolui em três horizontes. A fronteira entre eles é a [disciplina
de fases](./principles.md) (Princípio 6): o que é declarativo entra cedo; o que
exige execução real é gated.

| Horizonte | O que é | Estado | Gate |
|---|---|---|---|
| H0 — Foundation atual | Invariantes e módulos declarativos já entregues | Implementado | — |
| H1 — Curto prazo declarativo | Governança de ativos, RBAC modelado, versionamento, contratos de RLS/CLS/masking | Conceitual — não implementado | ADR por item |
| H2 — Fase 2 (execução) | Enforcement em endpoints e em dados, IA como ator, observability | Futuro | `adr-0006`, `adr-0014`, `adr-0025` |

---

## Horizonte 0 — A foundation de governança que já existe

O Delfos não parte do zero. A Fase 1 entregou invariantes e módulos que já são,
em si, decisões de governança:

- **`tenantId` como fronteira de isolamento.** Toda query multi-tenant é
  tenant-scoped. O isolamento não é um filtro que alguém pode esquecer de
  aplicar — é estrutural (Princípio 3; `adr-0009`).
- **`credentialRef` nunca é o segredo; `connectionId` nunca é connection
  string.** O control plane manipula referências, não valores sensíveis
  (Princípio 4).
- **Auth administrativa temporária** via header `x-delfos-admin-key`
  (`adr-0016`). É explicitamente provisória — não é RBAC, não é login de usuário
  final, e o documento é honesto sobre isso (Princípio 8).
- **Auditoria segura** (`audit`, `adr-0018`) e **sanitização de metadados**
  (`core/utils/sanitize-metadata.ts`, `adr-0020`): nenhum log, erro ou export
  carrega forbidden fields.
- **Decisões de governança já registradas como ADR**: modelo de roles
  (`adr-0017`), criptografia e rotação de credenciais (`adr-0019`), política de
  mascaramento (`adr-0023`). Decidir não é implementar — mas deixa rastro
  (Princípio 7).

H0 é a prova de que governança nativa é possível: ela já está embutida nos
módulos `tenants`, `users`, `connections`, `credentials`, `audit` e `auth`.

---

## Horizonte 1 — Governança declarativa de curto prazo

Tudo neste horizonte é **declarativo**: metadados, contratos e definições
versionáveis. Alto valor, baixo custo, viável sem runtime. É conceitual e
gated por ADR — descrito aqui como visão, não como trabalho autorizado.

### Governança de ativos: dono e procedência

Datasets, query-definitions, dashboard-definitions e report-definitions deixam
de ser objetos anônimos. Cada ativo ganha **metadados de governança**: um dono
responsável, um selo de certificação ("fonte confiável") e tags pesquisáveis.
A pergunta "qual número eu uso?" passa a ter resposta — o número certificado,
com dono identificável. Quem pode certificar é definido pelo modelo de roles
(`adr-0017`). Inspiração reinterpretada de Superset (Princípio 10), não cópia.

### RBAC e modelo de roles/permissions

O Delfos modela o RBAC completo agora — papéis, permissões por recurso, herança
— operacionalizando `adr-0017`. Mas modelar **não é** aplicar: o enforcement em
endpoints para usuários finais depende de auth real (`adr-0006`, JWT) e é
H2. Esta distinção é deliberada e inegociável.

O modelo segue um princípio firme: **negação por padrão**. Uma permissão que não
foi concedida explicitamente não existe. O Delfos recusa o modelo permissivo em
que "o que não foi negado está liberado".

### Row-level e column-level security — dentro da fronteira `tenantId`

RLS e CLS são uma camada de granularidade **dentro** do tenant — nunca um
substituto da fronteira de isolamento. O `tenantId` separa clientes; RLS/CLS
separa o que cada papel vê *dentro* de um mesmo cliente (uma região, uma
unidade de negócio, um conjunto de colunas).

No H1 o Delfos declara o **contrato** de RLS/CLS: regras por papel e por tenant,
expressas como definição versionável (Princípio 2), derivadas de um security
context verificado — não escritas à mão em cada query. A *aplicação* dessas
regras à execução real de dados é H2 e exige runtime (`adr-0014`).

### Field-level masking de dados sensíveis

A política de mascaramento (`adr-0023`) é operacionalizada como **metadado**:
quais campos são sensíveis, para quais papéis são mascarados, e com qual
estratégia (parcial, hash, redação total). Isso vive junto a `field-mappings` e
`datasets`. Mais uma vez: definir a política é H1; mascarar resultados reais é
H2, porque depende de execução.

### Versionamento de definições

Toda definição — query, dashboard, report — passa a ter **histórico, diff e
rollback**, sem depender de git. Uma definição é dado declarativo (Princípio 2);
portanto pode ser versionada como dado. Isso habilita revisão, explicabilidade e
evolução segura, e alimenta a auditoria. Inspirado em Lightdash/Evidence/Wren,
reinterpretado.

### Sanitização de metadados consolidada

H1 reforça `adr-0020` como invariante transversal: nenhum log, erro, export ou
**trilha de auditoria** carrega forbidden fields. Sanitização não é configurável
— é inegociável (Princípio 4).

### Security context unificado

O objeto `{ tenant, actor, role }` — do qual o filtro de tenant e as regras de
RLS/CLS são *derivados* — é formalizado, estendendo o
`request-context.interceptor`. O isolamento deixa de depender de disciplina de
código e passa a ser derivado de um contexto verificado.

---

## Horizonte 2 — Governança em execução e IA (Fase 2, gated)

**Nada deste horizonte é autorizado.** Tudo depende de runtime real, auth real
ou IA — e cada item tem seu próprio gate de ADR.

| Capacidade | Depende de | Gate |
|---|---|---|
| RBAC com enforcement em endpoints | Auth real (JWT) | `adr-0006`, `adr-0017` |
| RLS/CLS aplicada a dados retornados | Runtime real | `adr-0014`, `adr-0017` |
| Mascaramento aplicado a resultados | Runtime real | `adr-0023`, `adr-0014` |
| IA como sujeito de ACL auditado | Assistente de IA | `adr-0025`, `adr-0017`, `adr-0018` |
| Observability e cost tracking | Runtime / IA | nova ADR (observability) |
| Auditoria de uso como insight | Runtime | `adr-0018` (extensão) |

### Enforcement: do modelo à aplicação

O RBAC modelado no H1 ganha dentes: as permissões passam a ser **verificadas em
cada endpoint** para usuários finais, e as regras de RLS/CLS e de mascaramento
são **injetadas na execução real** de query. O modelo declarativo do H1 é a
especificação; o H2 é a sua aplicação fiel. Não há atalho — sem `adr-0006` e
sem runtime, isso não existe.

### IA como sujeito de ACL — nunca como bypass

Quando o assistente de IA chegar (`adr-0025`), ele **não é uma exceção à
governança** — é um ator sob ela. A IA tem papel próprio, permissões próprias e
trilha de auditoria própria, exatamente como um usuário humano. Ela não vê o que
seu papel não pode ver; não executa o que seu papel não pode executar; toda
proposta sua é registrada e atribuível.

Isso é consequência direta do Princípio 5: a IA *propõe, explica e resume* —
nunca decide nem executa sozinha, e toda saída é fundamentada e auditável. Uma
IA que pudesse contornar RLS para "ser mais útil" seria recusada pelo desenho.

---

## Auditoria: registro imutável e, depois, insight

A auditoria do Delfos tem duas vidas.

A primeira é **registro imutável** (`adr-0018`). Toda ação sensível — mudança de
credencial, alteração de definição, concessão de permissão, certificação de
ativo — gera um evento *append-only*. A trilha não é editável e não é apagável;
decisões revogadas são supersedidas, nunca removidas (Princípio 7, espelhando a
disciplina de ADRs). Mudanças de definição entram no histórico versionado do H1.
A trilha é sempre sanitizada (`adr-0020`): nem a auditoria carrega segredos.

A segunda vida, no H2, é **insight**: agregar a trilha em métricas de adoção,
ativos mais usados, padrões de acesso. Mas esta vida é estritamente derivada da
primeira — não se constrói "analytics de uso" enfraquecendo a imutabilidade do
registro. A trilha é primeiro evidência, depois dado.

---

## Segredos: criptografia, rotação, referência nunca valor

A regra é absoluta e atravessa todos os horizontes: **o control plane do Delfos
nunca manipula o segredo, apenas a referência a ele.** `credentialRef` é uma
referência opaca; o valor cifrado vive sob a estratégia de criptografia e
rotação de `adr-0019`.

A decifração — necessária só quando houver execução real contra fontes de
clientes — é deliberadamente **gated por `adr-0021`** e acontece em plano
isolado, jamais no control plane administrativo. O Delfos prefere não ter o
segredo a tê-lo "para conveniência". Isso é o Princípio 4 levado a sério: a
ausência do segredo é um recurso de segurança, não uma limitação.

---

## Governança documental: ADRs como mecanismo, não cerimônia

A governança do *produto* é sustentada por uma governança da *documentação*.
Cada decisão de governança enterprise é registrada como um ADR imutável; cada
horizonte deste documento aponta para o gate de ADR que o destrava. Isso não é
burocracia — é o que torna a "honestidade de estado" (Princípio 8) verificável.

A própria existência da [biblioteca estratégica de referências](../references/README.md),
governada por `adr-0026`, é uma decisão de governança: o Delfos estuda dez
produtos de mercado e **reinterpreta** seus padrões (Princípio 10), sem copiar
código nem arquitetura. As ideias de NocoBase (ACL field-level), Superset
(certificação/ownership), Cube (security context), Wren/Lightdash (RLS,
versionamento) e Airbyte (timeline imutável) entraram no Delfos como conceitos
absorvidos — não como dependências.

O Delfos também recusa, por governança documental, a inflação de progresso: este
documento é marcado como conceitual/futuro porque é exatamente isso. Visão não
vira implementação por vontade — vira por ADR.

---

## O que esta visão não promete

Para encerrar com honestidade de estado (Princípio 8), o que esta visão
**explicitamente não promete** hoje:

- Não promete auth real, login ou OAuth. Auth atual é o header
  `x-delfos-admin-key` (`adr-0016`); JWT é futuro (`adr-0006`).
- Não promete RBAC com enforcement, RLS/CLS aplicada a dados ou mascaramento de
  resultados — tudo isso é H2, gated por runtime e auth reais.
- Não promete um assistente de IA com permissões — isso depende de `adr-0025`.
- Não promete cache, fila, worker ou scheduler para sustentar governança em
  escala: complexidade entra quando o problema a exige (Princípio 12), não antes.

O que esta visão **garante** é a direção: governança nativa, declarativa
primeiro, aplicada depois, sempre com rastro — e nunca vendida como um extra.

---

## Relacionado

- [`./principles.md`](./principles.md) — os 12 princípios que esta visão deriva
- [`./README.md`](./README.md) — índice da camada de filosofia de produto
- [`./ai-philosophy.md`](./ai-philosophy.md) — IA assistiva, fundamentada e auditável
- [`./semantic-layer-vision.md`](./semantic-layer-vision.md) — definições e camada semântica
- [`./runtime-philosophy.md`](./runtime-philosophy.md) — execução futura e seus limites
- [`./embedded-analytics-philosophy.md`](./embedded-analytics-philosophy.md) — governança em cenários white-label
- [`../references/consolidated/enterprise-governance-roadmap.md`](../references/consolidated/enterprise-governance-roadmap.md) — roadmap operacional consolidado
- [`../references/maturity-taxonomy.md`](../references/maturity-taxonomy.md) — taxonomia de maturidade
- [`../adr/adr-0006-jwt-self-managed-auth.md`](../adr/adr-0006-jwt-self-managed-auth.md) — auth real (futuro)
- [`../adr/adr-0009-deployment-isolation-and-tenant-model.md`](../adr/adr-0009-deployment-isolation-and-tenant-model.md) — isolamento e modelo de tenant
- [`../adr/adr-0016-temporary-admin-key-auth.md`](../adr/adr-0016-temporary-admin-key-auth.md) — auth administrativa temporária
- [`../adr/adr-0017-roles-and-permissions-model.md`](../adr/adr-0017-roles-and-permissions-model.md) — modelo de roles e permissões
- [`../adr/adr-0018-secure-audit-strategy.md`](../adr/adr-0018-secure-audit-strategy.md) — estratégia de auditoria segura
- [`../adr/adr-0019-credential-encryption-and-rotation.md`](../adr/adr-0019-credential-encryption-and-rotation.md) — criptografia e rotação de credenciais
- [`../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md`](../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md) — sanitização de metadados
- [`../adr/adr-0021-credential-decryption-in-future-execution.md`](../adr/adr-0021-credential-decryption-in-future-execution.md) — decifração de credenciais (futuro)
- [`../adr/adr-0023-data-masking-policy.md`](../adr/adr-0023-data-masking-policy.md) — política de mascaramento de dados
- [`../adr/adr-0025-llm-assisted-analytics-text-generation.md`](../adr/adr-0025-llm-assisted-analytics-text-generation.md) — IA assistiva (futuro)
- [`../adr/adr-0026-strategic-reference-library.md`](../adr/adr-0026-strategic-reference-library.md) — governança da biblioteca de referências
