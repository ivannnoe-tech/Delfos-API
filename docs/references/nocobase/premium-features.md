# NocoBase — Recursos Premium e de Valor

> Tipo: referência estratégica · Produto estudado: NocoBase · Status: conceitual/futuro — não autoriza implementação

---

## Nota sobre licenciamento

NocoBase é open-source sob **AGPL 3.0** para o core e plugins fundamentais. Há **termos
comerciais** adicionais (cláusulas sobre branding e operação de SaaS concorrente). Não há um
"tier premium" tradicional bem documentado publicamente; os recursos abaixo são tratados como
**capacidades de alto valor percebido**, independentemente de embalagem comercial.

---

## Features premium / enterprise

| Recurso | Descrição | Valor percebido |
|---|---|---|
| Workflow / BPM | Motor de automação com gatilhos e nós extensíveis | Automação de processos de negócio |
| Data Source Manager | Catálogo unificado de múltiplas fontes | Integração sem código por fonte |
| ACL granular | Permissão por papel/recurso/ação/campo/menu | Governança fina |
| Departamentos | Hierarquia organizacional + variáveis em workflow | Modelagem organizacional real |
| Audit logs | Registro de operações para rastreabilidade | Compliance e auditoria |
| AI Employees | Agentes de IA em workflows e construção de apps | Automação assistida por IA |
| Plugin ecosystem | 100+ plugins oficiais (charts, auth, storage, APIs) | Extensão sem desenvolvimento |
| Multi-app | Várias aplicações no mesmo processo | Separação de contextos |

---

## Recursos que geram percepção de valor

- **Modo configuração vs. modo uso** — a sensação de "construir enquanto usa" é um forte motor
  de adoção.
- **Tudo é plugin** — a promessa de extensibilidade ilimitada reduz medo de lock-in funcional.
- **Sem lock-in de dados** — estrutura relacional padrão, dados no banco do cliente.
- **Catálogo de blocks rico** — kanban, gantt, calendar, map e charts cobrem muitos casos sem
  customização.

Para o Delfos, o aprendizado é que percepção de valor vem tanto de **capacidade** quanto de
**confiança** (governança, auditoria, ausência de lock-in).

---

## Recursos de IA

NocoBase 2.0 introduz **AI Employees**:

- Agentes de IA operam **dentro de workflows** (análise, preenchimento de formulários,
  reconhecimento de documentos, roteamento, monitoramento de risco).
- Agentes assistem a **própria construção de apps** (setup, desenvolvimento, migração, release),
  cooperando com agentes de codificação (Claude Code, Cursor, Codex).
- Cada agente tem **papel próprio no ACL** e é **auditado**.
- Integração com plataformas externas via **MCP, HTTP API e CLI** (Dify, n8n, Coze).

Maturidade: relatos públicos indicam **rough edges** — loops infinitos, parâmetros não
suportados por alguns provedores LLM. É um recurso promissor, mas instável.

> Para o Delfos: a governança de IA — agente como sujeito de ACL auditado — é o princípio de
> maior valor a preservar (ver ADR-0025). A instabilidade é o alerta a evitar.

---

## Colaboração

A colaboração em NocoBase é mediada por:

- **Papéis e departamentos** definindo quem vê e edita o quê.
- **Workflows de aprovação** como mecanismo de coordenação entre pessoas.
- **Modo configuração compartilhado** — múltiplos builders alterando a mesma app.

Não há ênfase pública em colaboração em tempo real (cursores ao vivo, comentários inline).

---

## Observability

NocoBase entrega **audit logs** integrados como módulo de primeira classe — rastreabilidade de
operações. Não há, no material público, ênfase em métricas operacionais profundas, tracing
distribuído ou dashboards de saúde do sistema.

O Delfos já trata auditoria como pilar (módulo `audit`, ADR-0018) — comparável ou superior em
disciplina de sanitização (ADR-0020).

---

## Analytics copilots

Os agentes de IA do front-end de NocoBase fazem **análise, Q&A e assistência de formulário**.
Isso é o mais próximo de um "copilot de analytics", mas é genérico — não há um copilot
especializado em explicar gráficos, sugerir métricas ou narrar tendências.

Para o Delfos, um **copilot de analytics especializado** (interpretar query results, sugerir
visualizações) seria diferenciação real — ver `ideas-for-delfos.md`.

---

## Explainability

NocoBase não destaca recursos de explainability de IA (por que o agente decidiu X). A
explainability está implícita nos **audit logs** — o que o agente fez fica registrado, mas o
*porquê* não é um recurso de produto.

Para o Delfos, explainability de uma futura geração de texto assistida por LLM (ADR-0025) deve
ser desenhada explicitamente — registrar prompt, fontes e parâmetros.

---

## Smart alerts

Alertas inteligentes em NocoBase são modelados via **workflow**: gatilho (mudança de dado,
agendamento) + nó de notificação (e-mail, canais como Telegram/Slack/WhatsApp). Não há um motor
de anomaly detection embutido — o "smart" depende da lógica desenhada no workflow.

---

## Template systems

NocoBase oferece **collection templates** (ex.: calendar collection) e a possibilidade de
reutilizar configurações de blocks. Apps e soluções podem ser empacotadas. Não há um marketplace
de templates de dashboard de BI — o ecossistema é de **plugins**, não de **templates de tela**.

Para o Delfos, um sistema de **templates de dashboard** (`dashboard-definitions` reutilizáveis
por tenant/segmento) é uma oportunidade clara.

---

## Sharing systems

O compartilhamento em NocoBase é mediado por **permissões e menus**: o que cada papel acessa
define o que é "compartilhado". Não há ênfase pública em links públicos de compartilhamento,
embed externo ou snapshots compartilháveis.

---

## Realtime

O material público não destaca colaboração ou atualização de dados em tempo real como pilar.
Workflows e notificações cobrem a parte assíncrona; live data e live cursors não são destaque.

---

## Síntese para o Delfos

| Recurso NocoBase | Vale perseguir no Delfos? | Observação |
|---|---|---|
| Workflow/BPM | Parcial / futuro | Só em runtime real; respeitar ADR-0007/0015 |
| ACL field-level | Sim | Alinha com mascaramento (ADR-0023) |
| AI Employees governados | Sim, o princípio | Governança sim; instabilidade não |
| Audit logs | Já presente | Manter disciplina atual (ADR-0018) |
| Templates de dashboard | Sim | Diferenciação de BI |
| Analytics copilot especializado | Sim, futuro | Diferenciação clara (ADR-0025) |
| Realtime / live | Baixa prioridade | Fora da foundation |

---

## Relacionado

- [`./overview.md`](./overview.md)
- [`./architecture.md`](./architecture.md)
- [`./ux-patterns.md`](./ux-patterns.md)
- [`./ideas-for-delfos.md`](./ideas-for-delfos.md)
- [`./anti-patterns.md`](./anti-patterns.md)
- ADR: [`../../adr/adr-0018-secure-audit-strategy.md`](../../adr/adr-0018-secure-audit-strategy.md)
- ADR: [`../../adr/adr-0023-data-masking-policy.md`](../../adr/adr-0023-data-masking-policy.md)
- ADR: [`../../adr/adr-0025-llm-assisted-analytics-text-generation.md`](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Índice da biblioteca de referências](../README.md)
