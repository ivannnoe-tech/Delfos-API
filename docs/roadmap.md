# Roadmap — Delfos Analytics

> Status: planejamento inicial. Datas devem ser definidas conforme execução real.

---

## Fase 0 — Fundação documental e governança

Status: concluída/inicial.

Entregas:

- `AGENTS.md`
- `DESIGN.md`
- ADRs iniciais
- política de bibliotecas
- política de dados
- política de conectores
- prompts internos
- guias de desenvolvimento

---

## Fase 1.1 — Estrutura técnica inicial

Objetivo: criar base dos dois repositórios sem regra de negócio avançada.

Entregas:

- setup NestJS no `delfos-api`
- setup Flutter Web no `delfos-web`
- lint/format/test/build
- Docker Compose local para MongoDB
- configuração de ambiente
- estrutura de pastas
- CI inicial
- healthcheck

---

## Fase 1.2 — Segurança e contas

Entregas:

- auth JWT
- refresh token
- usuários
- tenants
- vínculo usuário/tenant
- RBAC inicial
- guards
- auditoria básica

---

## Fase 1.3 — Conexões e datasets

Entregas:

- CRUD de conexões
- credenciais criptografadas
- teste de conexão
- CRUD de datasets
- execução segura de dataset
- paginação
- erros padronizados
- cache transitório

---

## Fase 1.4 — De/Para

Entregas:

- CRUD de field mappings
- validação de campos
- transformação simples
- preview de dados normalizados
- validação de configuração incompleta

---

## Fase 1.5 — Dashboards

Entregas:

- dashboard builder inicial
- widgets de KPI
- widgets de gráfico
- tabelas simples
- filtros por período
- layout configurável
- ChartRenderer

---

## Fase 1.6 — Relatórios e exportações

Entregas:

- report builder
- filtros
- colunas configuráveis
- ordenação
- exportação CSV/XLSX
- auditoria de exportação sensível

---

## Fase 1.7 — White label e acabamento

Entregas:

- logo por tenant
- cor primária por tenant
- tema claro/escuro refinado
- domínio/nome exibido
- polish visual
- testes de responsividade

---

## Fase 2 — Evolução analítica

Possíveis entregas futuras:

- ingestão própria
- histórico
- Redis
- filas/workers
- alertas
- snapshots
- conectores dedicados
- agendamento de relatórios

Fase 2 exige novos ADRs antes de execução.
