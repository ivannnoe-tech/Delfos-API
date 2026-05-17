# Lightdash — Visão geral estratégica

> Tipo: referência estratégica · Produto estudado: Lightdash · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Lightdash é uma plataforma de BI open-source construída diretamente sobre o **dbt** (data build tool). Em vez de ter um modelo de dados próprio e desconectado da camada de transformação, o Lightdash lê as definições do projeto dbt e transforma **métricas e dimensões declaradas em YAML** numa camada semântica navegável. O usuário final explora os dados através de *Explores* (interfaces de exploração geradas a partir dos modelos dbt) sem escrever SQL.

A tese central do produto: **a definição de negócio (métricas, KPIs) deve viver versionada no mesmo repositório git da transformação de dados**. Não há "métrica criada no clique" que diverge da fonte; tudo passa por pull request, code review e testes dbt antes de aparecer num dashboard.

A partir de 2024–2026 o Lightdash reposicionou-se como **"Agentic BI"**: a mesma camada semântica governada serve de contexto confiável para agentes de IA responderem perguntas em linguagem natural sem alucinar métricas.

---

## Objetivo do produto

- Eliminar a divergência entre "métrica do dashboard" e "métrica do data warehouse".
- Dar a times de dados um fluxo de BI que se comporta como software: branch, PR, review, CI, deploy.
- Permitir self-service analytics para usuários de negócio sem exposição a SQL.
- Servir de camada semântica única e aberta, consumível por UI, REST API, Python client e agentes de IA (via MCP Server).

---

## Público-alvo

| Perfil | Uso principal |
|---|---|
| Analytics engineers / data teams | Definem métricas e dimensões em YAML no projeto dbt |
| Analistas de negócio | Exploram dados via Explores, montam charts |
| Stakeholders / executivos | Consomem dashboards, recebem reports agendados |
| Times com cultura "analytics-as-code" | Governança via git, CI/CD de conteúdo de BI |

O produto pressupõe que **já existe um projeto dbt maduro**. Sem dbt, o Lightdash perde a maior parte do seu valor — é uma dependência forte, não opcional.

---

## Diferencial

1. **Camada semântica = código versionado.** As métricas não vivem num banco de configuração mutável por clique; vivem em arquivos YAML no repositório dbt, sob controle de versão.
2. **Single source of truth real.** A mesma definição que alimenta a transformação alimenta o BI — não há reimplementação da regra de negócio na ferramenta.
3. **Dashboards as Code.** Charts e dashboards também podem ser exportados/versionados como YAML, com `lightdash upload`/`download` e validação via CI.
4. **Preview environments.** `lightdash preview` cria um ambiente de BI efêmero por branch, permitindo validar mudanças antes de promover para produção.
5. **IA ancorada na governança.** Agentes respondem usando apenas a camada semântica auditada — reduz alucinação e mantém consistência.

---

## Arquitetura geral

- **Monorepo** TypeScript gerenciado com `pnpm workspaces` + `turbo`.
- `packages/frontend` — UI em React.
- `packages/backend` — servidor Express.
- `packages/common` — tipos e contratos compartilhados.
- `packages/cli` — CLI distribuída via npm (`lightdash` — preview, validate, deploy, download/upload).
- Camada de IA / `agent-harness` — capacidades agênticas.
- O Lightdash **não armazena os dados analíticos**: ele compila queries e as executa no data warehouse do cliente (push-down). Possui um banco operacional próprio (PostgreSQL) só para metadados, usuários, dashboards salvos e agendamentos.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem dominante | TypeScript (~95% do código) |
| Frontend | React |
| Backend | Express.js (Node.js) |
| Banco operacional | PostgreSQL (metadados, não dados analíticos) |
| Modelo semântico | YAML dentro do projeto dbt |
| Distribuição | Docker Compose, Helm/Kubernetes, Render one-click, Lightdash Cloud |
| Interfaces de acesso | UI, REST API, Python client, MCP Server |

---

## Pontos fortes

- Governança nativa: toda métrica passa por git, review e testes — auditabilidade forte.
- Coerência ponta a ponta entre transformação e consumo.
- Developer experience madura: CLI, preview environments, validação em CI/CD.
- Camada semântica aberta e multi-interface (não fica presa à UI).
- Posicionamento de IA bem fundamentado: a IA herda a governança da camada semântica.

---

## Pontos fracos

- **Acoplamento forte ao dbt.** Sem projeto dbt, o produto praticamente não funciona — não há caminho declarativo independente.
- Curva de entrada alta para quem não domina dbt/YAML/git — o "self-service" só vale para o consumidor final, não para quem define métricas.
- Recursos de IA, alertas e SSO/SAML/SCIM ficam atrás de planos pagos (Cloud Pro/Enterprise).
- O modelo de execução é sempre push-down ao warehouse: depende de um warehouse SQL performático; não há abstração para fontes via API.
- Manutenção de YAML em escala pode ficar verbosa e exigir disciplina de equipe.

---

## O que vale estudar

- O conceito de **camada semântica versionada** como contrato de negócio auditável.
- O fluxo **analytics-as-code**: branch → preview → validate → PR → merge → deploy.
- A ideia de **validação de conteúdo de BI em CI** (detectar charts quebrados antes do deploy).
- A separação entre *definir métrica* (declarativo, governado) e *explorar métrica* (interativo, sem código).
- O uso da camada semântica como **contexto confiável para IA**.

---

## O que NÃO reproduzir no Delfos

- **Acoplamento a uma ferramenta externa específica** (dbt). O Delfos deve manter sua camada declarativa própria (`datasets`, `field-mappings`, `query-definitions`) como fonte de verdade, independente de qualquer transformador externo.
- Exigir que o **definidor de métrica** domine git/YAML — o Delfos já oferece API administrativa e (futuramente) UI; a governança não precisa custar usabilidade.
- Modelo de execução exclusivamente push-down SQL — o Delfos prevê fontes via API (`adr-0001`) e connectors (`adr-0008`); não copiar a premissa "tudo é warehouse SQL".
- Colocar auditoria/segurança como dependente de plano pago — no Delfos auditoria é invariante de fundação (`adr-0018`).

---

## Relacionado

- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- ADR: [adr-0001-phase-1-api-based-data-source.md](../../adr/adr-0001-phase-1-api-based-data-source.md)
- ADR: [adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
