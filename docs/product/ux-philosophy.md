# Filosofia de UX — Delfos Analytics

> Tipo: filosofia de produto · Status: princípios orientadores — não autoriza implementação

Este documento declara **como o Delfos pensa experiência do usuário**. Ele deriva
diretamente de [`principles.md`](./principles.md) — em especial dos princípios
*Declarativo por padrão* (2), *Honestidade de estado* (8), *Inspiração sem
imitação* (10) e *Simplicidade primeiro* (12) — e não pode contradizê-los. Quando
este documento e uma regra canônica (`AGENTS.md`, ADR, regras invioláveis do
`delfos-web`) divergirem, a regra canônica prevalece.

UX, no Delfos, não é camada de acabamento. É a forma como a foundation declarativa
se torna compreensível para uma pessoa. Um modelo de dados correto exibido de forma
confusa é, na prática, um produto incorreto.

---

## Postura

O Delfos é uma plataforma de BI/analytics multi-tenant white-label. Seu usuário não
quer admirar a interface — quer **tomar decisões com confiança**. Toda escolha de UX
serve a isso: reduzir a distância entre uma pergunta de negócio e uma resposta na
qual a pessoa confia o suficiente para agir.

Disso decorre uma postura firme: o Delfos prefere uma tela honesta e legível a uma
tela impressionante e ambígua. Beleza é consequência de clareza, nunca substituto.

---

## Os pilares da UX do Delfos

### 1. Clareza acima de densidade

Cada tela carrega o mínimo de informação necessária para a decisão em foco. Densidade
existe quando ela ajuda a comparar e a entender — não para parecer poderosa. Uma
tabela com quarenta colunas que ninguém lê não é "rica": é ruído que esconde o sinal.

O critério é sempre: *esta informação muda a decisão de quem olha?* Se não, ela sai
da tela principal ou vai para um nível de detalhe. Simplicidade primeiro (princípio
12); complexidade só quando o caso a merece.

### 2. Estados são cidadãos de primeira classe

Toda tela de dados do Delfos trata explicitamente quatro estados, e eles são parte do
design — não exceções improvisadas:

| Estado | O que comunica | Componente |
|---|---|---|
| Loading | "Estou buscando, aguarde" — com forma, não congelamento | `DelfosLoadingState` |
| Empty | "Não há dados aqui" — e por quê, e o que fazer | `DelfosEmptyState` |
| Error | "Algo falhou" — de forma honesta e acionável, sem stack trace | `DelfosErrorState` |
| Permission | "Você não tem acesso" — sem fingir que o recurso não existe | `DelfosPermissionState` |

Esses quatro estados são **obrigatórios** em qualquer tela que apresente dados, e a
sua presença é verificada em revisão de PR. Um estado de erro engolido, um spinner
infinito ou uma tela vazia sem explicação são defeitos de produto, não detalhes
estéticos. Isso é *Honestidade de estado* (princípio 8) traduzida em interface: a tela
nunca esconde o que está acontecendo de verdade.

### 3. Consistência via Design System e tokens

A coerência visual e comportamental do Delfos não depende de disciplina individual —
ela é estrutural. As regras invioláveis do `delfos-web` garantem isso:

- **Cores só via `lib/core/theme/tokens.dart`.** Nenhuma cor hardcoded. Tema é
  contrato, não improviso.
- **UI base só de `lib/shared/widgets/`.** Botão, card, input, modal, tabela e
  afins vêm do Design System; `features/` nunca cria a sua própria versão.
- **Charts só via `lib/shared/charts/chart_renderer.dart`** (ADR-0003). Nenhuma
  feature importa `fl_chart` ou `graphic` diretamente.
- **Navegação só via `go_router`.** Rotas declaradas em um lugar; sem
  `Navigator.push` espalhado pelas features.

A consequência é que um usuário que aprendeu uma tela aprendeu o produto. Em uma
plataforma white-label, isso vale dobrado: a consistência é o que permite que vários
tenants compartilhem a mesma base com identidades visuais distintas, sem que cada um
vire um produto diferente por dentro.

### 4. Navegação previsível

O usuário deve sempre saber onde está, como chegou e como voltar. O Delfos recusa
navegação que surpreende: modais que abrem outros modais, fluxos que sequestram o
botão "voltar", rotas que não correspondem a uma URL real.

Como toda rota passa por `go_router` e tem URL própria, todo estado navegável é
endereçável — pré-condition para permalinks de exploração (ver
[`builder-and-ux-roadmap.md`](../references/consolidated/builder-and-ux-roadmap.md), Onda 2).
A previsibilidade da navegação não é conveniência; é o que torna o produto
compartilhável e auditável.

### 5. Acessibilidade e temas claro/escuro

Tema claro e tema escuro são **ambos** validados antes de qualquer PR — não há tema
"principal" e tema "secundário". Contraste, foco de teclado, alvos de toque e
semântica de leitor de tela são requisitos, não melhorias futuras.

Acessibilidade aqui também é honestidade: uma tela que só funciona bem para quem
enxerga bem, usa mouse e prefere fundo claro é uma tela que mente sobre para quem o
produto serve.

### 6. UX declarativa e composável

A experiência do Delfos é construída sobre **definições declarativas** (princípio 2):
dashboards, queries e relatórios são configuração inspecionável, não código
imperativo. Isso tem consequência direta de UX — o usuário monta artefatos
**escolhendo de catálogos governados**, não digitando texto livre.

Configuração por seleção, não por digitação: o usuário escolhe um dataset, uma
measure, uma dimension — nunca escreve SQL, URL ou header cru. Isso torna
**impossível pedir o que não existe** e elimina uma classe inteira de erros antes que
eles aconteçam. A UX composável e a segurança por construção (princípio 4) são, aqui,
a mesma decisão vista de dois ângulos.

### 7. Feedback imediato e honesto

Quando o produto puder mostrar o efeito de uma configuração enquanto a pessoa edita,
ele mostra — preview lado a lado, via `execution-preview`. Mas o feedback é sempre
rotulado pelo que é: na fase foundation, o preview é **demo** e a interface diz isso
sem ambiguidade. O Delfos nunca apresenta dado demonstrativo como se fosse dado real
de cliente.

---

## O que o Delfos recusa em UX

Filosofia se prova no que se rejeita. O Delfos recusa, explicitamente:

- **Telas que escondem erro.** Spinner infinito, falha silenciosa, estado de erro
  engolido. Se falhou, a tela diz — de forma honesta e acionável.
- **Densidade gratuita.** Painéis lotados de números que ninguém usa, "dashboards"
  que são vitrines de capacidade técnica. Densidade serve à decisão ou sai da tela.
- **Inconsistência.** Cor hardcoded, botão recriado dentro de uma feature, chart
  importado direto de `fl_chart`, navegação via `Navigator.push` solto. Cada um
  desses é uma rachadura na coerência do produto.
- **Navegação que surpreende.** Fluxos que sequestram o "voltar", modais aninhados,
  rotas sem URL.
- **UX por digitação livre.** Campos de SQL/URL/header crus na interface. Contraria
  o princípio declarativo e a segurança por construção.
- **Tema escuro como cidadão de segunda classe.** Um tema validado e outro
  "mais ou menos" não é aceitável.
- **Imitação de telas de referência.** O Delfos estuda Metabase, Superset, Cube e
  outros (princípio 10), mas reinterpreta padrões para o seu próprio Design System —
  nunca copia layout ou pixel.
- **Densidade ou interação que só existe na Fase 2.** Cross-filter com dados reais,
  drill-down que re-executa query e narrativa com dados dependem de runtime real e
  são *gated* por ADR. A UX não promete na interface o que a foundation ainda não
  sustenta (princípios 1 e 6).

---

## Relação com o roadmap

A maior parte da UX premium do Delfos é **viável já na foundation**, porque é
interface sobre modelos declarativos: builders por seleção, catálogo de métricas
navegável, filtros como configuração, os quatro estados, permalinks. O
[`builder-and-ux-roadmap.md`](../references/consolidated/builder-and-ux-roadmap.md) organiza
esses itens em ondas e separa com clareza o que é foundation do que é Fase 2.

As regras invioláveis do `delfos-web` **não são itens de roadmap** — são
pré-requisito de qualquer feature de UX. Nenhuma melhoria de experiência justifica
violá-las.

---

## Como usar esta filosofia

- Em **decisão de UX ou design**: verifique se a tela honra os sete pilares e não
  cai em nenhuma recusa. Se cair, ou a tela muda ou esta filosofia precisa de revisão
  formal.
- Em **revisão de PR**: estado não tratado, cor hardcoded, widget recriado em
  `features/` e tema escuro quebrado são motivos legítimos de feedback.
- Para **AI agents**: trate esta filosofia como a intenção de UX do produto. Ela
  filtra propostas que contrariam o Delfos, mas não autoriza implementação — telas
  exigem escopo aprovado e respeitam a disciplina de fases.

---

## Relacionado

- [`principles.md`](./principles.md) — os 12 princípios que regem todo o resto
- [`README.md`](./README.md) — índice da camada de filosofia de produto
- [`dashboard-philosophy.md`](./dashboard-philosophy.md) — composição visual e dashboards
- [`runtime-philosophy.md`](./runtime-philosophy.md) — execução e runtime
- [`embedded-analytics-philosophy.md`](./embedded-analytics-philosophy.md) — analytics embarcado
- [`../references/consolidated/builder-and-ux-roadmap.md`](../references/consolidated/builder-and-ux-roadmap.md) — roadmap de dashboard/query builder e UX premium
- [`../references/README.md`](../references/README.md) — biblioteca estratégica de referências
- [`../adr/adr-0003-chart-renderer-abstraction.md`](../adr/adr-0003-chart-renderer-abstraction.md) — abstração do chart renderer
- [`../adr/adr-0011-dashboard-builder-and-widget-model.md`](../adr/adr-0011-dashboard-builder-and-widget-model.md) — modelo de dashboard builder e widget
- [`../adr/adr-0024-phase-1-and-phase-2-definition.md`](../adr/adr-0024-phase-1-and-phase-2-definition.md) — definição de Fase 1 e Fase 2
