# Evidence — Ideias Aplicáveis ao Delfos

> Tipo: referência estratégica · Produto estudado: Evidence · Status: conceitual/futuro — não autoriza implementação

---

Este é o documento mais importante da referência. Reúne ideias inspiradas no Evidence **adaptadas à realidade do Delfos** — plataforma multi-tenant, API-first, com runtime e connectors reais previstos. Nenhuma ideia autoriza implementação; cada uma é candidata a brainstorming, ADR e priorização formal.

Princípio de tradução: o Evidence é "BI-as-code" com saída estática. O Delfos **não** deve copiar o modelo estático. O que se aproveita é o **espírito**: definições versionáveis, governança por diff, relatórios narrativos, templating dirigido por dados, transparência da definição.

---

## Catálogo de ideias

### 1. Definições analíticas como artefatos versionáveis

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | BI-as-code do Evidence — relatório é texto versionável |
| Descrição | Tratar `query-definitions`, `dashboard-definitions` e `report-definitions` como documentos com histórico de versões, diff entre versões e rollback |
| Objetivo | Governança, auditoria e reversão segura de definições analíticas |
| Impacto | Alto — confiança e rastreabilidade de toda a camada declarativa |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | query-definitions, dashboard-definitions, report-definitions, audit |
| Dependências | Modelo de versionamento de documentos no MongoDB; integração com audit |
| Viabilidade | Alta — o Delfos já é declarativo; falta a camada de histórico |
| ADRs futuras possíveis | ADR "versionamento e diff de definições" |
| Encaixe com | datasets, query-definitions, dashboard-definitions; base para AI assistant futuro explicar mudanças |

---

### 2. Templated definitions — uma definição, muitas instâncias

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Templated pages do Evidence (`[customer].md` gera N páginas) |
| Descrição | Permitir que uma `dashboard-definition` ou `report-definition` seja um molde parametrizado, instanciado por valor (por cliente, região, período) sem duplicar a definição |
| Objetivo | Escalar personalização sem multiplicar trabalho de configuração |
| Impacto | Alto — reduz drasticamente esforço de manutenção em catálogos grandes |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | dashboard-definitions, report-definitions, query-definitions |
| Dependências | Modelo de parâmetros em definições; resolução de parâmetros no runtime |
| Viabilidade | Alta — encaixa no modelo declarativo atual |
| ADRs futuras possíveis | ADR "definições parametrizadas / templating" |
| Encaixe com | dashboard-definitions, query-definitions, runtime bridge, execution requests |

---

### 3. Relatórios narrativos (texto + dados intercalados)

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Markdown narrativo do Evidence — prosa, números inline e gráficos juntos |
| Descrição | Estender `report-definitions` para suportar blocos de narrativa com valores dinâmicos embutidos no texto, não só grades de widgets |
| Objetivo | Relatórios que explicam o significado, não só exibem números |
| Impacto | Alto — diferencial de percepção de valor para usuários de negócio |
| Prioridade | Alta |
| Complexidade | Média |
| Maturidade | `Research` |
| Módulos impactados | report-definitions, dashboard-definitions |
| Dependências | Modelo de bloco de conteúdo misto (texto + binding de dado) |
| Viabilidade | Alta — declarativo, sem runtime real necessário na foundation |
| ADRs futuras possíveis | ADR "modelo de relatório narrativo / blocos de conteúdo" |
| Encaixe com | report-definitions, dashboard-definitions, AI assistant futuro (gerar a narrativa) |

---

### 4. Diff e code review de definições analíticas

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Fluxo Git do Evidence (pull request, review, blame) |
| Descrição | UI de comparação entre versões de uma definição e fluxo opcional de aprovação antes de publicar mudanças sensíveis |
| Objetivo | Governança colaborativa sem expor Git aos usuários |
| Impacto | Médio — relevante para tenants com requisitos de compliance |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | query-definitions, dashboard-definitions, report-definitions, audit, users |
| Dependências | Ideia 1 (versionamento); modelo de papéis (ADR-0017) |
| Viabilidade | Média — depende de versionamento estar pronto |
| ADRs futuras possíveis | ADR "workflow de aprovação de definições" |
| Encaixe com | query-definitions, dashboard-definitions, AI assistant futuro (resumir o diff) |

---

### 5. Camada de materialização opcional (cache de resultado)

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Cache Parquet do Evidence — separa extração de consulta |
| Descrição | Conceito futuro de materializar resultados de `query-definitions` para leitura rápida e estável, desacoplando o relatório da fonte ao vivo |
| Objetivo | Performance, estabilidade e redução de carga nas fontes do cliente |
| Impacto | Médio — ganho de performance, mas adiciona complexidade |
| Prioridade | Baixa (Fase 1 decidiu não ter cache — ADR-0007) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | runtime, query-definitions, connections |
| Dependências | Runtime real e connectors reais (Fase 2+); revisão do ADR-0007 |
| Viabilidade | Baixa no curto prazo — explicitamente fora da Fase 1 |
| ADRs futuras possíveis | ADR "materialização e cache de resultados" (revisaria ADR-0007) |
| Encaixe com | runtime bridge, execution requests, connectors |

---

### 6. Transparência da definição (explainability estrutural)

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Evidence: toda métrica é SQL aberto e rastreável até o commit |
| Descrição | Em cada widget/número, oferecer "ver definição": a `query-definition`, os `field-mappings` e a versão que produziram aquele resultado |
| Objetivo | Confiança, auditabilidade e redução de dúvidas "de onde vem esse número?" |
| Impacto | Médio — forte ganho de confiança com baixo custo |
| Prioridade | Média |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | dashboard-definitions, query-definitions, field-mappings, execution-preview |
| Dependências | Ideia 1 (versionamento) para mostrar a versão exata |
| Viabilidade | Alta — dados já existem na camada declarativa |
| ADRs futuras possíveis | Não exige ADR dedicada; cabe em design de UI |
| Encaixe com | query-definitions, field-mappings, datasets, semantic layer futura |

---

### 7. Semantic layer própria — a lacuna do Evidence como oportunidade

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Ausência de semantic layer no Evidence (métricas espalhadas no SQL) |
| Descrição | Catálogo central de métricas e dimensões reutilizáveis, construído sobre `datasets` e `field-mappings`, evitando a dispersão de regras que o Evidence sofre |
| Objetivo | Consistência de métricas entre dashboards e relatórios; uma definição única por métrica |
| Impacto | Alto — fundamento de governança de dados de longo prazo |
| Prioridade | Média |
| Complexidade | Alta |
| Maturidade | `Research` |
| Módulos impactados | datasets, field-mappings, query-definitions, dashboard-definitions |
| Dependências | Modelo de métrica/dimensão; possível revisão de datasets |
| Viabilidade | Média — grande valor, mas escopo amplo |
| ADRs futuras possíveis | ADR "semantic layer / catálogo de métricas" |
| Encaixe com | datasets, field-mappings, query-definitions, semantic layer futura, AI assistant futuro |

---

### 8. Drill-down por rota parametrizada

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Drill-down via templated pages do Evidence (`/customers/[customer]`) |
| Descrição | Definir, na `dashboard-definition`, navegação de detalhe onde clicar em um valor leva a uma visão parametrizada compartilhável por URL |
| Objetivo | Exploração guiada e estados de detalhe compartilháveis |
| Impacto | Médio — melhora UX de exploração |
| Prioridade | Média |
| Complexidade | Média |
| Maturidade | `Idea` |
| Módulos impactados | dashboard-definitions, query-definitions |
| Dependências | Ideia 2 (templating de definições); roteamento no delfos-web |
| Viabilidade | Média |
| ADRs futuras possíveis | ADR "navegação de drill-down e estados parametrizados" |
| Encaixe com | dashboard-definitions, query-definitions, runtime bridge |

---

### 9. IA copiloto de autoria de definições

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Evidence Studio — sugestões de SQL, componentes e visualizações |
| Descrição | Assistente que sugere `query-definitions`, escolhe visualização adequada ao dado e valida sintaxe enquanto o usuário monta um dashboard |
| Objetivo | Reduzir atrito de autoria e democratizar a criação para usuários menos técnicos |
| Impacto | Alto — acelera adoção e diferencia o produto |
| Prioridade | Média |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | query-definitions, dashboard-definitions, datasets, field-mappings |
| Dependências | Integração LLM (ADR-0025 cobre geração de texto); semantic layer ajuda |
| Viabilidade | Média — exige base de IA e cuidado de governança |
| ADRs futuras possíveis | ADR "copiloto de autoria assistida por IA" (complementa ADR-0025) |
| Encaixe com | query-definitions, dashboard-definitions, AI assistant futuro, semantic layer futura |

---

### 10. Validação de definições em "build-time"

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Evidence valida SQL/Markdown/componentes antes de publicar |
| Descrição | Validar `query-definitions` e `dashboard-definitions` (campos existentes, referências de `field-mappings` válidas, parâmetros resolvíveis) no momento de salvar, antes de qualquer execução |
| Objetivo | Capturar erros cedo, evitar relatórios quebrados em produção |
| Impacto | Médio — qualidade e confiabilidade da camada declarativa |
| Prioridade | Alta |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | query-definitions, dashboard-definitions, field-mappings, execution-preview |
| Dependências | Nenhuma crítica — alavanca o modelo declarativo já existente |
| Viabilidade | Alta — encaixa direto na foundation atual |
| ADRs futuras possíveis | Não exige ADR; cabe em design de validação |
| Encaixe com | query-definitions, field-mappings, datasets, execution requests |

---

### 11. Embedding de relatórios com contexto de tenant

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Embedding de primeira classe do Evidence — mas o Delfos resolve o que falta lá |
| Descrição | Permitir embutir um dashboard/relatório em aplicação externa preservando `tenantId`, papéis e masking — o oposto do embed sem contexto do Evidence open-source |
| Objetivo | Reporting embedado seguro para clientes do tenant |
| Impacto | Alto — habilita caso de uso comercial relevante |
| Prioridade | Baixa (depende de auth e runtime maduros) |
| Complexidade | Alta |
| Maturidade | `Idea` |
| Módulos impactados | dashboard-definitions, report-definitions, auth, users, runtime |
| Dependências | Auth real (ADR-0006), modelo de tenancy (ADR-0009), masking (ADR-0023) |
| Viabilidade | Baixa no curto prazo — Fase 2+ |
| ADRs futuras possíveis | ADR "embedded analytics e tokens de embed" |
| Encaixe com | dashboard-definitions, report-definitions, runtime bridge, execution requests |

---

### 12. Catálogo de templates iniciais (galeria de partida)

| Campo | Conteúdo |
|---|---|
| Origem/inspiração | Evidence oferece projetos/exemplos de partida e geração de scaffolds |
| Descrição | Galeria de `dashboard-definitions`/`report-definitions` modelo que um tenant clona e adapta, acelerando o onboarding |
| Objetivo | Reduzir tempo até o primeiro dashboard útil |
| Impacto | Médio — melhora adoção e percepção inicial de valor |
| Prioridade | Média |
| Complexidade | Baixa |
| Maturidade | `Research` |
| Módulos impactados | dashboard-definitions, report-definitions, datasets |
| Dependências | Ideia 2 (templating) potencializa, mas não é obrigatória |
| Viabilidade | Alta — pode ser feita com o modelo declarativo atual |
| ADRs futuras possíveis | Não exige ADR; decisão de produto/conteúdo |
| Encaixe com | dashboard-definitions, report-definitions, datasets, semantic layer futura |

---

## Síntese de priorização

| Prioridade | Ideias |
|---|---|
| Alta | 1 (versionamento), 2 (templated definitions), 3 (relatórios narrativos), 10 (validação) |
| Média | 4 (diff/review), 6 (transparência), 7 (semantic layer), 8 (drill-down), 9 (copiloto autoria), 12 (galeria) |
| Baixa | 5 (materialização/cache), 11 (embedding com tenant) |

As ideias 1, 2, 3 e 10 são as de **maior retorno e menor risco** na fase foundation: alavancam o caráter declarativo já existente, sem exigir runtime real, cache ou connectors reais.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./anti-patterns.md](./anti-patterns.md)
- [Taxonomia de maturidade](../maturity-taxonomy.md)
- [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [../../adr/adr-0014-runtime-execution-requests-foundation.md](../../adr/adr-0014-runtime-execution-requests-foundation.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
