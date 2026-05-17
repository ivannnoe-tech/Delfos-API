# Airbyte — Padrões de UX

> Tipo: referência estratégica · Produto estudado: Airbyte · Status: conceitual/futuro — não autoriza implementação

---

## Observação inicial

Airbyte **não é** uma ferramenta de BI: não há dashboards analíticos, drill-down de
métricas ou visualizações de negócio. Sua UX é de **configuração e operação de pipelines**.
Portanto, este documento traduz os padrões de UX do Airbyte para o que é aproveitável no
Delfos — sobretudo nos **builders de configuração** e nos **estados de execução** —, e
marca explicitamente o que não tem equivalente.

---

## "Dashboard" UX

O equivalente ao dashboard no Airbyte é a tela de **connections**: uma lista das conexões
fonte→destino, cada uma com status de saúde, último sync, próximo sync agendado e
frequência. É um *painel operacional*, não analítico.

Padrões úteis:

- Status visual imediato por linha (sucesso / falha / em execução / pausado).
- "Connection status" agregando saúde da pipeline em um indicador.
- Acesso rápido da linha para a timeline de execuções.

Para o Delfos, isso inspira uma futura tela de **operação de execuções** (`runtime` /
execution requests), distinta das telas analíticas.

---

## Builders

O **Connector Builder** é o padrão de UX mais valioso para estudo:

- Interface visual sobre um formato declarativo (YAML low-code).
- Estrutura em seções progressivas: configuração global, autenticação, processamento de
  registros, paginação, sync incremental, particionamento, error handling.
- **Stream tester embutido:** botão "Test" executa um sync de teste do conector e mostra
  os registros retornados ao lado da configuração — feedback imediato.
- O `spec` do conector dirige a renderização dos formulários: a UI é gerada a partir do
  schema, não codificada à mão.

Lição para os builders do Delfos (`dashboard-definitions`, `query-definitions`): **schema
dirige a UI** + **preview lado a lado** + **seções progressivas**.

---

## Filtros & filtros globais

Não há filtros analíticos globais (não é BI). O análogo é a **seleção de streams** dentro
de uma connection: o usuário escolhe quais streams sincronizar e, por stream, o sync mode
e os campos. É uma "filtragem de escopo de configuração", não de dados em runtime.

---

## Drill-down

Não há drill-down analítico. O análogo é o drill operacional: connection → job →
**logs do job** → detalhe de mensagens/erros. A navegação vai do agregado (saúde da
connection) ao específico (linha de log de uma tentativa).

---

## Navegação & exploração

- Workspace como contêiner de navegação (sources, destinations, connections, builder).
- Wizards passo a passo para criar fonte/destino/conexão.
- O `discover` apresenta o catálogo de streams descobertos para o usuário escolher —
  exploração guiada pelo que a fonte oferece.

---

## Visualizações

Airbyte praticamente não tem visualização de dados. Há indicadores de status, contadores
de registros movidos e barras de progresso de sync. Nenhum gráfico analítico — coerente
com não ser BI. O Delfos não tem o que aprender aqui; suas visualizações vêm do
`chart_renderer` (`adr-0003`).

---

## Shortcuts

UX de produtividade focada em automação: API, Terraform provider e SDKs permitem
"configurar como código". Não há atalhos de teclado analíticos relevantes.

---

## UX enterprise

- RBAC visível na UI (papéis por organização/workspace).
- Connection timeline: histórico imutável e auditável de execuções.
- Data residency e data planes regionais expostos como escolha de configuração.

---

## Responsive behavior

A UI do Airbyte é desktop-first (ferramenta de operação). Não há ênfase em mobile —
diferente do Delfos, que é Flutter Web com requisitos de tema claro/escuro e Design
System próprio.

---

## Loading / Empty / Error states

Aqui há padrões diretamente aproveitáveis:

| Estado | Padrão Airbyte | Aplicação Delfos |
|---|---|---|
| Loading | Progresso de sync com contagem de registros movidos | `DelfosLoadingState` com progresso real quando houver |
| Empty | Workspace sem connections orienta a criar a primeira | `DelfosEmptyState` com call-to-action |
| Error | Erro de sync com status, mensagem e link para logs | `DelfosErrorState` com causa + ação de diagnóstico |
| Permission | Ações limitadas por RBAC na própria UI | `DelfosPermissionState` |

O **error handling do Connector Builder** é exemplar: classifica respostas por status
code / corpo / headers e decide *continuar, repetir ou falhar* — um modelo de erro
estruturado, não um "deu erro" genérico.

---

## Interaction patterns

- **Test antes de salvar:** validar a configuração (`check`) e testar um sync antes de
  comprometer a connection.
- **Configuração progressiva:** o usuário só vê a próxima seção quando a anterior está
  válida.
- **Estado persistente entre sessões:** o builder mantém o trabalho em andamento.

---

## Contextual actions

- Da linha de connection: executar sync manual ("Sync now"), pausar, editar, ver timeline.
- Do job: re-executar, baixar logs.
- Ações sempre ancoradas no objeto e no seu estado atual (não há ação sem contexto).

Lição para o Delfos: ações contextuais no `runtime` futuro devem ser dirigidas pelo estado
da execução (uma execução falha oferece "reexecutar"; uma em curso oferece "cancelar").

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- [Índice da biblioteca de referências](../README.md)
