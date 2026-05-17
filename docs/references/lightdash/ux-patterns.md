# Lightdash — Padrões de UX

> Tipo: referência estratégica · Produto estudado: Lightdash · Status: conceitual/futuro — não autoriza implementação

---

## Dashboard UX

O dashboard no Lightdash é uma grade de *tiles* (charts salvos, tabelas, markdown, vídeos). Princípios observáveis:

- O dashboard é **composto a partir de charts já validados** na camada semântica — não se "inventa" um número direto no dashboard.
- Cada tile mantém rastreabilidade até a métrica de origem (o usuário pode abrir o chart e ver a exploração que o gerou).
- Layout em grid arrastável, com tiles redimensionáveis.

> Encaixe Delfos: combina com `dashboard-definitions` + `adr-0011` (dashboard builder e widget model). A lição: o widget referencia uma definição governada, não dados soltos.

---

## Builders

Há dois builders distintos e bem separados:

1. **Explore builder (query builder).** Interface no-code onde o usuário escolhe dimensões e métricas de uma tabela/modelo, aplica filtros e ordenações. O SQL é gerado automaticamente — o usuário não digita SQL. Dimensões aparecem como campos azuis; métricas como campos amarelos. Há um *results table* e um painel de chart.
2. **Dashboard builder.** Monta o layout de tiles, adiciona filtros de dashboard e organiza spaces.

A separação importa: **explorar dados** e **compor um painel** são tarefas distintas, com UIs distintas.

---

## Filtros & filtros globais

- **Filtros de exploração**: aplicados dentro de um Explore, afetam só aquele chart.
- **Filtros de dashboard (globais)**: definidos no dashboard, propagam para múltiplos tiles que compartilham a dimensão.
- Filtros podem ser temporários (interativos) ou salvos como parte da definição.
- Os filtros operam sobre **dimensões da camada semântica** — não sobre colunas cruas — o que garante que o filtro é semanticamente válido.

---

## Drill-down

O drill-down permite, a partir de um ponto de um gráfico, "abrir" para um nível mais granular usando outra dimensão da camada semântica. Como tudo é compilado para SQL, o drill-down é uma nova query gerada — não um recorte client-side. Isso garante números corretos no nível granular.

---

## Navegação & exploração

- Os **Explores** são a porta de entrada da exploração: listam os modelos dbt disponíveis como áreas navegáveis.
- **Spotlight** oferece uma visão de catálogo das métricas — facilita descobrir "quais KPIs existem" sem abrir cada Explore.
- **Data lineage**: visualização de linhagem mostra de onde vem cada campo.
- Navegação por *spaces* organiza charts e dashboards por time/assunto.

---

## Visualizações

Biblioteca de visualizações: tabelas, barras, linhas, área, pizza, big number, e outras. Cada chart é configurado sobre o resultado de um Explore. O foco é cobertura de casos comuns de BI, não uma galeria gigante de tipos exóticos.

> Encaixe Delfos: `adr-0003` (chart renderer abstraction) — o Delfos já abstrai o renderer (`chart_renderer.dart`). A lição do Lightdash: poucos tipos bem feitos > muitos tipos mal mantidos.

---

## Shortcuts

A UI suporta atalhos de teclado para acelerar exploração (busca de campos, navegação). O foco em produtividade do analista é parte do posicionamento "speed of code".

---

## UX enterprise

- **Spaces** com permissões para segmentar conteúdo sensível.
- **Verification workflows**: conteúdo pode receber selo de "verificado".
- **Preview environments** como parte do fluxo: stakeholder revisa o BI antes de ir a produção.
- Reports agendados entregues em Slack/e-mail.

---

## Responsive behavior

A UI é primariamente desktop-first (BI é tarefa de tela grande). Dashboards têm comportamento de leitura em telas menores, mas a *construção* de Explores e dashboards é claramente pensada para desktop.

> Encaixe Delfos: `delfos-web` é Flutter Web; vale herdar a postura "construção é desktop-first, consumo pode ser responsivo".

---

## Loading / Empty / Error states

- **Loading**: queries push-down podem demorar; a UI mostra estado de carregamento por tile, não trava o dashboard inteiro.
- **Empty**: Explores sem resultado mostram orientação ("ajuste filtros").
- **Error**: erro de compilação/execução de SQL é exibido com contexto — útil porque o usuário pode ter aplicado um filtro inválido.

> Encaixe Delfos: regra inviolável do `delfos-web` — toda tela de dados implementa `DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState`, `DelfosPermissionState`. O Lightdash valida o padrão de estados por tile.

---

## Interaction patterns

- Seleção de campos por clique (não digitação de SQL).
- Resultado em tabela atualiza ao vivo conforme a seleção muda.
- Charts derivam do mesmo resultado — trocar de tipo de chart não refaz a query.
- Distinção visual consistente entre dimensões e métricas (cor).

---

## Contextual actions

- A partir de um chart: "explorar de novo", "drill-down", "salvar", "adicionar ao dashboard".
- A partir de um campo: ver lineage, ver definição da métrica.
- A partir de um dashboard: agendar report, exportar, compartilhar.
- Ações contextuais sempre respeitam permissões do usuário e papel.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- ADR: [adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- ADR: [adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [Índice da biblioteca de referências](../README.md)
