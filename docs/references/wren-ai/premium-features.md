# WrenAI — Features Premium e Enterprise

> Tipo: referência estratégica · Produto estudado: WrenAI · Status: conceitual/futuro — não autoriza implementação

---

## Features premium / enterprise

| Feature | Descrição | Por que gera valor |
|---|---|---|
| Camada semântica (MDL) | Contrato versionável de modelos, métricas e relações | Consistência e governança analítica |
| Controle de acesso RLAC/CLAC | Acesso por linha e por coluna na definição | Governança *enterprise* sem reescrever queries |
| Multi-fonte (20+) | Um motor para muitos dialetos de SQL | Reduz custo de integração |
| Dashboard caching | Revisitar dashboards sem re-query | Custo e latência menores |
| AI-powered spreadsheets | Planilhas geradas/assistidas por IA | Estende o BI para o fluxo de planilha |
| Métricas pré-construídas (100+) | Biblioteca de métricas cross-platform | Acelera *time-to-value* |
| Camada de contexto reutilizável | Mesmo motor para BI, Slack, IDE, embedded | Plataforma, não produto fechado |

## Recursos que geram percepção de valor

- **"3 cliques para o primeiro dashboard"** — *time-to-value* curtíssimo.
- Resposta que vem com **SQL + passos + resumo** — confiança imediata.
- Modelagem visual que produz artefato versionável — o usuário sente controle.
- Biblioteca de métricas e *templates* prontos — partida rápida.

## Recursos de IA

- **Text-to-SQL** fundamentado na camada semântica.
- **Geração de gráficos por linguagem natural** — qualquer tipo de visualização.
- **Resumos de insight** automáticos junto ao resultado.
- **Follow-up questions** com contexto conversacional.
- **Value profiling** e **dry-plan validation** para qualidade da geração.
- **RAG híbrido** com memória de exemplos e queries passadas.
- **Structured error handling** com *hints* corretivos para o agente.

> Para o Delfos, qualquer recurso de IA é **futuro** e regido por `adr-0025`
> (geração de texto assistida por LLM). Esta seção é catálogo de inspiração.

## Colaboração

- Modelagem semântica *git-friendly* e versionável — colaboração via fluxo de
  revisão de código.
- *Threads* de perguntas funcionam como artefatos compartilháveis de análise.
- Dashboards como coleções de perguntas materializadas, compartilháveis.

## Observability

- Cada resposta é **auto-explicável**: SQL final, passos, resumo.
- *Dry-plan validation* dá visibilidade antes da execução.
- Erros estruturados facilitam diagnóstico.
- *Value profiling* expõe a distribuição dos dados subjacentes.

> Delfos já trata auditoria como cidadã de primeira classe (`audit`, `adr-0018`).
> O conceito de **proveniência da resposta** (de onde veio cada número) é altamente
> alinhado.

## Analytics copilots

WrenAI é, na prática, um **copiloto de analytics**: o usuário descreve a intenção e o
agente conduz recuperação de contexto, geração, validação e resumo. O copiloto não
substitui o analista — ele acelera e padroniza, com a camada semântica como guarda-corpo.

Padrões de copiloto observados:

- **Grounding** obrigatório: nada é gerado sem contexto semântico.
- **Iteração dialógica**: refino por follow-up em vez de reconfiguração manual.
- **Transparência**: o copiloto sempre mostra seu trabalho (SQL/passos).
- **Reuso**: respostas viram *cards*, métricas, *views* — conhecimento acumulado.

## Explainability

Pilar central do produto. Diferente de *text-to-SQL* "caixa-preta", WrenAI entrega:

- O **SQL gerado** (inspecionável e editável).
- Os **passos de raciocínio** que levaram àquele SQL.
- Um **resumo em linguagem natural** do insight.
- A **rastreabilidade** até a definição semântica (MDL) usada.

Isso transforma a explicabilidade em recurso de **confiança** e de **correção**: ao
ver um SQL errado, o usuário ajusta a MDL e fecha o ciclo de qualidade.

## Smart alerts

WrenAI não tem alertas inteligentes como recurso central destacado; o foco é
exploração conversacional e dashboards. Alertas são oportunidade adjacente (ver
`ideas-for-delfos.md`).

## Template systems

- Métricas pré-construídas (100+) como *templates* de negócio.
- *Macro functions* (estilo Jinja) na MDL — *templates* de lógica reutilizável.
- Modelos e *views* atuam como blocos reaproveitáveis.

## Sharing systems

- Dashboards e *threads* compartilháveis.
- Camada semântica como artefato compartilhado entre times.
- Operação embarcada permite levar analytics ao produto do cliente.

## Realtime

WrenAI não enfatiza *realtime/streaming*; o modelo é *query-on-demand* com *caching*
de dashboard. *Realtime* não é diferencial do produto.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- ADRs: [adr-0018](../../adr/adr-0018-secure-audit-strategy.md) ·
  [adr-0023](../../adr/adr-0023-data-masking-policy.md) ·
  [adr-0025](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
