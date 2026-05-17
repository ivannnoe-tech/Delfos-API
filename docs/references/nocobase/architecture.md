# NocoBase — Arquitetura

> Tipo: referência estratégica · Produto estudado: NocoBase · Status: conceitual/futuro — não autoriza implementação

---

## Modularização

NocoBase adota um **microkernel**: o núcleo é deliberadamente pequeno e estável, conhecendo
apenas o ciclo de vida de plugins, o registro de recursos e o roteamento. Todo domínio funcional
— páginas, blocks, ações, autenticação, workflows, data sources — vive em **plugins** carregados
sobre esse núcleo. O resultado é que o produto cresce por **adição de plugins**, não por
modificação do core.

Comparação conceitual com o Delfos:

| Aspecto | NocoBase | Delfos (foundation) |
|---|---|---|
| Unidade de extensão | Plugin | Módulo NestJS (`src/modules/<name>/`) |
| Núcleo | Microkernel + Plugin Manager | `src/core/` (filtros, interceptors, pipes, DTOs) |
| Acoplamento | Plugins compõem capacidades | Módulos com layout interno padronizado |
| Crescimento | Instalar/ativar plugin | Adicionar módulo espelhando estrutura |

O Delfos já é modular por convenção; a lição de NocoBase é tornar a modularidade um **contrato
de ciclo de vida explícito** quando capacidades futuras (connectors, AI) precisarem ser ativadas
e desativadas dinamicamente.

---

## Runtime & execution model

O runtime de NocoBase é uma `Application` Node.js (Koa) que, no boot, inicializa o Plugin
Manager, resolve dependências entre plugins e dispara hooks de ciclo de vida (`beforeLoad`,
`load`, `install`, `afterEnable`, etc.). Requisições passam por **middlewares** registrados por
plugins; ações de recurso são resolvidas contra o **Data Source Manager**.

No Delfos, o runtime atual é **declarativo** — o módulo `runtime` e `execution-preview` modelam
*requests* de execução sem executá-las (ver ADR-0014). O modelo de NocoBase serve de referência
para o dia em que o Delfos tiver execução real: um pipeline de hooks/middlewares por etapa
(validação → resolução de fonte → dispatch → coleta de resultado), mantendo cada etapa isolável.

---

## Plugins & extensibilidade

A extensibilidade é o coração do produto. Pontos de extensão típicos:

- **Field types** — novos tipos de campo de collection.
- **Collection types / templates** — modelos de tabela (ex.: calendar collection).
- **Blocks** — novos componentes de UI configuráveis.
- **Actions** — operações invocáveis sobre recursos.
- **Data sources** — bancos externos, APIs de terceiros.
- **Auth providers** — estratégias de autenticação.
- **Middlewares** — interceptação de requisições.

O catálogo oficial passa de **100 plugins**. Plugins de terceiros e plugins gerados por IA usam
exatamente a **mesma arquitetura** dos oficiais — não há caminho privilegiado.

> Para o Delfos: a inspiração não é virar no-code, mas definir **contratos de extensão**
> estáveis para widgets de dashboard, conectores e text-generation assistido por LLM.

---

## Connectors

NocoBase trata fontes externas pelo **Data Source Manager**, um plugin que centraliza a
gestão de collections e fields de todas as fontes — mas que **não acessa** as fontes por si só.
O acesso real é delegado a **plugins de data source** específicos (banco externo, API de
terceiros). Catálogo e execução são, portanto, responsabilidades separadas.

Esse desenho ecoa o Delfos: `connections`/`datasets`/`field-mappings` formam o catálogo
declarativo, enquanto a execução real é responsabilidade futura do `delfos-connectors`
(ver ADR-0008, ADR-0012). A separação **catálogo ≠ executor** é um acerto a manter.

---

## Cache, filas, workers

NocoBase oferece **workflows** (motor BPM) com gatilhos e nós extensíveis para automação de
negócio — aproximação de orquestração assíncrona. Não há, no material público, ênfase em uma
camada de cache distribuído como pilar arquitetural.

No Delfos, cache/fila/worker/scheduler são **explicitamente fora de escopo** na fase atual
(ver ADR-0007). NocoBase não muda essa decisão; apenas mostra que automação pode ser modelada
como grafo de nós quando o Delfos chegar a runtime real.

---

## Semantic layer

NocoBase **não possui** uma semantic layer dedicada de BI (métricas governadas, dimensões,
medidas reutilizáveis). O equivalente funcional é o **data model**: collections + fields +
relações servem como camada semântica de propósito geral, consumida por blocks de chart.

Para o Delfos, isso reforça uma oportunidade: uma futura semantic layer própria — ancorada em
`field-mappings` e `query-definitions` — seria um **diferencial de BI** que NocoBase não entrega.

---

## Permissions

O ACL de NocoBase é baseado em **papel × recurso × ação**, com granularidade que chega ao
**campo** (read/write por campo, por papel). Suporta "permission snippets", middlewares de
permissão e condições. Usuários podem ser organizados em **departamentos** hierárquicos, usados
inclusive como variáveis em workflows e expressões.

Comparação com o Delfos (ADR-0017):

| Dimensão | NocoBase | Delfos |
|---|---|---|
| Sujeito | Papel / departamento | Papel (`owner`, etc.) por tenant |
| Granularidade | Recurso, ação, campo, menu, plugin | Endpoint + papel |
| Isolamento | Por app / data source | `tenantId` obrigatório |

A granularidade **field-level** é a inspiração mais direta — aplicável ao mascaramento de dados
do Delfos (ADR-0023) e a permissões sobre `datasets`/`field-mappings`.

---

## Tenancy

NocoBase suporta **multi-app**: várias aplicações no mesmo processo. A própria documentação
adverte que o modo *process-sharing* é adequado apenas a **teste e demo**, não a produção
isolada.

O Delfos adota tenancy como **invariante de primeira classe**: `tenantId` é fronteira de
isolamento obrigatória em toda query (ver ADR-0009). O contraste é instrutivo: o Delfos **não
deve** seguir o modelo process-sharing leniente de NocoBase.

---

## Scalability

A camada de abstração no-code, segundo críticas públicas, pode tornar-se **gargalo** em alta
concorrência e cenários de baixa latência. Há também relatos de limites práticos na importação
de grandes volumes. A flexibilidade do modelo de blocks tem custo de performance.

Lição para o Delfos: capacidades de execução real devem ter **caminhos otimizados** e não
depender de uma camada genérica de interpretação de schema em hot paths.

---

## Embedded analytics

NocoBase não tem um produto de **embedded analytics** dedicado; a "incorporação" acontece pela
própria natureza de internal-tool platform — apps inteiras são o entregável. Não há SDK de
embed isolado destacado.

Para o Delfos, embedded analytics permanece **oportunidade futura** (ver `ideas-for-delfos.md`),
sem precedente forte a copiar daqui.

---

## APIs

NocoBase expõe **HTTP APIs** sobre recursos (resources/actions) e suporte a **MCP** e **CLI**
para integração com agentes externos. As APIs são geradas a partir do data model — cada
collection vira recursos REST-like automaticamente.

O Delfos já expõe API REST documentada via Swagger; a ideia transferível é a **geração de
contrato a partir do modelo declarativo** (datasets → endpoints previsíveis).

---

## AI integration

Na linha 2.0, NocoBase posiciona **AI Employees**: agentes de IA dentro de workflows e da
construção de apps. Pontos relevantes:

- Cada agente de IA tem **seu próprio papel** no ACL.
- Comportamento é **permission-controlled** e **auditado**.
- Integração via MCP, HTTP API e CLI com plataformas externas (Dify, n8n, Coze).
- Material público reporta **instabilidade** (loops, parâmetros não suportados).

Para o Delfos, a governança — *agente de IA é um sujeito de ACL como qualquer outro* — é o
princípio a preservar quando o AI assistant futuro existir (ver ADR-0025).

---

## Orchestration

A orquestração é entregue pelo plugin de **Workflow** (BPM): grafos de gatilhos e nós
(aprovação, operações de dados, notificações, lógica customizada), extensíveis sem limite.
É a peça que aproxima NocoBase de automação de processos.

No Delfos, orquestração de execução é **futura** e deve respeitar o command envelope do
runtime↔connectors (ver ADR-0015). O modelo de grafo de nós é uma referência conceitual válida.

---

## Relacionado

- [`./overview.md`](./overview.md)
- [`./ux-patterns.md`](./ux-patterns.md)
- [`./premium-features.md`](./premium-features.md)
- [`./ideas-for-delfos.md`](./ideas-for-delfos.md)
- [`./anti-patterns.md`](./anti-patterns.md)
- ADR: [`../../adr/adr-0008-connectors-and-integration-execution.md`](../../adr/adr-0008-connectors-and-integration-execution.md)
- ADR: [`../../adr/adr-0014-runtime-execution-requests-foundation.md`](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- ADR: [`../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md`](../../adr/adr-0015-runtime-connectors-command-envelope-bridge.md)
- ADR: [`../../adr/adr-0017-roles-and-permissions-model.md`](../../adr/adr-0017-roles-and-permissions-model.md)
