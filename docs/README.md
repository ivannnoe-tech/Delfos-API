# Documentação — delfos-api

Índice **arquivo por arquivo** da documentação do `delfos-api`. As regras
canônicas vivem em `AGENTS.md` (raiz do repositório); os documentos abaixo
detalham produto, arquitetura, foundation, runtime, operação, segurança e
governança.

> Documentos que descrevem conectores, cache, JWT, runtime real ou bridge real
> são **conceituais/futuros** e não autorizam implementação.

---

## Produto

| Arquivo | Conteúdo |
|---|---|
| [`delfos-prd.md`](./delfos-prd.md) | PRD — visão de produto, funcionalidades atuais e futuras. |
| [`roadmap.md`](./roadmap.md) | Roadmap por fases e taxonomia canônica de status. |
| [`phase-1-scope.md`](./phase-1-scope.md) | Escopo da Fase 1 (foundation declarativa). |
| [`phase-2-vision.md`](./phase-2-vision.md) | Visão da Fase 2 (execução real, futura). |
| [`out-of-scope.md`](./out-of-scope.md) | Limites normativos do que fica fora da Fase 1. |
| [`glossary.md`](./glossary.md) | Glossário de termos do produto e da foundation. |

## Arquitetura

| Arquivo | Conteúdo |
|---|---|
| [`architecture.md`](./architecture.md) | Arquitetura geral entre `delfos-api` e `delfos-web`. |
| [`project-structure.md`](./project-structure.md) | Estrutura de pastas e organização do código. |
| [`database-model.md`](./database-model.md) | Modelo de dados / coleções MongoDB. |
| [`de-para.md`](./de-para.md) | Modelo declarativo de field-mapping (De/Para). |
| [`api-contracts.md`](./api-contracts.md) | Padrões gerais de contrato REST e apêndice de contratos futuros. |
| [`api-foundation-contracts.md`](./api-foundation-contracts.md) | Contratos detalhados dos endpoints da foundation. |
| [`api-connectors.md`](./api-connectors.md) | Conceitos de conectores reais — conceitual/futuro. |
| [`external-source-configuration-flow.md`](./external-source-configuration-flow.md) | Fluxo declarativo de configuração de fonte externa. |
| [`components-strategy.md`](./components-strategy.md) | Estratégia de componentes — voltado ao `delfos-web`. |

## Foundation

| Arquivo | Conteúdo |
|---|---|
| [`foundation-auth-and-errors.md`](./foundation-auth-and-errors.md) | Auth temporária por admin-key e contrato de erros. |
| [`foundation-credentials-and-security.md`](./foundation-credentials-and-security.md) | Credenciais, `credentialRef` e segurança. |
| [`foundation-data-catalog.md`](./foundation-data-catalog.md) | Catálogo declarativo de datasets/queries/dashboards/reports/mappings. |
| [`foundation-tenancy-and-admin-resources.md`](./foundation-tenancy-and-admin-resources.md) | Multi-tenant e recursos administrativos. |
| [`foundation-stability-checkpoint.md`](./foundation-stability-checkpoint.md) | Checkpoint vivo do estado consolidado da foundation. |

## Runtime design (conceitual/futuro)

| Arquivo | Conteúdo |
|---|---|
| [`runtime-connectors-bridge-plan.md`](./runtime-connectors-bridge-plan.md) | Plano conceitual da bridge `ExecutionRequest → ConnectorExecutionCommand`. |
| [`runtime-connectors-bridge-resolver-design.md`](./runtime-connectors-bridge-resolver-design.md) | Design técnico do bridge resolver (foundation tests-only). |
| [`runtime-reference-reader-adapters-design.md`](./runtime-reference-reader-adapters-design.md) | Design dos reference reader adapters (foundation tests-only). |
| [`runtime-reference-reader-adapter-wiring-design.md`](./runtime-reference-reader-adapter-wiring-design.md) | Design do wiring futuro dos adapters (apenas design). |

## Operação

| Arquivo | Conteúdo |
|---|---|
| [`env-reference.md`](./env-reference.md) | Variáveis de ambiente e secrets. |
| [`local-development.md`](./local-development.md) | Fluxo de desenvolvimento local. |
| [`deployment-guide.md`](./deployment-guide.md) | Fluxo base de deploy (caveat: fase de foundation). |
| [`operations-runbook.md`](./operations-runbook.md) | Runbook de resposta a incidentes. |
| [`backup-restore.md`](./backup-restore.md) | Backup e restore do MongoDB. |
| [`destructive-commands-policy.md`](./destructive-commands-policy.md) | Política de comandos destrutivos. |
| [`branch-protection-checklist.md`](./branch-protection-checklist.md) | Checklist de proteção de branch. |
| [`development-guide.md`](./development-guide.md) | Guia de desenvolvimento e convenções de código. |
| [`testing-guide.md`](./testing-guide.md) | Guia de testes (unit, integração, E2E). |
| [`quality-checklist.md`](./quality-checklist.md) | Checklist de qualidade — regras canônicas (inclui §0.1, tamanho de arquivo). |
| [`libraries-policy.md`](./libraries-policy.md) | Política de bibliotecas e dependências. |
| [`postman-policy.md`](./postman-policy.md) | Política canônica de uso do Postman. |

> O antigo `operations.md` foi um stub de índice e foi removido; seu conteúdo
> está consolidado neste índice (grupo Operação acima).

## Segurança

| Arquivo | Conteúdo |
|---|---|
| [`security-checklist.md`](./security-checklist.md) | Checklist de segurança por área. |
| [`security-lgpd.md`](./security-lgpd.md) | LGPD, retenção e auditoria. |
| [`threat-model.md`](./threat-model.md) | Modelo de ameaças e controles. |
| [`data-access-policy.md`](./data-access-policy.md) | Política de acesso a dados. |

## Agentes (camada agent-ready)

| Arquivo | Conteúdo |
|---|---|
| [`agent-operating-model.md`](./agent-operating-model.md) | Modelo operacional para agentes de IA. |
| [`agent-safety-rules.md`](./agent-safety-rules.md) | Regras de segurança para agentes. |
| [`agent-stop-conditions.md`](./agent-stop-conditions.md) | Condições de parada que exigem validação humana. |
| [`agent-task-contract.md`](./agent-task-contract.md) | Contrato de tarefa para agentes. |
| [`agent-tooling-policy.md`](./agent-tooling-policy.md) | Política de ferramentas/MCP para agentes. |
| [`agent-validation-checklist.md`](./agent-validation-checklist.md) | Checklist de validação de entregas de agentes. |

## ADR — Architecture Decision Records

Decisões arquiteturais em [`adr/`](./adr/). Índice e status no
[`adr/README.md`](./adr/README.md). Cobertura atual: ADR-0001 a ADR-0033
(ADR-0013 é mantida no repositório `delfos-connectors`).

## Product — filosofia e visão de produto

Camada que declara **como o Delfos pensa**, em [`product/`](./product/). Ponto de
entrada: [`product/README.md`](./product/README.md). Inclui `principles.md`
(keystone) e documentos de filosofia por tema: `ai-philosophy.md`,
`dashboard-philosophy.md`, `embedded-analytics-philosophy.md`,
`enterprise-governance-vision.md`, `runtime-philosophy.md`,
`semantic-layer-vision.md`, `ux-philosophy.md`. Material orientador — não
autoriza implementação.

## References — referências estratégicas

Estudo estratégico de plataformas open-source de BI/Analytics/AI em
[`references/`](./references/). Ponto de entrada:
[`references/README.md`](./references/README.md). Material **conceitual/futuro**:
nenhum documento ali autoriza implementação.
