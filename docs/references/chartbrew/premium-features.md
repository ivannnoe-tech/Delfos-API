# Chartbrew — Features Premium e Enterprise

> Tipo: referência estratégica · Produto estudado: Chartbrew · Status: conceitual/futuro — não autoriza implementação

---

## Visão geral

Embora open-source, o Chartbrew concentra valor percebido em um conjunto de
recursos que normalmente seriam "premium" em BIs comerciais: IA aplicada, embedding
controlado, automação de relatórios e colaboração com clientes. Esta seção cataloga
esses recursos como inspiração estratégica.

---

## Features premium / enterprise

| Recurso | Descrição |
|---|---|
| AI Orchestrator | Geração de datasets/charts/dashboards por linguagem natural |
| AI SQL Assistant | Gera, corrige e refina queries SQL |
| MongoDB Query Assistant | Monta charts sem conhecimento de query Mongo |
| Embedding controlado | Charts/dashboards embedados com acesso restrito |
| Snapshots agendados | Envio automático por e-mail, Slack, webhook |
| Data alerts | Notificação ao cruzar limiar ou detectar anomalia |
| Client accounts | Acesso de cliente restrito a dashboards específicos |
| Dashboard templates | Relatórios de cliente reutilizáveis e escaláveis |
| Reporting API + webhooks | Automação programática e integração externa |
| Slack app nativo | Conversar com dados via menção em canais |

---

## Recursos que geram percepção de valor

O que faz o Chartbrew "parecer" uma ferramenta cara:

- **Dataset reutilizável** — sensação de modelagem, não de gambiarra por chart.
- **Variáveis + filtros globais automáticos** — interatividade sem esforço.
- **Snapshots agendados** — entrega passiva, "trabalha por você".
- **IA conversacional com preview** — barreira técnica derrubada.
- **Embedding white-label-ish** — o cliente vê o relatório, não a ferramenta.

A lição: percepção de valor vem de **automação + reuso + assistência**, não de
quantidade de tipos de gráfico.

---

## Recursos IA

O AI Orchestrator é o destaque:

- Entende **contexto** de projeto, conexão e dataset automaticamente.
- Gera artefatos completos (dataset, chart, dashboard), não só texto.
- Preview visual **dentro da conversa**.
- Assistentes especializados por fonte (SQL, Mongo).
- Guardas para limitar saídas inválidas/perigosas.
- Migrou para a *Responses API* da OpenAI na v5 — sinal de maturidade do pipeline.

Para o Delfos, `adr-0025` trata de geração de texto assistida por LLM — o Chartbrew
mostra um caminho mais ambicioso (gerar artefatos), que seria decisão futura própria.

---

## Colaboração

- **Times** com papéis (owner, admin, membros).
- **Client accounts** — clientes externos com acesso somente a seus dashboards.
- Compartilhamento por link com políticas de visibilidade.
- Slack como canal de colaboração sobre dados.

A colaboração é orientada a *client reporting*, não a coautoria simultânea (sem
edição multi-usuário em tempo real tipo Figma).

---

## Observability

Observability **não é foco** do Chartbrew. Não há painéis de saúde de execução,
métricas de uso detalhadas nem *lineage* de dados expostos ao usuário. Logs e
monitoramento ficam a cargo da operação self-hosted.

Lição para o Delfos: há espaço para diferenciar com observabilidade real (saúde de
*execution requests*, latência por connector) — algo que o Chartbrew deixa vago.

---

## Analytics copilots

O AI Orchestrator funciona como *copilot* de criação: o usuário descreve o que quer
e a IA monta. Não há, porém, um *copilot* de **interpretação** robusto — explicar
tendências, narrar resultados, sugerir próximos passos analíticos é limitado.

Oportunidade: um copilot de interpretação seria diferencial sobre o Chartbrew.

---

## Explainability

A explicabilidade é parcial: a IA mostra a query gerada e o preview, então o usuário
pode auditar a saída. Mas não há explicação de **por que** um chart foi sugerido nem
narrativa automática dos dados. As "guardas" protegem contra saída inválida, não
explicam decisões.

---

## Smart alerts

Os *data alerts* disparam quando um valor cruza um limiar ou quando uma anomalia é
detectada, entregando por Slack, e-mail ou webhook. É um recurso "smart" no sentido
de detecção de limiar/anomalia, integrado ao agendamento de refresh.

Para o Delfos, alertas inteligentes seriam uma feature futura atraente, dependente
de runtime real de execução (`adr-0014`).

---

## Template systems

Templates de dashboard permitem **empacotar um relatório** e reaplicá-lo para vários
clientes — central para a proposta de *client reporting* em escala. O template
captura estrutura de dashboard, charts e variáveis; ao instanciar, conecta-se a
dados específicos do cliente.

Este é um dos conceitos mais reaproveitáveis (ver `ideas-for-delfos.md`).

---

## Sharing systems

O compartilhamento tem múltiplos modos:

- **Embed** via iframe (com variáveis por URL).
- **Link compartilhado** com política de visibilidade.
- **Client account** com acesso restrito.
- **Snapshot agendado** (entrega passiva).

A v5 endureceu políticas de compartilhamento e visibilidade de relatórios — sinal
de que segurança de sharing exige atenção contínua.

---

## Realtime

O *Socket Manager* baseado em Redis distribui atualizações em tempo real: charts
atualizam, e o preview da IA aparece ao vivo na conversa. Não é *streaming* de dados
de alta frequência — é mais sobre reatividade da UI e da IA.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADR: [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md)
- ADR: [../../adr/adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- ADR: [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
