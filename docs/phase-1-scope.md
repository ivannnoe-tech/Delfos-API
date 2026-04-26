# Escopo da Fase 1 — Delfos Analytics

> Status: documento normativo  
> Objetivo: delimitar o que será construído agora e o que fica fora da primeira entrega.

A Fase 1 valida o produto como plataforma analítica configurável consumindo **APIs custom expostas pelos clientes**. O foco é entregar valor com baixo custo operacional, segurança e arquitetura evolutiva.

---

## 1. Objetivo da Fase 1

Entregar uma plataforma web capaz de:

- autenticar usuários
- separar empresas/tenants
- configurar conexões com APIs de clientes
- mapear campos por De/Para
- montar dashboards personalizados
- montar relatórios personalizados
- renderizar gráficos e KPIs
- exportar dados quando permitido
- aplicar white label básico
- auditar ações sensíveis

---

## 2. Premissa principal

O Delfos **não armazena dados operacionais dos clientes** na Fase 1.

Dados como vendas, produtos, pedidos, clientes finais, estoque, financeiro ou transações vêm das APIs dos próprios clientes no momento da consulta, com cache transitório em memória quando permitido.

---

## 3. Incluído na Fase 1

### 3.1 Autenticação e usuários

- Login com e-mail/senha
- JWT access + refresh
- refresh token rotacionável
- logout
- recuperação de senha, se priorizada no roadmap
- cadastro e gestão de usuários
- vínculo usuário ↔ tenant

### 3.2 Tenants e permissões

- cadastro de empresas
- isolamento por tenant
- RBAC básico
- perfis de acesso
- permissões por módulo/ação
- auditoria de ações sensíveis

### 3.3 Conexões com APIs dos clientes

- cadastro de URL base
- tipo de autenticação
- headers permitidos
- credenciais criptografadas
- teste de conexão
- timeout configurável
- rate limit por conexão
- status da conexão

### 3.4 Datasets

- cadastro de endpoints por conexão
- método HTTP permitido
- parâmetros permitidos
- paginação
- resposta esperada
- validação de schema mínimo
- ativação/inativação

### 3.5 De/Para

- mapeamento de campos da API do cliente para campos canônicos do Delfos
- transformação simples de tipos
- nomes amigáveis para exibição
- definição de campos obrigatórios
- suporte a nested path quando necessário

### 3.6 Dashboards

- criação de dashboards
- organização por widgets
- filtros por período e campos mapeados
- KPIs
- gráficos básicos
- tabelas analíticas
- layout configurável

### 3.7 Relatórios

- criação de relatórios configuráveis
- seleção de dataset
- colunas visíveis
- filtros
- ordenação
- agrupamento simples
- exportação CSV/XLSX quando aplicável

### 3.8 Design System

- layout base
- sidebar
- topbar
- cards
- botões
- inputs
- tabelas
- modais
- estados visuais
- tema claro/escuro
- tokens para white label

---

## 4. Fora da Fase 1

Fora do escopo imediato:

- ETL próprio
- ingestão recorrente de dados operacionais
- data warehouse próprio
- histórico analítico persistente
- filas complexas
- Redis obrigatório
- motor de alertas
- IA generativa embarcada no produto
- criação automática de APIs para clientes
- acesso direto ao banco de dados do cliente
- app mobile nativo
- marketplace de conectores

Detalhes em `docs/out-of-scope.md`.

---

## 5. Critério de sucesso

A Fase 1 é considerada bem-sucedida quando:

- um tenant consegue configurar uma API própria
- datasets podem ser cadastrados e testados
- campos podem ser mapeados por De/Para
- dashboards carregam dados reais da API do cliente
- relatórios podem ser gerados e exportados
- permissões impedem acesso indevido
- tema claro e escuro estão funcionais
- a experiência visual segue `DESIGN.md`
- a arquitetura permanece pronta para evoluir para Fase 2

---

## 6. Limitações aceitas

São limitações conscientes da Fase 1:

- dependência da disponibilidade da API do cliente
- latência variável conforme API externa
- cache apenas transitório
- sem histórico se a API do cliente não fornecer
- cada cliente pode exigir configuração própria
- integrações altamente específicas podem exigir adapter dedicado no futuro

---

## 7. Quando criar ADR

Criar ADR quando houver proposta de:

- armazenar dado operacional do cliente
- adicionar Redis, fila ou worker
- acessar banco de cliente diretamente
- mudar mecanismo de autenticação
- adicionar biblioteca paga ou restritiva
- alterar estratégia de repositórios
- mudar motor de gráficos
- alterar isolamento multi-tenant
