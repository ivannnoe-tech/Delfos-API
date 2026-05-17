# Chartbrew — Anti-padrões e Decisões a Evitar

> Tipo: referência estratégica · Produto estudado: Chartbrew · Status: conceitual/futuro — não autoriza implementação

---

## Visão geral

O Chartbrew é um produto bem executado para seu nicho, mas algumas decisões
arquiteturais e de UX não se traduzem bem para o contexto multi-tenant e enterprise
do Delfos. Esta seção cataloga o que **não** queremos reproduzir e por quê.

---

## 1. Isolamento por projeto/time em vez de tenant forte

**Problema observado.** O Chartbrew isola dados por *projeto* e *time* dentro de uma
instância. Não há um `tenantId` como fronteira obrigatória em toda consulta.

**Por que evitar.** Para um produto multi-tenant, isolamento fraco é risco de
vazamento entre clientes e dívida arquitetural difícil de reverter. O Delfos define
`tenantId` como fronteira obrigatória desde a foundation (`adr-0009`) — nunca um
filtro opcional.

**O que o Delfos faz.** Toda query multi-tenant é tenant-scoped por construção.

---

## 2. Execução síncrona acoplada ao servidor

**Problema observado.** A consulta à fonte do cliente roda no mesmo processo do
request HTTP. Consultas lentas prendem o servidor; não há *execution request* como
entidade nem fila/worker.

**Por que evitar.** Acoplamento da execução ao monólito limita escala, dificulta
isolamento de tenant e mistura responsabilidades. Falhas de uma fonte degradam o
app inteiro.

**O que o Delfos faz.** Modela *runtime execution requests* como entidade de
primeira classe (`adr-0014`) e separa o executor em `delfos-connectors` com envelope
de comando (`adr-0015`).

---

## 3. Connectors embutidos no núcleo

**Problema observado.** Cada fonte de dados é um módulo dentro do servidor. Adicionar
ou alterar um connector mexe no núcleo; não há fronteira de extensão isolada.

**Por que evitar.** Connectors no núcleo aumentam superfície de risco (um connector
com bug afeta tudo), dificultam testes isolados e impedem execução remota/on-premise
segura.

**O que o Delfos faz.** `delfos-connectors` é um pacote separado com contratos
explícitos (`src/contracts/`) e adapter determinístico sem rede/DB; transporte
separado do envelope (`adr-0022`).

---

## 4. Ausência de semantic layer

**Problema observado.** A modelagem mora dentro de cada dataset — query bruta,
transformações e mapeamento de campos por dataset. Não há catálogo central de
métricas/dimensões nomeadas.

**Por que evitar.** Sem semantic layer, a mesma métrica é redefinida em vários
datasets de formas divergentes; governança e consistência sofrem. É o maior gap do
produto frente a BIs enterprise.

**O que o Delfos faz.** Tem `field-mappings` e `query-definitions` como base para um
semantic layer real planejável (ver `ideas-for-delfos.md`, ideia 12).

---

## 5. Governança de credenciais simplista

**Problema observado.** Credenciais são protegidas por uma chave AES de 32 bytes
única. Não há política formal de rotação, referência segura nem mascaramento.

**Por que evitar.** Chave única é ponto único de falha; sem rotação, comprometimento
exige re-encriptar tudo manualmente. Para multi-tenant com dados sensíveis de
clientes, isso é insuficiente.

**O que o Delfos faz.** `credentialRef` é uma referência segura, nunca o segredo
(`adr-0019`); há política de criptografia/rotação e mascaramento de metadados
(`adr-0020`, `adr-0023`).

---

## 6. Acoplamento direto da visualização a uma lib de chart

**Problema observado.** O frontend usa Chart.js diretamente nos componentes. O tipo
de visualização e a lib estão entrelaçados.

**Por que evitar.** Trocar a lib de gráficos ou suportar novos renderers vira
refatoração ampla; o catálogo de visualizações fica refém da lib.

**O que o Delfos faz.** `adr-0003` define um `chart_renderer` abstrato; features
nunca importam `fl_chart` ou `graphic` diretamente.

---

## 7. Cache obrigatório (Redis) como dependência de base

**Problema observado.** Redis é dependência obrigatória para cache de consulta,
*Socket Manager* e IA. O produto não roda sem ele.

**Por que evitar (na fase atual do Delfos).** Cache introduz invalidação,
consistência e estado distribuído antes de o produto ter runtime real. Adicionar
infraestrutura cedo demais é complexidade prematura.

**O que o Delfos faz.** `adr-0007` decidiu explicitamente **não** usar cache/Redis
na Fase 1 — adia a complexidade até haver execução real que a justifique.

---

## 8. Estado de tempo real (sockets) como dependência transversal

**Problema observado.** O *Socket Manager* baseado em Redis é usado para atualização
de UI e para o AI Orchestrator. Estado de socket complica escala horizontal e
testes.

**Por que evitar.** Tempo real é poderoso mas caro de operar; introduzido cedo, vira
acoplamento difícil de remover. Não é necessário para uma foundation declarativa.

**O que o Delfos faz.** Não há requisito de tempo real na foundation; eventual
adoção seria decisão futura isolada com ADR própria.

---

## 9. Observabilidade e auditoria como afterthought

**Problema observado.** Observabilidade não é foco; auditoria detalhada e *lineage*
de dados não são expostos. Operação self-hosted vira por conta própria.

**Por que evitar.** Em produto multi-tenant, auditoria não pode ser opcional —
quem viu o quê, quando, é requisito de conformidade, não enfeite.

**O que o Delfos faz.** Tem módulo `audit` desde a foundation e estratégia de
auditoria segura (`adr-0018`), com sanitização de metadados (`adr-0020`).

---

## 10. Geração de artefatos por IA sem fronteira declarativa clara

**Problema observado.** O AI Orchestrator gera datasets/charts/dashboards
diretamente. As "guardas" limitam saídas inválidas, mas a IA produz artefatos
executáveis com pouca etapa intermediária de revisão.

**Por que evitar.** IA gerando artefatos que entram direto em execução é risco de
query maliciosa, custo descontrolado ou vazamento entre tenants se o contexto
falhar.

**O que o Delfos faz / deve fazer.** Tratar saída de IA como **rascunho
declarativo** que passa por validação e preview (`execution-preview`) antes de
persistir/executar; manter `tenantId` e validação de input como invariantes
inegociáveis (`adr-0025`).

---

## 11. Ausência de estado de permissão explícito na UX

**Problema observado.** O Chartbrew cobre loading/empty/error por widget, mas não
trata "sem permissão" como um estado de UX padronizado e distinto.

**Por que evitar.** Misturar "erro" com "sem acesso" confunde o usuário e esconde
problemas de autorização.

**O que o Delfos faz.** Telas de dados devem implementar os quatro estados:
`DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState` e
`DelfosPermissionState` — permissão é estado de primeira classe.

---

## Resumo

| Anti-padrão | Risco principal | Mitigação no Delfos |
|---|---|---|
| Isolamento fraco por projeto | Vazamento entre clientes | `tenantId` obrigatório (`adr-0009`) |
| Execução síncrona acoplada | Não escala / falhas globais | Execution requests (`adr-0014`) |
| Connectors no núcleo | Superfície de risco ampla | `delfos-connectors` isolado |
| Sem semantic layer | Métricas inconsistentes | `field-mappings` + plano futuro |
| Credenciais com chave única | Ponto único de falha | `credentialRef` + rotação (`adr-0019`) |
| Lib de chart acoplada | Refatoração para evoluir | `chart_renderer` abstrato (`adr-0003`) |
| Cache/Redis prematuro | Complexidade sem necessidade | Sem cache na Fase 1 (`adr-0007`) |
| Auditoria como afterthought | Não conformidade | Módulo `audit` (`adr-0018`) |
| IA gera artefato executável | Query maliciosa / custo | Rascunho + preview + validação |

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- ADR: [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md)
- ADR: [../../adr/adr-0009-deployment-isolation-and-tenant-model.md](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- ADR: [../../adr/adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- ADR: [../../adr/adr-0019-credential-encryption-and-rotation.md](../../adr/adr-0019-credential-encryption-and-rotation.md)
- ADR: [../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md](../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md)
