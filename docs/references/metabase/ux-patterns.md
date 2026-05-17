# Metabase — Padrões de UX

> Tipo: referência estratégica · Produto estudado: Metabase · Status: conceitual/futuro — não autoriza implementação

---

## Dashboard UX

Dashboards no Metabase são grades de "cards" (Questions). Características de UX relevantes:

- Layout em grid com cards redimensionáveis e organizáveis por arrasto.
- Cada card é uma Question salva — o dashboard é composição, não duplicação.
- Texto/markdown como cards de contexto (títulos, notas, explicações).
- Tabs de dashboard para organizar muitos cards sem rolagem infinita.

> Encaixe Delfos: `dashboard-definitions` armazena a definição declarativa de dashboards
> (ADR-0011 — dashboard builder and widget model). A ideia "card = referência a uma query
> salva, não cópia" é diretamente aplicável.

---

## Builders

Dois caminhos de construção de query, lado a lado:

| Builder | Público | Mecânica |
|---|---|---|
| Query builder gráfico | Não-técnico | Blocos: escolher dados → filtrar → resumir → agrupar → ordenar |
| Editor SQL nativo | Analista | SQL livre, com variáveis e parâmetros |

O builder gráfico é o **diferencial de adoção**. Ele monta MBQL passo a passo; o usuário nunca
escreve SQL. Um Model ou Metric pode ser o ponto de partida do builder.

---

## Filtros & filtros globais

- **Filtros de dashboard** são widgets no topo, conectados aos cards por mapeamento de coluna.
- Um filtro pode alimentar vários cards simultaneamente.
- Suportam valores default, que também se aplicam a subscriptions.
- **Cross-filtering**: clicar em um ponto do gráfico atualiza um filtro do dashboard, propagando
  o valor para todos os cards conectados.

---

## Drill-down

Charts criados pelo query builder vêm com **drill-through automático**. Ao clicar:

- Abre o menu de drill-through (ver detalhe por dimensão, fazer zoom temporal, ver registros).
- O usuário pode "descer" da agregação para as linhas subjacentes.

Esse comportamento "de graça" é resultado direto de a query ser MBQL estruturado — o Metabase
sabe quais dimensões existem. Queries SQL puras têm drill-through limitado.

---

## Navegação & exploração

- **Coleções** organizam Questions/dashboards de forma hierárquica (pastas).
- **Busca global** encontra conteúdo e tabelas.
- **X-rays** oferecem exploração automática a partir de uma tabela/coluna ou de um clique.
- "Browse data" permite navegar bancos → tabelas → registros sem criar uma Question.

---

## Visualizações

Tipos: tabela, linha, barra, área, pizza, número único (com goal), mapa, funil, pivot, etc.
O usuário escolhe a visualização após a query; a mesma Question pode trocar de visualização.

> Encaixe Delfos: o `chart_renderer` (ADR-0003 — chart renderer abstraction) já abstrai o
> backend de gráficos. A lição é: **separar a definição de dados da escolha de visualização**.

---

## Shortcuts

- `+ New` como ponto único de criação (Question, dashboard, model, AI exploration).
- Ações de teclado no editor SQL.
- Atalhos de drill direto no clique do gráfico (sem abrir menus profundos).

---

## UX enterprise

- White-label: cor, logo, remoção do "Powered by Metabase" (pago).
- Content moderation: marcar conteúdo como "verificado".
- Embedding interativo com a experiência completa dentro do produto do cliente.

---

## Responsive behavior

Dashboards têm comportamento responsivo limitado — pensados primariamente para desktop.
Layout em grid se adapta, mas a experiência mobile é secundária.

> Para o Delfos (Flutter Web), responsividade é parte da base de design system. Metabase é
> um lembrete de que mobile-as-afterthought gera dívida de UX.

---

## Loading / Empty / Error states

Metabase trata estes estados, mas de forma inconsistente entre telas. Cards mostram spinners;
queries com erro exibem mensagem técnica (às vezes crua demais para usuário de negócio).

> Invariante Delfos: telas de dados **devem** implementar `DelfosLoadingState`,
> `DelfosEmptyState`, `DelfosErrorState` e `DelfosPermissionState`. Metabase mostra o custo
> de não padronizar isso: mensagens de erro inconsistentes confundem o usuário final.

---

## Interaction patterns

| Padrão | Descrição |
|---|---|
| Click behavior configurável | Por card, escolher: drill-through / destino custom / atualizar filtro |
| Cross-filtering | Clique em série propaga valor para filtros |
| Custom destinations | Clique leva a outro dashboard/Question/URL com parâmetros passados |
| Pin/verify | Curadoria de conteúdo confiável |

O **click behavior configurável** é o padrão mais inspirador: o autor do dashboard decide a
semântica da interação, sem código.

---

## Contextual actions

- Menu de contexto no clique do gráfico (drill, filtrar por valor, excluir valor).
- Ações de coluna no header (ordenar, filtrar, ocultar).
- "Ask Metabot" disponível a partir de um gráfico para resumo/análise.

> Encaixe Delfos: ações contextuais devem sair dos `shared/widgets` (design system), nunca ser
> recriadas dentro de `features/`. Metabase mantém consistência por componentização — bom modelo.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
