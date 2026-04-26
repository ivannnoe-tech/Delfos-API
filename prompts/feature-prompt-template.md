# Prompt — Nova funcionalidade Delfos

Use este template com agentes/CLIs de IA para criar funcionalidade nova.

---

## Contexto obrigatório

Estamos no projeto **Delfos Analytics**.

Antes de implementar, considere como fonte principal:

- `AGENTS.md`
- `DESIGN.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md`
- `docs/components-strategy.md`
- `docs/libraries-policy.md`
- `docs/development-guide.md`
- `docs/security-checklist.md`

---

## Tarefa

Implementar: `[descreva a funcionalidade]`

Escopo permitido:

- `[listar o que entra]`

Fora de escopo:

- `[listar o que não deve ser feito]`

---

## Regras obrigatórias

- Não criar arquivo gigante.
- Separar responsabilidades.
- Não adicionar biblioteca sem revisar licença e necessidade.
- Não persistir dados operacionais do cliente na Fase 1.
- Validar tenant e permissões no backend.
- Usar Design System no frontend.
- Usar `ChartRenderer` para gráficos.
- Implementar estados loading/empty/error/permission/configuração incompleta quando aplicável.
- Atualizar documentação se mudar contrato, arquitetura ou comportamento relevante.

---

## Entrega esperada

- Lista de arquivos alterados/criados.
- Explicação curta do desenho técnico.
- Testes criados/atualizados.
- Comandos para validar.
- Riscos ou pendências assumidas.
