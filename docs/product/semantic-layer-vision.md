# Visão da Camada Semântica do Delfos Analytics

> Tipo: visão de produto · Status: conceitual/futuro — não autoriza implementação

Este documento descreve **para onde vai a camada semântica do Delfos** — a maior aposta
arquitetural do produto. Tudo aqui é **conceitual/futuro**. O Delfos hoje possui apenas
as fundações declarativas — `datasets`, `field-mappings`, `query-definitions` — sem uma
camada semântica unificada e sem runtime de agregação. Nenhuma capacidade descrita
abaixo está autorizada: cada uma exige escopo aprovado e **ADR nova** antes de qualquer
implementação ([Princípio 6 — Disciplina de fases](./principles.md)).

Esta é uma visão. É honesta sobre não ser realidade.

---

## A aposta: significado de negócio é um contrato, não um detalhe de query

A maioria das ferramentas de BI deixa o significado de uma métrica espalhado: cada
dashboard, cada query, cada relatório recalcula "receita líquida" do seu jeito. O
resultado é o problema mais caro de analytics — **dois números que deveriam ser iguais
não são**, e ninguém sabe qual está certo.

A camada semântica do Delfos existe para eliminar essa classe de erro. A aposta é
direta: **definir o significado de negócio uma única vez, de forma declarativa,
versionada e reutilizável** — e fazer todo consumo derivar dessa definição, nunca
reinventá-la.

Por que esta é *a* maior aposta arquitetural, e não apenas mais um módulo:

- Ela é o que diferencia o Delfos de um gerador de gráficos. Sem semântica
  compartilhada, o produto é apenas tubulação entre fonte e tela.
- Ela é a base que torna a IA do Delfos viável e fundamentada
  ([`ai-philosophy.md`](./ai-philosophy.md)): a IA raciocina sobre a semântica curada,
  não sobre schema cru.
- Ela é a aplicação máxima do [Princípio 2 — Declarativo por padrão](./principles.md):
  o significado de negócio vira dado versionável, diffável e revisável.

---

## Measures e dimensions reutilizáveis

A unidade da camada semântica não é a query — é o **conceito de negócio**:

- **Measure** — uma quantidade agregável com significado de negócio estável: "receita
  líquida", "ticket médio", "churn mensal". Definida uma vez, com a sua regra de
  agregação explícita.
- **Dimension** — um eixo de análise estável: "região", "categoria de produto",
  "coorte de cliente".

Uma vez definidos, measures e dimensions são **consumidos por N artefatos** —
`query-definitions`, dashboards, relatórios — sem redefinição. Mudou a regra de
"receita líquida"? Muda-se em um lugar; todo consumo herda. Isso é o oposto de copiar
fórmula entre telas.

---

## Significado estável sobre `field-mappings` e `datasets`

A camada semântica não substitui as fundações atuais — ela se **apoia** nelas e as
completa. A separação de responsabilidades proposta tem quatro níveis:

| Camada | Responsabilidade | Estado |
|---|---|---|
| `connections` | Referência de configuração da fonte (nunca connection string) | Foundation atual |
| `datasets` | Descrição curada da fonte — o contrato bruto | Foundation atual |
| `field-mappings` | Tradução entre campo físico e campo de negócio | Foundation atual |
| **Camada semântica** | Measures/dimensions com significado de negócio estável | **Visão futura** |

`field-mappings` resolve *"este campo físico chama-se assim no negócio"*. A camada
semântica resolve a pergunta seguinte, mais difícil: *"este conceito de negócio
significa exatamente isto, com esta regra, e é o mesmo em todo lugar"*. Uma é tradução
de nome; a outra é contrato de significado.

---

## Métricas versionadas e consistentes

Uma definição de measure é um **artefato versionado**, não uma string mutável perdida
numa query. Isso habilita, coerente com o [Princípio 7 — Decisões deixam rastro](./principles.md):

- **Histórico** — saber quando e por que a definição de uma métrica mudou.
- **Diff** — revisar a mudança de uma métrica como se revisa código.
- **Rollback** — reverter uma definição equivocada sem caça manual em dashboards.
- **Consistência garantida** — todo consumo da métrica usa a mesma versão vigente.

Uma métrica sem versão é uma métrica em que não se pode confiar ao longo do tempo. O
Delfos recusa esse modelo.

---

## Separação entre definição e consumo

O princípio estrutural da camada semântica é uma fronteira rígida:

- **Definição** — *o que* um conceito de negócio significa. Curada, versionada,
  governada. Vive na camada semântica.
- **Consumo** — *como* um conceito é usado num contexto: uma `query-definition` que
  seleciona measures e dimensions, um dashboard que os exibe.

O consumo **referencia** a definição; nunca a duplica nem a redefine. Uma
`query-definition` futura deixa de carregar fórmulas embutidas e passa a ser uma
**composição declarativa** de measures e dimensions semânticas — *"esta query usa a
measure X, a dimension Y, com este recorte"*. A definição permanece única; o consumo é
plural.

Essa separação é o que torna possível mudar significado sem caçar consumidores, e
auditar consumidores sem reabrir significado.

---

## Security context que deriva `tenantId`

Coerente com o [Princípio 3 — Multi-tenancy é fronteira, não filtro](./principles.md),
a camada semântica trata o isolamento como propriedade derivada, não como parâmetro:

- O `tenantId` é **derivado automaticamente** do contexto de execução — nunca passado
  manualmente como argumento de query.
- Toda resolução de measure/dimension é tenant-scoped por construção; não há caminho em
  que uma definição de um tenant alcance dados de outro.
- O *security context* é parte do contrato da camada, não um filtro aplicado depois.

O Delfos recusa, por desenho, qualquer modelo em que esquecer um filtro vaze dados
entre tenants. Na camada semântica, o isolamento não é uma coisa que se faz — é uma
coisa que já está feita.

---

## Relação com `query-definitions` e com o runtime

Hoje, `query-definitions` é uma foundation declarativa: a estrutura de uma consulta,
sem execução real ([`runtime-philosophy.md`](./runtime-philosophy.md)). A visão futura
não a descarta — ela a **eleva**:

- `query-definitions` deixa de descrever colunas e fórmulas cruas e passa a compor
  measures/dimensions semânticas.
- O runtime futuro, quando autorizado, executa contra a camada semântica — recebe a
  definição semântica resolvida e tenant-scoped, não SQL concatenado
  ([Princípio 4](./principles.md): nunca construir requisições por concatenação).
- A camada semântica torna-se o ponto único onde significado, segurança e versão
  convergem antes de qualquer execução.

A ordem de construção é inegociável: **a semântica declarativa vem antes da execução
que a consome** ([Princípio 1](./principles.md)).

---

## Horizonte de evolução

Da foundation atual ao destino, em ondas conceituais — cada uma *gated* por ADR:

| Onda | Conteúdo | Estado |
|---|---|---|
| 0 | `datasets`, `field-mappings`, `query-definitions` declarativos | Foundation atual |
| 1 | Modelo declarativo de measures/dimensions; catálogo navegável | Visão — exige ADR |
| 2 | Versionamento e diff de definições de métrica | Visão — exige ADR |
| 3 | `query-definitions` como composição semântica; security context derivado | Visão — exige ADR |
| 4 | Runtime executando contra a camada semântica resolvida | Visão — exige ADR e Fase 2 |

O detalhamento conceitual desta evolução — sintetizando os modelos de Cube, Lightdash,
WrenAI e Superset e adaptando-os à realidade do Delfos — vive no
[`semantic-layer-roadmap.md`](../references/consolidated/semantic-layer-roadmap.md).

Este documento é uma visão; o roadmap é o seu detalhamento. Nenhum dos dois autoriza
implementação. A camada semântica do Delfos será construída quando sua foundation
existir, for testada e estiver estável — e nem um passo antes.

---

## Relacionado

- [`principles.md`](./principles.md) — keystone; Princípios 1, 2, 3, 6 e 7 sustentam esta visão
- [`README.md`](./README.md) — índice da camada de filosofia de produto
- [`ai-philosophy.md`](./ai-philosophy.md) — a IA do Delfos é fundamentada nesta camada
- [`runtime-philosophy.md`](./runtime-philosophy.md) — execução futura que consome a semântica
- [`dashboard-philosophy.md`](./dashboard-philosophy.md) — dashboards como consumidores da semântica
- [`enterprise-governance-vision.md`](./enterprise-governance-vision.md) — governança sobre definições semânticas
- [`../references/consolidated/semantic-layer-roadmap.md`](../references/consolidated/semantic-layer-roadmap.md) — roadmap consolidado da camada semântica
- [`../references/consolidated/strategic-product-vision.md`](../references/consolidated/strategic-product-vision.md) — visão estratégica do produto
- [`../adr/adr-0024-phase-1-and-phase-2-definition.md`](../adr/adr-0024-phase-1-and-phase-2-definition.md) — definição de fases
- [`../adr/adr-0014-runtime-execution-requests-foundation.md`](../adr/adr-0014-runtime-execution-requests-foundation.md) · [`../adr/adr-0007-no-cache-redis-phase-1.md`](../adr/adr-0007-no-cache-redis-phase-1.md)
