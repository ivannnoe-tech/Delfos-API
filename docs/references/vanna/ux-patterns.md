# Vanna AI — Padrões de UX

> Tipo: referência estratégica · Produto estudado: Vanna AI · Status: conceitual/futuro — não autoriza implementação

---

## Contexto de UX

Vanna não é uma plataforma de dashboards — sua UX gira em torno de uma **interface conversacional**. No 0.x isso é o Flask app embutido; no 2.0, o web component `<vanna-chat>`. O padrão mental é o de um **chat com o banco de dados**: o usuário pergunta, recebe SQL + resultado + visualização, e itera. A seguir, os padrões observados, lidos sob a ótica do que pode inspirar o Delfos.

---

## Dashboard UX

Vanna **não tem dashboards persistentes** no sentido tradicional. O "dashboard" é efêmero: a resposta de uma pergunta. Cada pergunta produz uma tabela e, opcionalmente, um gráfico. A consequência de UX é que a exploração é **linear e conversacional**, não espacial — não há grade de widgets arrastáveis. Isso é mais simples mas perde a noção de "painel curado e recorrente".

---

## Builders

Não há dashboard builder nem query builder visual. O "builder" do Vanna é a **caixa de texto** — a query é construída por linguagem natural. O SQL gerado é exibido e **editável**: o usuário pode corrigir manualmente antes de executar. Esse padrão "gere, mostre, deixe editar" é o equivalente leve de um builder e funciona bem como ponto de partida para usuários técnicos.

---

## Filtros & filtros globais

Vanna não tem filtros de UI. O filtro é expresso **na própria pergunta** ("...no último trimestre", "...só região Sul"). Isso elimina componentes de filtro, mas transfere ambiguidade para o LLM. Não há conceito de filtro global persistente entre perguntas — cada pergunta é autocontida (embora 2.0 mantenha histórico de conversa para contexto).

---

## Drill-down

Drill-down acontece **conversacionalmente**: o usuário recebe um resultado agregado e pergunta "detalhe por mês" ou "quebra por cliente". O histórico de conversa do 2.0 permite que perguntas de acompanhamento herdem contexto. É drill-down por diálogo, não por clique numa célula.

---

## Navegação & exploração

A exploração é um **fluxo de conversa**: histórico de perguntas e respostas rolável. Não há árvore de navegação, breadcrumbs ou workspaces visuais ricos. A vantagem é zero curva de aprendizado de navegação; a desvantagem é a dificuldade de **reencontrar** uma análise feita semanas atrás sem busca dedicada.

---

## Visualizações

Vanna gera **gráficos Plotly automaticamente**: a partir do resultado tabular, o LLM/heurística escolhe um tipo de gráfico plausível e gera o código de plotagem. O usuário recebe a tabela + o gráfico + (em 2.0) um resumo em linguagem natural. O padrão "resultado em três formas — tabela, gráfico, texto" é forte para acessibilidade e para diferentes perfis de leitor.

---

## Shortcuts

A própria linguagem natural é o "atalho": não é preciso navegar menus. Em 2.0, perguntas frequentes e pares pergunta→SQL treinados funcionam como atalhos implícitos — perguntas similares recuperam rapidamente o caminho conhecido.

---

## UX enterprise

Vanna 2.0 traz elementos de UX enterprise: identidade visível, escopo por workspace, audit trail consultável, controle de quota. A UX assume **multiusuário**: o que cada um vê é filtrado por RLS. O web component é customizável e responsivo, pensado para embutir na identidade visual do host.

---

## Responsive behavior

O `<vanna-chat>` é descrito como responsivo e customizável, funcionando em React/Vue/HTML. Como a UI é essencialmente um chat + áreas de resultado, a adaptação a telas pequenas é natural (layout em coluna única). Tabelas largas e gráficos são o ponto sensível em mobile.

---

## Loading / Empty / Error states

| Estado | Comportamento típico no Vanna |
|---|---|
| Loading | Streaming progressivo — tabela/gráfico/resumo aparecem à medida que ficam prontos |
| Empty | Conversa vazia / nenhum treino → orienta a treinar primeiro |
| Error | SQL inválido ou erro de execução → mensagem de erro; usuário pode editar o SQL e reexecutar |
| Permission | 2.0: RLS filtra silenciosamente; tools fora do grupo não ficam disponíveis |

O **streaming incremental** é um padrão de loading de qualidade: a percepção de velocidade melhora porque o usuário vê resultado parcial cedo. O Delfos exige formalmente `DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState`, `DelfosPermissionState` — o padrão de streaming do Vanna inspira o `LoadingState`.

---

## Interaction patterns

- **Gere → mostre → edite → execute**: o SQL nunca é caixa-preta; é exposto e editável.
- **Pergunta de acompanhamento**: o contexto da conversa reduz repetição.
- **Feedback como treino**: marcar uma resposta como correta a transforma em material de recuperação.
- **Resultado multimodal**: tabela + gráfico + resumo na mesma resposta.

---

## Contextual actions

A partir de um resultado, as ações contextuais típicas são: editar o SQL, reexecutar, gerar/trocar o gráfico, pedir um resumo, salvar como par de treino correto, fazer pergunta de acompanhamento. Cada resultado é um objeto sobre o qual se pode agir — não um beco sem saída.

---

## O que vale levar para o Delfos

- **Streaming incremental de resultado** como padrão de `LoadingState`.
- **Exibir e permitir editar** o artefato gerado por IA (no Delfos: a `query-definition` sugerida), nunca caixa-preta.
- **Resultado multimodal** (tabela + gráfico + resumo) respeitando o `chart_renderer`.
- **Feedback do usuário vira treino** — ciclo de melhoria contínua.
- **Pergunta de acompanhamento com contexto** para drill-down conversacional.

---

## O que NÃO levar

- Substituir totalmente os builders visuais por chat — o Delfos tem `dashboard-definitions` e dashboards persistentes; o chat é complemento, não substituto.
- Filtros só por linguagem natural — o Delfos precisa de filtros estruturados e filtros globais explícitos.
- Ausência de painéis curados e recorrentes.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0003 — Chart renderer abstraction](../../adr/adr-0003-chart-renderer-abstraction.md)
- [ADR-0011 — Dashboard builder and widget model](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [ADR-0025 — LLM-assisted analytics text generation](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Índice da biblioteca de referências](../README.md)
