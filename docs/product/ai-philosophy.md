# Filosofia de IA do Delfos Analytics

> Tipo: filosofia de produto · Status: princípios orientadores — não autoriza implementação

Este documento declara **como o Delfos pensa IA aplicada a analytics**. Ele deriva
diretamente do [Princípio 5 — IA é assistiva, fundamentada e auditável](./principles.md)
e o detalha como postura de produto. Nada aqui autoriza implementação: o Delfos hoje
**não possui integração com LLM**, nem geração de texto, nem assistente. A capacidade é
*gated* por **ADR-0025**, que aceita a ideia para fins de documentação e desenho — não
como permissão de código.

A pergunta que este documento responde não é *"como o Delfos usa IA?"*, mas
*"que tipo de IA o Delfos aceita ter dentro de si — e que tipo recusa?"*.

---

## A tese: IA é um copiloto, nunca o piloto

A maior parte do mercado de analytics trata IA como um atalho: descreva em linguagem
natural, receba um resultado, confie. O Delfos rejeita esse contrato. Em analytics, uma
resposta plausível e errada é pior do que nenhuma resposta — porque decisões de negócio
são tomadas sobre ela.

Por isso o Delfos adota uma postura deliberadamente conservadora: a IA do produto
**propõe, explica e resume**. Ela não decide, não executa, não altera nada e não está
no caminho crítico de nenhuma operação. Tirar a IA do produto não pode quebrar o
produto — se quebrar, o desenho está errado.

Essa postura não é timidez tecnológica. É a aplicação consistente dos princípios do
Delfos a um domínio onde o erro é caro e silencioso.

---

## Os cinco compromissos

### 1. IA assistiva — propõe, não dispõe

A IA do Delfos produz **artefatos sugeridos**, nunca efeitos. Uma sugestão de query
nasce como uma `query-definition` em estado `draft`; uma narrativa de dashboard nasce
como texto rascunho associado a uma `dashboard-definition`. Nada disso é aplicado,
publicado ou executado sem um ato humano explícito.

O Delfos recusa, por desenho:

- IA que dispara execução de query sem aprovação humana.
- IA que altera `field-mappings`, `datasets` ou definições publicadas.
- IA que aprova, mascara, concede acesso ou toma qualquer decisão de governança.
- IA "autônoma" que encadeia ações sobre dados de cliente sem revisão.

A fronteira é simples: **a IA escreve propostas no mesmo lugar onde um humano
escreveria — e passa pela mesma porta de validação.**

### 2. IA fundamentada — grounded em metadados governados

Um LLM do Delfos nunca vê dados brutos do cliente. O *grounding* usa exclusivamente
**metadados governados**: catálogos, glossário de negócio, `field-mappings`,
descrições de `datasets` e — no futuro — a camada semântica
([`semantic-layer-vision.md`](./semantic-layer-vision.md)).

| O LLM PODE receber | O LLM NUNCA recebe |
|---|---|
| Nomes e descrições de measures/dimensions | Linhas de dados do cliente |
| Glossário e metadados de catálogo | Segredos, `credentialRef`, connection strings |
| Estrutura de `query-definitions` existentes | PII ou campos sob masking (ADR-0023) |
| Metadados já sanitizados (ADR-0020) | Schema cru não curado |

IA fundamentada raciocina sobre **significado de negócio curado**, não sobre tabelas
físicas. Isso reduz alucinação, mantém a sugestão dentro do vocabulário aprovado do
tenant e torna a IA uma consumidora da semântica — não uma adivinha de schema.

### 3. Proveniência e explainability obrigatórias

Toda saída de IA carrega **proveniência**: de onde veio cada campo, métrica ou
afirmação. Uma sugestão sem rastro até metadados governados não é uma sugestão válida —
é ruído, e não entra em produção.

Explainability não é um recurso opcional de UX: é condição de aceite. O usuário precisa
poder responder *"por que a IA propôs isto?"* olhando a própria proposta. Uma narrativa
de dashboard deve apontar quais measures sustentam cada frase; uma query sugerida deve
declarar quais definições semânticas usou.

### 4. Humano no loop — sempre, não às vezes

O Delfos não tem "modo automático". Toda transição de proposta para realidade — publicar
uma query, aplicar uma definição, divulgar uma narrativa — exige um ator humano
identificado. O humano não é um carimbo de fim de fila: ele é o ponto onde a
responsabilidade passa a existir.

Isso também significa que a IA é **sujeito de ACL e auditoria** como qualquer outro
ator. Uma ação assistida por IA respeita os papéis de `auth` (ADR-0017) e é registrada
em `audit` (ADR-0018). Não existe ator privilegiado invisível.

### 5. Auditabilidade e observabilidade de custo

Uso de LLM é uma operação observável de primeira classe, não um detalhe de
infraestrutura. Desde o primeiro dia de qualquer integração, o Delfos exige:

- **Trilha de auditoria** — qual prompt, qual ator, qual tenant, qual artefato gerado.
- **Observabilidade de custo e uso** — tokens e chamadas atribuídos por tenant.
- **Rastreabilidade de modelo** — qual provider e modelo produziram cada saída.

IA cujo custo e uso não são mensuráveis por tenant é uma dívida operacional disfarçada
de feature — e o Delfos recusa contraí-la.

---

## IA respeita a fronteira: tenantId, masking, sanitização

A IA não é exceção a nenhuma garantia do Delfos. Ela herda **todas**:

- **`tenantId` é fronteira, não filtro** ([Princípio 3](./principles.md)). O contexto
  de IA é tenant-scoped por construção; um prompt nunca cruza tenants, nem por engano
  de configuração.
- **Masking antes do modelo.** Campos sob política de masking (ADR-0023) já estão
  mascarados antes de qualquer metadado chegar ao prompt.
- **Sanitização de metadados** (ADR-0020). Campos proibidos e segredos são removidos
  antes do *grounding*; o LLM nunca é a primeira linha de defesa.

A ordem importa: o dado é protegido **antes** de a IA existir no fluxo, não depois. A IA
opera dentro de um perímetro já seguro — ela não o define.

---

## Provider e modelo são configuração, nunca código

Coerente com o [Princípio 11](./principles.md) (sem dependências caras ou restritivas)
e com o [Princípio 9](./principles.md) (pluralidade de fontes), o Delfos trata provider
e modelo de LLM como **configuração declarativa por tenant**, nunca como acoplamento
hardcoded.

- Nenhum provider de LLM é embutido na base do produto como dependência obrigatória.
- O modelo é selecionável e substituível sem mudança de código.
- A ausência de provider configurado degrada graciosamente: o produto funciona, apenas
  sem a camada assistiva.

O Delfos recusa cativeiro de fornecedor de IA tanto quanto recusa cativeiro de banco de
dados. A IA é plugável; o produto não depende dela para existir.

---

## O que o Delfos recusa explicitamente

Dizer o que se persegue é fácil. O Delfos também declara o que **não** aceita:

| Recusa | Por quê |
|---|---|
| IA que executa por conta própria | Viola IA assistiva; remove o humano responsável |
| IA sem proveniência | Saída não auditável é ruído, não informação |
| LLM exposto a dados brutos do cliente | Viola privacidade por construção e o grounding governado |
| IA no caminho crítico | Indisponibilidade ou erro de IA não pode quebrar o produto |
| Provider de LLM hardcoded | Cria dependência cara/restritiva e cativeiro |
| Uso de LLM sem custo observável por tenant | Dívida operacional invisível |
| "Agente autônomo" sobre dados de cliente | Sem revisão humana, sem responsabilidade |
| IA tratada como fonte de verdade | A verdade é o dado governado; a IA o interpreta |

---

## Horizonte: da postura ao roadmap

Esta filosofia é evergreen — guia decisões sem prazo. A tradução em capacidades
concretas vive no [`ai-assistant-roadmap.md`](../references/consolidated/ai-assistant-roadmap.md),
que sintetiza padrões de WrenAI, Vanna, Metabot, AI Assist e Cube AI e os adapta à
realidade *foundation* do Delfos.

O caminho conceitual, integralmente *gated* por ADR-0025 e por ADRs futuras:

1. **NL → `query-definition` sugerida** — o usuário descreve, a IA propõe um rascunho
   declarativo fundamentado na semântica; o humano valida e publica.
2. **Narrativas e resumos de dashboard** — texto explicativo ancorado em measures.
3. **Explicações de métrica e anomalia** — sempre com proveniência até a definição.

Cada onda exige autorização explícita. Nenhum item deste documento ou do roadmap
substitui esse gate. A IA do Delfos só nasce depois da foundation que ela respeita
([Princípio 1](./principles.md)).

---

## Relacionado

- [`principles.md`](./principles.md) — keystone; Princípio 5 é a base deste documento
- [`README.md`](./README.md) — índice da camada de filosofia de produto
- [`semantic-layer-vision.md`](./semantic-layer-vision.md) — a semântica que fundamenta a IA
- [`runtime-philosophy.md`](./runtime-philosophy.md) — execução que a IA propõe, mas não dispara
- [`ux-philosophy.md`](./ux-philosophy.md) — como a assistência aparece para o usuário
- [`../references/consolidated/ai-assistant-roadmap.md`](../references/consolidated/ai-assistant-roadmap.md) — roadmap consolidado de IA
- [`../references/consolidated/strategic-product-vision.md`](../references/consolidated/strategic-product-vision.md) — visão estratégica do produto
- [`../adr/adr-0025-llm-assisted-analytics-text-generation.md`](../adr/adr-0025-llm-assisted-analytics-text-generation.md) — gate da capacidade de IA
- [`../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md`](../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md) · [`../adr/adr-0023-data-masking-policy.md`](../adr/adr-0023-data-masking-policy.md) · [`../adr/adr-0024-phase-1-and-phase-2-definition.md`](../adr/adr-0024-phase-1-and-phase-2-definition.md)
