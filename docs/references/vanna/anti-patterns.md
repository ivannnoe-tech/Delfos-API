# Vanna AI — Anti-padrões e Decisões a Evitar

> Tipo: referência estratégica · Produto estudado: Vanna AI · Status: conceitual/futuro — não autoriza implementação

---

## Propósito

Esta seção identifica decisões, limitações e padrões do Vanna AI que o Delfos **não** deve reproduzir. Não é crítica ao Vanna — ele é um framework focado e bem-sucedido no seu nicho. É um exercício de contraste: o que faz sentido para uma biblioteca text-to-SQL pode ser nocivo para uma plataforma BI multi-tenant declarativa.

---

## 1. LLM com acesso direto à execução de SQL

**Observado:** o `RunSqlTool` do Vanna executa SQL gerado pelo LLM diretamente contra o banco do cliente.

**Por que evitar no Delfos:** o LLM pode alucinar SQL inválido ou semanticamente errado, e dar a ele um caminho direto ao banco é superfície de risco (injection, queries destrutivas, vazamento). O Delfos separa deliberadamente *definição* de *execução*: a IA pode sugerir uma `query-definition`, mas a execução passa pelo `runtime`/`connectors` com validação (ADR-0008, ADR-0014). Mantenha esse muro.

---

## 2. Significado de negócio como prosa solta

**Observado:** métricas e regras de negócio são ingeridas como documentação textual livre (`vn.train(documentation="...")`).

**Por que evitar:** prosa não é versionável, não é validável e produz interpretações inconsistentes — fraqueza reconhecida do Vanna ("no formal business logic, inconsistent interpretations, manual governance"). O Delfos deve perseguir um **semantic layer estruturado** sobre `field-mappings`, não um saco de texto.

---

## 3. Qualidade que depende inteiramente de curadoria manual

**Observado:** a precisão do Vanna é proporcional à qualidade do treino; sem curadoria contínua dos pares pergunta→SQL, degrada silenciosamente.

**Por que evitar a forma:** transferir 100% do ônus de qualidade para curadoria manual sem ferramentas torna o sistema frágil. O Delfos deve embutir governança (loop de validação, versionamento, métricas de qualidade) em vez de depender de disciplina humana avulsa.

---

## 4. Ausência de multitenancy no design original

**Observado:** Vanna 0.x não tem isolamento de tenant — uma instância = um conjunto de treino. O 2.0 adicionou workspace context *depois*.

**Por que evitar:** multitenancy retrofitado é fonte de vazamento entre clientes. No Delfos `tenantId` é fronteira **obrigatória e inviolável** desde o primeiro dia, em toda query — nunca um filtro opcional adicionado depois.

---

## 5. Chat como única interface

**Observado:** a UX do Vanna é essencialmente um chat; não há dashboards persistentes, filtros estruturados nem painéis curados.

**Por que evitar como exclusividade:** o chat é ótimo para exploração ad hoc, mas ruim para monitoramento recorrente, governança visual e reencontro de análises. O Delfos tem `dashboard-definitions` e builders visuais — o chat/copilot deve ser **complemento**, nunca substituto. Não jogar fora o builder visual.

---

## 6. Filtros expressos apenas em linguagem natural

**Observado:** filtragem só acontece dentro da pergunta ("...do último trimestre").

**Por que evitar:** transfere ambiguidade para o LLM e impede filtros globais persistentes e reproduzíveis. O Delfos precisa de filtros estruturados e explícitos, com filtros globais — determinísticos e auditáveis.

---

## 7. Caixa-preta de geração sem proveniência obrigatória

**Observado:** embora o SQL seja exibido, a proveniência (quais contextos sustentaram a resposta) não é um artefato de primeira classe garantido.

**Por que evitar:** toda saída de IA no Delfos deve carregar proveniência **obrigatória** — sem "por que isto foi sugerido", não há confiança nem auditoria. Explainability não pode ser opcional.

---

## 8. Falta de observability/cost tracking nativos no 0.x

**Observado:** o 0.x não tinha observability; veio só no 2.0 via middlewares.

**Por que evitar:** colocar IA em produção sem rastrear latência e **custo de LLM** desde o início leva a surpresas de fatura e à impossibilidade de diagnosticar regressões. No Delfos, observability de IA é pré-requisito, não retrofit.

---

## 9. Extensibilidade por herança/mixin de classe abstrata

**Observado:** Vanna 0.x compõe funcionalidade via herança múltipla de `VannaBase` (mixar uma classe de LLM com uma de vector store).

**Por que evitar a forma:** herança múltipla acopla implementações e dificulta testar peças isoladamente. O Delfos já adota **composição por injeção de dependência** (NestJS, repositórios) — manter contratos via interfaces injetáveis, não hierarquias de mixin.

---

## 10. Acoplamento ao paradigma SQL relacional

**Observado:** Vanna assume bancos relacionais e SQL como alvo único; "connectors" são adapters de banco SQL.

**Por que evitar:** o Delfos prevê fontes heterogêneas — APIs, fontes on-premise — atrás de um modelo de `connectors` genérico (ADR-0008, ADR-0012). Não desenhar o produto presumindo SQL; o alvo é a `query-definition` declarativa, neutra de fonte.

---

## 11. Repositório arquivado / dependência de upstream sem manutenção

**Observado:** o repositório do Vanna foi arquivado (read-only) em 29/03/2026.

**Lição:** ao avaliar qualquer biblioteca de IA como dependência, considerar o risco de abandono. Preferir contratos próprios e adapters finos sobre dependências externas voláteis, de modo que trocar o fornecedor de LLM/vector store seja barato.

---

## Resumo — tabela de contraste

| Anti-padrão do Vanna | Postura do Delfos |
|---|---|
| LLM executa SQL direto | IA sugere `query-definition`; execução isolada no runtime |
| Semântica como prosa livre | Semantic layer estruturado sobre field-mappings |
| Qualidade só por curadoria manual | Governança e loop de validação embutidos |
| Multitenancy retrofitado | `tenantId` inviolável desde o dia 1 |
| Chat como única UI | Chat complementa builders e dashboards |
| Filtros só em NL | Filtros estruturados + globais |
| Proveniência opcional | Explainability obrigatória |
| Observability como retrofit | Observability de IA como pré-requisito |
| Herança/mixin de classes | Composição por injeção de dependência |
| Acoplamento a SQL | Modelo declarativo neutro de fonte |

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [ADR-0008 — Connectors and integration execution](../../adr/adr-0008-connectors-and-integration-execution.md)
- [ADR-0009 — Deployment isolation and tenant model](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- [ADR-0020 — Metadata sanitization and forbidden fields](../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md)
- [ADR-0025 — LLM-assisted analytics text generation](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Índice da biblioteca de referências](../README.md)
