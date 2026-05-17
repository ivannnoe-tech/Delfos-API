# NocoBase — Padrões de UX

> Tipo: referência estratégica · Produto estudado: NocoBase · Status: conceitual/futuro — não autoriza implementação

---

## Filosofia de UX

A UX de NocoBase gira em torno de dois conceitos:

1. **Block model** — a interface é composta por **blocks** configuráveis (table, form, kanban,
   calendar, gantt, chart, map, detail). Cada block é alimentado por uma collection e tem suas
   próprias ações.
2. **Modo configuração vs. modo uso** — com um clique o usuário alterna entre **operar** a app
   e **editá-la** (arrastar blocks, configurar colunas, definir ações). A mesma tela é
   construtor e produto.

Essa dualidade é o aprendizado central: a customização não exige uma ferramenta separada — ela
é uma camada sobre a própria página.

---

## Dashboard UX

Dashboards em NocoBase são páginas montadas por **chart blocks** e **chart filter blocks**.
Um dashboard é, conceitualmente, uma página com vários blocks de visualização compartilhando
filtros. Não há um "produto dashboard" isolado — é um arranjo de blocks como qualquer outra tela.

Para o Delfos, isso reforça `dashboard-definitions` como **composição declarativa de widgets**
(ver ADR-0011): o dashboard é a definição da grade + widgets + filtros, não um artefato especial.

---

## Builders

NocoBase oferece um **WYSIWYG page builder** com drag-and-drop de blocks. O builder não é um
modo separado: é o modo configuração da própria página. Tipos de block disponíveis incluem
table, form, kanban, calendar, gantt, map e chart.

| Builder | NocoBase | Delfos (referência futura) |
|---|---|---|
| Page builder | Drag-and-drop de blocks na página | — (foco é dashboard, não app) |
| Dashboard builder | Arranjo de chart blocks | `dashboard-definitions` declarativo |
| Query builder | Configuração de data scope no block | `query-definitions` declarativo |

O Delfos deve **especializar** builders para analytics (widget + query), não generalizar para
construção de apps.

---

## Filtros & filtros globais

NocoBase usa **filter blocks** dedicados: um block de filtro publica critérios que outros blocks
da página consomem. Isso cria filtros **globais por escopo de página** sem acoplar a lógica de
filtro a cada visualização.

Padrão transferível: separar o **componente de filtro** do **componente de visualização**, com
um contrato de "filtro publicado / filtro consumido" — encaixa em `dashboard-definitions` como
filtros de dashboard que afetam múltiplos widgets.

---

## Drill-down

O drill-down em NocoBase é feito via **navegação entre blocks/páginas**: clicar em um registro
de uma table abre um detail block ou outra página com escopo filtrado. Não há um motor de
drill-down hierárquico de BI; o drill é navegação configurada.

Para o Delfos, drill-down de BI (de agregado para detalhe dentro do mesmo widget) é uma
oportunidade de **diferenciação** — não há precedente forte aqui.

---

## Navegação & exploração

A navegação é organizada por **menus** (com permissões por papel) e **tabs/dynamic blocks**
dentro de páginas. A exploração é guiada por estrutura de menu, não por exploração ad-hoc de
dados. O usuário navega pela aplicação, não por um cubo de dados.

---

## Visualizações

O plugin de charts suporta mais de uma dúzia de tipos: linha, área, barra, e outros. Cada chart
é um block configurável sobre uma collection. As visualizações vivem na mesma página que tables,
forms e kanbans — não há isolamento entre "tela de relatório" e "tela de cadastro".

No Delfos, o `chart_renderer` (ver ADR-0003) já abstrai o motor de gráficos — alinhado ao
princípio de NocoBase de tratar charts como blocks intercambiáveis.

---

## Shortcuts

O material público não destaca um sistema rico de atalhos de teclado. A produtividade vem
sobretudo da **reutilização de blocks** e da alternância rápida configuração↔uso. Atalhos de
teclado são, portanto, uma lacuna — e uma oportunidade para o Delfos.

---

## UX enterprise

Aspectos enterprise observáveis:

- **Departamentos** e hierarquia de usuários como estrutura organizacional.
- **Permissões por menu/página/block**, dando UX diferente por papel.
- **Audit logs** integrados, visíveis como recurso de governança.
- **Multi-app** para separar contextos (ainda que process-sharing).

---

## Responsive behavior

NocoBase é uma aplicação web React; o material público não enfatiza um modo mobile dedicado de
primeira classe. O layout de blocks adapta-se ao container, mas a experiência é primariamente
desktop — coerente com ferramentas internas.

O Delfos (Flutter Web) tem vantagem aqui: pode tratar responsividade como requisito de design
system desde o início.

---

## Loading / Empty / Error states

Blocks de dados naturalmente passam por estados de carregamento, vazio e erro. NocoBase trata
isso por block, mas sem um contrato de design system rígido publicamente documentado.

Contraste com o Delfos: o AGENTS.md do `delfos-web` **exige** que toda tela de dados implemente
`DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState` e `DelfosPermissionState`. Essa
disciplina é **superior** ao que se observa em NocoBase e deve ser mantida.

---

## Interaction patterns

- **Configurar in-place**: ações de configuração aparecem como overlays sobre o próprio block.
- **Ações por recurso**: cada block expõe ações (filter, add, edit, delete, duplicate) coerentes
  com a collection que o alimenta.
- **Tabs e dynamic blocks**: agrupamento e troca de contexto dentro da mesma página.

---

## Contextual actions

As ações em NocoBase são **contextuais ao block e ao registro**: uma table tem ações de linha
(editar, duplicar, excluir) e ações de bloco (filtrar, adicionar). As ações disponíveis dependem
do papel do usuário (ACL). O conjunto de ações é **configurável** — pode-se adicionar/remover
ações via modo configuração.

Para o Delfos, o padrão transferível é: ações contextuais a um widget devem respeitar
**permissões de papel** e ser **definidas declarativamente** na `dashboard-definition`.

---

## Relacionado

- [`./overview.md`](./overview.md)
- [`./architecture.md`](./architecture.md)
- [`./premium-features.md`](./premium-features.md)
- [`./ideas-for-delfos.md`](./ideas-for-delfos.md)
- [`./anti-patterns.md`](./anti-patterns.md)
- ADR: [`../../adr/adr-0003-chart-renderer-abstraction.md`](../../adr/adr-0003-chart-renderer-abstraction.md)
- ADR: [`../../adr/adr-0011-dashboard-builder-and-widget-model.md`](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
