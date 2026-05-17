# Lightdash — Anti-padrões e decisões a evitar

> Tipo: referência estratégica · Produto estudado: Lightdash · Status: conceitual/futuro — não autoriza implementação

---

## Objetivo desta seção

Listar decisões observadas no Lightdash que, embora façam sentido para o contexto dele, **não devem ser reproduzidas no Delfos**. Não é crítica ao produto — é filtro estratégico.

---

## 1. Acoplamento forte a uma ferramenta externa (dbt)

**Problema.** O Lightdash depende estruturalmente do dbt: sem projeto dbt, não há camada semântica, não há Explores, não há produto. Toda a proposta de valor é "BI sobre dbt".

**Por que evitar no Delfos.** O Delfos tem camada declarativa própria (`datasets`, `field-mappings`, `query-definitions`) que deve ser a **fonte de verdade autônoma**. Amarrar o produto a um transformador externo cria dependência de roadmap de terceiros e exclui clientes que não usam aquela ferramenta. O Delfos pode *integrar* com transformadores, mas não pode *depender* deles para existir.

---

## 2. Governança que custa usabilidade

**Problema.** No Lightdash, definir/alterar uma métrica exige domínio de git, YAML e dbt. O "self-service" só vale para quem **consome** dados; quem **define** precisa ser analytics engineer.

**Por que evitar no Delfos.** Governança e usabilidade não precisam ser trade-off. O Delfos já oferece API administrativa e prevê UI; a definição governada pode acontecer por formulário validado + auditoria (`adr-0018`) sem exigir que o autor escreva YAML num repositório. Versionamento é desejável, mas não às custas de barreira de entrada.

---

## 3. Modelo de execução único (push-down SQL ao warehouse)

**Problema.** O Lightdash assume que **todo dado está num warehouse SQL**. Não há caminho de primeira classe para fontes via API/SaaS. O modelo de execução é monolítico: compilar SQL e empurrar.

**Por que evitar no Delfos.** `adr-0001` define a Fase 1 como **API-based data source**, e `adr-0008` prevê connectors plurais. O Delfos não deve assumir um único modelo de execução. O runtime do Delfos (`adr-0014`/`adr-0015`) é uma ponte de *command envelope* — abstração que suporta múltiplos transportes/connectors, não um compilador SQL acoplado.

---

## 4. Auditoria, SSO e segurança atrás de paywall

**Problema.** SSO/SAML/SCIM, papéis customizados e parte da governança corporativa são exclusivos de planos pagos. Times menores ficam com governança reduzida.

**Por que evitar no Delfos.** No Delfos a auditoria é **invariante de fundação** (`adr-0018`), não feature premium. Isolamento por `tenantId` (`adr-0009`) e o modelo de papéis (`adr-0017`) são base, não upsell. Segurança não deveria ser uma decisão de pricing.

---

## 5. Verbosidade do YAML em escala

**Problema.** Manter centenas de métricas/dimensões em arquivos YAML manualmente se torna verboso e propenso a erro. A disciplina de equipe vira pré-requisito operacional.

**Por que evitar no Delfos.** A camada declarativa do Delfos vive em MongoDB estruturado (`adr-0005`) com schemas Mongoose validados. Definições estruturadas e validadas no servidor escalam melhor que YAML editado à mão, e permitem validação semântica forte antes da persistência.

---

## 6. Dependência total do warehouse para performance

**Problema.** Como o Lightdash não tem motor de dados, qualquer lentidão de dashboard é problema do warehouse do cliente. O produto tem pouca alavanca para otimizar — só cache de resultado.

**Por que evitar como premissa única.** O Delfos não deve assumir que performance é "problema de outro". O design de `runtime` e `execution-preview` deve considerar, no futuro, estratégias próprias (preview, limites, materialização controlada) — sempre via ADR, mas sem terceirizar 100% do desempenho.

---

## 7. UX bimodal sem ponte

**Problema.** O Lightdash tem dois mundos quase desconexos: o mundo do **código** (definir métrica em YAML, git, CLI) e o mundo da **UI** (explorar, montar dashboard). A transição entre eles é cultural e técnica, não fluida.

**Por que evitar no Delfos.** O Delfos deve oferecer um continuum: a mesma definição governada acessível por API e por UI, com a auditoria registrando autor e mudança independentemente do canal. Evitar criar "duas ferramentas dentro de uma".

---

## 8. Realtime ausente sem caminho claro

**Problema.** O frescor do dado depende inteiramente do agendamento do pipeline dbt. Não há modelo de atualização incremental/realtime — é uma lacuna assumida.

**Por que observar.** Não é erro reproduzir a ausência de realtime na fundação (o Delfos também não tem — `adr-0007`). O anti-padrão é **não ter um caminho arquitetural previsto**. O Delfos deve documentar, mesmo que como futuro, como o frescor evoluirá — não deixar a lacuna implícita.

---

## 9. IA como recurso pago que cria dependência de canal

**Problema.** Os AI Agents do Lightdash são exclusivos de planos pagos e fortemente integrados a Slack. Para muitos usuários, a IA vira "o produto" — e fica atrás de paywall e de um canal externo.

**Por que evitar no Delfos.** Se o Delfos adotar IA (`adr-0025`), ela deve ser uma camada opcional sobre a fundação, **canal-agnóstica** e sem se tornar pré-requisito de uso. A IA consome a camada semântica; não a substitui nem captura o usuário.

---

## Resumo dos princípios derivados

| Anti-padrão | Princípio Delfos |
|---|---|
| Acoplamento ao dbt | Camada declarativa própria e autônoma |
| Governança custa usabilidade | Governar via API/UI validada + auditoria |
| Execução única push-down | Runtime/connectors plurais e abstraídos |
| Segurança como paywall | Auditoria/tenancy/roles são fundação |
| YAML verboso à mão | Definições estruturadas e validadas no servidor |
| Performance terceirizada | Estratégias próprias previstas (via ADR) |
| UX bimodal | Continuum único definição/exploração |
| Realtime sem caminho | Lacuna documentada, não implícita |
| IA paga e presa a canal | IA opcional, canal-agnóstica, sobre a fundação |

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- ADR: [adr-0001-phase-1-api-based-data-source.md](../../adr/adr-0001-phase-1-api-based-data-source.md)
- ADR: [adr-0005-mongodb-as-config-store.md](../../adr/adr-0005-mongodb-as-config-store.md)
- ADR: [adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md)
- ADR: [adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
