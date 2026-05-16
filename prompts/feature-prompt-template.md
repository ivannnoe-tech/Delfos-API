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

- Respeitar a regra oficial de tamanho de arquivo (`docs/quality-checklist.md` §0.1): alvo ≤ 300 linhas; 301–450 avaliar split; 451–600 só com justificativa; **acima de 600 linhas é o limite máximo absoluto** — parar e pedir validação humana. Preferir módulos/serviços/helpers menores.
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
- Lista e justificativa de arquivos acima de 450 linhas criados/aumentados pela tarefa (regra de tamanho, `docs/quality-checklist.md` §0.1).
