# Chartbrew — Padrões de UX

> Tipo: referência estratégica · Produto estudado: Chartbrew · Status: conceitual/futuro — não autoriza implementação

---

## Visão geral

O UX do Chartbrew é desenhado para *time-to-first-dashboard* curto. A jornada
canônica é: criar conexão → criar dataset → montar chart → adicionar ao dashboard →
publicar/embedar. Esta seção destrina os padrões de interface relevantes para
inspirar (não copiar) o `delfos-web`.

---

## Dashboard UX

- Dashboards são **grids editáveis** de charts, tabelas e *goals* (metas).
- Layout reorganizável; cada widget é um cartão independente.
- Dashboards têm um modo de **edição** e um modo de **visualização/apresentação**.
- *Goals* permitem marcar um alvo numérico e mostrar progresso visual.

Lição para o Delfos: a separação clara entre **modo edição** e **modo consumo** é
um padrão sólido — combina com o modelo de `dashboard-definitions` declarativas.

---

## Builders

Há dois builders principais:

| Builder | Função |
|---|---|
| **Dataset builder** | Define a consulta (SQL/Mongo/API), transformações e variáveis |
| **Chart builder** | Escolhe tipo de visualização, eixos, agregações sobre um dataset |

O chart builder é **drag-and-drop** para configuração visual. O dataset builder usa
o **Monaco editor** para escrever queries, com assistentes de IA por fonte (SQL
Assistant, MongoDB Query Assistant).

A separação dataset/chart é o coração do reuso: um dataset alimenta vários charts.

---

## Filtros & filtros globais

- **Filtros de dashboard** ligam-se diretamente a **variáveis de dataset**.
- Adicionar um filtro com o mesmo nome de uma variável cria o vínculo
  **automaticamente** — mudar o filtro atualiza todos os charts que usam a variável.
- Variáveis podem ser alimentadas por: editor, filtro de dashboard, parâmetro de
  URL (em embed/report) ou valor padrão.

Este é o padrão mais elegante do produto: filtros globais sem fiação manual,
baseados em **convenção de nome**. Forte candidato a estudo (ver `ideas-for-delfos.md`).

---

## Drill-down

O drill-down do Chartbrew é **limitado**. O foco é em dashboards de KPI ao vivo,
não em exploração analítica profunda. Não há hierarquias de dimensão navegáveis nem
*drill-through* entre dashboards de forma nativa robusta. Filtros e variáveis
cobrem a maior parte da interatividade.

Lição: para o Delfos, drill-down rico é uma decisão futura própria — o Chartbrew
não é referência forte aqui.

---

## Navegação & exploração

A navegação é organizada por **projeto → dashboards → charts**. Dentro de um
projeto, dashboards são listados; dentro de um dashboard, charts. A exploração é
mais **curada** (o autor monta) do que **livre** (o consumidor explora).

Para o Delfos, isso combina com dashboards declarativos: o autor define, o
consumidor consome com filtros.

---

## Visualizações

- Gráficos renderizados via **Chart.js**: linha, barra, pizza, área, etc.
- Tabelas via `react-table`.
- *Goals* como visualização de progresso.
- Cada tipo tem opções de eixo, cor e agregação no chart builder.

O Delfos já decidiu abstrair o renderer (`adr-0003`), evitando acoplamento a uma
lib específica — uma decisão melhor que o acoplamento direto do Chartbrew ao
Chart.js.

---

## Shortcuts

Chartbrew não é centrado em atalhos de teclado avançados. O Monaco editor traz
atalhos próprios de edição de código nas queries. A produtividade vem mais da
fluidez do fluxo do que de *command palettes* ou hotkeys.

Lição: um *command palette* seria um diferencial que o Chartbrew **não** tem.

---

## UX enterprise

Recursos com cara "enterprise" no Chartbrew:

- *Client accounts* com acesso restrito.
- Templates de dashboard reutilizáveis.
- Snapshots agendados por e-mail/Slack/webhook.
- Controle de visibilidade de relatórios.

Faltam recursos enterprise pesados: auditoria detalhada, SSO/SAML robusto,
governança de dados, *data lineage*. O Delfos planeja parte disso (`adr-0017`,
`adr-0018`).

---

## Responsive behavior

A SPA React é responsiva; dashboards reorganizam para telas menores. O embedding
via iframe respeita dimensões do container hospedeiro. Não há um app mobile nativo.

O `delfos-web` é Flutter Web — o comportamento responsivo precisa ser validado em
light e dark (regra do projeto), algo que o Chartbrew trata de forma mais simples.

---

## Loading / Empty / Error states

Chartbrew exibe estados de carregamento por widget (cada chart carrega
independentemente), e mensagens quando uma consulta falha ou retorna vazio. Não há
um padrão de design system tão formalizado quanto o do Delfos.

O Delfos é **mais rigoroso**: telas de dados devem implementar `DelfosLoadingState`,
`DelfosEmptyState`, `DelfosErrorState` e `DelfosPermissionState`. O Chartbrew cobre
loading/empty/error mas não tem um estado de **permissão** explícito como padrão.

---

## Interaction patterns

- Edição inline de charts no builder.
- Preview imediato ao alterar dataset/chart.
- Preview de charts gerados pela IA **dentro da conversa**.
- Atualização em tempo real via *Socket Manager*.

O padrão "preview imediato + feedback visual na conversa de IA" é forte e vale
estudo para um futuro AI assistant do Delfos.

---

## Contextual actions

Ações contextuais aparecem por widget (editar, duplicar, remover, exportar) e por
dashboard (compartilhar, agendar snapshot, embedar). A IA também é contextual:
entende projeto/conexão/dataset ativos sem o usuário precisar reexplicar.

Lição: **contexto implícito da IA** reduz fricção — bom princípio de design para o
assistant futuro do Delfos.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADR: [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- ADR: [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [Índice da biblioteca de referências](../README.md)
