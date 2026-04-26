---
name: delfos-api-execution-plan
description: Planeje tarefas do delfos-api antes de editar código: escopo, arquivos afetados, riscos, validações, documentação e passos pequenos.
---

# Skill — Plano de execução do delfos-api

Use esta skill antes de tarefas estruturais, refatorações, criação de módulos, alterações em contratos, mudanças de segurança, modelagem MongoDB ou qualquer pedido que possa afetar vários arquivos.

## Quando não usar

Não use para correções triviais de texto, renomeações pequenas ou perguntas conceituais sem alteração no repositório.

## Leitura obrigatória

- `AGENTS.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/project-structure.md`
- `docs/development-guide.md`
- `docs/libraries-policy.md`
- `docs/quality-checklist.md`
- ADRs em `docs/adr/` relacionadas à tarefa

## Fluxo obrigatório

1. Identificar se a tarefa pertence à Fase 1.
2. Mapear os documentos normativos aplicáveis.
3. Listar arquivos/pastas que devem ser criados ou alterados.
4. Quebrar a execução em passos pequenos e reversíveis.
5. Identificar riscos: escopo, contrato, segurança, LGPD, multi-tenant, biblioteca nova, comando destrutivo.
6. Definir validações esperadas: lint, test, build, documentação e contratos.
7. Só implementar depois do plano estar coerente com `AGENTS.md` e `docs/`.

## Saída esperada antes de editar

```text
Plano de execução
1. Escopo:
2. Fora de escopo:
3. Documentos consultados:
4. Arquivos afetados:
5. Passos:
6. Riscos e mitigação:
7. Validações finais:
```

## Regras

- Não transformar o plano em implementação gigante.
- Não criar funcionalidade de negócio fora da fase aprovada.
- Não adicionar biblioteca sem passar por `docs/libraries-policy.md`.
- Não ignorar impacto no `delfos-web` quando houver contrato público.
- Não executar comando destrutivo sem autorização explícita.
