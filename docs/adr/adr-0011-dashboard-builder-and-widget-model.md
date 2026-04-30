# ADR-0011 - Dashboard builder and widget model

- **Status**: Accepted — decisão tomada, nada implementado além dos catálogos declarativos
- **Data**: 2026-04-29
- **Fase impactada**: Fase 1 e Fase 2, como decisao arquitetural e de produto
- **Implementação atual**: `dashboard-definitions` e `query-definitions` existem como catálogos declarativos (sem execução). O módulo `execution-preview` gera demonstração em memória. Dashboard builder, widget runtime, renderização real e query builder **não implementados**.

---

## Status

Esta ADR registra uma decisao arquitetural e de produto para o modelo futuro de dashboard builder
e widgets configuraveis do Delfos Analytics. Ela nao implementa dashboard builder, query builder,
editor visual, execucao real de query, renderizacao final de dashboards, novos schemas, novos
endpoints, novo contrato publico, `delfos-connectors`, cache, fila, scheduler ou staging nesta
fase.

## Contexto

A foundation atual do `delfos-api` ja possui catalogos administrativos para tenants, users,
connections, credentials, field-mappings, datasets, query-definitions, dashboard-definitions,
execution-preview demo e audit interno.

Esses recursos ainda sao declarativos. `dashboard-definitions` armazena layout, secoes, widgets e
filtros globais de forma configuravel, mas nao existe dashboard builder implementado no
`delfos-web`, nao existe query builder real, nao existe execucao real de query e nao existe
renderizacao final de dashboard real.

O `execution-preview` atual permite previews demonstrativos seguros de query-definitions e
dashboard-definitions. Esse preview deve continuar claro para o usuario e para o produto: ele e
demo, nao dado real.

O Delfos precisa registrar a direcao futura do builder antes de implementar telas, contratos ou
execucao real, para evitar widgets acoplados a banco, API externa, SQL livre ou payload bruto de
cliente.

## Decisao

Dashboards serao compostos por secoes, filtros globais e widgets.

Widgets serao unidades visuais configuraveis. Um widget define o tipo visual e as opcoes de
renderizacao, mas nao acessa banco, API externa, credenciais, dados brutos ou conectores
diretamente.

Todo widget que dependa de dados deve apontar para uma `queryDefinition`. A `queryDefinition`
define dataset, metricas, dimensoes, filtros, ordenacoes, limite padrao e demais parametros
declarativos da consulta. O `dataset` representa a origem logica dos dados e se relaciona com
connections, credentials e field-mappings.

Regra de ouro:

- Dashboard nao conhece banco ou API externa.
- Widget nao conhece banco ou API externa.
- Widget consome `queryDefinition`.
- `queryDefinition` consome `dataset`.
- Execucao real futura sera orquestrada pelo `delfos-api` e executada pelo
  `delfos-connectors`, snapshots, cache, staging ou mecanismo equivalente aprovado por ADR.

## Modelo conceitual

### Dashboard

Representa uma experiencia analitica configuravel por tenant. Um dashboard organiza secoes,
filtros globais, widgets, layout, tags, metadados seguros e configuracoes de exibicao.

O dashboard nao deve carregar dado operacional, credencial, segredo, SQL livre ou referencia
direta a banco/API externa.

### Secao

Representa um agrupamento logico e visual dentro do dashboard, como visao geral, detalhe por canal
ou analise por periodo. Secoes ajudam a organizar leitura, ordem, densidade e layout, mas nao
executam consultas.

### Filtro global

Representa um filtro aplicavel ao dashboard inteiro ou a um conjunto de widgets compativeis. Um
filtro global pode alimentar query-definitions que aceitem o mesmo campo, operador ou parametro
declarado.

Filtros globais sao configuracao e valores de interface. Eles nao devem armazenar tokens, senhas,
headers sensiveis, connection strings ou payload sensivel.

### Widget

Representa a unidade visual do dashboard. Um widget pode ser um KPI, card de metrica, grafico,
tabela, ranking, texto, filtro ou componente custom aprovado.

Um widget pode definir titulo, descricao, tamanho, posicao, tipo visual, visualizacao, formato,
opcoes de exibicao e filtros proprios. Widgets com dados devem referenciar uma
`queryDefinition`.

### Query definition

Representa a camada semantica declarativa consumida por widgets e relatorios. Ela define dataset,
metricas, dimensoes, filtros, ordenacoes, granularidades, limite padrao e tipo de consulta.

Na foundation atual, query-definitions nao executam query real. No futuro, serao a entrada
governada para execucao real.

### Dataset

Representa a origem logica dos dados. O dataset se relaciona com:

- `connection`, que descreve a origem tecnica ou integracao;
- `credentialRef`, por meio de credentials protegidas, quando a connection exigir auth;
- `field-mappings`, que traduzem campos da origem para campos canonicos ou declarativos do
  Delfos.

O dataset nao deve ser substituido por acesso direto do widget a banco, URL, header, SQL ou
payload externo.

## Relacao entre dashboard, widget, queryDefinition e dataset

O encadeamento conceitual aprovado e:

```text
dashboardDefinition
  -> sections
  -> filters globais
  -> widgets
      -> queryDefinition
          -> dataset
              -> connection
              -> credentials por credentialRef
              -> field-mappings
```

Esse encadeamento preserva governanca e desacoplamento:

- o `delfos-web` monta a experiencia guiada;
- o `delfos-api` valida contratos, tenant scope, permissoes, referencias e auditoria;
- o `delfos-connectors` ou mecanismo equivalente futuro executa integracoes e consultas pesadas;
- snapshots/cache/staging futuros podem acelerar leitura sem alterar a semantica do widget.

## Tipos iniciais de widgets e visualizacoes

Tipos iniciais de widget:

- `metric_card`;
- `chart`;
- `table`;
- `ranking`;
- `text`;
- `filter`;
- `custom`.

Tipos de visualizacao futuros:

- `number`;
- `line`;
- `bar`;
- `area`;
- `pie`;
- `donut`;
- `table`;
- `ranking`;
- `comparison`;
- `custom`.

Esses tipos representam direcao de produto e arquitetura. Esta ADR nao altera enums, DTOs, schemas
ou contratos publicos atuais.

## Fluxos futuros esperados

### Criacao de widget

1. Usuario cria ou abre um dashboard.
2. Usuario adiciona um widget.
3. Usuario escolhe o tipo visual.
4. Usuario escolhe uma `queryDefinition` existente, quando o widget depender de dados.
5. Usuario configura titulo, descricao, formato, tamanho, posicao, opcoes visuais e filtros.
6. Usuario visualiza preview demo enquanto nao houver execucao real.
7. Usuario salva o widget dentro da `dashboardDefinition`.

Widgets de texto ou filtros podem nao depender de `queryDefinition`, desde que nao carreguem
segredo, dado operacional bruto ou acesso direto a fonte externa.

### Query builder guiado

1. Usuario escolhe um dataset.
2. Usuario escolhe uma metrica.
3. Usuario escolhe uma dimensao, quando aplicavel.
4. Usuario escolhe filtros e ordenacoes permitidos.
5. Sistema cria ou atualiza uma `queryDefinition`.
6. Widget passa a consumir essa `queryDefinition`.

O query builder guiado deve criar configuracao declarativa. Ele nao deve liberar SQL livre, URL
livre, header livre, body livre ou acesso direto a fonte externa.

## Filtros

Dashboards podem ter filtros globais. Widgets podem ter filtros proprios.

Filtros globais podem alimentar query-definitions compativeis quando houver correspondencia
declarada de campo, operador, tipo e escopo. Widgets podem combinar filtros globais com filtros
proprios, desde que a combinacao seja validada pelo backend antes de execucao real.

Regras:

- filtros devem respeitar tenant scope;
- filtros devem respeitar contratos de sanitizacao da foundation;
- valores sensiveis nao devem ser salvos em filtros;
- filtros nao devem armazenar token, senha, chave, header sensivel ou connection string;
- filtros nao devem permitir injecao de SQL, URL, header ou body livre;
- auditoria nao deve gravar payload livre de filtros.

## Preview e execucao futura

Na fase inicial, previews usam `execution-preview` demo.

O preview demo deve sempre indicar `mode: "demo"` ou equivalente explicito. O produto nunca deve
fingir que preview demonstrativo e dado real, nem usar nomes, valores ou payloads reais de
clientes em exemplos.

Preview real futuro dependera de `delfos-connectors`, snapshots, cache, staging ou mecanismo
equivalente aprovado. O `delfos-api` deve continuar como fronteira de contrato, validacao,
tenant scope, autorizacao, auditoria e orquestracao.

Execucao real futura deve:

- validar dashboard, widget, queryDefinition e dataset no mesmo tenant;
- validar permissoes do ator;
- resolver credenciais apenas server-side;
- aplicar limites de volume, tempo, pagina, concorrencia e resposta;
- sanitizar erros antes de retornar ao frontend;
- evitar exposicao de segredo, token, senha, connection string ou credentialRef desnecessario.

## Seguranca e governanca

- Widgets nao armazenam secrets.
- Widgets nao executam SQL livre.
- Dashboards nao devem conter credenciais.
- Filtros nao devem armazenar tokens, senhas, headers sensiveis ou connection strings.
- Widgets nao devem acessar APIs externas, bancos externos, filas, cache ou staging diretamente.
- `credentialRef` nao deve ser exposto sem necessidade em payloads de preview ou execucao.
- Auditoria deve registrar mudancas de dashboard e widget sem payload sensivel.
- Auditoria deve registrar metadados seguros, como tenant, ator, recurso, acao, status e contagens
  relevantes, sem rows, secrets, filtros livres ou dados operacionais brutos.
- Execucao real deve respeitar tenant scope em leitura, escrita, listagem, auditoria, cache,
  snapshots e jobs.
- Payloads de preview e execucao nao devem expor segredo, token, senha, connection string,
  header sensivel ou credentialRef desnecessario.
- Erros devem ser seguros e nao devem revelar stack trace, segredo, query interna, payload de
  cliente ou detalhe sensivel de API externa.

## Implicacoes para o delfos-web

O `delfos-web` deve oferecer uma experiencia guiada para criacao de dashboards e widgets.

O usuario deve escolher tipo visual, `queryDefinition` e opcoes visuais por controles
estruturados. O builder nao deve permitir SQL livre, URL livre, header livre, credencial livre ou
acesso direto a fontes externas.

O preview inicial deve usar endpoints de `execution-preview` e exibir de forma clara que os dados
sao demonstrativos. Estados de loading, vazio, erro, sem permissao e configuracao incompleta
continuam obrigatorios.

O design visual definitivo do builder e da renderizacao final sera tratado em fase futura com base
nas referencias aprovadas, no Design System e na abstracao `ChartRenderer`.

## Fases recomendadas

1. Fase 1: catalogos foundation e `execution-preview` demo.
2. Fase 2: `delfos-web` consumir preview demo.
3. Fase 3: dashboard preview simples.
4. Fase 4: widget builder simples usando query-definitions existentes.
5. Fase 5: query builder guiado.
6. Fase 6: execucao real via `delfos-connectors` e storage analitico.

Essas fases sao recomendacao de evolucao. Elas nao alteram o roadmap oficial sem priorizacao e
planejamento especificos.

## Consequencias

### Positivas

- Modelo mais estruturado, seguro e governavel para dashboards.
- Widgets ficam desacoplados de bancos, APIs externas e conectores.
- `queryDefinition` vira a fronteira semantica para consultas futuras.
- Facilita troca futura do mecanismo de execucao sem reescrever widgets.
- Permite preview demo hoje e preview real futuro com fronteiras claras.
- Reduz risco de vazamento de secrets por configuracao visual.
- Mantem o `delfos-web` focado em experiencia, sem acessar fonte externa diretamente.

### Trade-offs

- Exige criacao e manutencao de query-definitions.
- Reduz liberdade para consultas totalmente livres.
- Exige builder guiado mais cuidadoso do que um editor de SQL generico.
- Exige validacao de compatibilidade entre filtros globais, widgets e query-definitions.
- Exige governanca para evoluir tipos de widget e visualizacao sem quebrar contratos.
- Pode exigir etapas adicionais para usuarios avancados que esperam consulta ad hoc livre.

### Neutras

- Tipos como `ranking`, `comparison` e visualizacoes custom podem ser introduzidos de forma
  incremental.
- Widgets sem dados, como `text` e alguns `filter`, podem existir sem `queryDefinition`, desde
  que continuem seguros e declarativos.
- Snapshots/cache/staging futuros podem mudar a origem fisica do resultado sem mudar a relacao
  conceitual widget -> queryDefinition -> dataset.

## Fora de escopo nesta fase

Esta ADR nao autoriza nem implementa:

- implementar dashboard builder agora;
- implementar editor visual;
- implementar drag and drop;
- implementar query builder real;
- implementar execucao real;
- implementar dashboard real ou renderizacao final no web;
- alterar schemas atuais;
- alterar endpoints atuais;
- alterar contratos publicos;
- alterar codigo TypeScript;
- adicionar dependencias;
- criar `delfos-connectors` agora;
- criar cache, fila, scheduler ou staging agora;
- criar snapshots ou storage analitico agora;
- executar SQL, Mongo aggregation analitico, API externa ou conector real;
- documentar, versionar ou usar segredo real.

## Referencias

- `AGENTS.md`
- `DESIGN.md`
- `SECURITY.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/phase-2-vision.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md`
- `docs/api-contracts.md`
- `docs/api-foundation-contracts.md`
- `docs/database-model.md`
- `docs/foundation-auth-and-errors.md`
- `docs/foundation-data-catalog.md`
- `docs/foundation-credentials-and-security.md`
- `docs/foundation-tenancy-and-admin-resources.md`
- `docs/operations-runbook.md`
- ADR-0001
- ADR-0003
- ADR-0005
- ADR-0007
- ADR-0008
- ADR-0009
- ADR-0010
