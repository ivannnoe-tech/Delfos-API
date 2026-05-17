# Filosofia de Produto — Delfos Analytics

> Tipo: índice da camada de filosofia de produto · Status: princípios e visão — não autoriza implementação

Esta camada declara **como o Delfos pensa**. Consolida, em documentos opinativos, a
intenção de produto que emergiu do estudo da camada de referências
([`docs/references/`](../references/README.md)), das ADRs e da arquitetura atual.

Enquanto `docs/references/` responde *"o que o mercado faz"*, `docs/product/` responde
*"o que o Delfos é e por quê"*.

---

## Natureza desta camada

- **Filosofia** (`*-philosophy.md`) — postura e princípios orientadores. Material
  evergreen: guia decisões, não tem prazo.
- **Visão** (`*-vision.md`) — direção futura de uma capacidade. Material conceitual/
  futuro: descreve para onde o Delfos quer ir, sem antecipar implementação.

Nenhum documento aqui autoriza implementação. Capacidades exigem escopo aprovado e, onde
couber, ADR (ver `docs/adr/`). Princípios cedem a regras canônicas (`AGENTS.md`, ADRs)
quando houver conflito.

---

## Documentos

| Documento | Tipo | Conteúdo |
|---|---|---|
| [`principles.md`](./principles.md) | Filosofia | **Keystone** — os 12 princípios que regem todo o resto |
| [`ux-philosophy.md`](./ux-philosophy.md) | Filosofia | Como o Delfos pensa experiência do usuário |
| [`ai-philosophy.md`](./ai-philosophy.md) | Filosofia | Como o Delfos pensa IA aplicada a analytics |
| [`dashboard-philosophy.md`](./dashboard-philosophy.md) | Filosofia | Como o Delfos pensa dashboards e composição visual |
| [`embedded-analytics-philosophy.md`](./embedded-analytics-philosophy.md) | Filosofia | Como o Delfos pensa analytics embarcado |
| [`runtime-philosophy.md`](./runtime-philosophy.md) | Filosofia | Como o Delfos pensa execução e runtime |
| [`semantic-layer-vision.md`](./semantic-layer-vision.md) | Visão | Para onde vai a camada semântica do Delfos |
| [`enterprise-governance-vision.md`](./enterprise-governance-vision.md) | Visão | Para onde vai a governança enterprise do Delfos |

---

## Como navegar

- **Primeiro contato** → comece por [`principles.md`](./principles.md); todo o resto deriva dele.
- **Decisão sobre um tema** → leia a filosofia/visão do tema antes de propor desenho.
- **AI agents** → tratem esta camada como a intenção do produto: ela filtra propostas
  que contrariam o Delfos, mas não substitui ADRs nem autoriza implementação.

---

## Relacionado

- [`../references/README.md`](../references/README.md) — biblioteca estratégica de referências
- [`../references/maturity-taxonomy.md`](../references/maturity-taxonomy.md) — taxonomia de maturidade
- [`../adr/`](../adr/) — Architecture Decision Records
- [`../README.md`](../README.md) — índice geral da documentação
- [`../roadmap.md`](../roadmap.md) · [`../phase-2-vision.md`](../phase-2-vision.md) · [`../delfos-prd.md`](../delfos-prd.md)
