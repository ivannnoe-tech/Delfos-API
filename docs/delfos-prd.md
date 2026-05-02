# PRD - Delfos Analytics

> Status: versao inicial realinhada  
> Produto: Delfos Analytics  
> Estado atual: foundation administrativa/declarativa

---

## 1. Problema

Empresas precisam acompanhar indicadores, vendas, operacao, financeiro e relatorios, mas cada
cliente possui sistemas, fontes e contratos diferentes. Solucoes fixas exigem customizacoes
repetidas e dificeis de manter.

O Delfos busca resolver isso com uma plataforma analitica configuravel, preparada para evoluir
para integracoes reais e dashboards customizaveis sem reescrever o produto para cada caso.

No estado atual, essa visao ainda nao executa dados reais de clientes. A entrega atual e a
foundation declarativa que permite governar catalogos, contratos e preview demo.

---

## 2. Objetivo

Permitir que clientes e parceiros tenham uma experiencia de BI simples, customizavel e white
label, com baixo custo inicial e arquitetura preparada para evolucao.

Objetivo da etapa atual:

- consolidar contratos e governanca;
- administrar tenants, users, connections declarativas, credentials, datasets e mappings;
- manter query-definitions, dashboard-definitions e report-definitions declarativas;
- oferecer preview demo seguro e explicitamente ficticio;
- evitar qualquer acesso real a API, banco, arquivo ou sistema de cliente.

---

## 3. Publico-alvo

- empresas que precisam de paineis administrativos;
- grupos com multiplas unidades;
- parceiros white label;
- clientes que possuem fontes proprias e poderao integrar futuramente;
- equipes que precisam de dashboards e relatorios personalizados em fases futuras.

---

## 4. Proposta de valor

Valor atual:

- foundation segura e declarativa;
- catalogos por tenant;
- referencias seguras de credenciais;
- De/Para declarativo;
- contratos REST claros;
- preview demo sem dado real;
- base preparada para evolucao.

Valor futuro:

- dashboards personalizados;
- relatorios configuraveis;
- integracoes reais via `delfos-connectors` ou local agent;
- execucao real governada por queryDefinitions e datasets;
- white label;
- controle final de usuarios e permissoes;
- implantacao mais segura e menos invasiva.

---

## 5. Funcionalidades atuais

- auth temporaria por `x-delfos-admin-key`;
- gestao administrativa de tenants;
- gestao administrativa de users, sem login/senha;
- connections declarativas, sem chamada externa;
- credentials protegidas e `credentialRef`;
- datasets declarativos;
- field-mappings declarativos;
- query-definitions declarativas;
- dashboard-definitions declarativas;
- report-definitions declarativas;
- audit interno;
- seed/dev com dados ficticios;
- `execution-preview` demo em memoria.

---

## 6. Funcionalidades futuras/deferidas

Nao implementadas atualmente:

- login/JWT/OAuth real;
- conexoes reais com APIs, bancos, arquivos ou sistemas de clientes;
- conectores reais ou `data-connectors`;
- `delfos-connectors`;
- local agent;
- teste real de conexao;
- sync/ingestao;
- cache, fila, worker, scheduler, staging ou snapshots;
- dashboard builder;
- dashboard runtime final;
- query builder;
- report builder;
- widgets com dados reais;
- exportacoes finais;
- white label completo.

Essas capacidades dependem de tarefa explicita, ADR quando necessario e alinhamento com ADR-0008
a ADR-0012.

---

## 7. Nao objetivos da etapa atual

- acessar dado operacional real de cliente;
- consumir API custom de cliente;
- acessar banco de cliente diretamente;
- armazenar historico analitico proprio;
- criar data warehouse proprio;
- criar ETL recorrente;
- criar app mobile nativo;
- embutir IA no produto;
- substituir sistema operacional do cliente.

---

## 8. Metricas de sucesso atuais

- clareza dos contratos foundation;
- ausencia de dados reais em fixtures, docs e preview;
- seguranca de credentials e `credentialRef`;
- isolamento por tenant nos recursos tenant-scoped;
- consistencia entre API e Web;
- previsibilidade de seed/dev;
- facilidade para agentes trabalharem sem implementar futuro fora de escopo.

Metricas como tempo de carregamento de dashboards reais, taxa de erros em conectores e quantidade
de relatorios exportados pertencem a fases futuras.

---

## 9. Personas iniciais

### Administrador Delfos

Gerencia tenants, suporte, configuracoes, catalogos e auditoria.

### Administrador do cliente

Futuramente configurara usuarios, permissoes, dashboards, relatorios e fontes. No estado atual,
essa experiencia final ainda nao existe.

### Gestor operacional

Futuramente consultara indicadores e relatorios para tomada de decisao.

### Parceiro white label

Futuramente oferecera a solucao com marca propria para sua carteira.

---

## 10. Requisitos nao funcionais

- seguranca por tenant;
- responsividade web;
- tema claro e escuro;
- componentes reutilizaveis;
- baixo custo de infraestrutura;
- logs seguros;
- LGPD desde o inicio;
- documentacao viva;
- sem bibliotecas pagas ou restritivas sem revisao;
- exemplos sem secrets reais.

---

## 11. Riscos

Riscos atuais:

- agentes confundirem visao futura com implementacao atual;
- documentos legados induzirem conectores/cache/JWT fora de escopo;
- preview demo ser interpretado como dado real;
- credenciais ou dados reais entrarem em exemplo, log ou fixture.

Riscos futuros:

- APIs de clientes lentas ou instaveis;
- contratos muito diferentes entre clientes;
- excesso de customizacao sem padrao;
- dashboards complexos demais na primeira versao real;
- expectativa de historico sem ingestao propria aprovada.

---

## 12. Mitigacoes

- `AGENTS.md` e `docs/phase-1-scope.md` como fonte de escopo atual;
- ADR-0008 a ADR-0012 como decisoes vigentes para integracoes, tenant, storage, dashboards e
  local agent;
- documentos conceituais marcados como futuro/deferido;
- preview demo sempre identificado como demo;
- `credentialRef` em vez de segredo real;
- limites claros de escopo antes de qualquer feature futura.
