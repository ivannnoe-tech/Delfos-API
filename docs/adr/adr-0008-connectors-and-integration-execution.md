# ADR-0008 - delfos-connectors and integration execution

- **Status**: Accepted — decisão tomada, nada implementado
- **Data**: 2026-04-29
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 2, com fronteira arquitetural registrada desde a foundation
- **Implementação**: não iniciada
- **Implementação atual**: serviço/runtime `delfos-connectors` **não existe**. Nenhum conector real, fila, cache, scheduler, execução de query ou staging foi implementado. O módulo `execution-preview` gera apenas dados de demonstração em memória.
- **Atualização 2026-05-03**: a ADR-0013, mantida no repositório `delfos-connectors`, autorizou apenas a foundation documental, contratos conceituais e fronteiras multitenant do `delfos-connectors`. O serviço/runtime real, conectores reais, workers, filas, cache, scheduler, local agent, execução de SQL/API externa e descriptografia real de credenciais continuam fora de escopo. Esta ADR permanece válida; ADR-0013 a complementa no eixo documental, sem supersedê-la no ponto de execução real.

---

## Status

Esta ADR registra uma decisao arquitetural futura. Ela nao implementa `delfos-connectors`, nao
cria fila, cache, scheduler, staging, conector real, execucao de query ou novo contrato publico
nesta fase.

## Contexto

A foundation atual do `delfos-api` ja possui catalogos e recursos administrativos para tenants,
users, connections, credentials, field-mappings, datasets, query-definitions,
dashboard-definitions, auditoria interna, auth temporaria, contrato de erro e seed local.

Esses recursos sao declarativos: eles descrevem configuracao, catalogo, seguranca e governanca.
Ainda nao existe servico de conectores implementado, fila, cache distribuido, scheduler,
processamento assincrono, execucao real de query ou conector real.

Ao evoluir para integracoes reais, o Delfos precisara executar chamadas externas, sincronizacoes,
ingestao, processamento assincrono, retry/backoff, timeouts e limites de concorrencia. Essas
rotinas podem ser lentas, instaveis, dependentes de APIs ou bancos de clientes e sujeitas a
falhas externas. Colocar esse processamento pesado diretamente na API principal aumentaria o
risco operacional do `delfos-api`.

## Decisao

O servico futuro responsavel pela execucao de integracoes se chamara `delfos-connectors`.

O `delfos-api` continuara sendo a fronteira principal de contratos, autenticacao/autorizacao,
governanca, tenants, catalogos, referencias de credenciais, auditoria e orquestracao. A API pode
receber solicitacoes, validar permissoes, registrar auditoria e orquestrar ou enfileirar trabalho,
mas a execucao real de rotinas externas e pesadas deve ser delegada ao `delfos-connectors`.

O `delfos-web` continuara responsavel pela interface do usuario, sem acessar APIs ou bancos de
clientes diretamente.

Chamadas rapidas de validacao ou teste de conexao podem ser avaliadas caso a caso. Mesmo nesses
casos, a preferencia arquitetural e isolar execucao externa no `delfos-connectors`, especialmente
quando a chamada envolver credenciais, rede externa, dados operacionais, retry, timeout, volume de
dados ou risco de degradar a API principal.

## Responsabilidades por servico

### delfos-api

- Expor e versionar contratos REST consumidos pelo `delfos-web`.
- Validar autenticacao, autorizacao, RBAC e tenant scope.
- Administrar tenants, users, connections, credentials, datasets, field-mappings,
  query-definitions e dashboard-definitions.
- Armazenar configuracao e catalogos, sem persistir payload operacional bruto de clientes fora de
  decisao futura especifica.
- Trabalhar com `credentialRef`, sem expor segredo real para frontend, logs ou payloads
  desnecessarios.
- Registrar auditoria segura de solicitacoes, mudancas de configuracao e eventos relevantes.
- Orquestrar trabalho futuro, incluindo criacao de jobs ou mensagens quando houver fila.
- Retornar status, erros seguros e metadados operacionais ao frontend.
- Nao executar diretamente rotinas pesadas de integracao, sincronizacao, ingestao ou processamento
  externo.

### delfos-web

- Oferecer a interface de usuario para configuracao, operacao e acompanhamento.
- Consumir contratos do `delfos-api`.
- Exibir estados de loading, erro, vazio, sem permissao e configuracao incompleta.
- Solicitar acoes como teste de conexao, preview, sincronizacao ou atualizacao de cache por meio
  do `delfos-api`.
- Nao acessar APIs de clientes, bancos de clientes, filas, cache ou staging diretamente.
- Nao manipular segredo real; quando necessario, exibir apenas informacao mascarada ou status
  seguro vindo da API.

### delfos-connectors

- Executar integracoes futuras com APIs, bancos ou outros sistemas de clientes quando essa
  capacidade for aprovada.
- Executar sync de datasets, ingestao, processamento assincrono e atualizacao de cache/staging.
- Executar preview ou query quando a arquitetura futura delegar essa responsabilidade.
- Resolver `credentialRef` por meio de provider seguro de credenciais, respeitando menor
  privilegio.
- Aplicar timeout, retry/backoff, limites de concorrencia, rate limit e limite de tamanho de
  resposta.
- Isolar falhas externas para que indisponibilidade de cliente nao derrube a API principal.
- Normalizar respostas conforme catalogos, datasets e field-mappings aprovados.
- Emitir eventos, status e auditoria segura via `delfos-api` ou canal definido em ADR futura.
- Nao logar segredo real, payload sensivel desnecessario ou dados operacionais brutos sem
  finalidade aprovada.

### Fila, cache e staging futuros

- Fila futura podera desacoplar solicitacao e execucao, controlar retries e representar estado de
  jobs longos.
- Cache futuro podera reduzir latencia e proteger APIs de clientes, sempre isolado por tenant e
  com TTL/politica definidos.
- Staging futuro podera apoiar ingestao, normalizacao e processamento, desde que uma ADR futura
  aprove armazenamento, retencao, LGPD, tecnologia e operacao.
- Esses componentes nao sao criados por esta ADR.

## Fluxos futuros esperados

### Sincronizacao de dataset

1. Usuario solicita sincronizacao no `delfos-web`.
2. `delfos-api` autentica, valida tenant/permissao, verifica catalogo e registra auditoria.
3. `delfos-api` cria ou orquestra um job futuro.
4. `delfos-connectors` executa a sincronizacao com timeout, retry/backoff e limites de
   concorrencia.
5. Resultado, status e erros sanitizados retornam ao `delfos-api` ou ao canal definido.
6. `delfos-web` exibe progresso, sucesso, falha ou configuracao incompleta.

### Preview ou execucao de query

1. `delfos-web` solicita preview ou execucao com filtros declarados.
2. `delfos-api` valida contrato, tenant, permissao, dataset, query definition e field mappings.
3. Execucao externa ou pesada e delegada ao `delfos-connectors`.
4. `delfos-connectors` busca dados, normaliza e retorna payload minimo necessario.
5. `delfos-api` aplica governanca final, padroniza erro/resposta e entrega ao frontend.

### Ingestao de dados

1. Um job futuro de ingestao e criado pelo `delfos-api` por acao manual, agenda futura ou evento.
2. `delfos-connectors` resolve configuracao e `credentialRef` sem expor segredo.
3. `delfos-connectors` coleta, valida, transforma e envia dados para staging ou destino aprovado.
4. Auditoria e observabilidade registram metadados seguros, sem payload sensivel desnecessario.

### Atualizacao de cache ou staging

1. `delfos-api` decide que um cache/staging futuro deve ser atualizado ou invalidado.
2. Trabalho e enfileirado ou enviado ao `delfos-connectors`.
3. `delfos-connectors` atualiza cache/staging respeitando tenant scope, TTL, limites e politicas.
4. `delfos-api` consulta status e expoe resposta segura ao frontend.

### Teste de conexao

1. Usuario solicita teste no `delfos-web`.
2. `delfos-api` valida permissao, tenant e configuracao da connection.
3. Se for teste rapido e seguro, a execucao pode ser avaliada caso a caso.
4. Preferencialmente, `delfos-api` delega o teste ao `delfos-connectors`.
5. Resultado retorna apenas status, duracao, classe de erro e mensagem segura; nunca segredo real
   ou payload sensivel desnecessario.

## Seguranca e governanca

- O servico/runtime futuro `delfos-connectors` nunca deve logar segredo real, token, senha, chave
  privada, connection string real ou header sensivel.
- O servico/runtime futuro `delfos-connectors` deve usar `credentialRef` e provider seguro de
  credenciais; segredo real nao deve trafegar pelo `delfos-web`.
- Toda execucao deve respeitar tenant scope. Nenhum job pode depender apenas de ID global quando o
  recurso for tenant-scoped.
- Auditoria deve registrar acoes, status, IDs tecnicos, tempos e classes de erro sem payload
  sensivel desnecessario.
- Auditoria do `delfos-connectors` deve passar pelo `delfos-api` ou por canal definido em decisao
  futura, mantendo correlacao por `requestId`, `correlationId`, tenant e job.
- Timeouts, retry/backoff, rate limit, limite de resposta e limites de concorrencia sao
  obrigatorios para chamadas externas.
- Erros externos devem ser sanitizados antes de chegar ao usuario final.
- Payloads retornados devem conter apenas os dados necessarios para o fluxo solicitado.
- Cache ou staging futuro deve incluir tenant na chave/particao e politica explicita de TTL,
  retencao e invalidacao.
- Qualquer armazenamento de dado operacional de cliente exige ADR futura, revisao LGPD e politica
  de retencao.

## Consequencias

### Positivas

- API principal mais estavel e focada em contratos, governanca e orquestracao.
- Melhor isolamento de falhas de APIs, bancos e redes de clientes.
- Melhor controle de jobs demorados, retries, timeouts e limites de concorrencia.
- Escalabilidade independente para execucao de integracoes.
- Separacao de responsabilidades mais clara entre API, web e execucao externa.
- Caminho mais limpo para filas, workers, cache/staging e conectores dedicados quando houver
  necessidade real.

### Trade-offs

- Mais um servico futuro para desenvolver, operar, versionar e monitorar.
- Necessidade futura de fila, orquestracao ou contrato interno entre `delfos-api` e
  `delfos-connectors`.
- Deploy, observabilidade, tracing e resposta a incidentes ficam mais complexos quando o servico
  existir.
- Testes de integracao e simulacao de falhas externas exigirao mais infraestrutura.
- Evolucao de contratos internos precisara de governanca para evitar acoplamento indevido.

## Fora de escopo nesta fase

Esta ADR nao autoriza nem implementa:

- criar o repositorio ou servico `delfos-connectors`;
- criar fila;
- criar Redis;
- criar cache;
- criar scheduler;
- criar conectores reais;
- executar queries reais;
- conectar em banco ou API de cliente;
- criar staging real;
- criar worker;
- alterar contratos publicos;
- alterar codigo TypeScript;
- adicionar dependencias;
- armazenar dado operacional de cliente;
- documentar ou versionar segredo real.

## Referencias

- `AGENTS.md`
- `SECURITY.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/phase-2-vision.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md`
- `docs/api-foundation-contracts.md`
- `docs/foundation-auth-and-errors.md`
- `docs/foundation-data-catalog.md`
- `docs/foundation-credentials-and-security.md`
- `docs/foundation-tenancy-and-admin-resources.md`
- `docs/operations-runbook.md`
- ADR-0001
- ADR-0004
- ADR-0007
