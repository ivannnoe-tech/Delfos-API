# Apache Superset — Padrões de UX

> Tipo: referência estratégica · Produto estudado: Apache Superset · Status: conceitual/futuro — não autoriza implementação

---

## Dashboard UX

O dashboard do Superset é uma grade ajustável (drag-and-drop) de componentes:
charts, markdown, divisores, abas (`Tabs`) e linhas/colunas de layout. O usuário
arrasta charts de uma gaveta lateral para a grade e redimensiona livremente.

Padrões aproveitáveis:

- **Layout em grade com abas** — dashboards densos sem rolagem infinita.
- **Modo edição x modo visualização** separados explicitamente.
- **Componentes não-chart** (markdown, header) tratados como cidadãos de 1ª classe.

No Delfos isso conversa com `dashboard-definitions` e o modelo de widget
(ver `../../adr/adr-0011-dashboard-builder-and-widget-model.md`).

---

## Builders

Dois builders distintos:

| Builder | Função | Público |
|---|---|---|
| **Explore view** | Constrói um chart: escolhe dataset, métricas, dimensões, tipo de viz | Analista / negócio |
| **SQL Lab** | Editor SQL livre; resultado vira dataset/chart | Usuário avançado |
| **Dashboard editor** | Compõe charts em layout | Curador de dashboard |

A Explore view usa um **painel de controles contextual** que muda conforme o tipo
de visualização escolhido — só mostra controles relevantes. Esse padrão de
"formulário que se adapta ao artefato" é forte para o builder do Delfos.

---

## Filtros & filtros globais

**Native Filters** é o sistema de filtros em nível de dashboard: o curador define
controles (dropdown, range, time) que se aplicam a múltiplos charts de uma vez.
Filtros podem ter escopo (todos os charts ou um subconjunto), valores padrão e
dependências entre si (filtro encadeado).

Padrões aproveitáveis:

- Filtro como **objeto de configuração do dashboard**, não estado efêmero de UI.
- **Escopo explícito** de cada filtro (quais widgets ele afeta).
- Filtros encadeados (a seleção de um restringe as opções de outro).

---

## Drill-down

Dois mecanismos:

- **Drill by** — clique direito no chart → escolher outra dimensão para reagrupar;
  abre modal com o chart redesenhado naquele recorte.
- **Drill to detail** — clique numa célula/ponto → ver as linhas subjacentes.

A comunidade aponta que o desenho de drill-down/drill-through ainda é confuso (ver
`./anti-patterns.md`). Lição para o Delfos: drill-down precisa de **modelo de
navegação explícito**, não improviso por chart.

---

## Navegação & exploração

- **Cross-filtering**: clicar num elemento de um chart filtra os demais do
  dashboard — exploração relacional sem sair da tela.
- **Permalinks**: o estado de filtros/exploração é serializável em URL,
  permitindo compartilhar uma "vista" exata.
- Lista CRUD padronizada (charts, dashboards, datasets) com busca, filtros e
  favoritos.

---

## Visualizações

40–50+ tipos prontos (linha, barra, área, tabela, big number, mapas, heatmap,
sankey, etc.), renderizados majoritariamente sobre ECharts. Cada tipo declara seus
controles. O catálogo é extensível por plugin.

Lição: tratar visualização como **catálogo declarativo versionável**, alinhado ao
`chart_renderer` do Delfos (`../../adr/adr-0003-chart-renderer-abstraction.md`).

---

## Shortcuts

SQL Lab oferece atalhos de teclado (executar query, formatar SQL, autocomplete de
schema/tabela/coluna). O dashboard tem clique-direito como gatilho de ações
contextuais (drill). Atalhos reduzem fricção para o usuário avançado.

## UX enterprise

- **Tagging e pastas** para organizar centenas de ativos.
- **Certificação de datasets/charts** (selo de "fonte confiável").
- **Ownership** explícito por ativo.
- Linha 6.x: **pastas hierárquicas** para métricas/colunas dentro do dataset,
  resolvendo o limite histórico de 50 itens visíveis.

## Responsive behavior

Historicamente o Superset é desktop-first; dashboards densos não se adaptam bem a
telas pequenas. A linha 6.x melhorou o sistema de design (Ant Design v5) e dark
mode, mas responsividade real continua limitada — ponto de atenção, não de cópia.

O Delfos (`delfos-web`, Flutter Web) deve validar light/dark e comportamento
responsivo antes de PR — regra inviolável do projeto.

---

## Loading / Empty / Error states

O Superset mostra skeletons de carregamento por chart, mensagens de "no data" e
erros de query inline no chart. A consistência desses estados, porém, varia entre
componentes (legado).

O Delfos é mais rígido: telas de dados **devem** implementar `DelfosLoadingState`,
`DelfosEmptyState`, `DelfosErrorState` e `DelfosPermissionState`. O aprendizado do
Superset é negativo aqui: padronize estados desde o design system, não por chart.

---

## Interaction patterns

- Clique → cross-filter; clique-direito → menu contextual (drill).
- Hover → tooltip com detalhamento do ponto.
- Arrastar → reposicionar/redimensionar no dashboard editor.
- Seleção de intervalo temporal por slider/range.

## Contextual actions

O menu de clique-direito do chart concentra ações contextuais: drill by, drill to
detail, ver query, exportar, tela cheia. Concentrar ações no contexto do objeto —
em vez de uma barra de ferramentas global distante — é um padrão sólido para o
builder de dashboards do Delfos.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0011 — Dashboard builder and widget model](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [ADR-0003 — Chart renderer abstraction](../../adr/adr-0003-chart-renderer-abstraction.md)
