# Politica de Acesso a Dados - Delfos Analytics

> Status: documento normativo  
> Escopo: acesso, uso, armazenamento e exposicao de dados entre Delfos e clientes.

Esta politica define a fronteira de dados do estado atual da foundation e a direcao futura para
acesso a fontes externas. Ela deve ser lida junto com ADR-0008, ADR-0009, ADR-0010, ADR-0011 e
ADR-0012.

---

## 1. Regra principal atual

No estado atual da foundation, o Delfos **nao acessa dados operacionais reais de clientes**.

O `delfos-api` guarda configuracoes, catalogos, referencias seguras de credenciais e auditoria
interna. Connections, datasets, field-mappings, query-definitions e dashboard-definitions sao
declarativos. O modulo `execution-preview` gera apenas dados ficticios em memoria com
`mode: "demo"`.

Nao existe atualmente:

- conector real;
- `data-connectors`;
- `delfos-connectors`;
- local agent;
- chamada a API, banco, arquivo ou sistema de cliente;
- execucao real de query;
- teste real de conexao;
- cache, fila, worker, scheduler, staging ou snapshot real.

---

## 2. O que o Delfos pode armazenar agora

O MongoDB atual armazena dados proprios do Delfos e configuracoes da foundation:

- tenants;
- usuarios administrativos;
- connections declarativas;
- credentials protegidas e `credentialRef`;
- datasets declarativos;
- field-mappings declarativos;
- query-definitions declarativas;
- dashboard-definitions declarativas;
- report-definitions declarativas;
- logs e auditoria interna sanitizada;
- dados ficticios de seed/dev local.

Esses registros nao devem conter payload operacional bruto de cliente.

---

## 3. O que o Delfos nao pode armazenar agora

Nao armazenar na foundation atual:

- vendas reais do cliente;
- pedidos reais;
- produtos operacionais reais;
- estoque real;
- clientes finais reais;
- dados financeiros operacionais reais;
- dados fiscais reais;
- transacoes de pagamento reais;
- payload bruto retornado por API de cliente;
- historico analitico proprio;
- snapshots ou resultados materializados reais.

Excecao: logs tecnicos minimos, sanitizados e sem payload sensivel, quando indispensaveis para
diagnostico da propria foundation.

---

## 4. Connections, datasets e field-mappings

Connections, datasets e field-mappings existem atualmente como catalogo declarativo e contratos de
governanca.

- `Connection` descreve metadados e referencia segura de credencial, mas nao executa chamada.
- `Dataset` descreve uma origem logica futura, mas nao busca dados.
- `FieldMapping` descreve De/Para declarativo, mas nao transforma payload real.

Qualquer uso desses recursos para acessar fonte externa real depende de fase futura, autorizacao
explicita e alinhamento com ADR-0008 e ADR-0012.

---

## 5. Cache, snapshots e staging

Cache transitorio em memoria, Redis, filas, workers, scheduler, staging, snapshots e resultados
materializados **nao existem no estado atual**.

ADR-0010 registra direcao futura para storage analitico, snapshots, resultados materializados,
sync runs e ingestion batches. Ela nao autoriza criar esses componentes agora.

Qualquer proposta de cache real, snapshot, staging, retencao analitica ou armazenamento de dado
operacional exige decisao futura explicita, revisao de seguranca/LGPD e ADR quando necessario.

---

## 6. Acesso futuro a fontes externas

O acesso real a APIs, bancos, arquivos ou sistemas de clientes e futuro.

Quando aprovado, a preferencia arquitetural e:

- `delfos-api` continua como fronteira de contratos, auth/autorizacao, tenant scope, catalogo,
  governanca, auditoria e orquestracao;
- `delfos-connectors` executa integracoes, sync, ingestao, preview real ou query real quando essa
  capacidade existir;
- local agent futuro acessa fontes locais/on-premise sem exigir exposicao direta de bancos ou
  servicos internos do cliente para a internet.

Ver ADR-0008 e ADR-0012.

---

## 7. Isolamento por tenant

Todo recurso tenant-scoped deve validar:

- `tenantId`;
- permissao ou role aplicavel;
- pertencimento do recurso ao tenant;
- auditoria segura quando houver mutacao sensivel.

Nenhuma consulta tenant-scoped deve buscar recurso apenas por ID global.

---

## 8. Credenciais

Credenciais atuais sao armazenadas de forma protegida e expostas apenas por `credentialRef` e
metadados seguros.

Regras:

- segredo real nunca retorna ao frontend apos cadastro/rotacao;
- segredo real nunca aparece em log, auditoria, resposta de API ou documento;
- connections devem referenciar `credentialRef`, nao guardar segredo bruto;
- exemplos versionados devem usar placeholders, nunca valores reais.

---

## 9. Dados sensiveis e LGPD

O Delfos deve reduzir coleta, exposicao e retencao de dados pessoais.

Diretrizes:

- buscar e armazenar apenas o minimo necessario para a foundation atual;
- mascarar informacoes sensiveis em logs;
- evitar payload bruto em erros;
- diferenciar dado operacional de cliente de dado de configuracao do Delfos;
- manter auditoria com metadados seguros, sem secrets ou payload sensivel.

Ver `docs/security-lgpd.md`.

---

## 10. Secoes historicas e futuras

Documentos antigos que mencionem consumo de APIs custom, cache transitorio, execucao de dataset,
dashboard builder, query builder ou conectores devem ser interpretados como historicos, conceituais
ou futuros quando conflitarem com ADR-0008 a ADR-0012 e `docs/phase-1-scope.md`.

Qualquer proposta de armazenar dados operacionais, criar ingestao, conectar direto em banco/API de
cliente, criar `delfos-connectors`, criar local agent ou usar cache/snapshot/staging real exige
autorizacao explicita e ADR quando necessario.
