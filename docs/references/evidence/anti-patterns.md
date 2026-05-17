# Evidence — Anti-padrões e Decisões a Não Reproduzir

> Tipo: referência estratégica · Produto estudado: Evidence · Status: conceitual/futuro — não autoriza implementação

---

Este documento registra **o que aprender a evitar** ao estudar o Evidence. As críticas não desmerecem o produto — muitas "limitações" são escolhas conscientes coerentes com seu nicho (relatórios versionáveis para times técnicos). O ponto é que **o Delfos tem outro perfil** (multi-tenant, API-first, usuários de negócio, runtime real) e copiar essas escolhas seria um erro de contexto.

---

## Problemas observados

### Saída estática como única forma de entrega

O Evidence só produz um site estático. Dados refletem o último build de sources; não há consulta ao vivo nem tempo real.

- **Por que não reproduzir no Delfos**: o Delfos prevê runtime real e execução de queries via connectors. Um modelo "tudo é build" não comporta multi-tenancy lógico, *freshness* sob demanda nem isolamento em runtime.

### Ausência de autenticação no produto open-source

A versão community não tem login nem gestão de usuários — a segurança é delegada à infraestrutura de hospedagem.

- **Por que não reproduzir**: o Delfos trata auth como núcleo (ADR-0006, ADR-0016). Delegar identidade à infra externa é incompatível com `tenantId` como fronteira obrigatória e com o modelo de papéis (ADR-0017).

### RLS por "um deployment por usuário"

Sem RLS no open-source, o padrão recomendado para isolar dados é **gerar builds/deployments separados** por usuário ou segmento, com variáveis de build distintas.

- **Por que não reproduzir**: isso é o oposto do isolamento lógico do Delfos. Multiplicar deployments para isolar dados gera explosão operacional, inconsistência e superfície de erro. No Delfos, isolamento é `tenantId` em runtime (ADR-0009), centralizado e único.

---

## UX ruim (para o público do Delfos)

### Autoria exige perfil de desenvolvedor

Construir um relatório no Evidence exige SQL, Git, terminal e entender o ciclo de build. Não há montador visual.

- **Risco para o Delfos**: o Delfos atende usuários de negócio. Adotar autoria exclusivamente em código excluiria boa parte do público. O modelo declarativo do Delfos deve ser servido por **UI**, não por arquivos de texto editados à mão.

### Exploração rígida e curada

A navegação espelha a árvore de pastas; a exploração é a que o autor pré-definiu. Não há *pivot* livre nem análise ad-hoc.

- **Risco para o Delfos**: relatórios narrativos curados são ótimos, mas o Delfos não deve fechar a porta para exploração interativa. Curadoria não pode virar engessamento.

### Estados de dados não padronizados

Como o relatório lê um cache materializado, tratar *empty*/*error* fica a cargo do autor de cada página — não há contrato.

- **Risco para o Delfos**: o Delfos exige estados explícitos e padronizados (`DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState`, `DelfosPermissionState`). Deixar isso "por conta do autor" produziria experiência inconsistente.

---

## Complexidade excessiva / no lugar errado

### Complexidade empurrada para o build e o CI/CD

O Evidence parece simples no runtime porque empurra a complexidade para fora: agendamento, *freshness*, orquestração e re-extração viram problema do pipeline de CI/CD do cliente.

- **Lição para o Delfos**: "simplicidade" que só existe porque a complexidade foi terceirizada não é simplicidade real. O Delfos deve assumir orquestração e *freshness* de forma explícita e governada — não escondê-los num cron externo.

### Re-extração total como modelo de atualização

Atualizar dados = re-rodar as sources. Não há atualização incremental nativa.

- **Lição para o Delfos**: o futuro modelo de execução (`runtime`, `execution requests`) deve considerar granularidade e custo de atualização desde o início, evitando o "re-extrai tudo".

---

## Gargalos

### Tempo de build cresce com o projeto

Mais sources e mais páginas alongam `npm run sources` e o build. Projetos grandes sofrem ciclos de feedback lentos.

- **Lição para o Delfos**: como a arquitetura do Delfos é orientada a API e runtime (não a build), esse gargalo específico não se aplica — mas reforça evitar qualquer operação "tudo de uma vez" que escale mal com o catálogo.

### Cache Parquet no browser não escala com volume

A interatividade depende de carregar Parquet no DuckDB-WASM. Datasets grandes inflam o bundle e a memória do navegador.

- **Lição para o Delfos**: cuidado ao mover processamento para o cliente. O Delfos deve manter execução e volume sob controle no servidor/connectors, não empurrar grandes datasets para o Flutter Web.

### Sem observabilidade de uso

Não há métricas de adoção ou de performance de relatórios embutidas.

- **Lição para o Delfos**: governança e analytics de uso (quem acessa o quê) devem ser previstos como recurso de plataforma, não como item acessório.

---

## Problemas arquiteturais

### Sem semantic layer — métricas dispersas

Regras de negócio e métricas vivem espalhadas no SQL das páginas e sources. Não há definição única por métrica.

- **Lição para o Delfos**: é exatamente a lacuna que o Delfos pode preencher com `datasets`/`field-mappings` e uma semantic layer futura. Não repetir a dispersão: métrica deve ter dono e definição única.

### Sem API de gestão da plataforma

Não há REST/GraphQL para criar/gerenciar relatórios programaticamente — a "API" é o filesystem + Git.

- **Lição para o Delfos**: o Delfos é API-first e deve continuar assim. Tratar definições como dados versionáveis é bom; substituir a API por arquivos de texto não é.

### Acoplamento a um único engine (DuckDB)

DuckDB é, ao mesmo tempo, connector, formato de cache e engine de browser. É elegante, mas amarra o produto a uma tecnologia.

- **Lição para o Delfos**: a estratégia de connectors plurais (ADR-0008, ADR-0015) e o `chart-renderer` abstrato (ADR-0003) existem justamente para evitar acoplamento a um único motor. Manter essa abstração.

---

## Decisões que NÃO queremos reproduzir — resumo

| Decisão do Evidence | Por que evitar no Delfos |
|---|---|
| Saída estática como única entrega | Incompatível com multi-tenancy e runtime real |
| Sem auth no produto (delegada à infra) | Auth é núcleo do Delfos (ADR-0006/0016) |
| RLS via deployments separados | Viola `tenantId` como fronteira única (ADR-0009) |
| Autoria só em código (SQL+Git) | Exclui usuários de negócio; Delfos precisa de UI |
| Complexidade empurrada para o CI/CD | "Simplicidade" ilusória; orquestração deve ser governada |
| Re-extração total para atualizar | Custo e granularidade ruins; runtime deve ser incremental |
| Sem semantic layer | Dispersão de métricas; Delfos deve centralizar |
| Acoplamento a um único engine | Connectors plurais e renderer abstrato (ADR-0003/0008) |
| Sem API de gestão | Delfos é API-first por princípio |
| Estados de dados sem contrato | Delfos exige estados padronizados obrigatórios |

---

## Nota de equilíbrio

Vários desses "anti-padrões" são, no contexto do Evidence, **decisões corretas**: o produto escolheu ser leve, versionável e voltado a times técnicos, e cumpre isso bem. O erro seria portá-los para o Delfos sem considerar que o Delfos é uma plataforma multi-tenant, com usuários de negócio, API-first e runtime real. O que se leva do Evidence é o **espírito do BI-as-code** (versionamento, reprodutibilidade, narrativa, templating) — não a sua arquitetura de saída estática.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [../../adr/adr-0003-chart-renderer-abstraction.md](../../adr/adr-0003-chart-renderer-abstraction.md)
- [../../adr/adr-0006-jwt-self-managed-auth.md](../../adr/adr-0006-jwt-self-managed-auth.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- [../../adr/adr-0016-temporary-admin-key-auth.md](../../adr/adr-0016-temporary-admin-key-auth.md)
