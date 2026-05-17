# NocoBase — Anti-padrões e Decisões a Evitar

> Tipo: referência estratégica · Produto estudado: NocoBase · Status: conceitual/futuro — não autoriza implementação

---

## Como ler este documento

Este arquivo registra **o que o Delfos NÃO deve reproduzir** ao se inspirar em NocoBase. Não é
crítica gratuita ao produto — NocoBase é maduro e bem-sucedido no seu nicho de no-code. São
escolhas que **não combinam** com um produto de BI/analytics multi-tenant em fase foundation.

---

## 1. Generalizar demais o escopo do produto

**Observado:** NocoBase é uma plataforma de propósito geral — CRM, ERP, gestão de projetos,
portais — onde analytics é apenas um conjunto de blocks entre muitos.

**Por que evitar no Delfos:** o Delfos é um produto de **BI/analytics** com foco definido.
Adotar a ambição "construa qualquer app" diluiria o produto, multiplicaria superfícies de
manutenção e enfraqueceria a especialização (drill-down, semantic layer, copilot de analytics)
que é o real diferencial.

**Princípio Delfos:** especializar, não generalizar. Widgets de analytics, não blocks genéricos.

---

## 2. Abstração no-code em hot paths de execução

**Observado:** críticas públicas apontam que a camada de abstração no-code pode virar
**gargalo de performance** e "caixa-preta arquitetural" em alta concorrência e baixa latência.

**Por que evitar no Delfos:** quando o Delfos tiver execução real (Fase 2), interpretar schema
declarativo dinamicamente em cada requisição de dados penalizaria latência.

**Princípio Delfos:** definições declarativas para **configuração**; caminhos de execução
**otimizados e previsíveis**, não interpretação genérica de schema em runtime quente.

---

## 3. Multi-app em process-sharing como modelo de tenancy

**Observado:** o multi-app de NocoBase roda aplicações no mesmo processo e a própria
documentação adverte que serve apenas para **teste e demo**, não isolamento de produção.

**Por que evitar no Delfos:** tenancy no Delfos é **invariante de primeira classe** —
`tenantId` é fronteira obrigatória em toda query (ADR-0009). Um modelo de isolamento "leniente"
seria incompatível com requisitos de segurança multi-tenant.

**Princípio Delfos:** isolamento por `tenantId` não negociável; nunca filtro opcional.

---

## 4. API inconsistente em motor central

**Observado:** o FlowEngine tem inconsistências de API — ex.: `exit()` funcionalmente idêntico
a `exitAll()`, contrariando documentação e expectativa.

**Por que evitar no Delfos:** APIs ambíguas em um motor central erodem confiança e geram bugs
sutis. O Delfos exige contrato de erro uniforme (`http-exception.filter.ts`) e DTOs validados.

**Princípio Delfos:** contratos previsíveis, nomes que significam o que dizem, documentação que
corresponde ao comportamento. Sem aliases silenciosos com semântica divergente.

---

## 5. Lançar IA antes da maturidade

**Observado:** os AI Employees da versão 2.0 têm relatos de **loops infinitos** e parâmetros
não suportados por alguns provedores LLM — recurso de marketing à frente da estabilidade.

**Por que evitar no Delfos:** o AI assistant futuro (ADR-0025) só deve existir sob governança,
explainability e auditoria sólidas. IA instável em um produto de dados destrói confiança.

**Princípio Delfos:** IA é capacidade auditada e governada, liberada quando estável — nunca um
diferencial de marketing apressado.

---

## 6. Acoplar lógica de filtro a cada visualização

**Observado:** embora NocoBase tenha filter blocks, a configuração de "data scope" também é
feita por block individual, o que pode espalhar lógica de filtro pela página.

**Por que evitar no Delfos:** filtros duplicados por widget geram inconsistência (widgets do
mesmo dashboard mostrando recortes diferentes) e dificultam manutenção.

**Princípio Delfos:** filtros globais como entidade desacoplada que publica critérios
(ver ideia 5 em `ideas-for-delfos.md`); widgets consomem, não redefinem.

---

## 7. Licenciamento dual com atrito jurídico

**Observado:** NocoBase combina AGPL 3.0 com termos comerciais (cláusulas sobre branding e
SaaS concorrente). Usuários públicos relatam **atrito** para entender o que é permitido.

**Por que evitar no Delfos:** ambiguidade de licença afasta adoção e gera risco jurídico. Cada
repositório do Delfos é publicado como projeto standalone — a licença deve ser clara e sem
cláusulas que dependam de interpretação caso a caso.

**Princípio Delfos:** licenciamento claro e único por repositório.

---

## 8. Complexidade de configuração como barreira de entrada

**Observado:** NocoBase tem **curva de aprendizado acentuada**, especialmente para
desenvolvimento de plugins e modelagem de árvores de associação profundas.

**Por que evitar no Delfos:** o público do Delfos inclui analistas, não apenas desenvolvedores.
Se configurar um dashboard ou dataset exigir conhecimento de modelagem profunda, o produto
perde acessibilidade.

**Princípio Delfos:** defaults sensatos, estados guiados (loading/empty/error/permission
obrigatórios no `delfos-web`) e progressive disclosure — complexidade só quando pedida.

---

## 9. Ausência de semantic layer como aceitação

**Observado:** NocoBase usa o data model genérico como substituto de semantic layer. Funciona
para apps de negócio, mas **não governa métricas** (mesma métrica calculada de formas diferentes
em telas diferentes).

**Por que evitar no Delfos:** em BI, métricas inconsistentes destroem a confiança nos números.
Aceitar a ausência de uma camada semântica seria abdicar de um pilar do produto.

**Princípio Delfos:** tratar a semantic layer futura como diferencial deliberado, não como
lacuna tolerada (ver ideia 11 em `ideas-for-delfos.md`).

---

## 10. Crescer o core junto com os plugins

**Observado:** mesmo com microkernel, plataformas de plugins tendem, ao longo do tempo, a
**vazar lógica de domínio para o núcleo** sob pressão de prazo, corroendo a separação.

**Por que evitar no Delfos:** o `src/core/` do `delfos-api` deve conter apenas infraestrutura
transversal (filtros, interceptors, pipes, DTOs compartilhados). Domínio pertence a
`src/modules/<name>/`.

**Princípio Delfos:** disciplina de fronteira — capacidades novas viram módulos, não acréscimos
ao core; arquivos > 500 linhas exigem refatoração ou justificativa documentada.

---

## Resumo

| Anti-padrão | Decisão Delfos |
|---|---|
| Escopo genérico de no-code | Especialização em BI/analytics |
| Abstração no-code em hot path | Execução otimizada e previsível |
| Tenancy process-sharing leniente | `tenantId` como invariante rígido |
| API ambígua em motor central | Contratos previsíveis e documentados |
| IA imatura como marketing | IA governada, auditada, liberada quando estável |
| Filtro acoplado por widget | Filtros globais desacoplados |
| Licenciamento dual ambíguo | Licença única e clara por repo |
| Configuração como barreira | Defaults e progressive disclosure |
| Semantic layer ausente | Semantic layer como diferencial |
| Core inchando com domínio | Disciplina de fronteira core/módulos |

---

## Relacionado

- [`./overview.md`](./overview.md)
- [`./architecture.md`](./architecture.md)
- [`./ux-patterns.md`](./ux-patterns.md)
- [`./premium-features.md`](./premium-features.md)
- [`./ideas-for-delfos.md`](./ideas-for-delfos.md)
- ADR: [`../../adr/adr-0007-no-cache-redis-phase-1.md`](../../adr/adr-0007-no-cache-redis-phase-1.md)
- ADR: [`../../adr/adr-0009-deployment-isolation-and-tenant-model.md`](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- ADR: [`../../adr/adr-0024-phase-1-and-phase-2-definition.md`](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- ADR: [`../../adr/adr-0025-llm-assisted-analytics-text-generation.md`](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
