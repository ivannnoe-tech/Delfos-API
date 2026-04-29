# ADR-0010 - Analytics storage and retention

- **Status**: Accepted
- **Data**: 2026-04-29
- **Fase impactada**: Fase 2 e evolucao posterior, sem implementacao nesta ADR

---

## Status

Esta ADR registra uma decisao arquitetural sobre storage analitico operacional leve,
snapshots/resultados materializados e politica de retencao. Ela nao implementa colecoes
analiticas, jobs de retencao, TTL indexes, cache, staging, conectores reais, execucao de queries
reais, migracao de banco, alteracao de schemas atuais ou contrato publico nesta fase.

## Contexto

O MongoDB e o banco principal atual do Delfos Analytics. A foundation ja usa MongoDB para tenants,
users, connections, credentials, field-mappings, datasets, query-definitions,
dashboard-definitions e audit interno.

A ADR-0005 definiu MongoDB como store de configuracao do Delfos. A ADR-0008 definiu o papel
futuro do `delfos-connectors` para execucao de integracoes. A ADR-0009 definiu que o produto pode
comecar com implantacao isolada por cliente/grupo e continuar tenant-aware.

O volume esperado por cliente/grupo e moderado. Nao ha expectativa inicial de dezenas de milhoes
de linhas por cliente. A politica provavel de retencao sera manter 12 meses de movimentacao
detalhada por padrao, podendo chegar ate 36 meses conforme contrato ou plano.

Introduzir storage analitico especializado cedo demais aumenta complexidade operacional,
observabilidade, backup, deploy, custo e integracao. Ao mesmo tempo, a evolucao do produto pode
exigir armazenamento de dados sincronizados, snapshots, resultados materializados, execucoes de
sync e logs operacionais seguros.

## Decisao

O MongoDB permanece como banco principal inicial do Delfos.

O MongoDB podera ser usado inicialmente para:

- catalogo e configuracao da plataforma;
- dados sincronizados de volume moderado;
- snapshots de datasets;
- resultados materializados de queries;
- snapshots de widgets de dashboard;
- sync runs e metadados de ingestao;
- logs operacionais seguros relacionados a sync/ingestao.

O uso analitico inicial deve priorizar dados preparados, snapshots, agregados e resultados
materializados. A API principal nao deve depender de consultas pesadas, livres e recorrentes sobre
dados brutos a cada request.

Os contratos publicos do `delfos-api` nao devem ser acoplados ao MongoDB. DTOs, respostas REST e
semantica de erro devem continuar representando o contrato do produto, nao nomes de colecoes,
formato interno de documentos, indices ou decisoes de persistencia.

Se o volume, a complexidade analitica, a latencia ou a necessidade de consultas ad hoc crescerem,
o projeto podera introduzir storage analitico especializado por ADR futura. Opcoes possiveis
incluem PostgreSQL/JSONB, ClickHouse, DuckDB, BigQuery ou outro mecanismo apropriado ao caso de
uso e operacao.

Esta ADR amplia o planejamento futuro da ADR-0005 para permitir storage analitico operacional leve
no MongoDB quando essa capacidade for implementada, mantendo guardrails de tenant, seguranca,
retencao e desacoplamento de contratos.

## Politica inicial de retencao

- Dados detalhados sincronizados devem ter retencao padrao de 12 meses.
- A retencao de dados detalhados pode chegar ate 36 meses conforme contrato, plano ou decisao
  comercial registrada.
- Dados mais antigos podem ser removidos, arquivados ou convertidos em agregados historicos.
- Agregados historicos podem ter retencao maior do que dados brutos/detalhados, quando fizer
  sentido para analise, auditoria operacional ou contrato.
- Jobs de retencao devem ser controlados, observaveis e auditaveis.
- TTL automatico para dados de cliente nao deve ser criado sem decisao explicita, avaliacao de
  impacto, auditoria e estrategia de recuperacao.

## Uso esperado do MongoDB

O MongoDB deve continuar armazenando catalogos e configuracoes da foundation. Para uso analitico
operacional leve, ele tambem podera armazenar documentos preparados para leitura do produto, desde
que o desenho respeite tenant scope, volume moderado e consultas previsiveis.

Usos esperados:

- dados sincronizados ja normalizados ou minimamente preparados por dataset;
- snapshots de datasets em pontos de referencia;
- resultados de query calculados previamente;
- resultados de widgets de dashboard prontos para leitura;
- metadados de execucao de sync e ingestao;
- logs operacionais seguros, sem payload sensivel desnecessario.

Usos nao desejados:

- varreduras completas por request de usuario;
- consultas ad hoc livres e sem limites sobre dados brutos;
- colecao unica e generica para todos os dados de todos os clientes;
- armazenamento de segredo, token, senha ou connection string real em snapshots/logs;
- acoplamento de endpoint publico a formato interno de documento MongoDB.

## Colecoes futuras conceituais

As colecoes abaixo sao conceituais. Esta ADR nao cria schemas, migrations, repositorios, endpoints
ou contratos para elas.

- `dataset_records`: registros sincronizados e preparados de um dataset, sempre tenant-scoped.
- `dataset_snapshots`: snapshots de dataset em uma data ou execucao de referencia.
- `query_result_snapshots`: resultados materializados de query definitions aprovadas.
- `dashboard_widget_snapshots`: resultados prontos para renderizacao de widgets de dashboard.
- `sync_runs`: execucoes de sincronizacao com status, tempos, contadores e metadados seguros.
- `sync_run_logs`: eventos operacionais sanitizados de uma execucao de sync.
- `ingestion_batches`: lotes de ingestao, controle de progresso e metadados seguros.

## Recomendacoes futuras de indices

Indices devem nascer das consultas reais e devem incluir `tenantId` quando a colecao for
tenant-scoped. Recomendacoes iniciais para avaliacao futura:

- `tenantId`;
- `tenantId + datasetKey`;
- `tenantId + datasetKey + referenceDate`;
- `tenantId + datasetKey + occurredAt`;
- `tenantId + datasetKey + movementDate`;
- `tenantId + syncRunId`;
- `tenantId + status`;
- `tenantId + datasetKey + status`;
- `tenantId + syncRunId + status`.

Campos como `referenceDate`, `occurredAt` e `movementDate` devem ser escolhidos conforme a
semantica do dataset. Nao se deve criar indices amplos ou excessivos sem evidencias de consulta,
cardinalidade e custo de escrita.

## Guardrails de consulta e performance

- Consultas sobre dados tenant-scoped devem sempre filtrar e validar `tenantId`.
- Listagens devem ter paginacao obrigatoria e limites maximos.
- Dashboards devem preferir snapshots, agregados ou resultados materializados.
- Requests interativos devem evitar varreduras completas de colecao.
- Consultas devem preferir filtros delimitados, especialmente por tenant, dataset, status e janela
  de data.
- A arquitetura deve evitar colecao generica do tipo `all_client_data`.
- Contratos publicos nao devem expor nomes de colecoes, formato interno de documentos ou campos
  puramente tecnicos do MongoDB.
- TTL automatico nao deve ser usado para dados de cliente sem decisao explicita e auditoria.
- Jobs de retencao devem ser controlados, auditaveis e reversiveis quando aplicavel.
- Se uma consulta exigir processamento pesado ou recorrente, deve ser avaliado snapshot,
  materializacao, job assincrono ou storage analitico especializado.

## Seguranca e governanca

- Dados sincronizados devem respeitar tenant scope em escrita, leitura, listagem, auditoria e
  retencao.
- Buscas por ID em colecoes tenant-scoped devem incluir `tenantId`.
- Dados sensiveis devem ser minimizados antes de persistir.
- Logs operacionais nao devem gravar payload sensivel, segredo real, token, senha, chave privada,
  header sensivel ou connection string real.
- Snapshots e resultados materializados nao devem carregar segredo, token, senha, connection
  string real ou credencial descriptografada.
- `credentialRef` deve continuar sendo referencia segura e tenant-scoped, nao substituto para
  expor segredo real.
- Auditoria deve registrar tenant, usuario/ator quando aplicavel, acao, recurso, status e
  metadados seguros.
- Erros armazenados ou retornados devem ser sanitizados e nao devem expor stack trace, payload de
  cliente ou detalhe sensivel de API/banco externo.
- Backups contendo dados sincronizados devem ser tratados como dados de cliente e seguir politica
  de seguranca, acesso minimo e retencao aprovada.
- Isolamento fisico por ambiente nao substitui validacao logica por `tenantId`.

## Consequencias

### Positivas

- Simplicidade operacional inicial, com menos servicos para operar.
- Boa aderencia ao volume moderado esperado por cliente/grupo.
- Flexibilidade para datasets com schemas variados e evolutivos.
- Menor complexidade do que introduzir storage analitico especializado cedo demais.
- Caminho pragmatico para snapshots e resultados materializados usados por dashboards.
- Retencao inicial mais clara para dados detalhados e agregados historicos.
- Contratos publicos podem permanecer estaveis mesmo se o storage mudar no futuro.

### Trade-offs

- MongoDB pode nao ser a melhor opcao para consultas analiticas complexas, ad hoc ou de alto
  volume.
- Sera necessario disciplinar indices, paginacao, filtros e materializacao para evitar degradacao.
- Retencao, arquivamento e agregacao historica exigirao jobs e observabilidade quando forem
  implementados.
- Uma migracao futura para storage especializado pode exigir backfill, dual-write temporario ou
  reprocessamento de snapshots.
- A simplicidade inicial reduz complexidade agora, mas nao elimina a necessidade de reavaliacao
  quando volume, SLA ou padrao de consulta mudarem.

## Fora de escopo nesta fase

Esta ADR nao autoriza nem implementa:

- implementar colecoes analiticas agora;
- implementar retencao agora;
- criar TTL indexes agora;
- criar cache real agora;
- criar staging real agora;
- criar conectores reais;
- executar queries reais;
- conectar em banco ou API de cliente;
- alterar schemas atuais;
- alterar contratos publicos;
- migrar banco;
- adicionar PostgreSQL, ClickHouse, DuckDB, BigQuery ou outro storage analitico agora;
- alterar codigo TypeScript;
- adicionar dependencias;
- documentar ou versionar segredo real.

## Referencias

- `AGENTS.md`
- `SECURITY.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/phase-2-vision.md`
- `docs/data-access-policy.md`
- `docs/database-model.md`
- `docs/api-foundation-contracts.md`
- `docs/foundation-data-catalog.md`
- `docs/foundation-credentials-and-security.md`
- `docs/foundation-tenancy-and-admin-resources.md`
- `docs/operations-runbook.md`
- ADR-0001
- ADR-0005
- ADR-0007
- ADR-0008
- ADR-0009
