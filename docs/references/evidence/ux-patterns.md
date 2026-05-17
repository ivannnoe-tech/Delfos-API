# Evidence — Padrões de UX

> Tipo: referência estratégica · Produto estudado: Evidence · Status: conceitual/futuro — não autoriza implementação

---

## Dashboard UX

O "dashboard" do Evidence é, na prática, um **documento analítico**. Em vez de uma grade de widgets independentes, a tela é um relatório que flui de cima para baixo: títulos, parágrafos explicativos, números embutidos no texto e gráficos posicionados ao longo da narrativa.

Esse padrão — o **relatório narrativo** — é o traço de UX mais distintivo do produto. Ele responde "o que isso significa?" e não apenas "qual o número?". O leitor recebe contexto, não só métricas soltas.

| Modelo de dashboard | Evidence | BI tradicional (grade de widgets) |
|---|---|---|
| Unidade | Documento/página | Painel de tiles |
| Leitura | Linear, narrativa | Não-linear, exploratória |
| Contexto textual | Central, inline | Secundário ou ausente |
| Autoria | Código (Markdown+SQL) | Visual (drag-and-drop) |

---

## Builders

Não há *builder* visual. O "builder" do Evidence é o **editor de código** — VS Code com extensão dedicada, ou o Evidence Studio (IDE em navegador). O fluxo de construção é:

1. Escrever a *source query* (extração).
2. Escrever a página `.md` com SQL e componentes.
3. Ver o preview ao vivo enquanto edita (dev server).

A extensão de VS Code reduz atrito ao **gerar templates a partir de consultas ao banco** — automatiza a criação de páginas e índices de navegação. É um "builder" assistido, mas ainda centrado em texto.

---

## Filtros & filtros globais

Filtros são **componentes de input declarados na página**: dropdowns, date ranges, sliders, text inputs. O valor selecionado vira uma variável referenciável no SQL da página (`${inputs.nome}`).

- **Escopo**: por padrão o input afeta as queries da própria página. Filtros "globais" exigem replicar o input ou passar parâmetros entre páginas.
- **Execução**: a re-filtragem roda em DuckDB-WASM no browser — resposta quase instantânea, sem servidor.

O padrão é poderoso para interatividade local, mas não há um conceito formal de *filtro global persistente* compartilhado por todo o data app.

---

## Drill-down

Drill-down é feito via **templated pages**: um valor numa tabela ou gráfico vira link para uma página parametrizada (`/customers/[customer]`), que recarrega o contexto detalhado. É um drill-down por **navegação de rota**, não por expansão in-place.

Vantagem: cada nível de detalhe é uma URL versionável e compartilhável. Limitação: não há *drill* hierárquico dinâmico dentro do mesmo gráfico.

---

## Navegação & exploração

- A navegação espelha a **árvore de pastas** do projeto — rotas são derivadas do filesystem.
- Páginas índice e links de navegação podem ser gerados automaticamente.
- A exploração é **guiada/curada**: o autor define os caminhos (links, templated pages). Não há exploração ad-hoc tipo "pivot livre".

É uma UX de **leitura dirigida**, adequada a relatórios, menos a investigação aberta de dados.

---

## Visualizações

Biblioteca built-in de componentes: `BarChart`, `LineChart`, `AreaChart`, `ScatterPlot`, `DataTable`, heatmaps, mapas, *big value* (KPI inline), entre outros. Características de UX:

- Componentes têm **defaults sensatos** — pouco esforço para um gráfico decente.
- Configuração é **declarativa por props** no Markdown.
- Valores podem ser **embutidos no texto** (ex.: "as vendas cresceram `{valor}`%"), reforçando a narrativa.

---

## Shortcuts

Os "atalhos" relevantes são os de **fluxo de autoria**: live reload no dev server, geração de template via extensão, validação de sintaxe em tempo real, sugestões automáticas (Studio). Para o leitor final do site estático, a experiência é a de navegação web padrão.

---

## UX enterprise

Pontos que sustentam uso "enterprise" e o que falta:

- **A favor**: governança por Git, reprodutibilidade, embedding, deploy barato, relatórios consistentes e padronizados.
- **Faltando no open-source**: autenticação, RLS, gestão de usuários, permissões — recursos enterprise ficam na oferta paga ou na infra externa.

---

## Responsive behavior

O output é um site web responsivo: os componentes se adaptam a larguras de tela e o layout de documento flui naturalmente em mobile. Por ser baseado em SvelteKit, herda comportamento responsivo de web moderna sem esforço extra do autor.

---

## Loading / Empty / Error states

Como o relatório consulta um **cache materializado** (e não uma fonte ao vivo), os estados são mais simples que num BI server-side:

- **Loading**: presente sobretudo na hidratação do DuckDB-WASM e em interações.
- **Empty**: depende do autor tratar resultados vazios na página.
- **Error**: erros de SQL/sintaxe são capturados em build e na validação do editor, antes de chegar ao leitor.

O Delfos exige estados explícitos e padronizados — `DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState`, `DelfosPermissionState` —, algo que o modelo estático do Evidence não precisa formalizar mas o Delfos sim.

---

## Interaction patterns

- **Inputs reativos**: mudar um dropdown re-roda queries no browser instantaneamente.
- **Cross-filtering**: seleção em um componente pode alimentar variáveis usadas por outros na mesma página.
- **Links parametrizados**: padrão central de transição entre níveis de detalhe.
- **Conditional rendering**: blocos da página aparecem conforme valores/parâmetros.

---

## Contextual actions

Ações contextuais são modestas: tabelas oferecem ordenação/busca/exportação básica; gráficos têm tooltips. Não há menu rico de ações por widget (anotar, alertar, compartilhar tile) como em BIs enterprise — coerente com a filosofia de **documento, não painel operacional**.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
