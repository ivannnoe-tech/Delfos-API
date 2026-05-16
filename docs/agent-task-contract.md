# Agent Task Contract — Delfos Analytics

> Status: documento de governança da camada agent-ready.
> Define o **formato mínimo de uma tarefa** que um agente de IA pode executar
> no projeto Delfos Analytics.
> Complementa, não substitui, `AGENTS.md` e `docs/agent-operating-model.md`.

Uma tarefa só pode ser executada por um agente quando estiver descrita de forma
mínima e explícita. Este documento define esse contrato. Para o modelo
operacional geral do agente, ver `docs/agent-operating-model.md`.

---

## 1. Formato mínimo de uma tarefa executável

Toda tarefa despachada para um agente deve declarar:

1. **Objetivo** — o que a tarefa quer alcançar, em uma frase clara.
2. **Contexto** — por que a tarefa existe e o que o agente precisa saber.
3. **Escopo permitido** — o que entra na tarefa, de forma explícita.
4. **Fora de escopo** — o que **não** deve ser feito, de forma explícita.
5. **Arquivos permitidos / proibidos** — onde o agente pode e não pode tocar.
6. **Critérios de aceite** — o que define a tarefa como concluída.
7. **Validações obrigatórias** — comandos/checagens a executar antes de fechar.
8. **Formato do relatório final** — como o agente reporta o resultado.

Tarefa sem esses elementos é **incompleta** e o agente deve pedir que o
solicitante a complete antes de iniciar.

---

## 2. Escopo e fora de escopo

Toda tarefa declara **ambos** explicitamente. Tudo que não estiver no escopo
permitido é considerado **negado por padrão**: o agente não amplia a tarefa por
conta própria.

- O escopo permitido delimita o trabalho autorizado.
- O fora de escopo registra itens próximos que **não** devem ser feitos,
  evitando ambiguidade.
- Capacidades de Fase 2 (connectors reais, dispatch, execução real, JWT, cache,
  fila, scheduler) estão **sempre fora de escopo** na fase atual, mesmo que não
  listadas — ver `docs/agent-operating-model.md` §4 e ADR-0024.
- Tarefa que cria uma **nova operação ou endpoint** deve declarar o papel mínimo
  conforme a **matriz oficial papel→operações** da **ADR-0017**. Se a operação
  não se encaixar claramente na matriz, é **stop condition**: o agente não
  inventa permissão e pede validação humana — ver `docs/agent-stop-conditions.md`
  §10.
- O agente **pode propor** o uso da capability assistiva
  `analytics_text_generation` em tarefas de relatório, dashboard ou comparação
  de períodos, mas **não pode implementar** integração real com OpenAI ou
  qualquer LLM sem tarefa explícita que referencie a ADR-0025, com revisão de
  segurança e validação humana. Sem esses requisitos, a integração real está
  fora de escopo — ver **ADR-0025** e `docs/agent-safety-rules.md` §15.

---

## 3. Arquivos permitidos e proibidos

Por padrão:

- **Tarefas de documentação/governança** tocam apenas arquivos `.md` de
  documentação e governança. Não alteram código.
- Tocar `src/`, `lib/` ou `test/` exige **escopo explícito de implementação
  aprovado** na tarefa.

A tarefa deve listar caminhos permitidos e, quando útil, caminhos explicitamente
proibidos. Na dúvida sobre poder tocar um arquivo fora da lista, o agente
**não toca** e registra a dúvida como pendência.

---

## 4. Critérios de aceite e validações obrigatórias

Os **critérios de aceite** descrevem objetivamente o resultado esperado da
tarefa específica.

As **validações obrigatórias** seguem fontes canônicas — **não duplicar o
checklist completo na tarefa**:

- `docs/agent-validation-checklist.md` — checklist de validação da camada
  agent-ready;
- `docs/quality-checklist.md` — fonte canônica da Definition of Done (DoD),
  incluindo a regra de tamanho de arquivo (§0.1) e demais regras canônicas
  (§0.2). Para tarefas de código, inclui `format:check`, `lint`, `test` e
  `build` (§10).

Se uma validação não puder ser executada, isso é registrado como pendência no
relatório final (ver `docs/agent-stop-conditions.md`).

---

## 5. Relatório final

Toda tarefa termina com um relatório com, no mínimo:

- **Resumo** — o que foi feito.
- **Arquivos criados/alterados** — caminhos completos.
- **Validações** — comandos executados e resultados; pendências quando não foi
  possível validar.
- **Arquivos acima de 450 linhas** criados/aumentados, com justificativa
  objetiva (regra de tamanho, `docs/quality-checklist.md` §0.1).
- **Pendências "precisa validação humana"** — conflitos, stop conditions e
  decisões que o agente não pode tomar sozinho.
- **Riscos / limitações** assumidos.

---

## 6. Quando quebrar uma tarefa grande em subtarefas

O agente deve **preferir subtarefas pequenas e coesas** quando:

- a tarefa tocar **muitos arquivos ou várias áreas** distintas;
- um único arquivo fosse passar de **600 linhas** (limite máximo absoluto);
- a tarefa misturar responsabilidades que ganham clareza ao serem separadas.

Quebrar cedo evita arquivos gigantes e mantém cada entrega revisável. Tarefas
estruturais ou que tocam vários arquivos devem começar pela skill
`execution-plan` (ver `AGENTS.md` §5).

---

## 7. Regra de tamanho de arquivo (resumo)

Fonte canônica: `docs/quality-checklist.md` §0.1. Resumo:

| Faixa | Regra |
|---|---|
| Até 300 linhas | Alvo. Manter o arquivo pequeno e coeso. |
| 301–450 linhas | Permitido; avaliar divisão por responsabilidade. |
| 451–600 linhas | Permitido só com justificativa objetiva no relatório final. |
| Acima de 600 linhas | Proibido sem validação humana explícita — parar e perguntar. |

600 linhas é o **limite máximo absoluto, não uma meta**. Sempre preferir
módulos, componentes, serviços, helpers ou documentos menores. Para a regra
completa e as exceções, consultar `docs/quality-checklist.md` §0.1.

---

## 8. Modelo curto de contrato de tarefa

Um humano pode preencher o modelo abaixo para despachar um agente. Ele reaproveita
a estrutura de `prompts/feature-prompt-template.md` — para tarefas de
funcionalidade, usar esse template diretamente.

```
## Objetivo
[uma frase: o que a tarefa quer alcançar]

## Contexto
[por que a tarefa existe; o que o agente precisa saber]

## Escopo permitido
- [item]

## Fora de escopo
- [item]

## Arquivos permitidos
- [caminhos]

## Arquivos proibidos
- [caminhos, se houver]

## Critérios de aceite
- [resultado objetivo esperado]

## Validações obrigatórias
- Conforme docs/agent-validation-checklist.md e docs/quality-checklist.md
- [comandos específicos, se houver]

## Formato do relatório final
- Conforme seção 5 deste documento
```

Este contrato complementa, não substitui, `AGENTS.md` e
`docs/agent-operating-model.md`. Em caso de divergência, prevalecem as fontes
canônicas conforme a ordem de autoridade documental.
