# Guia de Testes - Delfos Analytics

> Status: documento normativo  
> Escopo: testes minimos atuais e testes futuros planejados para backend e frontend.

Testes existem para proteger contratos, seguranca e evolucao do produto.

---

## 1. Piramide de testes

Priorizar:

1. testes unitarios de regra pura;
2. testes de service/use-case;
3. testes de contrato/API;
4. testes de widget/estado visual;
5. testes end-to-end apenas quando houver estrutura operacional.

---

## 2. Testes atuais obrigatorios - backend

O estado atual do `delfos-api` e foundation administrativa/declarativa. A cobertura atual deve
proteger:

- validacao de ambiente;
- healthcheck;
- contrato global de erro;
- request id/correlation id;
- auth temporaria por `x-delfos-admin-key`;
- roles administrativas temporarias;
- tenants;
- users administrativos sem login/senha;
- connections declarativas, sem chamada externa;
- credentials, protecao local, rotacao/revogacao e `credentialRef`;
- datasets declarativos;
- field-mappings declarativos;
- query-definitions declarativas;
- dashboard-definitions declarativas;
- report-definitions declarativas;
- `execution-preview` demo em memoria;
- runtime execution requests foundation sem execucao real;
- auditoria interna sem secrets ou payload operacional;
- sanitizacao de metadata/settings/options/filtros;
- seed/dev local e dados ficticios.

Testes de controller/service devem confirmar que nenhum fluxo da foundation executa query real,
chama API externa, cria cache, worker, scheduler, fila, staging ou snapshot.

---

## 3. Testes atuais obrigatorios - frontend

O estado atual do `delfos-web` consome a foundation e preview demo.

Cobrir:

- configuracao via `API_URL`;
- headers temporarios via `DELFOS_ADMIN_KEY`, `DELFOS_TENANT_ID`, `DELFOS_ACTOR_ID` e
  `DELFOS_ACTOR_ROLE`;
- health/status da API;
- clients, DTOs, mappers e repositories dos catalogos atuais;
- telas de datasets, query-definitions e dashboard-definitions;
- loading, vazio, erro, sem permissao e configuracao incompleta;
- preview demo com sucesso, erro e vazio;
- formatadores e componentes compartilhados quando houver regra relevante.

---

## 4. Testes futuros planejados

Os itens abaixo sao planejados/futuros e nao devem ser tratados como operacionais enquanto nao
existirem implementacao, scripts e escopo aprovado:

- login/JWT/OAuth, refresh token, logout e recuperacao de senha;
- conectores reais e teste real de conexao;
- cache service, Redis, fila, worker ou scheduler;
- execucao real de dataset/query;
- processamento real de execution requests;
- chamada real a API, banco, arquivo ou sistema de cliente;
- dashboard runtime final;
- dashboard builder e query builder;
- reports/exportacoes;
- E2E completo (a camada de smoke E2E atual ja existe; ver secao 8a);
- testes Flutter em `integration_test/`.

CI basico do `delfos-api` ja existe - ver secao 8a.

Quando essas capacidades forem aprovadas, atualizar este guia antes de exigir os testes.

---

## 5. Testes de seguranca atuais

Obrigatorios em mudancas sensiveis:

- `x-delfos-admin-key` ausente ou invalido e rejeitado;
- role temporaria insuficiente e rejeitada em mutacoes;
- tenant obrigatorio validado em recursos tenant-scoped;
- recurso de outro tenant nao acessivel por ID global;
- input invalido rejeitado;
- credencial nao aparece em resposta;
- metadata/settings/options/filtros nao aceitam secrets;
- logs e auditoria nao contem secret em cenarios testaveis.

Token JWT invalido, fluxo de login e refresh token sao testes futuros.

---

## 6. Mocks e fixtures

Mocks devem ser claros e pequenos.

Evitar:

- payload gigante sem necessidade;
- mock que parece dado real de cliente;
- duplicar fixtures em varios testes;
- fixture com token, senha, connection string ou payload sensivel real.

Preferir fixtures compartilhadas por dominio e dados explicitamente ficticios.

---

## 7. APIs externas e conectores

Nao ha API externa real, conector real ou teste real de conexao no estado atual.

Testes de conectores, quando a capacidade futura for aprovada, deverao simular sucesso, timeout,
401/403, 429, payload invalido, paginacao e resposta vazia sem depender de API real.

---

## 8. Comandos atuais

Backend:

```bash
npm run format:check
npm run lint
npm test
npm run test:cov
npm run build
npm run test:e2e
```

Frontend:

```bash
flutter analyze
flutter test
flutter build web
```

`flutter test integration_test` e outros scripts nao existentes sao planejados/futuros.
Nao documentar nem exigir script inexistente como operacional.

---

## 8a. CI - delfos-api

O GitHub Actions do `delfos-api` (`.github/workflows/ci.yml`) roda em `push` e
`pull_request` para `main`.

Jobs obrigatorios (devem passar para o merge):

- `lint` - `npm run lint`;
- `test` - `npm test`;
- `build` - `npm run build`.

Esses tres jobs falham o CI se quebrarem. Nao usam `continue-on-error` e nao
mascaram falhas.

Job opcional:

- `e2e` - `npm run test:e2e`.

Regras do job `e2e`:

- e separado dos checks obrigatorios e ainda nao e exigido como status check
  obrigatorio em branch protection;
- mesmo opcional, falha o workflow se o E2E falhar (sem `continue-on-error`);
- usa MongoDB em memoria via `mongodb-memory-server`, nunca producao;
- nao usa secrets reais - chave admin e chave de criptografia sao valores
  ficticios definidos no proprio harness de teste;
- nao habilita execucao real de connectors, dispatch real nem descriptografia
  real de credenciais;
- cacheia os binarios do `mongodb-memory-server` (`MONGOMS_DOWNLOAD_DIR`) com
  chave por sistema operacional e hash do `package-lock.json`.

O E2E so se tornara status check obrigatorio quando o job estiver estavel.

---

## 9. Cobertura

Cobertura e metrica auxiliar, nao garantia de qualidade.

Prioridade atual:

- seguranca da foundation;
- contratos;
- erro padronizado;
- tenant scope;
- sanitizacao;
- mapeamento de dados;
- estados visuais criticos;
- preview demo seguro.

---

## 10. Antes do PR

- [ ] Testes novos para comportamento novo.
- [ ] Testes antigos continuam passando.
- [ ] Fixtures atualizadas sem dados reais.
- [ ] Casos de erro cobertos.
- [ ] Contratos/documentacao atualizados quando necessario.
- [ ] Nenhum teste trata capacidade futura como implementada.
