# Lightdash — Features premium e enterprise

> Tipo: referência estratégica · Produto estudado: Lightdash · Status: conceitual/futuro — não autoriza implementação

---

## Visão geral de monetização

O Lightdash é open-source no núcleo, mas separa claramente o que é gratuito (self-hosted, exploração, dashboards, camada semântica) do que é pago (**Cloud Pro** e **Enterprise**). O paywall concentra-se em **IA, automação, segurança corporativa e suporte** — não na funcionalidade analítica básica. Cloud Pro tem preço fixo (~US$2.400/mês) sem cobrança por usuário; Enterprise é sob consulta.

---

## Features premium / enterprise

| Feature | Plano | Valor percebido |
|---|---|---|
| AI Agents | Cloud Pro / Enterprise | Analista on-demand em linguagem natural |
| Scheduled reports & alerting | Cloud Pro / Enterprise | Distribuição automática de insights |
| SSO + SAML + SCIM 2.0 | Enterprise | Integração com IdP corporativo |
| Custom roles | Enterprise | Governança de acesso granular |
| On-prem deployment | Enterprise | Conformidade e isolamento |
| SOC 2 / HIPAA / BAA | Enterprise | Requisitos regulatórios |
| Priority support + SLA | Enterprise | Garantia operacional |

---

## Recursos que geram percepção de valor

- **Preço sem cobrança por seat** (Cloud Pro): remove o atrito de "quanto custa adicionar mais um usuário". Decisão comercial inteligente — incentiva adoção ampla.
- **Preview environments**: percepção de maturidade de engenharia — "BI tratado como software".
- **Validação de conteúdo em CI**: confiança de que nada quebra silenciosamente.
- **Camada semântica aberta**: o cliente não fica refém da UI; pode consumir métricas via API/Python/MCP.

---

## Recursos de IA

Posicionamento "Agentic BI". Os **AI Agents**:

- Agem como analistas on-demand treinados nas métricas, regras de governança e contexto de negócio do cliente.
- Respondem perguntas em linguagem natural, exploram dados e geram visualizações automaticamente.
- **Toda query do agente passa pela camada semântica governada** → resultados consistentes, sem alucinação de métrica.
- Integram com Slack.
- Têm **memória e aprendizado** entre interações.
- Respeitam **controle de acesso** (o agente não vê o que o usuário não pode ver).
- Suportam **múltiplos agentes** para times diferentes.
- Têm **evaluations** para validar a qualidade das respostas.

> Encaixe Delfos: `adr-0025` (LLM-assisted analytics text generation). A lição central: a IA é segura porque consome um modelo semântico auditado, não SQL livre.

---

## Colaboração

- **Spaces** compartilhados para organizar conteúdo por time.
- Comentários e compartilhamento de charts/dashboards.
- Reports agendados entregues ao time via Slack/e-mail.
- Workflow de PR/review herdado do git para qualquer mudança de definição.

---

## Observability

- **Auditoria** de ações de usuário.
- **Data lineage** — visibilidade de origem de cada campo.
- Validação de conteúdo detecta charts/dashboards quebrados.
- Visibilidade do SQL gerado — o usuário técnico pode auditar a query.

> Encaixe Delfos: `adr-0018` (secure audit strategy) já trata auditoria como invariante. O Lightdash adiciona a ideia de *observability de conteúdo* (detectar artefatos quebrados).

---

## Analytics copilots

O agente de IA funciona como copilot: o usuário descreve a pergunta, o copilot escolhe métricas/dimensões da camada semântica, monta a query e devolve um chart. O copilot é uma *interface alternativa* ao Explore builder — não substitui a governança, opera dentro dela.

---

## Explainability

- O usuário sempre pode abrir o SQL gerado.
- A definição de cada métrica é rastreável até o YAML versionado (quem mudou, em qual PR).
- Data lineage explica a origem do dado.
- As evaluations do agente dão visibilidade sobre por que/como a IA respondeu.

A explainability é estrutural: vem de a definição ser código versionado e a query ser compilada de forma determinística.

---

## Smart alerts

Alertas e reports agendados (planos pagos) monitoram métricas e disparam notificações em condições definidas (threshold, mudança). A entrega é multicanal (Slack/e-mail). É um recurso clássico de BI, posicionado como pago.

> Encaixe Delfos: futuro — depende de scheduler/worker, que `adr-0007` mantém fora da Fase 1.

---

## Template systems

Os modelos dbt + YAML funcionam como **templates reutilizáveis**: uma vez definida uma métrica, ela é reusada em todos os Explores e dashboards. "Dashboards as code" permite versionar e replicar layouts de dashboard como YAML entre projetos/ambientes.

---

## Sharing systems

- Compartilhamento de charts/dashboards por link, respeitando permissões.
- **Embedded analytics**: embarcar conteúdo em apps externos com tokens.
- Exportação de dados/charts.
- `download`/`upload` de conteúdo como YAML para portar entre ambientes.

---

## Realtime

O Lightdash **não** é uma ferramenta de streaming/realtime. A "atualização" vem de re-executar a query no warehouse (com cache opcional) ou de reports agendados. O frescor do dado depende do warehouse e do pipeline dbt — não há subscrição realtime de dados.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- ADR: [adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- ADR: [adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- ADR: [adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md)
