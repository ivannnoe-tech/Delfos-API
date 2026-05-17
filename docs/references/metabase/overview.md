# Metabase — Visão Geral Estratégica

> Tipo: referência estratégica · Produto estudado: Metabase · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Metabase é uma plataforma de Business Intelligence e Embedded Analytics open-source, distribuída
sob licença AGPL (edição OSS) e Metabase Commercial Software License (edições pagas Pro/Enterprise).
Seu posicionamento histórico é "BI para todos": permitir que pessoas sem conhecimento de SQL
explorem dados através de um query builder gráfico, dashboards e exploração automática.

O produto é entregue como um único artefato JAR (backend Clojure + frontend React empacotados
juntos), o que simplifica a operação self-hosted. Também é oferecido como SaaS (Metabase Cloud).

> Nota Delfos: o Delfos Analytics está em fase *foundation* — só armazena configuração, catálogos,
> referências seguras de credenciais e auditoria. Tudo que este documento descreve sobre execução
> de queries, conectores reais e embedding é material **conceitual/futuro**.

---

## Objetivo do produto

| Eixo | O que Metabase entrega |
|---|---|
| Acesso a dados | Conectar bancos e expor tabelas/colunas a usuários de negócio |
| Auto-serviço | Query builder GUI ("Questions") sem necessidade de SQL |
| Visualização | Dashboards com filtros, drill-through e cross-filtering |
| Exploração assistida | X-rays — insights automáticos sobre tabelas/colunas |
| Modelagem | Models e Metrics como camada semântica leve |
| Distribuição | Subscriptions, alerts, embedding e SDK modular |

---

## Público-alvo

- **Usuários de negócio**: consomem dashboards, fazem drill-down, criam Questions simples via GUI.
- **Analistas de dados**: usam o editor SQL nativo, criam Models e Metrics, ajustam metadados.
- **Administradores**: configuram fontes de dados, permissões, grupos e segurança row/column.
- **Desenvolvedores / ISVs**: embarcam dashboards e componentes em produtos próprios (embedding).

O Delfos atende um público semelhante, mas em modelo **multi-tenant explícito** — diferença
arquitetural relevante (ver `./architecture.md`).

---

## Diferencial competitivo

1. **Curva de adoção baixíssima** — o query builder gráfico é o principal motivo de escolha.
2. **Operação simples** — JAR único, sem orquestração complexa obrigatória.
3. **Open-source genuíno** — edição OSS funcional, comunidade ativa, transparência de roadmap.
4. **Embedding maduro** — embedding estático, interativo e SDK modular para React.
5. **X-rays** — geração automática de exploração reduz a "página em branco" inicial.

---

## Arquitetura geral

Arquitetura de três camadas:

```
React Frontend  →  Clojure REST API  →  Drivers plugáveis  →  Bancos do cliente
   (UI/SDK)         (MBQL + lógica)       (tradução p/ SQL nativo)
```

- O frontend constrói queries via `metabase-lib` (ClojureScript).
- O backend usa **MBQL** (Metabase Query Language) como representação intermediária.
- Drivers traduzem MBQL para o SQL nativo de cada banco.
- Backend e frontend são empacotados juntos em um JAR.

Detalhamento completo em `./architecture.md`.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Clojure (REST API) |
| Frontend | JavaScript, TypeScript, ClojureScript + React |
| Query IR | MBQL (Metabase Query Language) |
| Lib compartilhada | `metabase-lib` (ClojureScript, usada front e back) |
| Drivers | Implementações plugáveis por tipo de banco |
| Empacotamento | JAR único (Uberjar) |
| Modularidade backend | Namespaces `metabase.<module>.core`, fronteiras validadas por `clj-kondo` |

> O Delfos usa stack distinta (NestJS/TS + Flutter Web + MongoDB). Não há intenção de adotar
> Clojure — o que interessa são **conceitos**, não a stack.

---

## Pontos fortes

- Query builder gráfico que realmente funciona para não-técnicos.
- Camada MBQL desacopla a UI dos dialetos SQL — boa ideia arquitetural.
- X-rays reduzem fricção de exploração inicial.
- Embedding/SDK modular bem documentado.
- Modelo de drivers plugáveis facilita adicionar novas fontes.
- Comunidade e documentação extensas.

---

## Pontos fracos

- **Performance em datasets grandes** degrada; solução comum é aplicar `LIMIT`.
- APIs internas geram **excesso de queries** (ex.: `GET /api/database` chega a centenas de chamadas).
- Edição de Data Model em bancos grandes pode levar mais de 1 minuto.
- Multi-tenancy não é nativo no modelo de dados — depende de permissões e SSO.
- Recursos enterprise-críticos (segurança row/column, embedding interativo) ficam atrás de paywall.
- Camada semântica (Models/Metrics) é leve comparada a ferramentas dedicadas (dbt, Cube).

Detalhamento em `./anti-patterns.md`.

---

## O que vale estudar

- **MBQL como IR** — abstração de query independente de dialeto; inspira a futura semantic layer
  do Delfos e o contrato runtime/connectors.
- **X-rays** — exploração automática como onboarding de dados.
- **Models e Metrics** — definições reutilizáveis de lógica de negócio.
- **Click behavior configurável** em dashboards (drill-through / destino custom / atualizar filtro).
- **Embedding SDK modular** — componentes isolados embarcáveis.
- **Drivers plugáveis** — paralelo direto com `delfos-connectors`.

---

## O que NÃO reproduzir no Delfos

- **JAR único monolítico** — o Delfos é deliberadamente multi-repo e multi-serviço.
- **Multi-tenancy "emulado" por permissões** — no Delfos, `tenantId` é fronteira de isolamento
  obrigatória no modelo de dados, não um filtro opcional.
- **Stack Clojure/ClojureScript** — fora de escopo.
- **APIs com fan-out de queries** — o Delfos deve manter contratos de leitura previsíveis.
- **Recursos de segurança críticos atrás de paywall** — isolamento e governança no Delfos são
  invariantes de base, não add-ons.

---

## Relacionado

- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0001-phase-1-api-based-data-source.md](../../adr/adr-0001-phase-1-api-based-data-source.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [Índice da biblioteca de referências](../README.md)
