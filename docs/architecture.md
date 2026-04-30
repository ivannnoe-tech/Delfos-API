# Arquitetura — Delfos Analytics

> Status: documento normativo
> Escopo: arquitetura geral entre `delfos-api` e `delfos-web`.

Este documento descreve a arquitetura atual da foundation e a direcao alvo do Delfos Analytics. Ele deve ser lido junto com `AGENTS.md`, `DESIGN.md`, `docs/phase-1-scope.md` e os ADRs em `docs/adr/`.

---

## 1. Visão geral

O Delfos Analytics é composto por dois repositórios principais:

- `delfos-api`: backend NestJS, responsavel por contratos foundation, auth temporaria, configuracao declarativa, catalogos, credenciais protegidas, auditoria e contratos REST.
- `delfos-web`: frontend Flutter Web, responsavel pela interface, status da API, catalogos foundation e preview demo.

No estado atual, o Delfos **nao armazena dados operacionais dos clientes** e tambem **nao consome APIs, bancos, arquivos ou sistemas de clientes**. Connections, datasets, field-mappings, query-definitions e dashboard-definitions sao declarativos. `execution-preview` gera apenas dados ficticios em memoria.

Conectores reais, execucao real, cache, fila, scheduler, dashboard runtime e `delfos-connectors` sao futuros.

---

## 2. Fluxo lógico

```text
Usuario
  |
delfos-web
  | REST + headers foundation temporarios
delfos-api
  | catalogos declarativos + execution-preview demo
MongoDB
  |
delfos-web renderiza catalogos e preview demo
```

---

## 3. Responsabilidades do delfos-api

O backend é responsável por:

- auth temporaria por `x-delfos-admin-key`
- roles administrativas temporarias por tenant
- isolamento multi-tenant
- cadastro de tenants e usuarios administrativos
- cadastro declarativo de connections
- armazenamento protegido de credentials e `credentialRef`
- cadastro declarativo de datasets
- cadastro de De/Para declarativo por dataset
- cadastro declarativo de query-definitions e dashboard-definitions
- `execution-preview` demo em memoria
- execucao segura de chamadas HTTP externas *(planejado/futuro — `data-connectors` nao implementado; ver ADR-0008)*
- validacao, normalizacao e paginacao de respostas reais *(planejado/futuro — dependente do executor futuro)*
- cache, fila, worker e scheduler *(fora do escopo atual)*
- logs e auditoria
- contratos REST consumidos pelo front
- exportacoes *(planejado/futuro)*

O backend não deve conter regra visual.

---

## 4. Responsabilidades do delfos-web

O frontend é responsável por:

- navegacao e interface
- configuracao temporaria de headers foundation
- experiência visual e responsividade
- listagem de catalogos foundation
- preview demo
- montagem de dashboards e relatorios *(planejado/futuro)*
- renderizacao de graficos via `ChartRenderer` *(parcial/futuro conforme feature)*
- composição de widgets reutilizáveis
- aplicação do Design System
- estados visuais obrigatórios
- experiencia white label *(planejado/futuro)*
- interacao com filtros e builders *(planejado/futuro)*

O frontend não deve acessar APIs de clientes diretamente. Toda chamada passa pelo `delfos-api`, e execucao externa real dependera do futuro `delfos-connectors` ou mecanismo aprovado.

---

## 5. Modelo de camadas do backend

Cada módulo do backend deve seguir separação clara:

```text
controller -> service/use-case -> repository/model
```

Regras:

- Controller não contém regra de negócio complexa.
- Service coordena regra de aplicação.
- Repository encapsula persistência MongoDB.
- External client para comunicacao HTTP externa e futuro; nao criar sem escopo aprovado.
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

- auth temporaria por `x-delfos-admin-key` no estado atual
- JWT com refresh token rotacionavel planejado/futuro
- credenciais protegidas e referenciadas por `credentialRef`
- secrets fora do Git
- validação forte de input
- allowlist de headers e metodos para conectores futuros
- timeout e rate limit em chamadas externas futuras
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
