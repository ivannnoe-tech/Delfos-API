# Filosofia de Dashboards — Delfos Analytics

> Tipo: filosofia de produto · Status: princípios orientadores — não autoriza implementação

Este documento declara **como o Delfos pensa dashboards e composição visual**. Ele
deriva de [`principles.md`](./principles.md) — em especial dos princípios
*Declarativo por padrão* (2), *Multi-tenancy é fronteira* (3), *Foundation antes de
execução* (1) e *Disciplina de fases* (6) — e não pode contradizê-los. A regra
canônica aqui é a [ADR-0011](../adr/adr-0011-dashboard-builder-and-widget-model.md);
onde este documento e a ADR divergirem, a ADR prevalece.

Um dashboard, no Delfos, não é uma tela. É uma **definição** — um dado versionável,
inspecionável e validável. Essa frase é a tese do documento inteiro.

---

## Postura

O mercado de BI ensina um vício comum: o dashboard como artefato imperativo, montado
no editor, acoplado à sua fonte de dados, difícil de versionar e de auditar. O Delfos
recusa esse modelo.

No Delfos, o dashboard é configuração declarativa armazenada por
`dashboard-definitions`. Ele pode ser comparado por *diff*, revisado, explicado,
revertido e reaproveitado entre tenants — porque é dado, não código. A composição
visual segue a mesma lógica do resto da plataforma: *Declarativo por padrão*
(princípio 2) aplicado à camada que o usuário mais vê.

---

## Os pilares

### 1. Dashboard como definição declarativa

Um `dashboard-definition` organiza **seções, filtros globais, widgets, layout, tags e
metadados seguros**. Ele descreve uma experiência analítica — não a executa.

O dashboard **não conhece banco nem API externa**. Não carrega dado operacional, não
guarda credencial, não embute SQL, não referencia connection string. Essa é a regra
de ouro da ADR-0011, e ela existe para que a definição seja segura de versionar, de
auditar e de mover entre ambientes sem arrastar segredo junto (princípio 4).

Ser declarativo habilita o que importa: versionamento com `diff` e `rollback`,
validação de integridade quando um `dataset` referenciado muda, e auditoria de toda
alteração via o módulo `audit` — sempre sem gravar payload sensível.

### 2. Widget como unidade composável

O widget é o átomo do dashboard. É uma unidade visual configurável — `metric_card`,
`chart`, `table`, `ranking`, `text`, `filter`, `custom` — e nada além disso.

O encadeamento conceitual aprovado é inquebrável:

```text
dashboardDefinition
  -> sections
  -> filtros globais
  -> widgets
      -> queryDefinition
          -> dataset
              -> connection
              -> credentials por credentialRef
              -> field-mappings
```

Disso decorrem invariantes que o Delfos não negocia:

- O widget **não acessa banco, API externa, credencial, conector ou dado bruto**.
- Todo widget que depende de dados **referencia uma `queryDefinition` por id** —
  nunca embute a query.
- A `queryDefinition` consome um `dataset`; o `dataset` é o contrato semântico.
- O `chartSpec` de um widget vai para o `chart_renderer` (ADR-0003) — nunca para
  `fl_chart` ou `graphic` direto.

Um widget é, portanto, composável de verdade: pode ser movido, duplicado, instanciado
em outro dashboard, e continua funcionando porque depende apenas de referências
governadas, não de acoplamento físico.

### 3. Filtros como configuração explícita

Filtro, no Delfos, **não é estado efêmero de UI** — é uma entidade de configuração
dentro do `dashboard-definition`. Cada filtro global declara `name`, `type`,
`defaultValue` e os widgets que afeta.

Filtros globais alimentam `query-definitions` compatíveis por **correspondência
declarada de campo, operador, tipo e escopo** — idealmente por auto-vínculo de
convenção de nome (um filtro `region` alimenta toda variável `region`). Filtros são
desacoplados dos widgets: o filtro publica critérios, os widgets compatíveis
consomem.

Filtros são governados como o resto: respeitam tenant scope, respeitam os contratos
de sanitização, e **nunca armazenam** token, senha, header sensível, connection
string ou permitem injeção de SQL/URL/body livre.

### 4. Drill-down e exploração governados

O Delfos quer exploração rica, mas **exploração governada** — não improviso por
widget. Drill-down e cross-filter seguem caminhos **declarados no modelo**, não
comportamento ad hoc inventado por cada componente.

O `clickBehavior` de um widget é declarativo e versionado junto dele:

| Modo | Efeito | Horizonte |
|---|---|---|
| `none` | Sem ação | Contrato (foundation) |
| `cross-filter` | Emite valor como filtro global | Contrato agora, propagação real é Fase 2 |
| `drill-down` | Troca dimension / abre granularidade | Contrato declarativo |
| `navigate` | Vai para outro dashboard/rota parametrizada | Fase 2+ |
| `url` | Abre URL externa validada | Fase 2+ |

Na foundation, apenas o **contrato** do cross-filter e do drill existe. A propagação
real de estado e o drill-through que re-executa query dependem de runtime e são
*gated* por ADR (ADR-0014, ADR-0024). Toda exploração, em qualquer fase, permanece
**dentro do `tenantId`** — multi-tenancy é fronteira, não filtro (princípio 3).

### 5. Templates reutilizáveis

Um `dashboard-definition` marcado como `template` é parametrizável. Instanciá-lo num
tenant gera uma definição concreta com `tenantId` preenchido e referências
resolvidas. É assim que o Delfos acelera onboarding sem builder manual e sem
duplicar trabalho — e é só possível porque o dashboard é dado declarativo.

O template respeita a fronteira de isolamento como tudo o mais: ele é um molde, e
cada instância é integralmente escopada ao seu tenant.

### 6. Definição separada de runtime de execução

O Delfos separa formalmente **a definição do dashboard** da **execução que produz
seus números**. A definição existe e é estável hoje; a execução real é Fase 2.

Na foundation, o que preenche um widget é o `execution-preview` — e ele é **demo**.
A interface declara `mode: "demo"` (ou equivalente explícito) sem ambiguidade; o
Delfos nunca finge que preview demonstrativo é dado real, nem usa nomes ou valores
reais de clientes em exemplos (princípio 8, *Honestidade de estado*).

A execução real futura será orquestrada pelo `delfos-api` — que continua sendo a
fronteira de contrato, validação, tenant scope, autorização e auditoria — e executada
pelo `delfos-connectors` ou mecanismo equivalente aprovado. A virtude do desenho: a
relação `widget -> queryDefinition -> dataset` não muda quando o runtime entra.
Snapshots, cache ou staging futuros podem trocar a origem física do resultado sem
alterar a semântica do widget.

---

## O que o Delfos recusa

- **Dashboards imperativos.** Dashboard que é código, efeito colateral ou tela
  montada à mão, impossível de versionar e auditar. O dashboard é definição.
- **Widgets acoplados à fonte.** Widget que abre conexão, embute SQL, guarda
  credencial, fala com API externa ou conhece banco. O widget consome
  `queryDefinition` — e nada mais.
- **Query embutida no widget.** Widget que carrega a query inteira em vez de
  referenciá-la por id. Mata reuso, *diff* e explainability.
- **Filtro como estado de UI escondido.** Filtro que vive só na tela, sem ser
  configuração inspecionável do `dashboard-definition`.
- **Filtro com segredo ou injeção.** Filtro que armazena token, header sensível ou
  connection string, ou que permite SQL/URL/body livre.
- **Exploração improvisada por widget.** Cross-filter e drill inventados por cada
  componente, sem caminho declarado — anti-padrão observado no estudo de mercado.
- **Builder como fim em si.** Editor visual sofisticado que vira o produto. O
  builder existe para produzir boas definições declarativas; ele é meio, não fim.
- **Builder que libera texto livre.** Query builder que expõe SQL/URL/header crus.
  Builder produz `query-definition` declarativa por seleção — sempre.
- **Renderização ou cross-filter real antecipados.** Prometer na foundation o que só
  a Fase 2 sustenta. Contrato declarativo agora; execução real só com ADR (princípio
  6, *Disciplina de fases*).

---

## Relação com o roadmap

O [`dashboard-builder-roadmap.md`](../references/consolidated/dashboard-builder-roadmap.md)
organiza a evolução em ondas: contrato de widget e filtro global e versionamento de
definições são foundation declarativa (Onda 1); query builder visual e explainability
são builder e preview (Onda 2); cross-filtering com estado real, drill-through
executável e renderização real são Fase 2+ (Onda 3), *gated* por ADR-0024.

A ADR-0011 é a regra canônica do modelo de dashboard e widget. Este documento explica
*por que* o modelo é assim; a ADR define *o que* ele é. Nenhuma melhoria de
composição visual justifica romper o encadeamento
`dashboard -> widget -> queryDefinition -> dataset`.

---

## Como usar esta filosofia

- Em **decisão sobre dashboards, widgets ou filtros**: verifique se a proposta honra
  os seis pilares, não cai em nenhuma recusa e respeita a ADR-0011. Se cair, ou a
  proposta muda ou esta filosofia precisa de revisão formal.
- Em **revisão de PR**: query embutida, widget acoplado à fonte, filtro com segredo e
  exploração improvisada são motivos legítimos de feedback.
- Para **AI agents**: trate esta filosofia como a intenção do produto. Ela filtra
  propostas que contrariam o Delfos, mas não autoriza implementação — dashboard
  builder, query builder e execução real exigem escopo aprovado e respeitam a
  disciplina de fases.

---

## Relacionado

- [`principles.md`](./principles.md) — os 12 princípios que regem todo o resto
- [`README.md`](./README.md) — índice da camada de filosofia de produto
- [`ux-philosophy.md`](./ux-philosophy.md) — experiência do usuário
- [`runtime-philosophy.md`](./runtime-philosophy.md) — execução e runtime
- [`semantic-layer-vision.md`](./semantic-layer-vision.md) — camada semântica que alimenta widgets
- [`../references/consolidated/dashboard-builder-roadmap.md`](../references/consolidated/dashboard-builder-roadmap.md) — roadmap de dashboard/query builder
- [`../references/consolidated/premium-ux-roadmap.md`](../references/consolidated/premium-ux-roadmap.md) — roadmap consolidado de UX premium
- [`../references/README.md`](../references/README.md) — biblioteca estratégica de referências
- [`../adr/adr-0011-dashboard-builder-and-widget-model.md`](../adr/adr-0011-dashboard-builder-and-widget-model.md) — modelo de dashboard builder e widget
- [`../adr/adr-0003-chart-renderer-abstraction.md`](../adr/adr-0003-chart-renderer-abstraction.md) — abstração do chart renderer
- [`../adr/adr-0014-runtime-execution-requests-foundation.md`](../adr/adr-0014-runtime-execution-requests-foundation.md) — foundation de requisições de execução
- [`../adr/adr-0024-phase-1-and-phase-2-definition.md`](../adr/adr-0024-phase-1-and-phase-2-definition.md) — definição de Fase 1 e Fase 2
