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

### delfos-connectors

Servico futuro responsavel por integracoes, sync, ingestao, preview real ou query real quando essa
capacidade for aprovada. Nao existe ainda; ver ADR-0008.

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
