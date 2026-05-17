# Cube — Padrões de UX

> Tipo: referência estratégica · Produto estudado: Cube · Status: conceitual/futuro — não autoriza implementação

---

## Nota de contexto

Cube é **headless** — historicamente não impõe interface. Os padrões de UX aqui descritos vêm de dois lugares: (1) o **Playground** (ambiente de modelagem/exploração do Cube) e o frontend do Cube Cloud / Cube D3; (2) o ecossistema de aplicações embedded construído sobre o Cube. O valor para o Delfos está nos **conceitos de exploração e consumo de uma camada semântica**, não em pixels.

---

## Dashboard UX

O modelo mental do Cube separa **definição** (o que é uma métrica) de **apresentação** (como ela aparece). Um dashboard consome `views` da camada semântica; cada widget é uma query estruturada. Implicações de UX:

- Widgets são montados a partir de measures/dimensions disponíveis, não de SQL livre.
- Como a métrica é definida uma vez, o mesmo número aparece idêntico em todos os dashboards — elimina a "discussão de qual receita é a certa".
- O dashboard é um consumidor "burro" da camada semântica: toda a inteligência (joins, filtros, agregação) está no modelo.

---

## Builders

O **Playground** funciona como query builder visual: o usuário escolhe measures, dimensions e time dimensions de uma lista, e vê o resultado imediatamente — com a query estruturada e o SQL gerado lado a lado. Padrões valiosos:

- **Construção por seleção, não por digitação** — o usuário escolhe membros do modelo; impossível pedir algo que não existe.
- **Preview imediato** — toda mudança no builder reflete no resultado.
- **Transparência** — mostrar a query estruturada E o SQL gerado ensina o usuário e gera confiança.

---

## Filtros & filtros globais

- Filtros são **first-class** na query estruturada (campo `filters`), não strings concatenadas.
- **Segments** são filtros nomeados e reutilizáveis, definidos no modelo — o usuário aplica "clientes ativos" sem reescrever a condição.
- **Time dimensions** têm tratamento especial: granularidade (dia/semana/mês) e intervalos relativos ("últimos 30 dias") são parte do contrato.
- Filtros globais de dashboard propagam para todos os widgets compatíveis.

---

## Drill-down

Cube suporta drill-down via **hierarchies** (dimensões organizadas em níveis) e via `drillMembers` nas measures — ao clicar num ponto agregado, o sistema sabe quais dimensões expor para detalhar. O caminho de drill é definido no modelo, então é consistente e governado.

---

## Navegação & exploração

- Exploração guiada pelo modelo: o usuário navega measures/dimensions de uma `view`, que já expõe só o que faz sentido.
- Hierarquias dão um caminho natural de "panorama → detalhe".
- O modelo semântico atua como mapa: descrições e títulos de negócio orientam quem não conhece o schema técnico.

---

## Visualizações

Cube é agnóstico de gráfico — entrega dados, o consumidor renderiza. Padrão recomendado pelo ecossistema: a camada semântica sugere o **tipo de visualização** adequado (série temporal → linha; categórico → barra; parte/todo → pizza) com base no shape da query (presença de time dimension, cardinalidade). Isso é apenas sugestão; o usuário decide.

---

## Shortcuts

No Playground: alternância rápida entre resultado/SQL/query estruturada, cópia da query, re-execução. O padrão útil é **baixo atrito para iterar** — o ciclo "ajustar → ver → ajustar" precisa ser de segundos.

---

## UX enterprise

- **Governança visível** — o usuário vê de qual `view` o dado veio e quais regras de acesso se aplicam.
- **Catálogo de métricas** — measures e dimensions documentados são navegáveis como um catálogo.
- **Consistência cross-tool** — o mesmo número no Excel, no dashboard e no agente de IA.

---

## Responsive behavior

Por ser headless, a responsividade é responsabilidade do consumidor. O ponto relevante: a API entrega dados independentes de viewport; o frontend adapta layout e densidade. Cube não trava decisões de layout.

---

## Loading / Empty / Error states

A API do Cube retorna estados explícitos que o frontend deve tratar:

| Estado | Origem |
|---|---|
| Loading | Query em execução; pre-aggregation em build (`Continue wait`) |
| Empty | Query válida sem linhas |
| Error | Query inválida, falha de banco, timeout |
| Sem permissão | Security context bloqueia membro/linha |

O Delfos já exige tratamento explícito de `DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState`, `DelfosPermissionState` — o paralelo é direto e validante.

---

## Interaction patterns

- **Estruturado sobre livre** — o usuário interage com objetos do modelo, não com SQL.
- **Feedback imediato** — toda interação tem resposta visível.
- **Erro localizado** — falha de um widget não derruba o dashboard inteiro.

---

## Contextual actions

- Sobre uma measure: ver definição, drill-down, exportar.
- Sobre um ponto do gráfico: detalhar via `drillMembers`.
- No agente (D3): a partir de um resultado, refinar em linguagem natural ("e por região?").

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADRs: [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md), [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [Índice da biblioteca de referências](../README.md)
