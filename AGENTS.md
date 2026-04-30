# AGENTS.md — Delfos Analytics

> Versão: 2.0
> Status: Diretriz obrigatória para agentes de IA, copilotos, CLIs e automações de desenvolvimento.
> Fonte canônica de regras compartilhadas entre `delfos-api` e `delfos-web`.

Este arquivo é o ponto de entrada. Ele intencionalmente é curto. Cada bloco aponta para um documento dedicado em `docs/` ou `prompts/`.

Antes de qualquer implementação, ler:

- `AGENTS.md` (este arquivo)
- `DESIGN.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md`
- `docs/components-strategy.md`
- `docs/libraries-policy.md`
- `docs/development-guide.md`
- `docs/security-checklist.md`
- `.agents/skills/` quando a tarefa tiver skill específica

---

## 1. Contexto do produto

O Delfos Analytics é uma plataforma web de dashboards, gráficos, KPIs e relatórios personalizados para empresas e parceiros white label.

A **Fase 1** entrega a experiência analítica completa **consumindo APIs custom expostas pelos próprios clientes** (cada cliente tem seu contrato). O Delfos não armazena dado operacional do cliente em banco próprio. O banco do Delfos guarda **apenas configuração** (empresas, usuários, permissões, conexões, dashboards, widgets, relatórios, layouts, De/Para, white label, logs e auditoria).

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

- criar arquivos gigantes e difíceis de manter (regra dura: > 500 linhas exige refatoração)
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
| `mongo-modeling-review` | criar/revisar schemas MongoDB, índices, De/Para, auditoria e metadados |
| `testing-quality-review` | revisar testes, lint, build, DoD e qualidade final |
| `ci-fix-review` | corrigir falhas de CI, build, lint e testes com causa raiz |

Regras:

- skills complementam este `AGENTS.md`; não substituem `docs/`.
- nomes das skills são os diretórios em `.agents/skills/` — usar sem prefixo.
- se a tarefa for grande, estrutural ou tocar vários arquivos, comece com `execution-plan`.
- se a tarefa for de estrutura NestJS, use `nestjs-structure`.
- se a tarefa alterar contrato público, use `api-contract-review`.
- se a tarefa tocar auth, tenant, permissão, secrets, logs ou dados pessoais, use `security-lgpd-review`.
- se a tarefa criar ou alterar schema MongoDB, use `mongo-modeling-review`.
- antes de finalizar PR/commit relevante, use `testing-quality-review`.
- se houver erro de lint/test/build/CI, use `ci-fix-review`.

---

## 6. Estado atual da implementação

> Leia esta seção antes de qualquer tarefa. Implementar algo fora do estado atual requer autorização explícita.

### O que já existe (foundation)

| Módulo | Caminho | Status |
|---|---|---|
| health | `src/modules/health/` | Implementado |
| auth (foundation) | `src/modules/auth/` | Implementado — admin-key temporário, sem JWT real |
| audit | `src/modules/audit/` | Implementado |
| tenants | `src/modules/tenants/` | Implementado |
| users | `src/modules/users/` | Implementado |
| connections | `src/modules/connections/` | Implementado — declarativo, sem chamada externa |
| credentials | `src/modules/credentials/` | Implementado — criptografia local, credentialRef |
| datasets | `src/modules/datasets/` | Implementado — declarativo |
| field-mappings | `src/modules/field-mappings/` | Implementado — declarativo |
| query-definitions | `src/modules/query-definitions/` | Implementado — declarativo |
| dashboard-definitions | `src/modules/dashboard-definitions/` | Implementado — declarativo |
| execution-preview | `src/modules/execution-preview/` | Implementado — demo em memória, sem execução real |

### O que NÃO existe ainda

**Não implementar sem autorização explícita e ADR quando necessário:**

- JWT auth real (login, refresh, bcrypt, strategies) — planejado, não iniciado
- Motor de consumo de APIs de clientes (`data-connectors`) — planejado, não iniciado
- Teste de conexão real — planejado, não iniciado
- Execução real de query — Fase 2
- Cache Redis / fila / worker / scheduler — Fase 2
- Relatórios, exportações, white-label, preferências — não implementados
- delfos-connectors — serviço futuro separado
- Módulo `dashboards` ou `widgets` de runtime — não implementados

---

## 7. Onde achar cada coisa

| Tema | Documento |
|---|---|
| Arquitetura geral | `docs/architecture.md` |
| Escopo da Fase 1 | `docs/phase-1-scope.md` |
| Fora de escopo | `docs/out-of-scope.md` |
| Política de acesso a dados | `docs/data-access-policy.md` |
| Motor de consumo de APIs | `docs/api-connectors.md` |
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
| Checklist de qualidade | `docs/quality-checklist.md` |
| Decisões arquiteturais | `docs/adr/README.md` |
| Glossário | `docs/glossary.md` |
| PRD | `docs/delfos-prd.md` |
| Roadmap | `docs/roadmap.md` |

---

## 8. Definition of Done

Uma entrega só é considerada pronta quando:

- compila sem erros e passa no CI
- segue a arquitetura definida
- não introduz gambiarra
- não cria arquivo monolítico (> 500 linhas sem justificativa documentada)
- não duplica regra existente
- respeita o Design System (`DESIGN.md`)
- respeita segurança e isolamento por empresa (multi-tenant)
- possui tratamento de **loading**, **erro**, **vazio**, **sem permissão**
- está coerente com a Fase atual do produto
- respeita a política de bibliotecas (`docs/libraries-policy.md`)
- respeita a política de skills, plugins e MCPs (`docs/agent-tooling-policy.md`)
- não usa ferramenta externa com permissão além do necessário
- documentação relevante foi atualizada

Checklist completo em `docs/quality-checklist.md`.

---

## 9. Regra final

Sempre que houver dúvida, escolher na seguinte ordem:

1. **Solução organizada** > solução rápida.
2. **Reaproveitar** > criar novo (pesquisar antes).
3. **Abstração própria** > acoplamento direto a biblioteca específica.
4. **Caminho mais restritivo** em segurança.
5. **`DESIGN.md`** em dúvidas visuais.
6. **`docs/phase-1-scope.md`** em dúvidas de escopo.
7. **Menor privilégio + revisão humana** em ferramenta externa sensível.
