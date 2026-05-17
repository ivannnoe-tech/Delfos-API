# ADR-0026 — Strategic reference library (docs/references)

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: ambas

---

## Contexto

O Delfos Analytics está em fase **foundation** — administrativa e declarativa. Para
orientar as próximas fases do produto (dashboard builder, semantic layer, connectors
reais, IA aplicada, embedded analytics), foi criada uma **camada de documentação
estratégica** em `docs/references/`, baseada no estudo de 10 aplicações open-source de
BI/Analytics/AI (Metabase, Apache Superset, Chartbrew, Cube, Airbyte, WrenAI, Vanna AI,
Lightdash, Evidence, NocoBase).

Essa camada tem **risco de governança real**:

- Pode ser confundida com especificação de implementação e disparar trabalho não
  autorizado.
- Pode crescer de forma desordenada, com formato inconsistente e arquivos gigantes.
- Pode induzir cópia de código, telas ou arquitetura de produtos de terceiros —
  problema técnico, de qualidade e **de licença**.
- Novas referências podem entrar sem critério, poluindo a base.

É necessário registrar formalmente **o que essa biblioteca é, o que ela não é, e como
ela evolui**, para evitar bagunça e ambiguidade futuras.

## Decisão

O Delfos mantém uma **strategic reference library** em `docs/references/`, governada
pelas regras abaixo.

### 1. Objetivo da biblioteca

A biblioteca existe para:

- orientar a evolução futura do Delfos;
- consolidar padrões enterprise observados no mercado;
- documentar diferenciais competitivos potenciais;
- estruturar futuras fases do produto;
- servir como base de contexto para AI agents.

Ela é uma fonte de **inteligência de produto e inspiração estratégica** — não um
backlog, não um plano de execução, não um contrato.

### 2. Proibição de copiar código

É **proibido** copiar para o Delfos, a partir de qualquer produto estudado:

- código-fonte (trechos, arquivos, módulos);
- telas, layouts ou componentes visuais reproduzidos 1:1;
- arquitetura inteira ou estrutura de pastas replicada.

O estudo é **conceitual**: aproveitam-se ideias, conceitos, padrões e fluxos —
**reinterpretados** para a realidade do Delfos (multi-tenant, API-first, declarativo).
Copiar artefatos de terceiros é risco de licença, de qualidade e de identidade de
produto, e fica vedado por esta ADR.

### 3. Uso apenas conceitual — não autoriza implementação

Nenhum documento em `docs/references/` autoriza implementação. Todo arquivo carrega no
cabeçalho o status `conceitual/futuro — não autoriza implementação`.

Implementar qualquer ideia da biblioteca exige, obrigatoriamente:

1. escopo explícito aprovado;
2. quando a mudança for arquitetural (ver `adr/README.md`, "Quando criar um ADR"), uma
   **ADR própria** aprovada;
3. respeito às fases (ADR-0024) e às ADRs de bloqueio vigentes (ex.: ADR-0007,
   ADR-0021, ADR-0022).

Uma ideia descrita em `ideas-for-delfos.md` ou em um roadmap consolidado **não** é uma
ideia aprovada — é uma candidata a brainstorming e priorização.

### 4. Como usar as referências

- **Estudar um produto** → pasta do produto, começando por `overview.md`.
- **Buscar ideias aplicáveis** → arquivos `ideas-for-delfos.md` e a pasta
  `consolidated/`.
- **Decisão estratégica de produto** → `consolidated/strategic-product-vision.md` e os
  roadmaps temáticos.
- **AI agents** → podem ler a biblioteca como contexto, mas devem tratá-la como
  material conceitual; nunca como instrução de implementação.
- Ao citar uma referência em discussão, PR ou ADR, **linkar o arquivo específico**.

### 5. Estrutura e formato (como evoluir os docs)

- A camada vive somente em `docs/references/`.
- Cada produto tem uma pasta com **6 arquivos de seções padronizadas**: `overview.md`,
  `architecture.md`, `ux-patterns.md`, `premium-features.md`, `ideas-for-delfos.md`,
  `anti-patterns.md`.
- Sínteses transversais vivem em `docs/references/consolidated/`.
- `docs/references/README.md` é o índice navegável e deve ser atualizado a cada
  produto ou documento consolidado adicionado.
- Todo arquivo começa com `# Título` e a linha de status
  `> Tipo: ... · Status: conceitual/futuro — não autoriza implementação`.
- Arquivos devem permanecer **navegáveis e enxutos** (alvo ~120–320 linhas); arquivos
  gigantes devem ser divididos.
- Conteúdo em PT-BR; termos técnicos e nomes de código em inglês.
- A camada deve passar no `markdownlint` do repositório como qualquer outro doc.

### 6. Como novas referências entram

Para adicionar um novo produto de referência:

1. Justificar a relevância estratégica (categoria, lacuna que cobre, por que agora).
2. Criar a pasta com os **6 arquivos padronizados** — sem formato ad-hoc.
3. Fatos sobre o produto (arquitetura, stack, features) devem ser **verificados em
   fontes públicas**, não presumidos.
4. Atualizar `docs/references/README.md` e os documentos `consolidated/` afetados.
5. Manter a proibição de cópia e o status conceitual.
6. Entrar via PR de documentação (`docs/` branch), como qualquer mudança.

Atualizar uma referência existente segue as mesmas regras de formato e verificação.

## Alternativas consideradas

- **Não registrar governança (deixar como docs comuns)** — rejeitada. Sem regra
  explícita, a camada tende a virar backlog informal, a induzir cópia e a crescer sem
  padrão. O risco que motivou esta ADR continuaria aberto.
- **Tratar cada referência como ADR** — rejeitada. ADRs registram decisões
  arquiteturais imutáveis; material de estudo e inspiração não é uma decisão e mudaria
  a natureza do diretório `adr/`.
- **Manter as referências fora do repositório (wiki/Notion externo)** — rejeitada.
  Perde versionamento, revisão por PR e acesso direto por AI agents no contexto do
  código.

## Consequências

### Positivas

- A natureza conceitual da biblioteca fica formalmente registrada e não-ambígua.
- Reduz o risco de implementação não autorizada disparada por leitura de docs.
- Reduz risco de licença ao vedar cópia de código/telas/arquitetura.
- Garante formato consistente, navegável e previsível para humanos e agentes.
- Dá um processo claro para entrada de novas referências.

### Negativas / trade-offs aceitos

- Adiciona overhead de processo para criar/atualizar referências (6 arquivos,
  verificação de fatos, atualização de índice).
- Exige disciplina de revisão em PR para impedir desvio de formato.

### Neutras

- Não altera código, runtime, API nem UI.
- Não cria, adia nem antecipa nenhuma capacidade de produto.

## Impacto na Fase 1

- Nenhuma mudança em código, arquitetura executável, segurança ou LGPD.
- `docs/references/` permanece como documentação; esta ADR apenas a governa.
- Revisores de PR passam a validar formato e o status conceitual de qualquer alteração
  na camada.

## Impacto futuro / Fase 2

- Habilita uso da biblioteca como insumo estruturado para brainstorming e para futuras
  ADRs de capacidades (semantic layer, dashboard builder, AI assistant, connectors).
- Pode dificultar atalhos: implementar uma ideia exigirá sempre escopo e, quando
  arquitetural, ADR própria — intencional, para evitar avanço desgovernado.
- Esta ADR pode ser revista por uma ADR futura se o modelo de governança da camada
  precisar mudar.

## Referências

- [`../references/README.md`](../references/README.md) — índice da strategic reference library
- [`../references/consolidated/strategic-product-vision.md`](../references/consolidated/strategic-product-vision.md)
- [`../README.md`](../README.md) — índice da documentação do `delfos-api`
- [`./README.md`](./README.md) — índice e regras dos ADRs
- [`./adr-0002-no-paid-components.md`](./adr-0002-no-paid-components.md) — licenças e componentes
- [`./adr-0024-phase-1-and-phase-2-definition.md`](./adr-0024-phase-1-and-phase-2-definition.md) — definição de fases
- [`./adr-0025-llm-assisted-analytics-text-generation.md`](./adr-0025-llm-assisted-analytics-text-generation.md) — precedente de ADR "Accepted para documentação/planejamento"
