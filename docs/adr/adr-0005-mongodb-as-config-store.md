# ADR-0005 — MongoDB as Delfos configuration store

- **Status**: Accepted
- **Data**: 2026-04-25
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1
- **Implementação**: implementado

---

## Contexto

O Delfos precisa de um banco próprio para armazenar **configuração** da plataforma:

- empresas (tenants)
- usuários
- permissões/roles
- conexões (API base URL, credenciais criptografadas, perfis de rate limit)
- datasets (catálogo de endpoints por conexão)
- field-mappings (De/Para)
- dashboards (estrutura, layout, widgets, filtros)
- widgets (tipo, configuração visual, fonte de dado)
- relatórios (templates, filtros, agrupamentos, ordenação, exportações salvas)
- white label (logo, cores, domínio futuro)
- preferências de usuário
- logs operacionais e de auditoria

Esses dados são **majoritariamente documentos de configuração**, com schemas que evoluem (novos tipos de widget, novos campos de relatório, etc.) e relações relativamente rasas. Não são dados operacionais do cliente — esses ficam nas APIs dos clientes (ADR-0001).

---

## Decisão

O banco principal do Delfos é **MongoDB**, acessado via **Mongoose** (`@nestjs/mongoose`).

---

## Alternativas consideradas

- **PostgreSQL com JSONB** — relacional sólido, JSONB para partes flexíveis. Boa opção. Foi descartada porque a maioria dos documentos do Delfos é "config rica e aninhada" (layout de dashboard, configuração de widget), onde Mongo encaixa melhor sem múltiplos joins. Postgres continua sendo o plano para a Fase 2 se entrar dado analítico estruturado.
- **MySQL/MariaDB** — sem vantagens claras sobre Postgres no contexto.
- **DynamoDB / Cosmos DB** — vendor lock-in, sem benefício para o escopo atual.
- **SQLite no dev + Postgres em prod** — dois ambientes, dois dialetos.

---

## Consequências

### Positivas

- Schemas de documento ricos (layouts, configs de widget, mapeamentos) cabem naturalmente
- Evolução de schema é incremental sem migrações pesadas
- Mongoose é maduro, tipa-se bem com TypeScript e tem integração de primeira no NestJS
- Multi-tenant simples (campo `tenantId` em todo documento + index composto)
- Operacional simples (Atlas, replica set, snapshots)

### Negativas / trade-offs aceitos

- Relacionamentos entre coleções precisam de cuidado (referências manuais, populate seletivo)
- Sem tipos fortes do banco (depender de validação na aplicação via Mongoose schema + class-validator)
- Transações multi-documento existem mas têm custo (precisa replica set, e em geral evitamos)
- Indexação correta é responsabilidade da aplicação — exige disciplina

### Neutras

- Caso a Fase 2 introduza dado analítico volumoso, esse dado **não** vai pra esse Mongo de configuração. Vai para um banco analítico apropriado (Postgres + extensão analítica, ClickHouse, ou similar)

---

## Impacto na Fase 1

- Conexão definida em `src/config/mongo.config.ts`
- Cada módulo do `src/modules/` define seu próprio Schema Mongoose em `<module>/schemas/`
- Todo schema tem `tenantId` (exceto entidades globais explícitas como `system-settings`)
- Index composto `(tenantId, ...)` em campos de busca frequente
- Validação dupla: **Mongoose schema** (estrutura, defaults, tipos) + **class-validator** nos DTOs (regras de negócio na entrada)
- Credenciais de conexões dos clientes são armazenadas **criptografadas** com `ENCRYPTION_KEY` (AES-256-GCM)
- `docs/database-model.md` documenta as coleções principais

## Impacto futuro / Fase 2

- Se a Fase 2 introduzir cache analítico e ingestão de dado operacional, o **banco de configuração continua sendo Mongo**. O dado analítico vai para outra tecnologia, com boundaries claros.
- Se um dia precisarmos sair do Mongo, a separação por módulo + uso de Repositórios facilita uma migração gradual.

---

## Relação com outros documentos

- `docs/database-model.md`
- ADR-0001 → supersedida pela ADR-0032 (não armazenar dado operacional do cliente na Fase 1)
- ADR-0007 → supersedida pela ADR-0033 (sem Redis na Fase 1)
