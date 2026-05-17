# ADR-0012 - Local connectors agent and on-premise sources

- **Status**: Accepted
- **Data**: 2026-04-30
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 2 e evolucao posterior, sem implementacao nesta ADR
- **Implementação**: não iniciada
- **Atualizacao 2026-05-03**: a ADR-0013 incluiu local agent na fronteira documental do futuro
  `delfos-connectors`. O local agent continua nao implementado e esta ADR permanece valida como
  decisao futura, sem supersedencia.

---

## Status

Esta ADR registra uma decisao arquitetural futura para acesso a fontes locais e on-premise por
meio de um agente local do `delfos-connectors`, chamado conceitualmente de
`delfos-connectors local agent`.

Ela nao implementa agente local, servico novo, fila, cache, staging, scheduler, conectores reais,
execucao real de query, protocolo definitivo, endpoint de teste de conexao, tela de teste,
alteracao de schema, alteracao de contrato publico, codigo TypeScript ou dependencia nesta fase.

## Contexto

O Delfos Analytics possui dois repositorios principais: `delfos-api` e `delfos-web`. A foundation
do `delfos-api` ja possui catalogos declarativos para tenants, users, connections, credentials,
field-mappings, datasets, query-definitions, dashboard-definitions, execution-preview demo e audit
interno.

A ADR-0008 definiu o `delfos-connectors` como servico futuro responsavel por integracoes, sync,
ingestao, chamadas externas e execucao pesada. A ADR-0009 definiu o modelo de isolamento e tenant.
A ADR-0010 definiu direcao para storage analitico e retencao. A ADR-0011 definiu que dashboards e
widgets devem consumir query-definitions, que por sua vez consomem datasets.

Ainda nao existe `delfos-connectors`, agente local, fila, cache, scheduler, execucao real de query
ou conector real.

O produto precisara futuramente acessar fontes que existem apenas dentro da rede do cliente, como
bancos SQL locais, APIs internas, arquivos em disco ou compartilhamentos de rede e sistemas
legados sem exposicao publica segura. Exigir que o cliente abra bancos, portas internas ou
servicos legados diretamente para a internet aumentaria risco operacional e superficie de ataque.

## Decisao

Fontes locais ou on-premise nao devem exigir exposicao direta de bancos, arquivos ou servicos
internos do cliente para a internet como caminho padrao.

O Delfos adotara futuramente um modelo de agente local do `delfos-connectors` para acessar fontes
dentro da rede do cliente. Esse agente local sera instalado ou executado no ambiente do cliente,
com escopo controlado, e sera responsavel por:

- testar conexao com fontes locais;
- descobrir schema permitido;
- executar sync e ingestao aprovados;
- acessar bancos, APIs internas, arquivos locais ou compartilhamentos de rede;
- aplicar limites, mascaramento e sanitizacao antes de devolver resultados;
- reportar status e erros seguros ao `delfos-api`.

O `delfos-api` continuara responsavel por contratos, governanca, autenticacao/autorizacao,
catalogo, credentials por `credentialRef`, auditoria e orquestracao.

O `delfos-web` continuara responsavel pela interface de configuracao, operacao, visualizacao de
status e experiencia guiada, sem acessar fontes locais diretamente.

## Modos de execucao futuros

### delfos-connectors cloud/server

Modo usado quando a fonte e acessivel de forma segura pelo ambiente Delfos.

Casos esperados:

- APIs publicas ou privadas acessiveis pelo ambiente do Delfos;
- integracoes sem restricao de rede local;
- fontes com allowlist de origem, VPN, private link ou mecanismo equivalente aprovado;
- execucoes em que nao seja necessario instalar componente dentro da rede do cliente.

Mesmo nesse modo, a execucao deve respeitar tenant scope, credentialRef, timeouts, retry/backoff,
limites de concorrencia, limites de resposta, sanitizacao de erro e auditoria segura.

### delfos-connectors local agent

Modo usado quando a fonte e acessivel apenas dentro da rede do cliente.

Casos esperados:

- bancos locais;
- APIs internas;
- arquivos em disco local;
- arquivos em compartilhamentos de rede;
- sistemas legados que nao devem ser expostos para a internet.

A preferencia arquitetural e que o agente local se comunique de saida com o Delfos, evitando a
abertura de portas inbound no ambiente do cliente como requisito padrao. O protocolo definitivo,
autenticacao entre componentes, heartbeats, atualizacao de versao e canais de transporte serao
definidos por decisao futura.

## Fontes locais previstas

Fontes previstas para avaliacao futura:

- SQL Server;
- PostgreSQL;
- MySQL/MariaDB;
- Firebird, como possibilidade futura;
- SQLite, quando fizer sentido como fonte local simples;
- APIs internas HTTP ou equivalentes;
- arquivos CSV em disco ou compartilhamento de rede;
- arquivos Excel em disco ou compartilhamento de rede;
- arquivos XML em disco ou compartilhamento de rede;
- outras fontes customizadas aprovadas caso a caso.

Essa lista nao adiciona dependencias, drivers, conectores ou suporte real nesta fase.

## Fluxos futuros esperados

### Teste de conexao

1. Usuario configura connection, credential e dataset no `delfos-web`.
2. `delfos-api` valida autenticacao, autorizacao, tenant scope, permissao e consistencia da
   configuracao.
3. `delfos-api` registra a solicitacao com auditoria segura e orquestra a execucao futura.
4. `delfos-connectors local agent` executa o teste dentro da rede do cliente.
5. Resultado seguro volta para `delfos-api`.
6. `delfos-web` exibe status, duracao, classe de erro e mensagem segura.

Segredos nunca devem ser retornados, logados ou auditados. O teste nao deve buscar volume grande
de dados nem retornar payload bruto da fonte.

### Descoberta de schema

1. Usuario solicita descoberta de schema para uma connection ou dataset.
2. `delfos-api` valida tenant, permissao, connection, credentialRef e escopo permitido.
3. Agente local lista tabelas, views, endpoints, arquivos, colunas ou campos permitidos.
4. Agente local pode retornar amostra limitada e mascarada quando isso for explicitamente
   permitido.
5. `delfos-api` usa o resultado seguro para apoiar criacao de datasets e field-mappings.
6. `delfos-web` apresenta a descoberta como assistente guiado, nao como acesso livre a fonte.

Dados sensiveis nao devem ser retornados sem mascaramento, limite explicito e finalidade clara.
Payloads de descoberta devem ser pequenos, sanitizados e adequados apenas para configuracao.

### Sync e ingestao

1. `delfos-api` orquestra a execucao por acao manual, agendamento futuro ou evento aprovado.
2. `delfos-api` valida tenant, permissao, dataset, field-mappings, queryDefinition quando
   aplicavel e credentialRef.
3. Agente local executa a coleta dentro da rede do cliente.
4. Agente local aplica timeout, retry/backoff, limites de concorrencia, limites de resposta e
   validacoes de schema.
5. Resultados sao enviados para storage, staging, snapshots ou mecanismo equivalente definido por
   ADR futura.
6. Status, contadores, tempos, classes de erro e auditoria segura sao registrados.

Execucoes devem respeitar tenant scope, limites de concorrencia e politicas de retencao. O agente
nao deve enviar segredo real, payload sensivel desnecessario ou dados fora do escopo do dataset.

## Seguranca e governanca

- Nao abrir banco do cliente diretamente para a internet como padrao.
- Preferir comunicacao de saida do agente local para o Delfos.
- Credenciais devem usar `credentialRef` e provider seguro.
- Segredo real nao deve trafegar pelo `delfos-web`.
- Agente local nunca deve logar segredo real, token, senha, chave privada, header sensivel ou
  connection string real.
- Agente local deve respeitar tenant scope em toda execucao.
- Agente local deve aplicar timeout, retry/backoff, rate limit quando aplicavel e limites de
  concorrencia.
- Respostas de teste e schema devem ser limitadas e mascaradas.
- Logs e auditoria nao devem conter payload sensivel, dados operacionais brutos, rows completas
  ou amostras sem finalidade.
- Comandos SQL livres nao devem ser permitidos para usuarios comuns.
- Operacoes destrutivas como `DROP`, `UPDATE`, `DELETE` e `EXEC` ficam fora do fluxo controlado.
- Consultas futuras devem ser geradas a partir de datasets e query-definitions governados, nao de
  SQL livre arbitrario.
- Erros devem ser sanitizados antes de chegar ao usuario final.
- Qualquer protocolo entre `delfos-api`, `delfos-connectors` e agente local deve prever
  autenticacao mutua ou mecanismo equivalente, autorizacao, rotacao, revogacao, observabilidade e
  menor privilegio.
- Atualizacao, versionamento e revogacao de agentes devem ser tratados por decisao futura antes
  de implementacao.

## Implicacoes para a tela de conexoes

A futura tela de connections/fontes de dados devera suportar uma experiencia guiada e segura para
fontes cloud/server e fontes via agente local.

Campos e estados esperados:

- tipo da fonte;
- modo de acesso: cloud/server ou agente local;
- agente vinculado, quando aplicavel;
- status do agente: online, offline ou unknown;
- ultima comunicacao;
- versao do agente;
- teste de conexao;
- descoberta de schema;
- credenciais mascaradas;
- datasets vinculados;
- field mappings.

A tela de teste de conexao pode parecer um "mini Insomnia/Postman" apenas de forma controlada.
Quando aplicavel, ela pode permitir configurar endpoint, metodo, parametros e body dentro dos
limites do dataset/connection. Headers devem ser allowlisted e nao sensiveis. Credenciais devem
ser referenciadas por `credentialRef`. Respostas devem ser limitadas e mascaradas, sem expor ou
persistir payload sensivel.

Essa experiencia nao deve virar cliente HTTP livre, console SQL livre ou explorador irrestrito da
rede do cliente.

## Consequencias

### Positivas

- Reduz necessidade de expor portas, bancos e servicos internos do cliente.
- Melhora compatibilidade com clientes on-premise e sistemas legados.
- Mantem `delfos-api` como fronteira de governanca, contratos e auditoria.
- Preserva `delfos-web` como interface, sem acesso direto a fontes internas.
- Permite evoluir conexoes locais sem acoplar widgets, dashboards ou query-definitions a detalhes
  fisicos da fonte.
- Cria caminho para sync, ingestao e descoberta de schema com menor superficie de ataque.

### Trade-offs

- Exige instalacao e manutencao de agente local.
- Exige estrategia futura de atualizacao e versionamento do agente.
- Observabilidade e suporte ficam mais complexos, pois parte da execucao ocorre dentro do ambiente
  do cliente.
- Exige protocolo seguro entre API, connectors e agente.
- Diagnostico de rede, permissao local, firewall, compartilhamentos de arquivo e drivers pode
  exigir suporte operacional adicional.
- Ambientes de cliente podem ter restricoes diferentes de sistema operacional, rede, proxy,
  certificados e politicas internas.

### Neutras

- O modo cloud/server continua valido para fontes acessiveis com seguranca pelo ambiente Delfos.
- O modo local agent nao substitui datasets, field-mappings ou query-definitions; ele apenas muda
  onde a execucao fisica acontece.
- A decisao preserva a possibilidade de implantar o Delfos em ambiente isolado por cliente, como
  descrito na ADR-0009.

## Fora de escopo nesta fase

Esta ADR nao autoriza nem implementa:

- implementar `delfos-connectors local agent` agora;
- criar servico novo agora;
- criar fila agora;
- criar cache ou staging agora;
- criar scheduler agora;
- criar conectores reais agora;
- conectar em banco, API interna ou arquivo de cliente agora;
- criar protocolo definitivo de comunicacao agora;
- criar endpoint de teste de conexao agora;
- criar tela de connection test agora;
- alterar schemas atuais;
- alterar endpoints existentes;
- alterar contratos publicos;
- alterar codigo TypeScript;
- adicionar dependencias;
- adicionar drivers de banco ou bibliotecas de leitura de arquivo;
- executar query real;
- executar sync ou ingestao real;
- documentar ou versionar segredo real.

## Referencias

- `AGENTS.md`
- `DESIGN.md`
- `SECURITY.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/phase-2-vision.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md`
- `docs/api-foundation-contracts.md`
- `docs/foundation-data-catalog.md`
- `docs/foundation-credentials-and-security.md`
- `docs/foundation-tenancy-and-admin-resources.md`
- `docs/operations-runbook.md`
- ADR-0001 → supersedida pela ADR-0032
- ADR-0005
- ADR-0008
- ADR-0009
- ADR-0010
- ADR-0011
