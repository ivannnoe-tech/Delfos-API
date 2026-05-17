# Apache Superset — Features Premium e Enterprise

> Tipo: referência estratégica · Produto estudado: Apache Superset · Status: conceitual/futuro — não autoriza implementação

---

## Nota sobre "premium"

O Superset é 100% open-source — não há edição paga. Porém a empresa **Preset**
opera um SaaS gerenciado sobre o Superset, e a fronteira entre o core e o que a
Preset agrega indica claramente **onde está a percepção de valor enterprise**.
Este arquivo trata "premium" como: recursos que clientes corporativos esperam e
que distinguem um produto de BI maduro — venham eles do core ou da camada Preset.

---

## Features premium / enterprise

| Recurso | Onde vive | Valor percebido |
|---|---|---|
| Alertas e relatórios agendados | Core (Celery) | Entrega proativa de insight |
| Embedded SDK + guest tokens | Core | Analytics dentro do produto do cliente |
| Row-Level Security | Core | Isolamento de dados por perfil |
| Workspaces multi-tenant | Preset | Isolamento real entre clientes |
| AI Assist (text-to-SQL) | Preset | Reduz barreira de SQL |
| Certificações de segurança (SOC2 etc.) | Preset | Confiança de compra enterprise |
| Pastas hierárquicas de métricas | Core 6.x | Governança de catálogos grandes |
| Grupos de usuários | Core 6.x | Gestão de permissão em escala |

---

## Recursos que geram percepção de valor

- **Certificação de ativos** — datasets e charts podem receber selo de "confiável",
  sinalizando ao usuário qual fonte usar. Barato de implementar, alto valor.
- **Ownership e tagging** — todo ativo tem dono e tags pesquisáveis.
- **Permalinks compartilháveis** — qualquer estado de exploração vira link.
- **Temas / dark mode** — a linha 6.x fez disso uma feature de destaque.
- **CSS templates** — customização visual de dashboards sem fork.

Para o Delfos, "certificação" e "ownership" encaixam em `datasets` e
`query-definitions` como metadados de governança — baratos e de alto retorno.

---

## Recursos de IA

- **AI Assist (Preset)** — geração de SQL a partir de linguagem natural.
- **MCP no core** — desde fins de 2025, o Superset move abstrações de Model
  Context Protocol para o core, permitindo que extensões registrem tools de IA
  (um chart, uma query, um dataset podem ser expostos a um agente).

No Delfos, IA aplicada a analytics é conceitual e regida por
`../../adr/adr-0025-llm-assisted-analytics-text-generation.md`. O padrão MCP é
inspirador: expor artefatos do domínio como ferramentas para um copiloto futuro.

---

## Colaboração

O Superset é fraco em colaboração nativa: não há comentários, threads ou anotações
em dashboards. Compartilhamento se resume a permissões + permalinks + e-mail de
relatório. É uma **lacuna** — e portanto uma oportunidade de diferenciação para o
Delfos (anotações, comentários ancorados a um widget).

## Observability

- Logs de query e tempos de execução no SQL Lab.
- A linha 6.x e a Preset investem em métricas de uso (quais dashboards/charts são
  mais acessados).
- O Delfos já tem base sólida: módulo `audit` e estratégia de auditoria segura
  (`../../adr/adr-0018-secure-audit-strategy.md`) — observability de produto
  (uso, performance) é evolução natural.

## Analytics copilots

Conceito emergente no ecossistema (via Preset/MCP): um assistente que entende o
catálogo semântico e responde perguntas, sugere gráficos e explica resultados. Não
é maduro no core do Superset — é direção de mercado, não feature pronta.

## Explainability

Praticamente ausente no Superset: o usuário vê o gráfico, não o "porquê". Um
diferencial para o Delfos seria explicar variações ("vendas caíram 12% por causa
da região X"), tema que conecta com `../../adr/adr-0025`.

## Smart alerts

Alertas do Superset são baseados em **regra fixa** (limiar/cron). Não há detecção
de anomalia estatística nativa robusta. "Smart alerts" (baseline dinâmico,
sazonalidade) são oportunidade, não cópia.

## Template systems

CSS templates e dashboards duplicáveis funcionam como templates rudimentares. Não
há um sistema de template parametrizável de primeira classe. Outra lacuna que o
Delfos pode preencher (templates de dashboard por segmento de cliente).

## Sharing systems

- Permalinks (estado exato de exploração).
- Embedded SDK com guest token.
- Relatórios agendados por e-mail/Slack.
- Export de dados (CSV/Excel) e de chart (imagem).

## Realtime

O Superset **não é realtime**: depende de polling/refresh de dashboard e cache. Não
há streaming nativo. Atualização "ao vivo" é apenas auto-refresh em intervalo. Não
reproduzir essa expectativa sem ADR — no Delfos não há runtime real ainda.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0018 — Secure audit strategy](../../adr/adr-0018-secure-audit-strategy.md)
- [ADR-0025 — LLM-assisted analytics text generation](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [ADR-0024 — Phase 1 and Phase 2 definition](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [Índice da biblioteca de referências](../README.md)
