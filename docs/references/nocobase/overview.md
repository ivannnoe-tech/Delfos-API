# NocoBase — Visão Geral Estratégica

> Tipo: referência estratégica · Produto estudado: NocoBase · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

NocoBase é uma plataforma open-source de **no-code/low-code** para construção de aplicações de
negócio e ferramentas internas (internal tools). Não é um produto de BI puro: é um construtor de
**business systems** — CRMs, gestão de projetos, ERPs leves, portais administrativos — onde
relatórios e dashboards são apenas um dos blocos disponíveis.

O ponto central do produto é a **arquitetura de plugins (microkernel)**: praticamente toda
funcionalidade — páginas, blocks, ações, tipos de campo, data sources, autenticação, workflows —
é entregue como plugin. O kernel é mínimo e estável; o produto cresce por composição de plugins,
oficiais ou de terceiros, sem inchar o núcleo.

A partir da versão 2.0, NocoBase incorpora um discurso de **AI + no-code**: agentes de IA
("AI Employees") operam dentro de workflows e da própria construção de apps, sempre sob o mesmo
modelo de permissões e auditoria aplicado a usuários humanos.

---

## Objetivo do produto

Permitir que equipes construam sistemas de negócio **sobre infraestrutura comprovada** em vez de
gerar tudo do zero. NocoBase separa o **modelo de dados** (collections, fields, relações) da
**interface** (pages, blocks, actions), de modo que a mesma tabela possa ser apresentada de N
formas diferentes sem duplicação de dados.

---

## Público-alvo

| Perfil | Uso típico |
|---|---|
| Equipes de TI internas | Ferramentas administrativas, portais, automações |
| Integradores / agências | Entregar apps customizados a clientes |
| Product builders | MVP de SaaS sobre base relacional |
| Desenvolvedores | Estender via plugins próprios sem forkar o core |

Para o Delfos, o público relevante é diferente — analistas de BI e administradores de tenant —
mas os **padrões de extensibilidade e governança** de NocoBase são transferíveis.

---

## Diferencial

- **Tudo é plugin.** O microkernel não conhece domínios; conhece o ciclo de vida de plugins.
- **Data model-driven.** UI desacoplada da estrutura de dados; collections como contrato central.
- **Sem lock-in de dados.** Os dados ficam em banco relacional do próprio usuário.
- **Modo configuração vs. modo uso.** Alterna entre editar a app e operá-la com um clique.
- **Governança uniforme.** O mesmo ACL vale para humanos, plugins e agentes de IA.

---

## Arquitetura geral (resumo)

NocoBase organiza-se em camadas. Detalhes em [`./architecture.md`](./architecture.md).

```
┌─────────────────────────────────────────────┐
│  Plugins (oficiais + terceiros + custom)     │
│  pages · blocks · actions · fields · auth …  │
├─────────────────────────────────────────────┤
│  Microkernel — Application / Plugin Manager  │
│  ciclo de vida, registro, hooks, middlewares │
├─────────────────────────────────────────────┤
│  Data Source Manager — collections & fields  │
│  primary DB · external DB · third-party API  │
├─────────────────────────────────────────────┤
│  ORM relacional (persistência)               │
└─────────────────────────────────────────────┘
```

A UI é montada por **blocks** configuráveis (table, form, kanban, calendar, gantt, chart, map)
sobre um schema declarativo. A versão 2.0 introduziu o **FlowEngine**, um motor de front-end
low-code que combina "Models" e "Flows" para descrever lógica de tela de forma reutilizável.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript (quase toda a base) |
| Backend | Node.js + Koa |
| Frontend | React |
| Persistência | ORM relacional sobre bancos SQL |
| Monorepo | Lerna |
| Licença | AGPL 3.0 (core + plugins fundamentais) + termos comerciais |

Há sobreposição parcial com o Delfos no backend (Node.js + TypeScript), mas o Delfos usa
**NestJS + MongoDB**, enquanto NocoBase é fortemente ancorado em **ORM relacional**.

---

## Pontos fortes

- Microkernel real: extensibilidade previsível em todo o ciclo de vida.
- Modelo de dados como contrato único, reaproveitado por múltiplos blocks.
- Catálogo grande de plugins oficiais (workflows, charts, auth, storage, APIs).
- ACL granular por papel, recurso e ação — inclusive a nível de campo.
- Data Source Manager unifica banco primário, bancos externos e APIs de terceiros.
- Sem lock-in: estrutura relacional padrão, dados sob controle do usuário.

---

## Pontos fracos

- **Curva de aprendizado acentuada** para desenvolvimento de plugins.
- Camada de abstração pode virar **gargalo de performance** em alta concorrência.
- Integrações de terceiros mais limitadas que ferramentas comerciais (Airtable, Retool).
- Limites práticos de escala em importação de grandes volumes.
- API do FlowEngine com **inconsistências** que confundem desenvolvedores.
- Recursos de IA (2.0) ainda imaturos — relatos de loops infinitos e parâmetros não suportados.
- Licenciamento dual (AGPL + comercial) gera atrito jurídico em cenários SaaS.

---

## O que vale estudar

- O **microkernel de plugins** e seu ciclo de vida — inspiração para modularizar capacidades
  futuras do Delfos (connectors, AI assistant, novos tipos de widget).
- A separação **modelo de dados ↔ apresentação** — alinhada ao par
  `datasets`/`dashboard-definitions`.
- O **Data Source Manager** como camada de catálogo unificada — paralelo a `connections` +
  `datasets` + `field-mappings`.
- O modelo de **ACL granular** por papel/recurso/ação/campo.
- O **block model** como vocabulário de UI configurável.

---

## O que NÃO reproduzir no Delfos

- Não transformar o Delfos em plataforma no-code genérica: o foco é BI/analytics multi-tenant.
- Não adotar ORM relacional como núcleo — o Delfos é MongoDB e foundation-first.
- Não copiar a abstração universal de blocks: o Delfos precisa de widgets de analytics
  especializados, não de um construtor de apps de propósito geral.
- Não replicar o licenciamento dual AGPL + comercial.
- Não importar a complexidade do FlowEngine para a fase foundation.

---

## Relacionado

- [`./architecture.md`](./architecture.md)
- [`./ux-patterns.md`](./ux-patterns.md)
- [`./premium-features.md`](./premium-features.md)
- [`./ideas-for-delfos.md`](./ideas-for-delfos.md)
- [`./anti-patterns.md`](./anti-patterns.md)
- ADR: [`../../adr/adr-0011-dashboard-builder-and-widget-model.md`](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- ADR: [`../../adr/adr-0024-phase-1-and-phase-2-definition.md`](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
