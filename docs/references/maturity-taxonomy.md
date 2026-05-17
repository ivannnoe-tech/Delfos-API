# Taxonomia de Maturidade — Delfos Analytics

> Tipo: taxonomia de governança da camada estratégica · Status: conceitual/futuro — não autoriza implementação

Escala única e canônica para descrever **em que estágio de maturidade** está cada ideia,
módulo futuro ou item de roadmap da camada `docs/references/`. Padroniza a leitura por
humanos e por AI agents e evita que "ideia" e "coisa pronta" pareçam o mesmo.

Governada por [`ADR-0026`](../adr/adr-0026-strategic-reference-library.md).

---

## Por que existe

A camada estratégica mistura, no mesmo lugar, desde anotações cruas até itens já
sustentados pela foundation declarativa. Sem uma escala explícita:

- ideias parecem promessas;
- roadmaps parecem cronogramas;
- agentes podem confundir material conceitual com trabalho aprovado.

A taxonomia dá a cada item **um rótulo de estágio honesto**, separado de prioridade e
de fase.

---

## A escala (8 estágios)

Ordem crescente de maturidade. Um item ocupa **exatamente um** estágio por vez.

| # | Estágio | Definição | Critério de entrada | Critério de saída |
|---|---|---|---|---|
| 1 | `Idea` | Conceito capturado. Inspiração registrada, ainda não investigada. | Item descrito na camada de referências. | Alguém inicia investigação de viabilidade. |
| 2 | `Research` | Em investigação. Viabilidade, encaixe e trade-offs sendo estudados. | Investigação ativa; pode citar ADR `Proposed`. | Viabilidade concluída e item aceito no roadmap. |
| 3 | `Planned` | Aceito formalmente no roadmap, com escopo e sequência. | Escopo aprovado; ADR `Accepted` quando arquitetural. | Design/spec iniciado. |
| 4 | `Designed` | Design e especificação concluídos e revisados. | Spec/design doc aprovado (ver `superpowers:brainstorming`). | Construção (protótipo ou foundation) iniciada. |
| 5 | `Prototype` | Existe protótipo experimental e descartável que valida a ideia. | Protótipo funcional, não-produtivo, construído. | Aprendizado consolidado; protótipo descartado. |
| 6 | `Foundation Ready` | A **foundation declarativa** que sustenta a capacidade existe e está mergeada (schemas, contratos, endpoints declarativos, types) — sem runtime/execução real. | Foundation declarativa entregue e testada. | Desenvolvimento da capacidade real iniciado. |
| 7 | `In Development` | Capacidade real sendo construída ativamente. | Implementação real em andamento, autorizada por escopo/ADR. | Capacidade entregue e validada. |
| 8 | `Production` | Disponível em produção, em uso real por tenants. | Release em produção, validado. | — (estágio terminal) |

### Observações de uso

- `Prototype` é **opcional** — muitos itens vão de `Designed`/`Foundation Ready` direto
  para `In Development`. Use só quando um protótipo descartável for de fato construído.
- `Foundation Ready` é o estágio **específico do Delfos**: reflete o modelo *foundation
  first* — contratos e estrutura declarativa existem antes da execução real (ver
  ADR-0024).
- Um item pode estar simultaneamente coberto por foundation pronta (`Foundation Ready`)
  enquanto a **capacidade real** que ele propõe ainda é `Idea`. Nesse caso, rotule pelo
  estágio da **capacidade descrita no item**, não pela foundation que a apoia.
- Regressão é possível: pesquisa pode rebaixar `Research` de volta a `Idea`.

---

## Três eixos independentes — não confundir

Maturidade **não** é prioridade e **não** é fase. São eixos ortogonais:

| Eixo | Pergunta que responde | Valores |
|---|---|---|
| **Maturidade** | Em que estágio do ciclo o item está? | os 8 estágios acima |
| **Prioridade** | Quão importante / urgente é? | alta / média / baixa |
| **Fase** | A que horizonte de produto pertence? | Fase 1 / Fase 2 / ambas (ADR-0024) |

Exemplo: um item pode ser `Idea` (maturidade), prioridade `alta` e Fase `2`. São três
informações distintas e todas úteis.

---

## Estado atual da camada de referências

Por força da [`ADR-0026`](../adr/adr-0026-strategic-reference-library.md), **nenhum item
da camada `docs/references/` está aprovado para implementação**. Na prática, hoje:

- a grande maioria dos itens é `Idea`;
- itens que se apoiam diretamente em módulos de foundation já existentes, ou que citam
  uma ADR `Proposed`, podem ser `Research`;
- **nenhum** item da camada de referências deve aparecer como `Planned` ou acima — esses
  estágios exigem aprovação formal fora da biblioteca.

Conforme cada item evoluir por escopo aprovado e ADRs, seu estágio sobe.

---

## Onde e como aplicar

A taxonomia é aplicada em três lugares da camada estratégica.

### 1. `ideas-for-delfos.md` (por produto)

Cada ideia (`### N. ...`) recebe um campo **`Maturidade`** na sua tabela de campos:

```text
| Maturidade | `Idea` |
```

### 2. `consolidated/*-roadmap.md`

Cada tabela de itens de roadmap ganha uma coluna **`Maturidade`**:

```text
| Item | Prioridade | Complexidade | Maturidade | ... |
|------|-----------|--------------|------------|-----|
```

### 3. `consolidated/future-modules-catalog.md`

Cada módulo futuro recebe um campo **`Maturidade`** com o estágio do módulo.

### Regras de aplicação

- Use **exatamente** um dos 8 rótulos, sempre em crase: `` `Idea` ``, `` `Research` ``, etc.
- Não inventar estágios intermediários nem combinar dois.
- Na dúvida entre dois estágios, escolher o **menor** (mais conservador).
- Ao mover um item de estágio, a mudança deve refletir um fato real (investigação feita,
  ADR aceita, foundation mergeada) — não otimismo.

---

## Relacionado

- [`../adr/adr-0026-strategic-reference-library.md`](../adr/adr-0026-strategic-reference-library.md) — governança da camada
- [`../adr/adr-0024-phase-1-and-phase-2-definition.md`](../adr/adr-0024-phase-1-and-phase-2-definition.md) — definição de fases
- [`README.md`](./README.md) — índice da strategic reference library
- [`consolidated/future-modules-catalog.md`](./consolidated/future-modules-catalog.md)
- [`consolidated/strategic-product-vision.md`](./consolidated/strategic-product-vision.md)
