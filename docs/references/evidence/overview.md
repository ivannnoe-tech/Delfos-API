# Evidence — Visão Geral

> Tipo: referência estratégica · Produto estudado: Evidence · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Evidence (Evidence.dev) é um framework open-source de **Business Intelligence as Code** (BI-as-code). Em vez de oferecer um editor visual drag-and-drop, propõe que relatórios, dashboards e data apps sejam escritos como **arquivos Markdown enriquecidos com SQL e componentes**. O projeto gera, a partir desses arquivos-fonte, um **site estático interativo** — publicável internamente, compartilhável com clientes ou embutido em outra aplicação.

A premissa central: tratar artefatos de BI como código-fonte versionável. Tudo que define um relatório (consultas, narrativa, visualizações, parâmetros) vive em arquivos de texto sob controle de versão, permitindo *diff*, *code review*, branches, rollback e reprodutibilidade — práticas que o BI tradicional raramente oferece.

---

## Objetivo do produto

Permitir que equipes de dados produzam **data products** (relatórios, ferramentas de apoio à decisão, reporting embedado) usando apenas linguagens que já dominam — SQL e Markdown — sem depender de uma ferramenta visual proprietária. O foco não é o dashboard operacional de monitoramento em tempo real, mas o **relatório narrativo**: documentos analíticos onde texto explicativo e visualização caminham juntos.

---

## Público-alvo

| Perfil | Uso típico |
|---|---|
| Analistas de dados / Analytics Engineers | Escrevem relatórios em SQL+Markdown, conhecem dbt e warehouses |
| Equipes de produto de dados | Constroem reporting embedado para clientes |
| Times técnicos enxutos | Querem BI sem operar uma plataforma pesada |
| Consultorias / agências | Entregam relatórios versionados e reproduzíveis a clientes |

Não é voltado a usuários de negócio que esperam montar gráficos por arrastar-e-soltar — exige conforto com SQL e fluxo de trabalho de desenvolvedor (Git, terminal, build).

---

## Diferencial

- **BI-as-code real**: o relatório é texto versionável, não um objeto opaco em um banco de metadados.
- **Relatórios narrativos**: Markdown intercala prosa, números embutidos no texto e gráficos — formato de "documento analítico", não de painel de KPIs.
- **Reprodutibilidade**: qualquer estado do relatório pode ser reconstruído a partir do commit; *code review* aplica-se à análise.
- **Saída estática**: o build produz um site sem servidor de aplicação, fácil de hospedar e barato de operar.
- **SQL como interface única**: consultas em dialeto DuckDB rodam contra um cache local; o mesmo SQL serve qualquer fonte.

---

## Arquitetura geral

Fluxo conceitual do Evidence:

1. **Sources** — conectores extraem dados das fontes (warehouses, arquivos, APIs) e materializam o resultado como arquivos **Parquet** num cache local.
2. **Markdown + SQL** — páginas `.md` contêm *code fences* SQL (dialeto DuckDB) executados contra o cache.
3. **Componentes** — resultados de query alimentam componentes de visualização e inputs declarados na própria página.
4. **Build estático** — o framework (sobre SvelteKit) compila tudo num site estático; consultas interativas rodam no browser via DuckDB-WASM.
5. **Deploy** — o site é publicado em qualquer hosting estático (Netlify, Vercel, Cloudflare Pages, GitHub Pages etc.).

O ponto arquitetural marcante é a **separação entre extração (sources, em build) e consulta (no cache/browser)**: o relatório final não fala diretamente com o warehouse de produção.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework de UI | SvelteKit |
| Engine de consulta | DuckDB (em build e via WebAssembly no browser) |
| Formato de cache | Parquet (colunar, comprimido) |
| Linguagem de autoria | Markdown estendido + SQL + JavaScript |
| Distribuição | Site estático (SSG) |
| Ferramentas de autoria | Extensão VS Code; Evidence Studio (IDE em navegador, com auxílio de IA) |

---

## Pontos fortes

- **Versionamento nativo** de toda a definição analítica — governança via Git "de graça".
- **Reprodutibilidade e auditabilidade** do relatório por commit.
- **Custo operacional baixo**: site estático, sem servidor de BI dedicado.
- **Templated pages**: um único template Markdown gera N páginas (uma por cliente, país, período).
- **Performance interativa**: filtros e dropdowns rodam em DuckDB-WASM, sem round-trip ao servidor.
- **Curva curta para quem já sabe SQL**: nada de DSL proprietária de modelagem.
- **Relatórios narrativos** de qualidade editorial — texto e dados integrados.

---

## Pontos fracos

- **Exige perfil técnico**: SQL, Git, terminal e build não são acessíveis a usuários de negócio.
- **Sem self-service visual**: não há montador de gráfico para não-programadores.
- **Segurança por linha (RLS) ausente no open-source**: o padrão é gerar *deployments* separados por usuário/segmento; RLS real só na oferta paga (Evidence Cloud).
- **Sem autenticação na versão community**: controle de acesso fica a cargo da infraestrutura externa.
- **Modelo estático limita tempo real**: dados refletem o último build de sources.
- **Multi-tenancy não é nativo**: isolamento depende de múltiplos builds, não de fronteira lógica em runtime.

---

## O que vale estudar

- O conceito de **BI-as-code**: definições analíticas como arquivos versionáveis e revisáveis.
- **Templated pages** como padrão de geração de muitas visões a partir de um molde.
- A ideia de **relatório narrativo** — combinar texto explicativo, números inline e gráficos.
- A **separação extração/consulta** com um cache materializado intermediário.
- O fluxo de **governança por Git** (diff, review, rollback) aplicado a artefatos de analytics.

## O que NÃO reproduzir no Delfos

- **Saída estática sem runtime**: o Delfos é multi-tenant com runtime e isolamento lógico — não cabe build estático por tenant.
- **RLS por deployment separado**: viola o princípio de `tenantId` como fronteira única e centralizada.
- **Ausência de autenticação no produto**: o Delfos já planeja auth próprio (ADR-0006); delegar segurança à infra externa não é aceitável.
- **Exigir perfil de desenvolvedor**: o Delfos atende usuários de negócio; autoria 100% em código não serve como única via.
- **Acoplar a um único engine (DuckDB)** como camada obrigatória — conflita com a estratégia de connectors plurais.

---

## Relacionado

- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0001-phase-1-api-based-data-source.md](../../adr/adr-0001-phase-1-api-based-data-source.md)
- [../../adr/adr-0011-dashboard-builder-and-widget-model.md](../../adr/adr-0011-dashboard-builder-and-widget-model.md)
- [../../adr/adr-0024-phase-1-and-phase-2-definition.md](../../adr/adr-0024-phase-1-and-phase-2-definition.md)
