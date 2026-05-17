# Estratégia de Componentes — Delfos Analytics

> **Nota:** este documento é **voltado ao `delfos-web`**. Ele é a fonte canônica
> compartilhada de regras, mas o conteúdo trata de componentes/Design System do
> frontend Flutter Web.

> Status: documento normativo  
> Escopo: componentes reutilizáveis, Design System e fronteira entre API e Web.

Este documento define como componentes devem ser criados, reutilizados e mantidos, principalmente no `delfos-web`.

---

## 1. Princípio central

Nenhuma tela deve construir sua própria linguagem visual isolada. Componentes comuns pertencem ao Design System.

---

## 2. Onde cada coisa vive

No `delfos-web`:

```text
lib/shared/widgets/       # componentes visuais reutilizáveis
lib/shared/layout/        # shell, sidebar, topbar, page layout
lib/shared/charts/        # ChartRenderer e adapters
lib/core/theme/           # tokens, tema claro/escuro
features/*/presentation/  # composição específica de feature
```

---

## 3. Componentes globais

Devem nascer em `lib/shared/widgets/`:

- botão
- card
- input
- select
- modal
- drawer
- tabela
- badge
- breadcrumb
- tabs
- empty state
- loading state
- error state
- permission state
- filter bar
- toolbar
- pagination

Features não devem recriar esses componentes localmente.

---

## 4. Componentes específicos

Podem ficar em `features/<feature>/presentation/widgets/` quando:

- só fazem sentido naquela feature
- não representam padrão visual reutilizável
- dependem fortemente do contexto daquela tela
- são composição de componentes globais

Exemplo permitido:

- `DashboardWidgetGrid`
- `ReportColumnSelector`
- `ConnectionStatusPanel`

---

## 5. Quando promover para shared

Promover para `shared` quando:

- o mesmo componente aparece em duas ou mais features
- representa padrão visual do produto
- resolve estado recorrente
- precisa de consistência visual ampla
- será documentado no catálogo de widgets

---

## 6. Contratos de componentes

Componentes devem:

- receber dados por parâmetros claros
- evitar acessar provider global sem necessidade
- expor callbacks explícitos
- não fazer chamada HTTP diretamente
- não conter regra de negócio profunda
- suportar tema claro/escuro
- ter estado desabilitado/loading quando aplicável

---

## 7. Componentes de gráficos

Gráficos são sempre renderizados via `ChartRenderer`.

A feature escolhe:

- tipo de gráfico
- dados normalizados
- configuração visual permitida

O adapter decide como desenhar com a biblioteca concreta.

---

## 8. Componentes de formulário

Formulários devem usar componentes compartilhados e validação padronizada.

Regras:

- label visível
- helper/error text padronizado
- foco acessível
- loading no submit
- prevenção de duplo envio
- mensagens em PT-BR

---

## 9. Componentes e white label

Componentes não recebem cor de marca diretamente. Eles recebem intenção semântica e resolvem via tema/tokens.

Cor custom de tenant é responsabilidade da camada de tema.

---

## 10. Revisão obrigatória

Ao criar componente novo, responder:

1. Ele já existe?
2. É específico ou compartilhado?
3. Usa tokens do tema?
4. Funciona no claro e escuro?
5. Possui estado loading/disabled/error quando necessário?
6. Pode ser testado isoladamente?
7. Está documentado em `delfos-web/docs/widget-catalog.md` se for shared?
