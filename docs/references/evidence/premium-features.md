# Evidence — Recursos Premium e Enterprise

> Tipo: referência estratégica · Produto estudado: Evidence · Status: conceitual/futuro — não autoriza implementação

---

## Panorama: open-source vs. pago

Evidence segue um modelo *open-core*: o framework de BI-as-code é open-source; **Evidence Cloud** (oferta paga) adiciona o que falta para uso corporativo multiusuário — autenticação, RLS, hospedagem gerenciada. Evidence Studio (IDE em navegador com IA) é a camada de autoria assistida.

| Recurso | Open-source | Evidence Cloud / Studio |
|---|---|---|
| BI-as-code (SQL+Markdown) | Sim | Sim |
| Build estático e deploy próprio | Sim | Sim |
| Autenticação de usuários | Não | Sim |
| Row-level security | Não | Sim |
| Hospedagem gerenciada | Não | Sim |
| IDE em navegador + IA de autoria | — | Sim (Studio) |

---

## Features premium / enterprise

- **Autenticação e gestão de acesso** — login e controle de quem vê cada relatório, ausentes no open-source.
- **Row-level security (RLS)** — filtragem de dados por identidade do usuário, sem precisar de deployments separados.
- **Hospedagem gerenciada** — entrega o site sem o time operar CI/CD e CDN próprios.
- **IDE em navegador (Studio)** — autoria sem setup local de ambiente.

A leitura estratégica: as features premium do Evidence são exatamente **as fronteiras de segurança e identidade** — justamente o que o Delfos já trata como núcleo (auth, papéis, `tenantId`, masking).

---

## Recursos que geram percepção de valor

- **Versionamento como governança** — diff e review de análises transmitem confiança e rastreabilidade.
- **Reprodutibilidade** — "este número veio deste commit" é um forte argumento de auditoria.
- **Templated pages** — gerar centenas de relatórios personalizados de um molde único é percebido como escala barata.
- **Relatórios narrativos polidos** — qualidade editorial diferencia de painéis genéricos.
- **Embedding simples** — incorporar reporting no produto do cliente sem servidor dedicado.

---

## Recursos de IA

A IA do Evidence vive em **Evidence Studio** e foca a **produtividade de autoria**:

- Validação automática de sintaxe (SQL, Markdown, componentes).
- Sugestão de componentes adequados ao dado.
- Sugestão de opções de visualização.
- Sugestão/assistência na escrita de queries SQL.

É um **copiloto de desenvolvimento do relatório**, não um assistente analítico para o leitor. Diferença relevante para o Delfos, que em ADR-0025 prevê IA para **geração de texto analítico** — mais próximo de um copiloto de *insight* do que de autoria.

---

## Colaboração

A colaboração do Evidence é a **colaboração do Git**: branches, pull requests, code review, histórico, blame. Não há comentários in-app, menções ou edição colaborativa em tempo real no relatório. Para times técnicos isso é natural e poderoso; para usuários de negócio, é uma barreira.

---

## Observability

Não há observabilidade analítica embutida (uso de relatórios, métricas de adoção, *query performance dashboards*). O que existe é observabilidade **do build**: logs de `npm run sources` e do pipeline de CI. Monitorar quem usa o quê depende de ferramentas externas de web analytics.

---

## Analytics copilots

Não há copiloto de análise voltado ao consumidor do relatório (perguntar em linguagem natural, gerar gráfico sob demanda). A IA é de autoria. O leitor final consome um artefato pré-construído e curado.

---

## Explainability

A "explicabilidade" do Evidence é **estrutural, não algorítmica**: como toda métrica é SQL versionado em texto aberto, qualquer número é rastreável até a consulta e o commit que o produziram. Não há explicações geradas por IA, mas há **transparência total da definição** — uma forma valiosa e auditável de explainability.

---

## Smart alerts

Não existem alertas inteligentes nem detecção de anomalias. O modelo estático e sem servidor não comporta monitoramento contínuo. Alertas, se desejados, são responsabilidade de ferramentas externas.

---

## Template systems

É um dos pontos mais fortes do produto. Dois níveis de templating:

- **Templated pages** — um arquivo `[param].md` gera N páginas dirigidas por dados (um relatório por cliente, país, período).
- **Reuso de queries e componentes** — consultas nomeadas e componentes reaproveitados entre páginas.

O sistema de templates entrega **escala de personalização** sem multiplicar trabalho de autoria — conceito altamente transferível ao Delfos (ver `ideas-for-delfos.md`).

---

## Sharing systems

Compartilhar = **publicar o site estático**. Opções: link interno, entrega a clientes, embedding no produto. Simples e barato. A limitação é a granularidade: sem auth/RLS no open-source, "compartilhar com a pessoa certa vendo só o dado dela" exige a oferta paga ou builds segregados.

---

## Realtime

Não há tempo real. Os dados refletem o **último run de sources**. *Freshness* é função da frequência do pipeline de build. Para casos que exigem dados ao vivo, o modelo do Evidence é inadequado por design.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md)
- [../../adr/adr-0023-data-masking-policy.md](../../adr/adr-0023-data-masking-policy.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
