# Arquitetura — Delfos Analytics

> Status: documento normativo  
> Escopo: arquitetura geral entre `delfos-api` e `delfos-web`.

Este documento descreve a arquitetura alvo da Fase 1 do Delfos Analytics. Ele deve ser lido junto com `AGENTS.md`, `DESIGN.md`, `docs/phase-1-scope.md` e os ADRs em `docs/adr/`.

---

## 1. Visão geral

O Delfos Analytics é composto por dois repositórios principais:

- `delfos-api`: backend NestJS, responsável por autenticação, permissões, configuração, consumo de APIs dos clientes, auditoria e contratos REST.
- `delfos-web`: frontend Flutter Web, responsável pela experiência analítica, dashboard builder, report builder, visualização de gráficos e gestão operacional.

Na Fase 1, o Delfos **não armazena dados operacionais dos clientes**. Ele consome APIs expostas por cada cliente, aplica contratos, filtros, De/Para e entrega dados ao frontend.

---

## 2. Fluxo lógico

```text
Usuário
  ↓
delfos-web
  ↓ REST/JWT
delfos-api
  ↓ Connection + Dataset + FieldMapping
API custom do cliente
  ↓ resposta operacional
delfos-api normaliza/valida
  ↓
delfos-web renderiza dashboard/relatório/gráfico
```

---

## 3. Responsabilidades do delfos-api

O backend é responsável por:

- autenticação e renovação de sessão
- RBAC e permissões por tenant
- isolamento multi-tenant
- cadastro de empresas e usuários
- cadastro de conexões com APIs de clientes
- armazenamento criptografado de credenciais
- cadastro de datasets/endpoints
- cadastro de De/Para por dataset
- execução segura de chamadas HTTP externas *(planejado — módulo `data-connectors` não implementado; ver ADR-0008)*
- validação, normalização e paginação de respostas *(planejado — dependente do motor acima)*
- cache transitório em memória quando permitido *(planejado — Fase 1, não iniciado)*
- logs e auditoria
- contratos REST consumidos pelo front
- exportações quando dependerem de regra de backend

O backend não deve conter regra visual.

---

## 4. Responsabilidades do delfos-web

O frontend é responsável por:

- login, sessão e navegação
- experiência visual e responsividade
- montagem de dashboards e relatórios
- renderização de gráficos via `ChartRenderer`
- composição de widgets reutilizáveis
- aplicação do Design System
- estados visuais obrigatórios
- experiência white label
- interação com filtros e builders

O frontend não deve acessar APIs de clientes diretamente. Toda chamada passa pelo `delfos-api`.

---

## 5. Modelo de camadas do backend

Cada módulo do backend deve seguir separação clara:

```text
controller → service/use-case → repository/model → external client
```

Regras:

- Controller não contém regra de negócio complexa.
- Service coordena regra de aplicação.
- Repository encapsula persistência MongoDB.
- External client encapsula comunicação HTTP externa.
- DTO valida entrada e saída pública.
- Models/schemas não vazam diretamente para o contrato público.

---

## 6. Modelo de camadas do frontend

Cada feature do front segue:

```text
data → domain → application → presentation
```

Detalhes em `delfos-web/docs/frontend-architecture.md`.

---

## 7. Multi-tenant

Todo dado de configuração do Delfos deve estar associado a um `tenantId`, quando fizer sentido.

Regras:

- Nenhuma query pode depender apenas de ID global quando o recurso é tenant-scoped.
- Toda rota sensível valida tenant e permissão.
- Logs não devem expor dados sensíveis do tenant.
- Usuário só enxerga tenants autorizados.
- White label é resolvido por tenant/domínio, não por dados soltos no front.

---

## 8. Segurança

A arquitetura assume postura de menor privilégio:

- JWT próprio com refresh token rotacionável
- credenciais de APIs externas criptografadas
- secrets fora do Git
- validação forte de input
- allowlist de headers e métodos para conectores
- timeout e rate limit em chamadas externas
- logs com redaction
- auditoria de ações sensíveis

Ver `docs/security-lgpd.md` e `docs/security-checklist.md`.

---

## 9. Dados e persistência

MongoDB é usado como banco de configuração do Delfos.

Ele armazena:

- tenants
- usuários
- permissões
- conexões
- datasets
- field mappings
- dashboards
- widgets
- relatórios
- preferências
- white label
- logs/auditoria necessários

Ele não armazena dados operacionais dos clientes na Fase 1.

Ver `docs/database-model.md` e ADR-0005.

---

## 10. Conectores de API

O motor de conectores deve ser genérico e seguro. Cada cliente pode ter contratos próprios, mas o Delfos deve abstrair isso por:

- `Connection`
- `Dataset`
- `FieldMapping`
- `QueryParameters`
- `ResponseSchema`

Ver `docs/api-connectors.md`.

---

## 11. Contratos públicos

Contratos REST são documentados em `docs/api-contracts.md`.

Mudanças de contrato devem considerar:

- compatibilidade com `delfos-web`
- versão ou migração quando necessário
- validação por DTO
- atualização de testes
- documentação atualizada

---

## 12. Observabilidade

Desde a Fase 1, a API deve emitir logs estruturados para:

- autenticação
- chamadas externas
- erros de conector
- tempo de resposta
- auditoria sensível
- falhas de permissão

Logs nunca devem conter token, senha, chave privada, CPF, e-mail completo quando não necessário, ou payload operacional bruto do cliente.

---

## 13. Fronteiras proibidas

Não é permitido:

- front chamar API do cliente diretamente
- backend armazenar dados operacionais permanentes na Fase 1
- feature front importar lib de gráfico diretamente
- controller acessar banco diretamente sem service/repository
- misturar regra visual em contrato de API
- hardcode de tenant, usuário, credencial ou endpoint
- biblioteca paga/restritiva sem aprovação

---

## 14. Evolução esperada

A Fase 2 pode introduzir:

- ingestão própria
- cache analítico persistente
- filas e workers
- snapshots históricos
- alertas
- conectores padronizados por ERPs/PDVs
- camada semântica mais robusta

Essas decisões exigem novos ADRs antes de implementação.
