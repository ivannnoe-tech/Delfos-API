# Airbyte — Anti-padrões e Decisões a Evitar

> Tipo: referência estratégica · Produto estudado: Airbyte · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Airbyte resolve bem o problema de movimentação de dados, mas paga um preço em
**complexidade operacional** e tem fronteiras de produto que, se ignoradas, geram
expectativas erradas. Esta seção lista o que o Delfos **não** deve reproduzir.

---

## Complexidade operacional excessiva no self-hosted

**Observado:** o stack self-hosted do Airbyte tem muitos serviços — Config API, banco de
config/jobs, Temporal, workers, workload API, launcher, cron, bootloader. Operá-lo com
confiabilidade praticamente exige Kubernetes e uma equipe de plataforma.

**Por que evitar no Delfos:** a fase foundation é deliberadamente leve (NestJS + MongoDB,
sem cache/fila/worker — `adr-0005`, `adr-0007`). Importar a arquitetura de execução
completa do Airbyte agora seria over-engineering e contraria o escopo foundation.

**Diretriz:** introduzir orquestração/workers só quando houver runtime real, com ADR, e
ainda assim começar pelo mínimo viável — não pelo stack completo.

---

## Um container por execução como custo padrão

**Observado:** cada sync sobe um container/pod de conector. Isola falhas, mas tem
overhead de inicialização e custo de recurso significativos, especialmente em cargas
pequenas e frequentes.

**Por que evitar:** o Delfos é multi-tenant com muitas definições pequenas. Adotar
"um container por execução" como padrão geraria custo desproporcional.

**Diretriz:** preferir isolamento lógico para o caso comum; reservar isolamento por
processo/container para fontes que realmente exijam (on-premise, não confiáveis).

---

## Não ser orquestrador, mas parecer um

**Observado:** o Airbyte agenda e executa syncs, mas **não** é um orquestrador completo —
para dependências entre tarefas precisa de Airflow/Dagster/Prefect. Usuários frequentemente
descobrem essa fronteira tarde.

**Por que evitar:** o Delfos não deve prometer orquestração de pipelines complexos no
`runtime`. Tentar reimplementar um motor de workflow durável dentro do produto é um buraco
sem fundo.

**Diretriz:** fronteira explícita — o `runtime` executa requisições; orquestração ampla,
se necessária, é integração externa, documentada como tal.

---

## Conectores de comunidade com qualidade desigual

**Observado:** o catálogo enorme inclui conectores mantidos pela comunidade cuja
confiabilidade varia; mudanças de API a montante quebram conectores e a manutenção é
contínua.

**Por que evitar:** no Delfos, um conector toca `credentialRef` e cruza a fronteira de
`tenantId` — qualidade desigual aqui é risco de segurança e de isolamento, não só de UX.

**Diretriz:** catálogo **curado e certificado** (ver `ideas-for-delfos.md`, ideia 11), não
um marketplace aberto sem revisão.

---

## Transformação fora do escopo (T do ELT ausente)

**Observado:** Airbyte faz EL; a transformação fica no warehouse (dbt etc.). O "dado
analytics-ready" depende de ferramentas externas.

**Por que evitar como suposição:** não é um defeito do Airbyte — é um anti-padrão *assumir*
que o Airbyte entrega dado modelado. Para o Delfos, a semantic layer é responsabilidade
própria (`field-mappings`, `query-definitions`); não se deve esperar que um "conector
estilo Airbyte" entregue modelagem semântica.

---

## UX assume operador técnico

**Observado:** a UI do Airbyte é desktop-first, voltada a data engineers, com vocabulário
técnico (streams, cursors, sync modes, CDC).

**Por que evitar:** o Delfos tem usuários de negócio. Copiar a densidade técnica e o
vocabulário cru do Airbyte nos builders alienaria o público-alvo.

**Diretriz:** abstrair vocabulário técnico nos builders; expor detalhes avançados de forma
progressiva, não de início.

---

## Falsa expectativa de realtime

**Observado:** Airbyte é batch/agendado. CDC reduz latência, mas o modelo é micro-batch,
não streaming contínuo.

**Por que evitar:** comunicar ou desenhar o `runtime` do Delfos como "tempo real" gera
expectativa que a arquitetura batch não sustenta.

**Diretriz:** ser explícito sobre a natureza agendada/sob demanda das execuções; não
prometer streaming sem arquitetura para isso.

---

## Estados de erro genéricos quando o teste não repete

**Observado:** no Connector Builder, o botão "Test" **não** repete requisições falhas —
comportamento diferente do sync real. Isso pode confundir: o teste passa/falha de modo
distinto da execução de produção.

**Por que evitar:** divergência entre o comportamento do *preview/test* e o da *execução
real* mina a confiança no builder.

**Diretriz:** o `execution-preview` do Delfos deve deixar claras as diferenças entre
preview e execução real, ou minimizá-las.

---

## Job que "falha" após mover todos os dados

**Observado:** há relatos (issues públicas) de jobs que se marcam como falhos/repetem
mesmo após transferir todos os dados — desalinhamento entre estado real e estado reportado.

**Por que evitar:** estado de execução incorreto destrói a confiança operacional e gera
retries desnecessários (custo).

**Diretriz:** o modelo de estado de execução do Delfos (`adr-0014`) precisa de transições
de estado precisas e idempotência — sucesso é sucesso, sem ambiguidade.

---

## Acoplamento a um motor de orquestração específico

**Observado:** o runtime do Airbyte é fortemente acoplado ao Temporal. Poderoso, mas é uma
dependência pesada e uma decisão difícil de reverter.

**Por que evitar:** adotar um motor de orquestração pesado cedo demais cria lock-in
arquitetural antes de o produto saber qual carga realmente terá.

**Diretriz:** se o Delfos um dia precisar de orquestração durável, abstrair o motor atrás
de um contrato (como o `command envelope` de `adr-0015`) e adiar a escolha do motor.

---

## Síntese

O padrão recorrente a evitar é **adotar a arquitetura de execução completa do Airbyte
antes de o Delfos precisar dela**. A fase foundation é declarativa por decisão; connectors
reais, runtime real e orquestração só avançam com ADR e autorização — e, mesmo então,
começando pelo mínimo, com fronteiras de produto explícitas.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [Índice da biblioteca de referências](../README.md)
