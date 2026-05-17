# Metabase — Features Premium e Enterprise

> Tipo: referência estratégica · Produto estudado: Metabase · Status: conceitual/futuro — não autoriza implementação

---

## Features premium / enterprise

Metabase separa OSS (AGPL) de Pro/Enterprise (licença comercial). As edições pagas concentram
recursos de governança, escala e distribuição.

| Feature paga | O que entrega | Categoria |
|---|---|---|
| Row & column security | Sandboxing por atributo do usuário | Governança |
| Interactive embedding | Experiência completa white-label multi-tenant | Distribuição |
| Modular embedding SDK | Componentes React isolados embarcáveis | Distribuição |
| White-label | Cor, logo, remoção de marca | Branding |
| SSO (SAML/JWT) | Identidade federada | Governança |
| Serialization | Export/import de conteúdo entre instâncias (CI/CD de BI) | Operação |
| Auditing tools | Visão de uso, queries, atividade | Observability |
| Content moderation | Marcar conteúdo como verificado | Confiança |
| Filtros por grupo em subscriptions | Mesmo dashboard, recorte por audiência | Distribuição |
| Suporte dedicado | Success engineer, SLA de 1 dia | Serviço |

> Para o Delfos, recursos de **isolamento e governança são invariantes de base**, não add-ons
> pagos. A divisão de pacote do Metabase é referência de empacotamento comercial, não de arquitetura.

---

## Recursos que geram percepção de valor

- **X-rays** — exploração automática elimina a "tela em branco". Alto valor percebido com baixo
  esforço do usuário.
- **Click behavior configurável** — autor define a interação sem código.
- **Subscriptions** — o dashboard "vai até" o usuário (e-mail/Slack), sem login.
- **Models e Metrics** — "fonte única da verdade" para revenue, churn, active users.
- **Serialization** — versionar BI como código aproxima de práticas de engenharia.

---

## Recursos de IA — Metabot

Metabot é o assistente de IA do Metabase:

- **Linguagem natural → query/gráfico**: pergunta em texto, Metabot roda e visualiza.
- **Geração de SQL** no editor nativo a partir de NL.
- **Correção de erros de query** — sugere fixes.
- **Análise de visualizações existentes** — resumo em um clique de gráfico/dashboard.
- **Integração com Slack** — perguntar e gerenciar subscriptions sem sair do chat.
- **Processo agêntico de duas etapas** (2025): QueryDesigner interpreta a pergunta com o schema;
  QueryArchitect extrai documentação de tabelas para gerar SQL preciso.
- Roda no Metabase AI service ou com API key de provedor próprio.

> Encaixe Delfos: ADR-0025 (LLM-assisted analytics text generation) ancora qualquer copiloto
> futuro. Metabot é referência forte de **UX de IA** — especialmente o "resumo em um clique".
> Arquitetura agêntica é conceitual; não autoriza implementação.

---

## Colaboração

- **Coleções** compartilhadas com permissões.
- **Comentários/discussão** em conteúdo (em evolução).
- **Content moderation** — verificação dá sinal de confiança coletivo.
- **Subscriptions compartilhadas** — distribuição agendada para grupos.

---

## Observability

- **Auditing tools** (pago): quem rodou o quê, queries lentas, conteúdo mais usado.
- Logs de uso ajudam a identificar dashboards abandonados e gargalos.

> Encaixe Delfos: o módulo `audit` (ADR-0018 — secure audit strategy) já é a fundação para
> observabilidade de uso. Metabase mostra o valor de **transformar auditoria em insight de produto**,
> não só em trilha de conformidade.

---

## Analytics copilots

Metabot atua como copiloto: sugere prompts, gera queries, explica resultados. O diferencial é
estar embutido no fluxo (no gráfico, no editor, no Slack) — não é um chat isolado.

---

## Explainability

- "One-click summaries" explicam o que um gráfico mostra em linguagem natural.
- X-rays explicam a distribuição/perfil de uma tabela ou coluna automaticamente.

Explicabilidade reduz o risco de leitura errada de dados — relevante para qualquer copiloto Delfos.

---

## Smart alerts

- **Alerts** em Questions: dispara quando o resultado cruza uma "goal line".
- Canais: e-mail, Slack, webhook.
- Diferente de subscription (envio agendado): alert é **orientado a condição**.

> O Delfos não tem scheduler/alerts hoje (sem cache/fila/worker na fase atual). Alerts são
> material conceitual/futuro — ver `./architecture.md`.

---

## Template systems

- **Models** funcionam como templates de ponto de partida para Questions.
- X-rays usam templates internos de exploração por tipo semântico de coluna.
- Serialization permite "templates" de instância (config replicável).

---

## Sharing systems

| Mecanismo | Acesso | Caso de uso |
|---|---|---|
| Public links | Sem login | Compartilhar leitura externamente |
| Static embedding | Iframe assinado | Dashboard fixo em produto externo |
| Interactive embedding | Sessão white-label | Portal de cliente multi-tenant |
| Subscriptions | E-mail/Slack | Distribuição agendada |
| Coleções | Login + permissão | Colaboração interna |

---

## Realtime

Metabase **não** é uma plataforma realtime. A "atualização" vem de:

- Auto-refresh de dashboard em intervalo configurável.
- Cache com TTL.

Para dados realmente ao vivo, depende do banco-fonte. Lição: não prometer realtime sem
infraestrutura de streaming dedicada.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md)
- [Índice da biblioteca de referências](../README.md)
