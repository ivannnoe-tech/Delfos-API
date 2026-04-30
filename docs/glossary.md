# Glossário — Delfos Analytics

> Status: referência viva.

---

## Termos principais

### Delfos Analytics

Plataforma de dashboards, KPIs, gráficos e relatórios personalizados para empresas e parceiros white label.

### Tenant

Empresa/cliente isolado dentro do Delfos.

### Multi-tenant

Arquitetura em que múltiplas empresas usam a mesma aplicação, com dados e permissões isolados.

### delfos-api

Backend NestJS responsável por autenticação, configuração, permissões, conectores e contratos REST.

### delfos-web

Frontend Flutter Web responsável pela experiência visual e analítica.

### Connection

Configuração de acesso à API custom de um cliente.

### Dataset

Endpoint ou recurso consultável dentro de uma conexão.

### FieldMapping

De/Para entre campos retornados pela API do cliente e campos canônicos do Delfos.

### De/Para

Mapeamento de um campo de origem para um campo de destino.

### Campo canônico

Nome padronizado usado internamente pelo Delfos para relatórios, dashboards e widgets.

### Dashboard

Tela configurável composta por widgets, KPIs, gráficos e filtros.

### Widget

Unidade visual dentro de um dashboard, como KPI, gráfico, tabela ou ranking.

### Report

Relatório configurável, geralmente tabular, com filtros, colunas e exportação.

### ChartRenderer

Abstração do frontend que renderiza gráficos sem expor a biblioteca concreta às features.

### White label

Personalização visual por cliente/parceiro, como logo, nome e cor primária.

### RBAC

Role-Based Access Control. Modelo de permissões baseado em perfis.

### Access token

Token JWT de curta duração usado para autenticar chamadas.

### Refresh token

Token usado para renovar sessão. Deve ser rotacionável.

### Cache transitório

Cache em memória, com TTL, não persistente e não compartilhado entre instâncias.

### ADR

Architecture Decision Record. Documento que registra decisão arquitetural relevante.

### LGPD

Lei Geral de Proteção de Dados. Lei brasileira que regula tratamento de dados pessoais.

### Fase 1

Fase atual: Delfos consome APIs dos clientes e armazena apenas configuração.

### Fase 2

Fase futura possível: ingestão própria, histórico, cache persistente, filas e recursos avançados.

---

## Termos da foundation e execução

### QueryDefinition

Configuração declarativa de uma consulta: dataset, filtros, campos, ordenação e limites. Define *o que* será consultado, não executa diretamente.

### DashboardDefinition

Configuração declarativa de um dashboard: título, widgets ordenados, cada widget referenciando uma QueryDefinition.

### credentialRef

Referência opaca a uma credencial armazenada de forma criptografada. Formato: `cred_<ObjectId>`. O segredo real nunca trafega pelo frontend nem aparece em logs ou respostas de API.

### execution-preview

Módulo que gera dados de demonstração em memória para simular a execução de QueryDefinitions e DashboardDefinitions. Não executa chamadas externas reais e não persiste resultados.

### delfos-connectors

Serviço futuro (Fase 2) responsável por conectar o Delfos a fontes externas, executar queries reais e realizar sync/ingestão. Não existe ainda — ver ADR-0008.

### local agent

Componente futuro do `delfos-connectors` que seria instalado na rede do cliente para acessar fontes locais (bancos, APIs internas, arquivos) sem expô-las à internet. Não implementado — ver ADR-0012.

### sync run

Execução de coleta de dados de um dataset, com registro de status, contadores, duração e erros. Planejado para Fase 2.

### snapshot

Resultado materializado de uma execução de query, armazenado para servir visualizações sem nova chamada externa. Planejado para Fase 2.

### materialized result

Dado analítico pré-calculado e armazenado, equivalente a snapshot. Distinto do cache transitório em memória da Fase 1.
