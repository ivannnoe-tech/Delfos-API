# WrenAI — Padrões de UX

> Tipo: referência estratégica · Produto estudado: WrenAI · Status: conceitual/futuro — não autoriza implementação

---

## Dashboard UX

WrenAI inverte a lógica do dashboard tradicional: em vez de o usuário montar widgets
em um *canvas* vazio, ele **pergunta** e o resultado vira gráfico. O slogan do
produto fala em "primeiro dashboard em 3 cliques":

1. Usuário digita (ou fala) uma pergunta de negócio.
2. O GenBI recupera linhas/colunas relevantes e gera uma visualização.
3. Com um clique, o gráfico é **fixado (pin)** ao dashboard.

O dashboard, então, é uma coleção de perguntas materializadas — cada *card* carrega
consigo a pergunta original, o SQL e o resumo. Há *dashboard caching* para revisitar
sem re-executar.

> Aprendizado para o Delfos: o dashboard como **conjunto de definições**
> (`dashboard-definitions`) que carregam intenção e proveniência, não só pixels.

## Builders

WrenAI tem dois "builders" complementares:

- **Modeling builder** (visual): definição da camada semântica — modelos, relações,
  campos calculados — de forma gráfica, refletida na MDL.
- **Chart/Query builder conversacional**: a "construção" acontece pela linguagem
  natural; o usuário refina por follow-ups em vez de arrastar componentes.

Esse par — *builder estrutural* (durável, versionado) + *builder conversacional*
(efêmero, exploratório) — é um padrão de UX forte.

## Filtros & filtros globais

- Recortes temporais e dimensionais frequentemente expressos **na própria pergunta**
  ("últimos 30 dias", "por região").
- Conceitos como "último trimestre" são padronizados na MDL (filtros/transformações
  de negócio), garantindo consistência de interpretação.

> Delfos: filtros globais devem ser **definições versionadas** ligadas a
> `query-definitions`, não estado volátil de UI.

## Drill-down

A exploração ocorre por **follow-up questions**: o usuário aprofunda perguntando
sobre o resultado anterior, mantendo contexto conversacional. É um drill-down
*dialógico* em vez de hierárquico/clicável.

## Navegação & exploração

- Modelo *thread*/conversa: cada análise é um fio com histórico de perguntas.
- O usuário transita entre explorar (chat) e consolidar (pin no dashboard).
- A camada semântica funciona como "mapa" navegável de entidades de negócio.

## Visualizações

WrenAI gera por linguagem natural uma ampla gama de gráficos: barras, linhas,
*candlestick*, *heatmaps*, mapas geográficos, *bubble*, *funnel* e outros. O motor de
*charting* foi anunciado com "gráficos ilimitados" e *caching* de dashboard.

> Delfos: charts apenas via `lib/shared/charts/chart_renderer.dart` (`adr-0003`).
> O aprendizado é a **seleção automática de tipo de gráfico** a partir do shape do
> resultado — conceitual.

## Shortcuts

A entrada principal é a *prompt box* (texto ou voz). O atalho real do produto é
linguístico: a pergunta substitui menus e configurações.

## UX enterprise

- Modelagem semântica versionável e *git-friendly* — alinhada a fluxos de revisão.
- Controle de acesso por linha/coluna refletido no que cada usuário vê.
- Operação como camada reutilizável (Slack, IDE, embedded) — UX consistente entre
  superfícies.

## Responsive behavior

UI web; dashboards e gráficos adaptam-se a diferentes tamanhos. O modelo conversacional
favorece telas menores (uma *prompt box* + resultado).

> Delfos-web: temas claro e escuro ambos validados antes de PR; sidebar fora da
> semântica do Flutter Web (ver memória de projeto).

## Loading / Empty / Error states

WrenAI tem estados naturais a um produto de IA:

| Estado | Tratamento observado |
|---|---|
| Loading | Geração de SQL/gráfico assíncrona com *feedback* de progresso por passos |
| Empty | Sem dados → resumo textual explica a ausência |
| Error | *Structured error handling* com *hints* corretivos; falhas de *task* ("failed to create asking task") expostas |

> Delfos: telas de dados **devem** implementar `DelfosLoadingState`,
> `DelfosEmptyState`, `DelfosErrorState` e `DelfosPermissionState` — regra inviolável.

## Interaction patterns

- **Pergunta → resposta → follow-up**: ciclo conversacional iterativo.
- **Materializar**: transformar resultado efêmero em *card* persistente.
- **Inspecionar**: abrir SQL e passos por trás de qualquer resposta.
- **Refinar**: editar a pergunta ou a camada semântica e re-gerar.

## Contextual actions

- "Pin to dashboard" diretamente do resultado.
- "Ver SQL" / "ver passos" / "ver resumo" como ações de transparência.
- Converter resultado em planilha/relatório.
- Editar definição semântica a partir de uma resposta imprecisa (fechamento do
  *loop* de qualidade).

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- ADRs: [adr-0003](../../adr/adr-0003-chart-renderer-abstraction.md) ·
  [adr-0011](../../adr/adr-0011-dashboard-builder-and-widget-model.md) ·
  [adr-0025](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Índice da biblioteca de referências](../README.md)
