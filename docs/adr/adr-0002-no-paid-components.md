# ADR-0002 — No paid or restrictive-license components

- **Status**: Accepted
- **Data**: 2026-04-25
- **Fase impactada**: Fase 1 e Fase 2

---

## Contexto

Componentes visuais e bibliotecas pagas (e.g. Syncfusion, DevExpress, AG Grid Enterprise, Telerik) reduzem o tempo de desenvolvimento inicial, mas trazem custo recorrente, lock-in, restrições por número de desenvolvedores/usuários, dependência de vendor e, frequentemente, dificuldade de white label.

O Delfos pretende oferecer **white label** desde a Fase 1. Componentes pagos costumam restringir redistribuição, customização visual e revenda do produto que os embarca, criando atrito real com o modelo de negócio.

Licenças copyleft fortes (GPL, AGPL) e algumas custom (e.g. SSPL, BSL) também são incompatíveis com produto proprietário comercializado, ou exigem cláusulas que o time não está disposto a assumir.

---

## Decisão

O Delfos **não usa** bibliotecas pagas como base estrutural do produto. Também **não usa** bibliotecas com licença GPL, AGPL, LGPL, SSPL, BSL ou licenças comerciais/desconhecidas, sem aprovação explícita por escrito.

Licenças aceitas por padrão: **MIT**, **BSD-2-Clause**, **BSD-3-Clause**, **Apache-2.0**.

Bibliotecas com licença "gratuita até X usuários/desenvolvedores/faturamento" são tratadas como pagas e **não** entram sem aprovação.

---

## Alternativas consideradas

- **Aceitar componentes pagos** com cláusula de redistribuição — descartada por custo recorrente e lock-in.
- **Aceitar GPL/LGPL** mediante isolamento via processo separado — descartada por complexidade operacional e risco jurídico.
- **Caso a caso, sem regra dura** — descartada porque vira fonte recorrente de discussão e introduz risco silencioso.

---

## Consequências

### Positivas

- Sem custo recorrente de licença
- Sem restrição de white label
- Sem lock-in com vendor
- Política simples e auditável

### Negativas / trade-offs aceitos

- Algumas funcionalidades exigem mais trabalho de implementação (e.g. data grid avançada, gráficos complexos)
- Suporte oficial inexistente para libs OSS — a equipe assume manutenção
- Componentes próprios precisam de investimento contínuo

---

## Impacto na Fase 1

- Antes de adicionar qualquer biblioteca, o agente/desenvolvedor segue `prompts/library-review-prompt.md`
- O Design System Delfos é construído **internamente** (`lib/shared/widgets/` no front)
- Para gráficos, usamos `fl_chart` (MIT) e `graphic` (Apache-2.0) atrás de `ChartRenderer` — ver ADR-0003
- Para data grid no front, partimos de `DataTable2` ou implementação própria — sem opção paga

## Impacto futuro / Fase 2

- Mesma política se mantém. Funcionalidades avançadas que tradicionalmente seriam compradas (e.g. pivot table interativa, OLAP) serão construídas internamente ou substituídas por composição de componentes próprios.

---

## Referências

- `docs/libraries-policy.md`
- `prompts/library-review-prompt.md`
- ADR-0003 (ChartRenderer)
