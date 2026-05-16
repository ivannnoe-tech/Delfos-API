# Glossario - Delfos Analytics

> Status: referencia viva.

---

## Termos principais

### Delfos Analytics

Plataforma de dashboards, KPIs, graficos e relatorios personalizados para empresas e parceiros
white label.

### customer/account/workspace

Termos conceituais para uma camada futura acima de tenant, caso o Delfos opere em ambiente
compartilhado para varios clientes/grupos. Nao existem como schema ou contrato atual; ver ADR-0009.

### Tenant

Escopo logico usado pelo produto para isolar configuracoes, catalogos, credenciais e auditoria.
Em um ambiente isolado, pode representar empresa, unidade, estabelecimento, loja, matriz, filial ou
divisao operacional.

### Empresa/unidade/estabelecimento

Recortes de negocio que podem ser modelados como tenants conforme o cliente/grupo contratante. A
definicao exata depende do desenho comercial e operacional de cada ambiente.

### Multi-tenant

Arquitetura em que multiplos tenants usam a mesma aplicacao ou ambiente, com dados, configuracoes
e permissoes isolados por `tenantId`.

### delfos-api

Backend NestJS responsavel por contratos REST, auth temporaria/futura, governanca, tenant scope,
catalogos declarativos, referencias seguras de credenciais, auditoria e orquestracao. No estado
atual, nao executa conectores reais nem acessa API, banco, arquivo ou sistema de cliente.

### delfos-web

Frontend Flutter Web responsavel pela experiencia visual, status da API, catalogos foundation e
preview demo.

### Connection

Registro declarativo que descreve uma fonte logica futura e metadados de acesso, incluindo
`credentialRef` quando aplicavel. No estado atual, nao executa teste real nem chamada externa.

### Dataset

Catalogo declarativo de uma origem logica de dados. No estado atual, nao busca dados reais e nao
executa consulta. Futuramente podera ser consumido por `delfos-connectors` ou mecanismo aprovado.

### FieldMapping

De/Para declarativo entre campos de origem/logicos e campos canonicos ou semanticos do Delfos. No
estado atual, nao transforma payload real de cliente.

### De/Para

Mapeamento de um campo de origem para um campo de destino.

### Campo canonico

Nome padronizado usado internamente pelo Delfos para relatorios, dashboards e widgets futuros.

### Dashboard

Experiencia analitica configuravel composta por secoes, widgets, KPIs, graficos e filtros. O
runtime final de dashboard e futuro.

### Widget

Unidade visual dentro de um dashboard, como KPI, grafico, tabela, ranking, texto ou filtro.
Widgets com dados devem apontar para uma `queryDefinition`; eles nao acessam banco/API externa.

### Report

Relatorio configuravel, geralmente tabular, com filtros, parametros, blocos e opcoes declarativas
de exportacao. Na foundation atual existe como `reportDefinition`; runtime, geracao real de
arquivo, envio e agendamento continuam futuros.

### ChartRenderer

Abstracao do frontend que renderiza graficos sem expor a biblioteca concreta as features.

### White label

Personalizacao visual por cliente/parceiro, como logo, nome e cor primaria. Planejado/futuro para
experiencia final.

### RBAC

Role-Based Access Control. Modelo de permissoes baseado em perfis.

### Access token

Token JWT de curta duracao planejado para auth futura. Nao existe no estado atual.

### Refresh token

Token planejado para renovar sessao futura. Nao existe no estado atual.

### Cache transitorio

Conceito futuro/deferido de cache em memoria com TTL. Nao existe no estado atual; cache real,
Redis, fila, worker e scheduler continuam fora de escopo sem decisao explicita.

### ADR

Architecture Decision Record. Documento que registra decisao arquitetural relevante.

### LGPD

Lei Geral de Protecao de Dados. Lei brasileira que regula tratamento de dados pessoais.

### Retencao (auditoria e logs)

Prazo padrao pelo qual registros sao mantidos antes de eliminacao, anonimizacao ou compactacao.
Politica inicial: logs de auditoria/seguranca seguros 365 dias; eventos de
runtime/execution-requests 180 dias; logs tecnicos/debug/diagnostico 30 dias. Raw payloads,
secrets e credenciais reais nunca sao persistidos. Ver ADR-0018.

### Fase 1

Estado atual: foundation administrativa/declarativa. Inclui catalogos, contratos, auth temporaria,
credenciais protegidas, auditoria e `execution-preview` demo em memoria. Nao inclui dado real de
cliente, conector real, cache, fila, scheduler, JWT/login/OAuth real, dashboard runtime final ou
query builder.

### Fase 2

Fase futura possivel: integracoes reais, `delfos-connectors`, local agent, ingestao, storage
analitico, snapshots, cache/staging, filas e recursos avancados conforme ADRs e autorizacao.

---

## Termos da foundation e execucao

### queryDefinition

Configuracao declarativa de uma consulta: dataset, metricas, dimensoes, filtros, ordenacao e
limites. Define o que podera ser consultado no futuro; nao executa query real no estado atual.

### dashboardDefinition

Configuracao declarativa de um dashboard: layout, secoes, filtros, widgets e referencias a
queryDefinitions. Nao e dashboard runtime final.

### reportDefinition

Configuracao declarativa de um relatorio: layout, secoes, blocos, filtros, parametros,
exportOptions e referencias opcionais a queryDefinitions/dashboardDefinitions. Nao gera arquivo,
nao executa query e nao agenda envio no estado atual.

### credentialRef

Referencia opaca a uma credencial armazenada de forma protegida. Formato atual:
`cred_<ObjectId>`. O segredo real nunca trafega pelo frontend nem aparece em logs ou respostas de
API.

### execution-preview

Modulo que gera dados de demonstracao em memoria para simular previews de queryDefinitions e
dashboardDefinitions. Nao executa chamadas externas reais, nao persiste resultados e sempre deve
ficar identificado como demo.

### executionRequest

Registro administrativo foundation de uma solicitacao futura de runtime, com `kind`, references,
status e metadados seguros. Na foundation atual, nao executa query, conector, worker, fila,
scheduler, cache, exportacao, e-mail ou acesso a fonte de cliente.

### delfos-connectors

Tem dois sentidos:

1. **Repositorio `delfos-connectors`**: existe como foundation documental e governanca. Versiona
   contratos conceituais, fronteiras multitenant, security boundaries e ADR-0013. Nao contem
   codigo, conector real, worker, fila, cache, scheduler, local agent ou execucao.
2. **Servico/runtime `delfos-connectors`**: nao existe ainda. Sera o executor futuro de
   integracoes, sync, ingestao, preview real ou query real quando essa capacidade for aprovada.

Ver ADR-0008 (decisao original) e ADR-0013 (foundation documental) no repositorio
`delfos-connectors` (`docs/adr/ADR-0013-connectors-boundary-and-multitenant-runtime-contract.md`).

### local agent

Componente futuro do `delfos-connectors` para acessar fontes locais ou on-premise dentro da rede
do cliente sem expor bancos, APIs internas ou arquivos diretamente a internet. Nao implementado;
ver ADR-0012.

### sync run

Execucao futura de coleta/sincronizacao de dados de um dataset, com status, contadores, duracao e
erros. Planejado para fase futura.

### ingestion batch

Lote futuro de ingestao usado para controlar progresso, origem, status e metadados seguros de uma
coleta/processamento. Planejado na direcao da ADR-0010.

### snapshot

Resultado futuro armazenado em ponto de referencia para servir consultas ou dashboards sem nova
execucao externa. Nao existe no estado atual.

### materialized result

Dado analitico futuro pre-calculado e armazenado, equivalente a resultado materializado de uma
query ou widget. Distinto do preview demo atual e inexistente na foundation.

---

## Termos do runtime/bridge e execucao futura

### connector bridge

Ponte conceitual entre o runtime do `delfos-api` e o executor `delfos-connectors`. Transforma um
`executionRequest` em um command de conector. No estado atual existe apenas como `foundation-only`
em `src/modules/runtime/bridge/` (types e testes), sem dispatch nem provider.

### bridge resolver

Componente `foundation-only` do `runtime/bridge` que prepara, em memoria, um command a partir de
um `executionRequest` (`prepareCommand`). Nao faz transporte nem dispatch real.

### reference resolver

Componente `foundation-only` do `runtime/bridge` que resolve referencias declarativas (connections,
datasets, field-mappings, `credentialRef`) de forma conservadora e source-agnostic. Nao faz decrypt
e nao acessa fontes externas.

### credentialRef

Referencia opaca a uma credencial armazenada de forma protegida. Formato atual: `cred_<ObjectId>`.
O segredo real nunca trafega pelo frontend nem aparece em logs ou respostas de API. Ver tambem a
entrada `credentialRef` na secao de foundation.

### safeMetadata

Conjunto de metadados seguros expostos por contratos de runtime/bridge sem revelar segredos,
payload bruto de cliente ou dados sensiveis. E o resultado de aplicar masking e exclusao de
forbidden fields.

### dry-run

Verificacao de readiness de um `executionRequest` que valida pre-condicoes sem executar query,
conector ou acesso a fonte real. Faz parte da foundation atual de runtime.

### demo execute

Operacao de demonstracao do runtime/`execution-preview` que produz resultado ficticio em memoria,
sempre identificado como demo. Nao executa chamada externa nem persiste resultado.

### execution request

Registro administrativo `foundation implementada` de uma solicitacao futura de runtime, com `kind`,
references, status e metadados seguros. Na foundation atual nao executa query, conector, worker,
fila, scheduler, cache, exportacao, e-mail ou acesso a fonte de cliente. Equivale a
`executionRequest`.

### runtime event

Evento administrativo de ciclo de vida emitido pelo runtime do `delfos-api` (por exemplo, mudancas
de status de um `executionRequest`). E interno e administrativo; nao representa execucao real.

### connector event

Evento futuro originado do executor `delfos-connectors` durante execucao real. Nao existe no estado
atual; depende da fase de execucao real.

### capability

Descricao declarativa do que um conector futuro consegue fazer (operacoes, formatos, limites). Usada
para planejamento; nao habilita execucao real.

### analytics_text_generation

Capability assistiva de geracao textual analitica via LLM (narrativas de relatorio, explicacao de
dashboard, comparacao entre periodos, resumo executivo de KPIs, leitura de graficos, comentarios de
widget). Conceito de foundation/futuro: nao implementada e nao autorizada como integracao real.
Apoia a montagem da narrativa; nao executa, nao decide e nao acessa dados reais. Ver ADR-0025.

### LLM

Large Language Model (modelo de linguagem). No Delfos tem uso estritamente assistivo: monta texto
analitico a partir de dados ja agregados, sanitizados e mascarados. Modelo inicial recomendado
`gpt-4o-mini` (provider OpenAI), configuravel por ambiente e desligado por padrao. O LLM nunca
acessa banco, executa SQL, aciona conectores nem recebe secrets. Ver ADR-0025.

### AI-assisted

Marcacao de conteudo gerado por IA. Texto produzido pela capability `analytics_text_generation`
deve ser identificado como AI-assisted / gerado por IA e exige revisao humana; nunca e usado como
decisao automatica. Ver ADR-0025.

### dispatch

Envio efetivo de um command para execucao real pelo `delfos-connectors`. Permanece **proibido** no
estado atual; o `runtime/bridge` para na preparacao de command (`prepareCommand`), sem dispatch.

### foundation-only

Estado de um item que possui apenas skeleton, types e testes, sem runtime, provider NestJS,
endpoint ou dispatch. Aplica-se hoje ao `src/modules/runtime/bridge/` (bridge resolver, reference
resolver e adapters).

### masking

Tecnica de ocultar ou substituir valores sensiveis (segredos, dados pessoais) em metadados, logs e
respostas de API, preservando apenas o que e seguro expor.

### forbidden fields

Campos que nunca devem ser expostos em contratos, logs ou metadados (por exemplo, segredo de
credencial, payload operacional bruto do cliente). Sao removidos ao construir `safeMetadata`.

### tenant boundary

Fronteira de isolamento por `tenantId`. Toda leitura, escrita e referencia em runtime/bridge deve
respeitar essa fronteira; nenhum recurso de um tenant pode vazar para outro.
