# AGENTS.md — Delfos Analytics

> Versão: 2.0
> Status: Diretriz obrigatória para agentes de IA, copilotos, CLIs e automações de desenvolvimento.
> Fonte canônica de regras compartilhadas entre `delfos-api` e `delfos-web`.

Este arquivo é o ponto de entrada. Ele intencionalmente é curto. Cada bloco aponta para um documento dedicado em `docs/` ou `prompts/`.

## Estado atual implementado

Leia esta seção antes de qualquer tarefa. O estado atual do `delfos-api` é foundation administrativa/declarativa:

- auth temporária por `x-delfos-admin-key`;
- `tenants`, `users`, `connections`, `credentials`, `datasets`, `field-mappings`, `query-definitions`, `dashboard-definitions`, `report-definitions`, `semantic-models`, `runtime/execution-requests` foundation e `execution-preview` demo;
- seed/dev local com dados fictícios;
- sem JWT real, login ou OAuth;
- sem conectores reais;
- sem cache, fila ou scheduler;
- sem execução real de query;
- sem conexão com banco, API ou sistema de cliente.

Documentos sobre conectores, cache, JWT ou execução real descrevem conceitos ou planos futuros, não autorização para implementar esses componentes.

Antes de qualquer implementação, ler:

- `AGENTS.md` (este arquivo)
- `DESIGN.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md` (conceitual/futuro; não autoriza criar motor real)
- `docs/components-strategy.md`
- `docs/libraries-policy.md`
- `docs/development-guide.md`
- `docs/security-checklist.md`
- `.agents/skills/` quando a tarefa tiver skill específica

---

## 1. Contexto do produto

O Delfos Analytics é uma plataforma web de dashboards, gráficos, KPIs e relatórios personalizados para empresas e parceiros white label.

A etapa atual entrega a foundation administrativa/declarativa do produto. O `delfos-api` guarda configurações, catálogos, referências seguras de credenciais e auditoria interna. O consumo real de APIs/bancos de clientes, conectores, sync, ingestão, cache, filas, schedulers e execução real permanecem planejados para fases futuras e dependem de decisão explícita.

A **Fase 2** poderá evoluir para ingestão própria, cache analítico, filas, workers e armazenamento independente. Não é foco desta fase.

Detalhes em `docs/phase-1-scope.md` e `docs/phase-2-vision.md`.

---

## 2. Princípios obrigatórios

O agente deve sempre seguir estes princípios:

- clareza antes de velocidade
- arquitetura antes de improviso
- manutenção antes de pressa
- componentes reutilizáveis antes de duplicação
- separação de responsabilidade antes de solução rápida
- tipagem forte antes de código solto
- segurança antes de conveniência
- documentação antes de decisão implícita
- consistência visual antes de criatividade isolada
- menor privilégio antes de permissões amplas
- simplicidade sustentável antes de complexidade prematura

---

## 3. Proibido fazer

O agente **não deve**:

- criar arquivos gigantes e difíceis de manter — regra oficial de tamanho (fonte canônica: `docs/quality-checklist.md` §0.1): alvo ≤ 300 linhas; 301–450 avaliar divisão por responsabilidade; 451–600 só com justificativa objetiva no relatório final; **acima de 600 linhas é o limite máximo absoluto** e exige validação humana explícita (parar e perguntar). Arquivo já acima de 600 linhas: não adicionar lógica, propor extração/refatoração
- misturar UI, regra de negócio, acesso a dados e transformação no mesmo arquivo
- criar soluções temporárias sem registrar motivo (`TODO:` com contexto claro)
- duplicar lógica já existente
- criar componentes específicos demais quando poderiam ser reutilizáveis
- usar bibliotecas pagas, GPL, AGPL ou de licença restritiva sem aprovação (ver `docs/libraries-policy.md`)
- montar requisições de API por concatenação de strings
- permitir input livre do usuário final virando URL/header/body sem validação
- deixar credenciais, tokens ou dados sensíveis hardcoded ou em log
- quebrar padrões visuais definidos em `DESIGN.md`
- alterar contratos públicos sem revisar impactos em ambos os repos
- conectar ferramentas externas (MCPs, plugins) com permissões amplas sem necessidade
- executar comandos destrutivos sem autorização explícita

Detalhes operacionais e exemplos em `docs/development-guide.md` (gambiarras, tamanho de arquivo, separação de responsabilidade) e `docs/destructive-commands-policy.md`.

---

## 4. Padrão para novas funcionalidades

1. Ler a documentação relacionada.
2. Entender o objetivo da funcionalidade.
3. Verificar se já existe componente, service, type ou padrão similar.
4. Criar ou atualizar contratos antes da implementação.
5. Criar componentes pequenos e reutilizáveis.
6. Separar lógica de dados da lógica visual.
7. Garantir estados de **loading**, **erro**, **vazio**, **sem permissão** e **configuração incompleta**.
8. Garantir **tema claro e escuro**.
9. Garantir **responsividade**.
10. Evitar dependência paga ou de licença restritiva.
11. Atualizar documentação se houver decisão relevante.
12. Revisar se a entrega respeita `AGENTS.md`, `DESIGN.md` e `docs/`.

Use os prompts em `prompts/` para guiar o trabalho:

- `prompts/feature-prompt-template.md` — criar nova funcionalidade
- `prompts/review-prompt.md` — revisar código antes de aceitar
- `prompts/ui-review-prompt.md` — revisar tela
- `prompts/security-review-prompt.md` — revisar segurança
- `prompts/library-review-prompt.md` — antes de adicionar lib
- `prompts/api-connector-review-prompt.md` — revisar integração com API de cliente

---

## 5. Repo skills para Codex

Além dos prompts em `prompts/`, este repositório possui skills versionadas em `.agents/skills/`.

Use a skill mais específica quando a tarefa se encaixar em um destes fluxos:

| Skill | Quando usar |
|---|---|
| `execution-plan` | planejar tarefa estrutural, refatoração ou mudança com vários arquivos antes de editar |
| `nestjs-structure` | criar/reorganizar estrutura NestJS, módulos, config, healthcheck, Swagger e testes base |
| `api-contract-review` | criar/revisar endpoints, DTOs, OpenAPI, paginação, filtros e erros |
| `security-lgpd-review` | revisar autenticação, autorização, multi-tenant, LGPD, secrets e logs |
| `testing-quality-review` | revisar testes, lint, build, DoD e qualidade final |
| `ci-fix-review` | corrigir falhas de build, lint, testes e, quando houver CI configurado, falhas de workflow |

Regras:

- skills complementam este `AGENTS.md`; não substituem `docs/`.
- nomes das skills são os diretórios em `.agents/skills/` — usar sem prefixo.
- se a tarefa for grande, estrutural ou tocar vários arquivos, comece com `execution-plan`.
- se a tarefa for de estrutura NestJS, use `nestjs-structure`.
- se a tarefa alterar contrato público, use `api-contract-review`.
- se a tarefa tocar auth, tenant, permissão, secrets, logs ou dados pessoais, use `security-lgpd-review`.
- se a tarefa criar ou alterar o modelo de dados, o backend é **PostgreSQL/Kysely** desde a P5: siga `docs/postgresql-data-model-draft.md` e as migrations em `src/database/postgres/migrations/` (`docs/database-model.md` é registro histórico do modelo Mongo da Fase 1).
- antes de finalizar PR/commit relevante, use `testing-quality-review`.
- se houver erro de lint/test/build ou CI futuro, use `ci-fix-review`.

---

## 6. Estado atual da implementação

> Leia esta seção antes de qualquer tarefa. Implementar algo fora do estado atual requer autorização explícita.

### O que já existe (foundation) — tabela canônica de status de módulos

> **Esta é a tabela canônica de status de módulos do `delfos-api`.** Outros
> documentos (`docs/phase-1-scope.md`, `docs/delfos-prd.md` §5, `docs/roadmap.md`)
> devem referenciar esta tabela em vez de manter cópias próprias. A taxonomia de
> status segue `docs/roadmap.md` ("Taxonomia de status"): `foundation
> implementada`, `parcialmente implementado`, `foundation-only`, `pendente`,
> `futuro`.

| Módulo | Caminho | Status |
|---|---|---|
| health | `src/modules/health/` | `foundation implementada` |
| auth (foundation) | `src/modules/auth/` | `foundation implementada` — admin-key temporário, sem JWT real |
| audit | `src/modules/audit/` | `foundation implementada` |
| tenants | `src/modules/tenants/` | `foundation implementada` |
| users | `src/modules/users/` | `foundation implementada` |
| connections | `src/modules/connections/` | `foundation implementada` — declarativo, sem chamada externa |
| credentials | `src/modules/credentials/` | `foundation implementada` — criptografia local, credentialRef |
| datasets | `src/modules/datasets/` | `foundation implementada` — declarativo |
| field-mappings | `src/modules/field-mappings/` | `foundation implementada` — declarativo |
| query-definitions | `src/modules/query-definitions/` | `foundation implementada` — declarativo |
| dashboard-definitions | `src/modules/dashboard-definitions/` | `foundation implementada` — declarativo |
| report-definitions | `src/modules/report-definitions/` | `foundation implementada` — declarativo |
| semantic-models | `src/modules/semantic-models/` | `foundation implementada` — modelo semântico declarativo (measures, dimensions, glossário, governança); metadata-only, sem semantic engine, SQL ou execução; ADR-0034 |
| runtime (execution-requests) | `src/modules/runtime/` | `foundation implementada` — execution-requests foundation: contratos, estados, eventos administrativos, runtime monitor, readiness dry-run e demo-execute fictício; sem execução real |
| runtime/bridge | `src/modules/runtime/bridge/` | `foundation-only` — bridge resolver, reference resolver e adapters; apenas types e testes, sem provider NestJS, sem dispatch e sem execução real |
| execution-preview | `src/modules/execution-preview/` | `foundation implementada` — demo em memória, sem execução real |

### O que NÃO existe ainda

**Não implementar sem autorização explícita e ADR quando necessário:**

- JWT auth real (login, refresh, bcrypt, strategies) — planejado, não iniciado
- Motor de consumo de APIs de clientes (`delfos-connectors`) — planejado, não iniciado
- Teste de conexão real — planejado, não iniciado
- Execução real de query — Fase 2
- Cache / fila / worker / scheduler — Fase 2 (tecnologia de cache decidida = Valkey, ADR-0035; promoção exige fase/ADR própria)
- Runtime de relatórios, exportações reais, white-label, preferências — não implementados
- delfos-connectors — serviço futuro separado
- Módulo `dashboards` ou `widgets` de runtime — não implementados
- Capability `analytics_text_generation` / integração LLM — planejada (ADR-0025), não implementada, não autorizada

> Documentos conceituais ou de visão futura (conectores, bridge, dispatch, cache, JWT, execução
> real) descrevem planejamento e **não autorizam** implementação real. A execução real de
> conectores permanece **proibida**; apenas planejamento documentável é permitido. Implementar
> exige fase explícita e ADR quando necessário.

### Planos documentados (planejamento, não implementação)

Existem planos documentais que **não autorizam** implementação — descrevem
direção futura:

- **Auth/JWT** — tem plano documental (`docs/auth-jwt-migration-plan.md`), mas
  **não está implementado**; o `x-delfos-admin-key` temporário permanece.
- **Observability** — tem plano documental (`docs/observability-plan.md`), mas
  **não há stack implementada**.
- **ORM/query layer** — segue **pendente** (`docs/runtime-query-layer-decision.md`);
  nenhuma biblioteca escolhida.
- **Divisão de trabalho (4 devs/trilhas)** — documentada em
  `docs/team-work-split.md`.

Detalhe e status no `docs/roadmap.md` (seção "Planos e decisões documentados").

---

## 7. Onde achar cada coisa

| Tema | Documento |
|---|---|
| Arquitetura geral | `docs/architecture.md` |
| Escopo da Fase 1 | `docs/phase-1-scope.md` |
| Fora de escopo | `docs/out-of-scope.md` |
| Política de acesso a dados | `docs/data-access-policy.md` |
| Motor de consumo de APIs | `docs/api-connectors.md` (conceitual/futuro; não autoriza implementação atual) |
| De/Para campo a campo | `docs/de-para.md` |
| Modelo do banco do Delfos | `docs/database-model.md` |
| Contratos do delfos-api | `docs/api-contracts.md` |
| Estratégia de componentes | `docs/components-strategy.md` |
| Política de bibliotecas | `docs/libraries-policy.md` |
| Estrutura do projeto | `docs/project-structure.md` |
| Guia de desenvolvimento | `docs/development-guide.md` |
| Guia de testes | `docs/testing-guide.md` |
| Segurança e LGPD | `docs/security-lgpd.md` |
| Checklist de segurança | `docs/security-checklist.md` |
| Comandos destrutivos | `docs/destructive-commands-policy.md` |
| Política de skills/MCPs/plugins | `docs/agent-tooling-policy.md` |
| Política de uso do Postman | `docs/postman-policy.md` |
| Checklist de qualidade | `docs/quality-checklist.md` |
| Decisões arquiteturais | `docs/adr/README.md` |
| Glossário | `docs/glossary.md` |
| PRD | `docs/delfos-prd.md` |
| Roadmap | `docs/roadmap.md` |
| Modelo operacional de agentes | `docs/agent-operating-model.md` |
| Contrato de tarefa de agente | `docs/agent-task-contract.md` |
| Regras de segurança para agentes | `docs/agent-safety-rules.md` |
| Checklist de validação para agentes | `docs/agent-validation-checklist.md` |
| Stop conditions para agentes | `docs/agent-stop-conditions.md` |

> **Camada agent-ready**: os cinco documentos `docs/agent-*.md` formam a camada de governança
> para execução por agentes (IA/CLI/automação). Leitura obrigatória antes de qualquer tarefa de
> agente, junto com este `AGENTS.md` e `docs/quality-checklist.md`.

---

## 8. Definition of Done

Fonte canônica do DoD: `docs/quality-checklist.md`. Esta seção é apenas um resumo; em caso de
divergência, vale o checklist canônico.

Resumo — uma entrega só é considerada pronta quando:

- compila sem erros e passa no CI quando configurado;
- segue a arquitetura definida, sem gambiarra e sem duplicação;
- respeita a regra oficial de tamanho de arquivo (`docs/quality-checklist.md` §0.1): alvo ≤ 300; 451–600 só com justificativa no relatório final; > 600 exige validação humana;
- o relatório final da tarefa lista e justifica arquivos acima de 450 linhas criados/aumentados;
- respeita segurança, secrets e isolamento multi-tenant;
- possui os estados de UI obrigatórios (**loading**, **vazio**, **erro**, **sem permissão**, **sucesso**) — aplicável ao `delfos-web`;
- não executa conector real (proibido na fase atual);
- está coerente com a Fase atual e tem documentação/testes atualizados.

Checklist completo e canônico em `docs/quality-checklist.md`.

---

## 9. Stop conditions — quando parar e pedir validação humana

> Fonte canônica destas condições. Referenciada por `delfos-web/AGENTS.md` e por
> `docs/quality-checklist.md`. A versão detalhada da camada agent-ready está em
> `docs/agent-stop-conditions.md`.

Um agente (IA, CLI ou automação) **deve interromper a tarefa e pedir validação humana
explícita** antes de prosseguir quando precisar:

- ultrapassar **600 linhas** em um arquivo (criar novo ou aumentar existente) — ver regra de
  tamanho em `docs/quality-checklist.md` §0.1;
- alterar **contratos públicos** de API (rotas, DTOs, payloads, status, headers);
- mexer em **secrets, credenciais ou descriptografia** de qualquer forma;
- implementar **dispatch real** para connectors;
- **promover uma ADR `Proposed` para `Accepted`** (em especial ADR-0021 e ADR-0022);
- encontrar **divergência entre ADR, `AGENTS.md` e código**;
- não conseguir validar **build, teste ou lint**;
- **remover arquivo** ou executar qualquer ação destrutiva;
- alterar a **política de retenção LGPD / auditoria** definida na ADR-0018;
- lidar com **operação fora da matriz papel→operações** (ver ADR-0017);
- usar o **Postman** além de local/dev, com secret real, para publicar
  collection/workspace ou para alterar contrato público (ver
  `docs/postman-policy.md`).

Nessas situações, o agente registra o ponto como **"precisa validação humana"** no relatório,
não decide sozinho e não contorna o bloqueio.

---

## 10. Camada agent-ready

A camada agent-ready **existe** e é composta por cinco documentos em `docs/`:

- `docs/agent-operating-model.md` — modelo operacional, ordem de autoridade documental;
- `docs/agent-task-contract.md` — formato mínimo de uma tarefa executável por agente;
- `docs/agent-safety-rules.md` — regras de segurança obrigatórias;
- `docs/agent-validation-checklist.md` — validações por tipo de mudança;
- `docs/agent-stop-conditions.md` — quando parar e pedir validação humana.

Critérios de entrada que foram atendidos para criar esta camada (e que devem permanecer
verdadeiros): documentação sem contradição factual; **ADR-0021 e ADR-0022 permanecem
`Proposed`**, bloqueando execução real; Definition of Done canônica em
`docs/quality-checklist.md`; regra de tamanho de arquivo aplicada e propagada; stop conditions
referenciadas na seção 9; pendências humanas registradas em `docs/agent-stop-conditions.md`;
nenhum código de aplicação alterado pelo saneamento documental.

Qualquer agente que trabalhe no Delfos deve ler estes cinco documentos antes de iniciar uma
tarefa.

---

## 11. Regra final

Sempre que houver dúvida, escolher na seguinte ordem:

1. **Solução organizada** > solução rápida.
2. **Reaproveitar** > criar novo (pesquisar antes).
3. **Abstração própria** > acoplamento direto a biblioteca específica.
4. **Caminho mais restritivo** em segurança.
5. **`DESIGN.md`** em dúvidas visuais.
6. **`docs/phase-1-scope.md`** em dúvidas de escopo.
7. **Menor privilégio + revisão humana** em ferramenta externa sensível.
