# Documentação — delfos-api

Índice da documentação do `delfos-api`. As regras canônicas vivem em `AGENTS.md`
(raiz do repositório); os documentos abaixo detalham produto, arquitetura, operação
e governança.

---

## Grupos de documentos

| Grupo | Documentos principais |
|---|---|
| Produto | `delfos-prd.md`, `roadmap.md`, `phase-1-scope.md`, `phase-2-vision.md`, `out-of-scope.md` |
| Arquitetura | `architecture.md`, `project-structure.md`, `database-model.md`, `de-para.md` |
| Foundation | `foundation-*.md`, `api-foundation-contracts.md`, `external-source-configuration-flow.md` |
| Segurança | `security-checklist.md`, `security-lgpd.md`, `threat-model.md`, `data-access-policy.md` |
| Operação | `deployment-guide.md`, `operations.md`, `operations-runbook.md`, `backup-restore.md` |
| Desenvolvimento | `development-guide.md`, `local-development.md`, `testing-guide.md`, `quality-checklist.md` |
| Agentes | `agent-operating-model.md`, `agent-safety-rules.md`, `agent-task-contract.md`, `agent-*.md` |
| Decisões | `adr/` — Architecture Decision Records |

---

## Strategic References

Documentação estratégica baseada em análise de plataformas modernas de BI,
Analytics, Embedded Analytics, Semantic Layer e AI Analytics.

Local:

- `docs/references/`

Objetivos:

- orientar evolução futura do Delfos,
- consolidar padrões enterprise,
- documentar diferenciais,
- estruturar futuras fases do produto,
- servir como base para AI agents.

Estuda 10 produtos open-source (Metabase, Apache Superset, Chartbrew, Cube, Airbyte,
WrenAI, Vanna AI, Lightdash, Evidence, NocoBase) como inspiração estratégica — sem
copiar código, telas ou arquitetura. Material **conceitual/futuro**: nenhum documento
ali autoriza implementação. Ponto de entrada: [`references/README.md`](./references/README.md).
