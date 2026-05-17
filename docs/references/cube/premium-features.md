# Cube — Features premium e enterprise

> Tipo: referência estratégica · Produto estudado: Cube · Status: conceitual/futuro — não autoriza implementação

---

## Nota de contexto

O Cube divide-se em **Cube Core** (open-source, Apache 2.0) e **Cube Cloud** (gerenciado, com camada enterprise e Cube D3). As features abaixo são majoritariamente de Cube Cloud/D3. O objetivo aqui é mapear **percepção de valor**, não recomendar implementação — o Delfos está em fase foundation.

---

## Features premium / enterprise

| Feature | Valor percebido |
|---|---|
| Cube Store gerenciado | Pre-aggregations performáticas sem operar infraestrutura |
| Pre-aggregations particionadas | Refresh incremental sobre datasets grandes |
| Multi-region / alta disponibilidade | SLA para analytics embarcado em produto SaaS |
| Access policies por membro | Governança granular de measures/dimensions |
| Data masking | Conformidade — ofuscar PII por papel |
| Semantic catalog | Catálogo navegável de métricas como ativo organizacional |
| Cube D3 (agentic analytics) | Análise por IA ancorada na camada semântica |

---

## Recursos que geram percepção de valor

- **Single source of truth de métricas** — o argumento de venda central: "todos os números batem".
- **Performance sem esforço** — o usuário não pensa em cache; o Cube roteia para pre-aggregations.
- **Time-to-value para embedded** — embarcar analytics multi-tenant no próprio produto sem construir um motor de BI.
- **Independência de ferramenta** — conectar Excel, Tableau e um app custom à mesma camada.

---

## Recursos de IA

Cube D3, lançado em 2025, é a aposta agentic do produto:

- **AI Data Analyst** — análise self-service em linguagem natural; gera Semantic SQL e visualizações.
- **AI Data Engineer** — automatiza a construção de modelos semânticos a partir das fontes.
- **Cube Copilot** — sugere métricas em tempo real conforme o contexto de trabalho.
- **Semantic SQL** — dialeto que opera sobre a camada semântica, consumível por humanos e agentes.

O insight estratégico: a camada semântica é o que torna a IA **confiável** — o agente consulta métricas definidas e governadas, não inventa SQL sobre tabelas cruas.

---

## Colaboração

- Modelo de dados versionado em Git — revisão por PR, histórico, rollback.
- Catálogo de métricas compartilhado entre times.
- Workspaces e ambientes (dev/staging/prod) no Cube Cloud.

---

## Observability

- Métricas de uso de API, latência de query, hit rate de pre-aggregations.
- Visibilidade de quais rollups são usados e quais estão obsoletos.
- Logs de refresh e de falhas de build.

---

## Analytics copilots

O Copilot atua durante a modelagem (sugerindo measures) e durante o consumo (traduzindo intenção em query). Ambos ancorados no modelo — o copiloto não opera no vácuo, opera sobre definições existentes.

---

## Explainability

Ponto forte conceitual: como a métrica é **definida explicitamente** no modelo, sempre é possível responder "como esse número foi calculado" — a definição é o documento. Combinado com a query estruturada e o SQL gerado, há rastreabilidade completa do número à fonte.

---

## Smart alerts

No ecossistema Cube, alertas observam measures da camada semântica e disparam quando cruzam limites ou desviam do padrão. Como a measure é governada, o alerta é confiável e reutilizável entre dashboards.

---

## Template systems

- Cubes reutilizáveis via `extends` (herança de modelo).
- Segments como filtros-template.
- Views como templates de consumo para casos de uso recorrentes.

---

## Sharing systems

- Compartilhamento de queries estruturadas (serializáveis e portáteis).
- APIs múltiplas como mecanismo de "compartilhamento": o mesmo dado, vários canais.
- Embedding com security context — compartilhar dashboard sem vazar dados de outro tenant.

---

## Realtime

Cube suporta refresh keys curtas e WebSockets para consultas próximas de tempo real. O trade-off é explícito: quanto mais "realtime", menos benefício de pre-aggregation — uma decisão de modelagem por measure.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- ADRs: [../../adr/adr-0023-data-masking-policy.md](../../adr/adr-0023-data-masking-policy.md), [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md), [../../adr/adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
