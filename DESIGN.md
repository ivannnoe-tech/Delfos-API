# DESIGN.md — Delfos Analytics

> Versão: 1.0  
> Status: Diretriz obrigatória de experiência visual, usabilidade e consistência entre `delfos-api` e `delfos-web`.  
> Escopo: Design System, padrões de tela, gráficos, relatórios, estados visuais, temas e white label.

Este documento é a fonte canônica de design do Delfos Analytics. Toda implementação visual no `delfos-web` deve respeitar estas regras. O `delfos-api` deve entregar contratos que permitam essa experiência sem acoplar regra visual no backend.

---

## 1. Princípios de design

O Delfos deve parecer uma plataforma analítica profissional, clara e confiável. A interface precisa ajudar o usuário a tomar decisão sem excesso visual.

Princípios obrigatórios:

- clareza acima de enfeite
- informação importante em primeiro nível
- hierarquia visual consistente
- componentes reutilizáveis
- baixa densidade em telas executivas
- densidade controlada em tabelas e relatórios
- tema claro e escuro desde o início
- acessibilidade como regra, não como ajuste final
- white label sem quebrar legibilidade
- gráficos úteis antes de gráficos bonitos

---

## 2. Linguagem visual

A experiência deve seguir uma estética **moderna, limpa e corporativa**:

- cantos arredondados moderados
- sombras suaves, nunca pesadas
- espaçamento generoso
- bordas discretas
- contraste suficiente em ambos os temas
- ícones simples e consistentes
- textos objetivos
- componentes com estados visuais claros

Evitar:

- excesso de gradientes
- animações chamativas
- cores puras/saturadas em grandes áreas
- tabelas sem respiro
- cards com muitas informações competindo
- dashboards com gráficos demais no primeiro nível

---

## 3. Tokens obrigatórios

O front deve centralizar os tokens em `lib/core/theme/tokens.dart`.

Categorias mínimas:

- cores semânticas
- tipografia
- espaçamentos
- raios de borda
- sombras
- breakpoints
- elevações
- tamanhos mínimos de toque/click
- duração de transições

Nenhuma feature deve usar cor hardcoded. Cores de cliente white label entram por tokens resolvidos, nunca direto no widget.

---

## 4. Cores semânticas

Toda cor usada em produto deve responder a uma intenção:

| Intenção    | Uso                                             |
| ----------- | ----------------------------------------------- |
| `primary`   | ação principal, seleção, destaque institucional |
| `secondary` | ação secundária e elementos de apoio            |
| `success`   | estados positivos, concluído, aprovado          |
| `warning`   | atenção, risco moderado, pendência              |
| `danger`    | erro, falha, ação destrutiva                    |
| `info`      | informação neutra contextual                    |
| `surface`   | fundo de cards, modais e painéis                |
| `border`    | divisões discretas                              |
| `muted`     | textos secundários                              |

A cor da marca do cliente pode substituir `primary`, desde que passe em contraste mínimo e não quebre os estados semânticos.

---

## 5. Tipografia

A tipografia deve priorizar leitura rápida.

Hierarquia mínima:

| Nível      | Uso                                         |
| ---------- | ------------------------------------------- |
| Display    | páginas de entrada, telas vazias especiais  |
| H1         | título principal da página                  |
| H2         | seção importante                            |
| H3         | card ou agrupamento                         |
| Body       | conteúdo padrão                             |
| Body small | metadados, legendas, informações auxiliares |
| Label      | campos, filtros, chips e botões             |
| Numeric    | KPIs, valores monetários e indicadores      |

KPIs e valores numéricos devem usar alinhamento, abreviação e formatação consistentes.

---

## 6. Layout base

A aplicação web deve ter estrutura consistente:

- sidebar lateral para navegação primária
- topbar para contexto, filtros globais, usuário e tenant
- área principal com largura fluida
- header de página com título, descrição curta e ações
- filtros em barra ou painel dedicado
- conteúdo com cards, tabelas, gráficos ou builders

A sidebar deve suportar modo expandido e recolhido. A topbar deve ter altura consistente em todas as telas onde aparece.

---

## 7. Estados obrigatórios

Toda tela que busca dados deve implementar:

- loading
- vazio
- erro
- sem permissão
- configuração incompleta
- sucesso quando houver ação assíncrona relevante

Estados devem ser componentes do Design System, não blocos soltos criados dentro de cada feature.

---

## 8. Dashboards

Dashboards devem privilegiar leitura executiva.

Estrutura recomendada:

1. cards de KPIs principais
2. gráfico ou tabela principal
3. comparativos e rankings
4. detalhes expansíveis
5. filtros contextuais

Evitar:

- mais de 6 KPIs no primeiro nível sem agrupamento
- gráficos 3D
- excesso de cores em uma única visualização
- eixo ou legenda sem unidade
- cards sem contexto de período/filtro

Cada widget deve deixar claro:

- origem dos dados
- período analisado
- última atualização
- filtros aplicados
- estado de erro parcial, quando houver

---

## 9. Gráficos

Todo gráfico deve passar pela abstração `ChartRenderer`, documentada em `delfos-web/docs/chart-renderer.md`.

Regras:

- título claro
- unidade explícita
- legenda quando houver mais de uma série
- tooltip acessível
- estado vazio específico
- estado de erro específico
- responsividade
- exportação quando aplicável

Bibliotecas de gráfico são detalhe interno do adapter. Features não importam `fl_chart` ou `graphic` diretamente.

---

## 10. Relatórios e tabelas

Tabelas devem priorizar comparação, leitura e exportação.

Regras:

- cabeçalhos fixos quando a tabela for longa
- alinhamento numérico à direita
- datas em formato PT-BR
- valores monetários com moeda
- filtros visíveis e compreensíveis
- paginação ou virtualização para grandes volumes
- ações destrutivas sempre confirmadas
- exportação respeitando os filtros aplicados

---

## 11. Formulários

Formulários devem ter:

- labels visíveis
- mensagens de erro próximas ao campo
- validação de front e back
- máscara apenas quando melhora a entrada
- placeholders como exemplo, não como label
- botões com hierarquia clara
- prevenção de envio duplo

Campos sensíveis nunca exibem valor integral por padrão.

---

## 12. Botões e ações

Hierarquia obrigatória:

| Tipo        | Uso                                 |
| ----------- | ----------------------------------- |
| Primary     | ação principal da tela ou modal     |
| Secondary   | ação complementar                   |
| Ghost       | ação discreta                       |
| Destructive | exclusão, revogação, reset perigoso |
| Link        | navegação textual                   |

Ações de mesmo peso devem ter aparência equivalente. Ações destrutivas exigem confirmação quando houver perda de dados.

---

## 13. Modais, drawers e overlays

Use:

- modal para decisão focada e confirmação
- drawer para edição lateral sem tirar contexto
- popover para opções curtas
- tooltip para ajuda pontual

Modais não devem virar páginas escondidas. Se o conteúdo é grande, criar página ou drawer com seções.

---

## 14. Responsividade

Breakpoints mínimos:

| Faixa   | Diretriz                                                 |
| ------- | -------------------------------------------------------- |
| Mobile  | navegação compacta, foco em cards e listas               |
| Tablet  | layout em 1–2 colunas                                    |
| Desktop | sidebar + conteúdo em grid                               |
| Wide    | largura máxima para leitura, grids ampliados com cuidado |

A Fase 1 prioriza web desktop, mas não deve quebrar em telas menores.

---

## 15. Acessibilidade

Obrigatório:

- contraste adequado
- foco visível por teclado
- texto alternativo quando aplicável
- estados não dependentes apenas de cor
- área mínima de clique/toque
- labels acessíveis em campos
- navegação previsível

---

## 16. White label

White label pode alterar:

- logo
- nome exibido
- cor primária
- favicon
- tema preferencial
- textos institucionais permitidos

White label não pode alterar:

- semântica de cores de erro/sucesso/alerta
- estrutura de navegação principal sem aprovação
- contraste mínimo
- componentes essenciais do Design System
- segurança, permissões ou isolamento por tenant

---

## 17. Revisão visual obrigatória

Antes de aceitar uma tela:

- testar tema claro e escuro
- validar estados loading/empty/error/permission/configuração incompleta
- conferir responsividade
- checar textos e unidades
- checar se componentes vêm do Design System
- checar se gráficos usam `ChartRenderer`
- checar se botões têm hierarquia correta

Use `prompts/ui-review-prompt.md` para revisão assistida.
