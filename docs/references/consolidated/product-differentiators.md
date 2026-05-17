# Diferenciais Competitivos do Delfos

> Tipo: visão estratégica consolidada · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este documento

Este arquivo sintetiza o estudo de 10 produtos open-source de BI/Analytics/AI
(metabase, superset, chartbrew, cube, airbyte, wren-ai, vanna, lightdash,
evidence, nocobase) e responde a uma pergunta única: **onde o Delfos pode ser
melhor ou diferente?**

Nada aqui autoriza implementação. O Delfos está em fase *foundation*
declarativa — armazena configuração, catálogos, referências seguras de
credenciais e auditoria. Os diferenciais abaixo são direção de produto; cada um
exige ADR e autorização explícita antes de virar código.

---

## 1. As lacunas comuns dos 10 concorrentes

O estudo revelou padrões de fraqueza que se repetem na maioria dos produtos
analisados. Essas lacunas não são bugs — são consequências de decisões de
arquitetura tomadas cedo e difíceis de reverter. O Delfos, por estar em
foundation, ainda pode escolher melhor.

### 1.1 Multi-tenancy como recurso adicionado depois

A maioria dos produtos nasceu single-tenant ou single-org e recebeu
multi-tenancy como camada posterior. O isolamento de dados depende de filtros
aplicados manualmente, de convenções de schema ou de deploy isolado por
cliente. O resultado é uma fronteira de tenant **frágil** — fácil de esquecer
em uma query nova, em um endpoint novo, em uma feature de IA.

No Delfos, `tenantId` é uma **invariante de isolamento obrigatória**, não um
filtro opcional. Toda query é tenant-scoped por construção. Esse é o diferencial
estrutural mais difícil de copiar: concorrentes maduros não conseguem reescrever
o isolamento sem quebrar tudo.

### 1.2 Semantic layer ausente, fraca ou opcional

Vários produtos não têm camada semântica (chartbrew, evidence em parte) ou a
tratam como recurso premium/avançado. Onde existe (cube, lightdash, wren-ai,
superset datasets), ela costuma estar acoplada a um motor SQL específico ou a um
ecossistema externo (dbt no caso do lightdash).

O Delfos pode tratar a camada semântica declarativa como o **núcleo** da
plataforma desde o início — `datasets` + `field-mappings` + `query-definitions`
já são os blocos de partida — e independente de qualquer motor de execução
concreto.

### 1.3 IA não-auditável e não-fundamentada

A onda de IA generativa nos produtos (Metabot, AI Assist, AI orchestrator,
copilotos GenBI, RAG treinável) traz um risco recorrente: a IA **gera SQL cru e
executa**, ou propõe consultas sem proveniência verificável. Quando alucina, o
erro chega ao dado. Quando a auditoria é fraca, ninguém sabe o que a IA fez.

O Delfos pode adotar uma postura distinta: a IA **propõe uma
`query-definition` declarativa**, fundamentada na camada semântica do tenant; um
humano valida; a IA nunca executa direto. Tudo gated por `adr-0025`.

### 1.4 Connectors acoplados ao runtime

Em produtos de integração e BI, o connector frequentemente é código acoplado ao
motor — difícil de versionar, de validar isoladamente, de evoluir sem risco. O
airbyte é a exceção parcial (protocolo versionado, CDK), e é justamente de onde
vem a melhor inspiração.

O Delfos pode tratar o connector como **spec declarativo + protocolo
versionado**, com a execução isolada em `delfos-connectors` (skeleton seguro
hoje) e a UI dirigida pelo spec. Gated por `adr-0021`/`adr-0022`.

### 1.5 Definições como estado mutável, não como artefato

Na maioria dos produtos, dashboards e queries são registros mutáveis sem
histórico, diff ou rollback de primeira classe. Evidence e lightdash são
exceções (BI-as-code, versionamento via git/dbt), mas isso exige disciplina
externa de engenharia.

O Delfos pode versionar definições **nativamente no produto** — diff, rollback e
validação de integridade sem depender de git do cliente.

### 1.6 Governança fragmentada

RBAC, masking field-level, certificação/ownership e auditoria costumam estar
espalhados, parciais ou em edições enterprise pagas. `adr-0002` do Delfos veta
componentes pagos; a governança precisa ser **nativa e completa** na base
open-source.

---

## 2. Tabela — diferencial × concorrentes que falham nele

A tabela cruza cada diferencial potencial do Delfos com os produtos estudados
onde aquele aspecto é fraco, ausente ou pago. "Parcial" = existe mas com
ressalva relevante.

| Diferencial do Delfos | Concorrentes onde é fraco/ausente | Onde é forte (referência) |
|---|---|---|
| Multi-tenancy nativo como invariante | metabase, superset, chartbrew, evidence, vanna, nocobase (parcial) | cube (security context) |
| Semantic layer declarativa central | chartbrew, evidence (parcial), vanna, airbyte | cube, lightdash, wren-ai, superset |
| IA fundamentada + auditável (propõe, não executa) | metabase (Metabot), superset (AI Assist), chartbrew, vanna | wren-ai (grounding parcial) |
| Connector como spec declarativo versionado | metabase, superset, chartbrew, cube, evidence | airbyte (protocolo versionado) |
| Definições versionáveis nativas (diff/rollback) | metabase, superset, chartbrew, cube, nocobase | evidence, lightdash (via git/dbt) |
| Governança completa sem edição paga | metabase, superset, lightdash (enterprise tiers) | nocobase (ACL field-level) |
| Auditoria como insight, não só log | metabase (parcial), superset, chartbrew, evidence | metabase (usage analytics) |
| Explainability / proveniência de cada número | metabase, superset, chartbrew, vanna, evidence | wren-ai, cube, lightdash |
| `credentialRef` como referência segura, nunca segredo | a maioria embute connection strings | — (diferencial próprio) |
| Validação dry-plan antes de execução | metabase, superset, chartbrew, vanna | wren-ai (dry-plan), lightdash (validação) |

---

## 3. Como o caráter do Delfos vira vantagem competitiva

### 3.1 Declarativo por construção

Porque o Delfos começou armazenando **definições**, não executando código, ele
não precisa "adicionar" um modelo declarativo depois — ele já é declarativo.
Cada `query-definition`, `dashboard-definition` e `report-definition` é um
documento inspecionável. Isso habilita, sem reescrita:

- diff e rollback de definições;
- validação de integridade contra o catálogo;
- templated definitions (1 definição → N instâncias por tenant);
- IA que produz definições verificáveis em vez de SQL opaco.

### 3.2 Multi-tenant nativo

O isolamento por `tenantId` derivado de um security context (inspiração cube)
torna impossível "esquecer" a fronteira de tenant. Para um produto que mira
client reporting e múltiplos clientes (caso de uso de chartbrew, mas com
multi-tenancy fraco lá), isso é vantagem direta de confiança e de venda.

### 3.3 IA auditável como postura de produto

Em vez de competir na corrida do "copiloto que faz tudo", o Delfos pode se
posicionar como o **BI de IA confiável**: a IA é um propositor fundamentado, não
um executor autônomo. Cada proposta carrega proveniência; cada aceitação é
auditada. Esse é um diferencial vendável para setores regulados.

### 3.4 Segurança de credenciais como cláusula de arquitetura

`credentialRef` nunca é o segredo; `connectionId` nunca é connection string;
metadados são sanitizados (`adr-0019`, `adr-0020`). A maioria dos concorrentes
não trata isso como invariante. Para o Delfos é cláusula de arquitetura — um
diferencial de postura de segurança.

---

## 4. Onde o Delfos NÃO deve tentar competir

Diferenciação também é foco. O estudo sugere evitar:

- **Catálogo gigante de connectors prontos** (airbyte tem centenas) — o Delfos
  compete em qualidade do spec e do protocolo, não em quantidade.
- **Viz extremamente ricas e exóticas** (superset) — o `chart_renderer`
  (`adr-0003`) cobre o essencial; profundidade de viz não é o campo de batalha.
- **BI-as-code puro com git obrigatório** (evidence) — versionamento nativo no
  produto serve mais ao público multi-tenant do Delfos.
- **Execução real antecipada** — `adr-0007`, `adr-0021`, `adr-0022` e
  `adr-0024` mantêm runtime/cache/dispatch como Fase 2; antecipar destrói o
  diferencial de foundation enxuta.

---

## 5. Síntese — a tese competitiva do Delfos

> O Delfos não tenta ser "mais um BI com IA". Ele se posiciona como uma
> **plataforma analítica declarativa, multi-tenant nativa e auditável por
> construção** — onde definições são artefatos versionáveis, a IA propõe sem
> executar, e o isolamento de dados é invariante, não configuração.

Os concorrentes maduros têm anos de features, mas carregam dívidas de
arquitetura (multi-tenancy fraco, semantic layer acoplada, IA não-auditável,
connectors acoplados) que não conseguem pagar sem reescrita. O Delfos, em
foundation, ainda pode escolher a arquitetura certa — e esse é o seu maior
ativo competitivo.

---

## Relacionado

- Consolidados: [./future-modules-catalog.md](./future-modules-catalog.md) ·
  [./strategic-product-vision.md](./strategic-product-vision.md) ·
  [./semantic-layer-roadmap.md](./semantic-layer-roadmap.md) ·
  [./ai-assistant-roadmap.md](./ai-assistant-roadmap.md) ·
  [./connectors-roadmap.md](./connectors-roadmap.md) ·
  [./enterprise-governance-roadmap.md](./enterprise-governance-roadmap.md) ·
  [./embedded-analytics-roadmap.md](./embedded-analytics-roadmap.md) ·
  [./premium-ux-roadmap.md](./premium-ux-roadmap.md) ·
  [./dashboard-builder-roadmap.md](./dashboard-builder-roadmap.md)
- Produtos estudados: [../cube/ideas-for-delfos.md](../cube/ideas-for-delfos.md) ·
  [../wren-ai/ideas-for-delfos.md](../wren-ai/ideas-for-delfos.md) ·
  [../airbyte/ideas-for-delfos.md](../airbyte/ideas-for-delfos.md) ·
  [../lightdash/ideas-for-delfos.md](../lightdash/ideas-for-delfos.md) ·
  [../metabase/anti-patterns.md](../metabase/anti-patterns.md)
- Visão e roadmap: [../../phase-2-vision.md](../../phase-2-vision.md) ·
  [../../roadmap.md](../../roadmap.md)
- ADRs: [../../adr/adr-0002-no-paid-components.md](../../adr/adr-0002-no-paid-components.md) ·
  [../../adr/adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md) ·
  [../../adr/adr-0019-credential-encryption-and-rotation.md](../../adr/adr-0019-credential-encryption-and-rotation.md) ·
  [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md) ·
  [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
