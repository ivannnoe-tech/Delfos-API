# Apache Superset — Anti-padrões e Decisões a Evitar

> Tipo: referência estratégica · Produto estudado: Apache Superset · Status: conceitual/futuro — não autoriza implementação

---

## Propósito

Este arquivo cataloga problemas observados no Apache Superset — não para criticar
um projeto maduro e respeitado, mas para registrar **o que o Delfos deve evitar
deliberadamente**. Cada item traz a consequência e a postura recomendada.

---

## 1. Multi-tenancy não estrutural

**Problema.** O Superset não tem multi-tenancy nativo. A prática comum é Row-Level
Security manual por dashboard/slice, ou rodar instâncias separadas por cliente. Não
é possível ter múltiplos bancos de metadados por instância.

**Consequência.** Isolamento depende de configuração correta repetida; erro humano
vaza dados entre clientes ("noisy neighbor", data leakage). Auditar a isolação é
difícil.

**Postura Delfos.** `tenantId` é fronteira de isolamento **obrigatória** em toda
query multi-tenant — nunca filtro opcional. Isolamento é invariante de domínio,
testado, não convenção. Ver `../../adr/adr-0009-deployment-isolation-and-tenant-model.md`.

---

## 2. Autorização acoplada ao framework de UI

**Problema.** A autorização vive no Flask-AppBuilder. Permissões são granulares
(`can_read on Chart`), mas espalhadas; usuários relatam que é difícil ver quem tem
acesso a quê.

**Consequência.** RBAC pouco auditável, difícil de testar isoladamente, preso ao
ciclo de vida do framework de UI.

**Postura Delfos.** Modelo de roles próprio, no domínio, testável e auditável — ver
`../../adr/adr-0017-roles-and-permissions-model.md`. Autorização não deve depender
de um framework de tela.

---

## 3. Credenciais como connection string no metadado

**Problema.** Cada `Database` do Superset guarda uma connection string (com
credenciais embutidas) no banco de metadados, ainda que criptografada.

**Consequência.** O segredo e a configuração de conexão moram juntos; o blast
radius de um vazamento de metadados inclui credenciais.

**Postura Delfos.** Separação estrita: `connectionId` é referência de config,
`credentialRef` é referência segura — **nunca** o segredo em si. Ver
`../../adr/adr-0019-credential-encryption-and-rotation.md` e
`../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md`.

---

## 4. SQL gerado por interação executado direto na fonte

**Problema.** A UI traduz interações em SQL e o executa diretamente na fonte. Poder
analítico enorme, mas a superfície de risco (injeção, query destrutiva, custo
descontrolado) é proporcional.

**Consequência.** Depende de RBAC e RLS bem configurados; uma falha de escopo gera
acesso indevido ou query cara.

**Postura Delfos.** Nunca construir requisições por concatenação de string; toda
entrada validada antes de virar URL/header/body. Execução futura é mediada por
`runtime` + connector bridge declarativos, com envelope de comando validado — ver
`../../adr/adr-0014` e `../../adr/adr-0015`.

---

## 5. Banco de metadados único como gargalo

**Problema.** O web server escala horizontalmente, mas todos compartilham um único
banco de metadados. Em escala, ele vira ponto de contenção.

**Consequência.** Gargalo de escrita/leitura de metadados; ponto único de falha.

**Postura Delfos.** Tratar o store de configuração (MongoDB) como recurso que
precisa de estratégia de escala e isolamento por design, não como detalhe — ver
`../../adr/adr-0005-mongodb-as-config-store.md` e
`../../adr/adr-0010-analytics-storage-and-retention.md`.

---

## 6. Curva de aprendizado alta e dependência de SQL

**Problema.** Muitas tarefas no Superset exigem SQL (joins, preparação). A Explore
view não cobre joins; o usuário precisa ir ao SQL Lab criar views.

**Consequência.** O usuário de negócio fica dependente do analista; adoção limitada.

**Postura Delfos.** A camada semântica (datasets + field-mappings + query-definitions)
deve absorver complexidade, de modo que o usuário de negócio não precise escrever
SQL. Joins/relacionamentos pertencem ao modelo declarativo, não à UI ad-hoc.

---

## 7. Drill-down/drill-through sem modelo de navegação

**Problema.** A própria comunidade discute que desenhar drill-down e drill-through
no Superset é confuso — o comportamento varia por chart e por configuração.

**Consequência.** Exploração imprevisível; o usuário não sabe o que um clique fará.

**Postura Delfos.** Modelar interações (drill, cross-filter) como configuração
declarada e previsível — ver ideia 6 em `./ideas-for-delfos.md`. Comportamento
explícito, não emergente.

---

## 8. Estados de Loading/Empty/Error inconsistentes

**Problema.** O Superset trata loading, "no data" e erro razoavelmente, mas a
consistência varia entre componentes legados.

**Consequência.** Experiência irregular; o usuário aprende padrões diferentes em
telas diferentes.

**Postura Delfos.** Estados padronizados desde o design system: telas de dados
**devem** implementar `DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState`,
`DelfosPermissionState`. Regra de revisão, não opção.

---

## 9. Colaboração ausente

**Problema.** Não há comentários, anotações ou threads em dashboards. Colaboração
se resume a permissões + permalink + e-mail.

**Consequência.** Discussão sobre os dados acontece fora da ferramenta (e-mail,
chat), perdendo contexto.

**Postura Delfos.** Não é anti-padrão a copiar — é uma **lacuna a preencher** como
diferencial (anotações ancoradas a widget). Registrado como oportunidade.

---

## 10. Realtime simulado por auto-refresh

**Problema.** O Superset não é realtime; "ao vivo" é apenas auto-refresh em
intervalo, custoso para a fonte e para o cache.

**Consequência.** Expectativa de tempo real frustrada; carga desnecessária.

**Postura Delfos.** Não prometer realtime sem arquitetura para isso. Na fase
foundation não há runtime real — qualquer recurso "ao vivo" exige ADR. Ver
`../../adr/adr-0024-phase-1-and-phase-2-definition.md`.

---

## 11. Complexidade operacional subestimada

**Problema.** "Licença grátis" esconde o custo de operar Celery, Redis, broker,
workers, tuning de cache e o banco de metadados em produção.

**Consequência.** TCO real alto; equipes subdimensionam a operação.

**Postura Delfos.** Manter a fase foundation deliberadamente simples — sem cache,
fila, worker ou scheduler (`../../adr/adr-0007-no-cache-redis-phase-1.md`).
Complexidade de infraestrutura entra só com ADR e necessidade comprovada.

---

## Resumo — o que NÃO queremos reproduzir

| Anti-padrão | Decisão Delfos |
|---|---|
| Multi-tenancy por convenção/RLS | `tenantId` como invariante estrutural |
| RBAC acoplado ao framework de UI | Modelo de roles próprio e auditável |
| Credenciais no metadado | `credentialRef` / `connectionId`, nunca o segredo |
| SQL ad-hoc direto na fonte | Runtime + connector bridge validados |
| Metadado único como gargalo | Estratégia de escala/isolamento por design |
| Dependência de SQL para tarefas básicas | Camada semântica absorve a complexidade |
| Drill emergente por chart | Modelo de navegação declarativo |
| Estados de UI inconsistentes | Estados padronizados no design system |
| Realtime simulado | Sem promessa de tempo real sem ADR |
| Complexidade operacional oculta | Fase foundation simples por decisão |

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [ADR-0009 — Deployment isolation and tenant model](../../adr/adr-0009-deployment-isolation-and-tenant-model.md)
- [ADR-0017 — Roles and permissions model](../../adr/adr-0017-roles-and-permissions-model.md)
- [ADR-0019 — Credential encryption and rotation](../../adr/adr-0019-credential-encryption-and-rotation.md)
- [ADR-0020 — Metadata sanitization and forbidden fields](../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md)
- [ADR-0007 — No cache/Redis Phase 1](../../adr/adr-0007-no-cache-redis-phase-1.md)
- [ADR-0024 — Phase 1 and Phase 2 definition](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
- [Índice da biblioteca de referências](../README.md)
