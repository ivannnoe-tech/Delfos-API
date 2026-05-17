# Princípios do Delfos Analytics

> Tipo: filosofia de produto · Status: princípios orientadores — não autoriza implementação

Este documento declara **como o Delfos pensa**. É a base da camada `docs/product/`:
todos os demais documentos de filosofia e visão derivam destes princípios e não devem
contradizê-los.

Princípios orientam decisões; não substituem ADRs nem autorizam implementação. Quando
um princípio e uma regra canônica (`AGENTS.md`, ADR) divergirem, a regra canônica
prevalece — e o princípio deve ser revisto.

---

## Para que serve

- Dar um critério estável de decisão quando a documentação específica não cobre o caso.
- Alinhar humanos e AI agents sobre a **intenção** do produto, não só sobre suas regras.
- Tornar explícito o que o Delfos recusa — não apenas o que persegue.

---

## Os princípios

### 1. Foundation antes de execução

O Delfos é construído de dentro para fora: primeiro contratos, schemas, catálogos e
endpoints declarativos; só depois execução real. Uma capacidade só é construída quando a
sua foundation declarativa existe, é testada e está estável. Pressa de runtime que pula
a foundation é recusada.

### 2. Declarativo por padrão

Dashboards, queries, relatórios e mapeamentos são **definições** — dados versionáveis,
inspecionáveis e validáveis — não código imperativo nem efeito colateral. O que pode ser
descrito como definição declarativa deve sê-lo. Isso habilita diff, revisão,
explicabilidade e evolução segura.

### 3. Multi-tenancy é fronteira, não filtro

`tenantId` é uma **fronteira de isolamento obrigatória**, presente em toda query
multi-tenant — nunca um filtro opcional que se possa esquecer. O isolamento é projetado
para ser impossível de burlar por omissão, não corrigido depois.

### 4. Segurança e privacidade por construção

Segredos nunca circulam: `credentialRef` é referência, nunca o segredo; `connectionId` é
referência de configuração, nunca connection string. Metadados são sanitizados, dados
sensíveis são mascarados, entradas são validadas antes de alcançar URL, header ou corpo.
Segurança é propriedade do desenho — não uma feature paga nem uma camada adicionada no
fim.

### 5. IA é assistiva, fundamentada e auditável

A IA do Delfos **propõe, explica e resume**; ela não decide, não executa e não altera
nada sozinha. Toda saída de IA é fundamentada em dados governados pela plataforma,
rastreável até sua origem e revisável por uma pessoa. IA sem proveniência não entra em
produção.

### 6. Disciplina de fases

O Delfos distingue formalmente Fase 1 (foundation administrativa/declarativa) e Fase 2
(execução real, ingestão, runtime). Antecipar capacidade de fase futura sem ADR é
recusado; adiar é uma decisão legítima e registrada. O roadmap é honesto sobre o que
existe, o que é foundation-only e o que é futuro.

### 7. Decisões deixam rastro

Mudanças arquiteturais viram ADRs imutáveis; decisões revogadas são supersedidas, não
apagadas. O produto prefere uma decisão registrada e revisável a uma decisão implícita.
A documentação é parte do produto, não um anexo.

### 8. Honestidade de estado

O Delfos nunca infla progresso. Um conceito é chamado de conceito; uma foundation é
chamada de foundation; só o que está pronto e validado é chamado de pronto. A
[taxonomia de maturidade](../references/maturity-taxonomy.md) existe para sustentar essa
honestidade.

### 9. Pluralidade de fontes

O Delfos não se casa com uma única tecnologia de dados. Connectors são plurais (API,
warehouse, on-premise) e conversam por contratos versionados — nunca por acoplamento a
um dialeto, produto ou fornecedor específico.

### 10. Inspiração sem imitação

O Delfos estuda o mercado a fundo (ver `docs/references/`), mas não copia código, telas
nem arquitetura. Absorve ideias e padrões e os **reinterpreta** para o seu próprio
modelo. A identidade do produto não é negociável.

### 11. Sem dependências caras ou restritivas

O Delfos se apoia em tecnologia open-source de licença permissiva. Componentes pagos ou
de licença restritiva não entram na base do produto. Valor premium vem do desenho e da
experiência, não de cativeiro de fornecedor.

### 12. Simplicidade primeiro, complexidade quando merecida

Cache, filas, workers, runtime distribuído e abstrações pesadas só entram quando o
problema real os exige. O Delfos prefere o desenho mais simples que resolve o caso atual
e evolui — em vez de antecipar complexidade que ainda não se pagou.

---

## Como usar estes princípios

- Em **decisão de produto ou arquitetura**: verifique se a opção respeita os 12
  princípios; se violar algum, ou a opção muda ou o princípio precisa de revisão formal.
- Em **revisão de PR**: princípios são critério legítimo de feedback.
- Para **AI agents**: trate estes princípios como a intenção do produto; eles não
  autorizam implementação, mas filtram propostas que contrariam o Delfos.

---

## Relacionado

- [`README.md`](./README.md) — índice da camada de filosofia de produto
- [`ux-philosophy.md`](./ux-philosophy.md)
- [`ai-philosophy.md`](./ai-philosophy.md)
- [`dashboard-philosophy.md`](./dashboard-philosophy.md)
- [`semantic-layer-vision.md`](./semantic-layer-vision.md)
- [`runtime-philosophy.md`](./runtime-philosophy.md)
- [`embedded-analytics-philosophy.md`](./embedded-analytics-philosophy.md)
- [`enterprise-governance-vision.md`](./enterprise-governance-vision.md)
- [`../references/README.md`](../references/README.md) — biblioteca estratégica de referências
- [`../adr/`](../adr/) — Architecture Decision Records
- [`../roadmap.md`](../roadmap.md) · [`../phase-2-vision.md`](../phase-2-vision.md) · [`../delfos-prd.md`](../delfos-prd.md)
