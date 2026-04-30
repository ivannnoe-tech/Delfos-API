# Fluxo de configuracao de fontes externas

> Status: fluxo futuro planejado.  
> Escopo: configuracao de fontes externas, teste de conexao controlado, descoberta de schema,
> datasets e field mappings.  
> Nao implementa endpoints, telas, conectores, agente local, sync, ingestao ou execucao real.

## Visao geral

Este documento descreve o fluxo futuro para configurar fontes externas de dados no Delfos
Analytics. Ele consolida o modelo de external source configuration flow e o conceito de teste de
conexao controlado, parecido com um "mini Insomnia/Postman", mas limitado por contratos,
permissoes, tenant scope, sanitizacao e governanca.

Na foundation atual, `connections`, `credentials`, `datasets`, `field-mappings`,
`query-definitions`, `dashboard-definitions` e `execution-preview` existem como recursos
declarativos. Ainda nao existe `delfos-connectors`, endpoint real de teste de conexao, descoberta
real de schema, conector real, agente local, fila, cache, scheduler, sync ou ingestao.

## Objetivo do fluxo

O objetivo futuro e permitir que um usuario autorizado configure uma fonte externa de dados de
forma guiada e segura, sem expor credenciais, sem permitir acesso livre a bancos/APIs e sem
persistir payload operacional bruto indevido.

O fluxo deve permitir:

- cadastrar configuracao tecnica nao sensivel da fonte;
- registrar credenciais por fluxo protegido;
- salvar e usar apenas `credentialRef` nas configuracoes;
- testar conexao com resposta limitada e segura;
- descobrir schema de forma controlada;
- criar ou confirmar datasets;
- criar field mappings explicitos;
- permitir preview demo ou preview real controlado quando a arquitetura futura existir;
- preparar sync e ingestao futuros executados pelo `delfos-connectors`.

## Componentes envolvidos

### Connection

Representa a configuracao tecnica da fonte externa, como nome, tipo, provedor, modo de acesso,
URL, host, porta, database, timeout, estrategia de paginacao, status, metadados e settings
sanitizados.

`connection` nao deve armazenar segredo real. Quando uma credencial existir, a connection deve
referenciar uma credencial por `credentialRef` ou indicador equivalente seguro.

### CredentialRef

Representa a referencia segura para uma credencial protegida. O segredo real fica em provider
seguro de credenciais e nunca deve retornar em GET/list, logs, auditoria ou payloads de preview.

O frontend pode exibir `credentialRef` quando necessario e `maskedPreview` quando permitido, mas
nunca o valor integral.

### Dataset

Representa o conjunto logico de dados consumido pelo produto. Um dataset pode nascer a partir de
schema descoberto e precisa ser tenant-scoped. Campos esperados incluem `datasetKey`, `name`,
`sourceType`, `schemaMode` e `fields`.

### Field mapping

Mapeia campos externos para campos logicos do Delfos. O mapping deve ser explicito, revisavel,
tenant-scoped e seguro. Ele nao deve armazenar segredo e serve de base para query-definitions,
dashboards e relatorios.

### Query definition

Define metricas, dimensoes, filtros, ordenacoes e dataset consumidos por widgets e relatorios.
Consultas futuras devem ser geradas a partir de datasets e query-definitions governados, nao de
SQL livre arbitrario.

### Dashboard definition

Define a estrutura declarativa de dashboards, secoes, filtros e widgets. Widgets que consomem
dados apontam para query-definitions; dashboards e widgets nao acessam banco ou API externa
diretamente.

### delfos-connectors

Servico futuro responsavel por executar testes, discovery, sync, ingestao, previews reais e
consultas governadas quando essa capacidade existir.

No modo cloud/server, executa quando a fonte e acessivel pelo ambiente Delfos. No modo local
agent, executa dentro da rede do cliente por meio do agente local.

## Relacao com ADRs existentes

- ADR-0008 define o `delfos-connectors` como executor futuro de integracoes, sync, ingestao e
  chamadas externas.
- ADR-0009 define isolamento por tenant e possibilidade de ambientes isolados por cliente/grupo.
- ADR-0010 define direcao para storage analitico, snapshots e retencao futura.
- ADR-0011 define que dashboards e widgets consomem query-definitions, e query-definitions
  consomem datasets.
- ADR-0012 define o agente local do `delfos-connectors` para fontes on-premise e locais.

Este documento detalha o fluxo operacional futuro de configuracao, sem criar implementacao.

## Fluxo principal de configuracao

1. Usuario ou admin cria uma fonte de dados no `delfos-web`.
2. Usuario escolhe o tipo da fonte.
3. Usuario escolhe o modo de acesso: cloud/server ou local agent.
4. Usuario informa dados tecnicos nao sensiveis, como nome, provider, sourceType, baseUrl, host,
   porta, database, ambiente, timeout e estrategia de paginacao quando aplicavel.
5. Usuario informa credenciais sensiveis em fluxo protegido.
6. `delfos-api` salva a credencial em provider seguro e retorna apenas `credentialRef` e
   `maskedPreview`, quando permitido.
7. Usuario solicita teste de conexao.
8. `delfos-api` valida autenticacao, autorizacao, role, tenant scope, connection, credentialRef e
   limites da solicitacao.
9. `delfos-connectors` executa o teste no modo adequado: cloud/server ou local agent.
10. Resultado seguro volta para `delfos-api` e `delfos-web`.
11. Usuario solicita descoberta de schema.
12. Sistema retorna metadados e amostras pequenas, limitadas e mascaradas quando permitido.
13. Usuario cria ou confirma datasets.
14. Usuario revisa e salva field mappings.
15. Sistema permite preview demo ou, futuramente, preview real controlado.
16. `delfos-connectors` executa sync ou ingestao quando essa capacidade for implementada e
    aprovada.

## Tipos de fonte suportados futuramente

Tipos previstos:

- API REST;
- SQL Server;
- PostgreSQL;
- MySQL/MariaDB;
- Firebird futuramente;
- SQLite/local files;
- CSV/Excel/XML;
- APIs internas;
- custom.

Esses tipos sao conceituais neste documento. Eles nao adicionam drivers, dependencias, adapters ou
contratos publicos nesta fase.

## Modos de acesso

### Cloud/server

Usado para fontes acessiveis de forma segura pelo ambiente Delfos.

Exemplos:

- APIs publicas com autenticacao adequada;
- APIs privadas acessiveis pelo servidor do Delfos;
- fontes acessiveis por allowlist, VPN, private link ou mecanismo equivalente aprovado;
- integracoes sem restricao de rede local.

### Local agent

Usado para fontes acessiveis apenas dentro da rede do cliente.

Exemplos:

- bancos locais;
- APIs internas;
- arquivos em disco;
- compartilhamentos de rede;
- sistemas legados sem exposicao publica segura.

O local agent deve evitar expor banco local para a internet como padrao. A preferencia futura e
comunicacao de saida do agente para o Delfos, com protocolo seguro definido por ADR ou documento
tecnico posterior.

## Modelo da tela de connections

A futura tela de connections deve ser guiada e restritiva. Campos conceituais:

- nome da conexao;
- descricao;
- provider ou sistema de origem;
- `sourceType`;
- `accessMode`: `cloud/server` ou `local_agent`;
- `baseUrl`, quando aplicavel;
- host, porta e database, quando aplicavel;
- environment: production, staging, homologation ou local;
- timeout;
- pagination strategy, quando a fonte for API;
- status;
- `agentId`, status, versao e `lastSeen`, quando o modo for local agent;
- metadata e settings sanitizados;
- credenciais mascaradas;
- datasets vinculados;
- field mappings vinculados.

Metadata e settings nao devem conter tokens, senhas, connection strings reais, authorization
headers, chaves privadas ou valores de alta entropia.

## Credenciais e credentialRef

Tipos de credencial previstos:

- API key;
- bearer token;
- basic auth;
- OAuth futuramente;
- database username/password;
- connection string apenas se realmente necessario e sempre protegida;
- custom.

Regras:

- nenhuma credencial deve voltar em GET/list;
- respostas podem exibir apenas `credentialRef`, status, tipo, provider, nome e `maskedPreview`;
- `secretValue`, token, senha, connection string real e headers sensiveis nunca fazem parte do
  contrato publico de resposta;
- auditoria deve registrar apenas metadados seguros;
- rotacao e revogacao devem manter historico seguro sem expor o valor real;
- credenciais devem ser tenant-scoped e associadas ao contexto de connection quando aplicavel.

## Teste de conexao controlado

O teste de conexao pode parecer um "mini Insomnia/Postman" apenas de forma limitada e governada.
Ele deve servir para validar configuracao, nao para virar cliente HTTP livre, console SQL livre ou
explorador irrestrito da rede do cliente.

### API

Campos permitidos de forma controlada:

- metodo HTTP permitido pela connection/dataset;
- endpoint relativo;
- query params declarados ou permitidos;
- headers nao sensiveis e allowlisted;
- body de teste limitado, quando aplicavel;
- credenciais via `credentialRef`;
- timeout curto.

Resultado esperado:

- status do teste;
- duracao;
- `httpStatus`, quando aplicavel;
- classe de erro segura;
- mensagem segura;
- resposta limitada e mascarada quando permitido.

Regras:

- nunca logar token, senha, authorization header, API key ou header sensivel;
- nunca auditar payload bruto;
- limitar tamanho de resposta;
- mascarar valores sensiveis;
- classificar erros sem expor stack trace ou detalhes internos da fonte.

### SQL e fontes locais

O teste de conexao SQL/local deve:

- validar host, porta, database e autenticacao;
- listar tabelas e colunas permitidas apenas quando seguro;
- executar apenas probes controlados;
- nao permitir SQL livre para usuario comum;
- bloquear operacoes destrutivas como `DROP`, `DELETE`, `UPDATE` e `EXEC`;
- preferir execucao pelo local agent quando a fonte estiver na rede do cliente.

Consultas futuras devem ser geradas por datasets, field mappings e query-definitions governados.

## Descoberta de schema

### API

Discovery de API deve usar chamada limitada e controlada:

- endpoint relativo permitido;
- amostra pequena;
- limite de tamanho e tempo;
- inferencia de campos e tipos;
- mascaramento de valores sensiveis;
- sem persistir payload bruto como configuracao.

### SQL

Discovery de SQL deve priorizar metadados:

- tabelas e views permitidas;
- colunas;
- tipos;
- chaves quando possivel;
- relacoes quando seguro e util;
- sem varredura completa de tabelas;
- sem executar SQL livre enviado pelo usuario comum.

### Arquivos

Discovery de arquivos deve usar leitura limitada:

- cabecalho;
- amostra pequena;
- limite de linhas;
- limite de tamanho;
- inferencia de tipos;
- mascaramento de valores sensiveis.

Arquivos grandes ou compartilhamentos de rede devem respeitar timeout, limite de leitura e
politica de erro segura.

## Datasets e field mappings

### Datasets

O dataset representa o conjunto logico de dados que sera usado por query-definitions, dashboards e
relatorios.

Um dataset pode nascer a partir de schema descoberto, mas deve ser revisado antes de virar base de
uso real. Campos esperados:

- `tenantId`;
- `connectionId`;
- `datasetKey`;
- `name`;
- `sourceType`;
- `schemaMode`;
- `fields`;
- status;
- metadata e settings sanitizados.

Fields podem ser declarados ou inferidos. Mesmo quando inferidos, devem ser revisaveis e nao devem
carregar linhas ou payload operacional bruto.

### Field mappings

Field mappings conectam campos externos a campos logicos do Delfos.

Regras:

- mapping deve ser explicito e revisavel;
- mapping deve ser tenant-scoped;
- mapping nao deve armazenar segredo;
- sourcePath e targetField devem ser tratados como configuracao, nao como payload operacional;
- alteracoes relevantes devem ser auditaveis sem gravar payload sensivel;
- mappings servem de base para query-definitions, dashboards e relatorios.

## Relacao com queryDefinitions e dashboards

O encadeamento conceitual futuro e:

```text
connection
  -> credentialRef
  -> dataset
      -> field-mappings
      -> query-definition
          -> dashboard-definition/widgets
```

`queryDefinition` define metricas, dimensoes, filtros e ordenacoes sobre um dataset. Widgets e
dashboards devem consumir query-definitions, nao bancos, APIs ou arquivos diretamente.

Na fase atual, previews seguem sendo demo via `execution-preview`. Preview real futuro dependera
de `delfos-connectors`, local agent quando aplicavel, snapshots/cache/staging ou mecanismo
equivalente aprovado.

## Relacao com delfos-connectors

Responsabilidades futuras:

- `delfos-api` salva contratos/configuracoes, valida tenant e permissoes, administra catalogo,
  registra auditoria e orquestra execucoes.
- `delfos-connectors` executa testes, discovery, sync, ingestao e preview real controlado quando
  implementado.
- local agent executa quando a fonte esta dentro da rede do cliente.
- cloud/server executa quando a fonte e acessivel pelo ambiente Delfos.

O `delfos-web` nunca deve acessar fonte externa diretamente.

## Seguranca e governanca

Regras obrigatorias:

- nunca expor credenciais;
- nunca logar payload sensivel;
- nunca auditar rows ou amostras completas;
- mascarar amostras;
- limitar tamanho de resposta;
- aplicar timeout;
- aplicar retry/backoff futuramente onde fizer sentido;
- respeitar `tenantId`;
- respeitar roles e permissoes;
- proteger endpoints administrativos com `x-delfos-admin-key` enquanto auth temporaria estiver em
  uso;
- manter respostas de erro sanitizadas;
- nao expor stack trace, segredo, header sensivel, connection string real ou payload bruto;
- nao permitir URL, header, body ou SQL livre fora de contratos controlados;
- nao persistir dado operacional bruto como configuracao.

Auditoria deve registrar eventos como criacao/alteracao de connection, credential, dataset,
field mapping, teste de conexao e discovery com metadados seguros: tenant, ator, recurso, status,
duracao, classe de erro e IDs tecnicos. Auditoria nao deve registrar credenciais, rows, payloads
brutos, headers sensiveis ou amostras completas.

## Estados futuros

Estados conceituais:

- connection: `draft`, `active`, `inactive`, `error`, `archived`;
- credential: `active`, `revoked`, `rotated`;
- agent: `online`, `offline`, `unknown`, `outdated`;
- test result: `success`, `failed`, `timeout`, `unauthorized`, `unreachable`, `invalid_schema`.

Esses estados podem orientar UI e contratos futuros, mas nao alteram enums ou schemas atuais.

## Fora de escopo nesta fase

Este documento nao autoriza nem implementa:

- implementar tela agora;
- implementar endpoint de teste agora;
- implementar discovery real agora;
- implementar `delfos-connectors` agora;
- implementar local agent agora;
- conectar em banco, API real ou arquivo real agora;
- executar SQL real agora;
- alterar schemas atuais;
- alterar contratos publicos;
- alterar endpoints existentes;
- adicionar dependencias;
- adicionar drivers de banco;
- criar fila, cache, staging ou scheduler;
- persistir payload operacional bruto;
- documentar ou versionar segredo real.
