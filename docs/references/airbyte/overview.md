# Airbyte — Visão Geral Estratégica

> Tipo: referência estratégica · Produto estudado: Airbyte · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Airbyte é uma plataforma open-source de **integração de dados (data movement / ELT)**. Seu papel
é replicar dados de origens (APIs, bancos de dados, arquivos) para destinos (data warehouses,
data lakes, vector stores), de forma agendada e incremental. É distribuída em duas formas:
**self-hosted (Open Source / Enterprise)** e **Airbyte Cloud** gerenciado.

Ponto fundamental para o Delfos: **Airbyte não é uma ferramenta de BI**. Ele não desenha
dashboards, não executa queries analíticas para usuários finais e não monta visualizações.
Ele resolve o problema *anterior* — trazer o dado para um lugar onde o BI possa consumi-lo.
Por isso o Airbyte é estudado aqui como referência primária de **connectors, runtime/execution
model e orquestração**, não de UX analítica.

---

## Objetivo do produto

- Eliminar pipelines de extração/carga (EL) construídos artesanalmente.
- Padronizar a movimentação de dados sob um protocolo único (Airbyte Protocol).
- Tornar a criação de novos conectores acessível (no-code / low-code), reduzindo o custo
  marginal de cada nova fonte.
- Entregar dados "analytics-ready" e "AI/LLM-ready" (incluindo destinos vetoriais para RAG).

---

## Público-alvo

| Perfil | Uso |
|---|---|
| Data engineers | Configuram fontes/destinos, agendam syncs, mantêm conectores |
| Analytics engineers | Consomem dados normalizados no warehouse para modelagem |
| Plataform/DevOps | Operam o deployment self-hosted, escalam workers |
| Desenvolvedores de conector | Usam CDK / Connector Builder para fontes não cobertas |

O usuário final de BI **não** é público do Airbyte — ele consome o resultado a jusante.

---

## Diferencial

- **Catálogo de 600+ conectores** pré-construídos e mantidos pela comunidade/empresa.
- **Connector Development Kit (CDK)** + **Connector Builder no-code**: criar um conector
  de REST API em minutos sem sair do workspace.
- **Open-core**: núcleo open-source com edição Enterprise para governança/escala.
- **Protocolo aberto** (Airbyte Protocol): contrato estável entre plataforma e conectores,
  permitindo que cada conector seja implementado em qualquer linguagem.
- **Conectores como containers Docker isolados**: isolamento de falhas e neutralidade
  tecnológica.

---

## Arquitetura geral

Airbyte separa **platform** (serviços horizontais de controle) de **connectors** (módulos
independentes de dados). Componentes principais:

| Componente | Função |
|---|---|
| `airbyte-server` (Config API) | Controlador central + API de configuração de fontes/destinos/conexões |
| `airbyte-db` | Persiste credenciais, agendamentos e histórico de jobs |
| `airbyte-temporal` | Orquestra filas de tarefas e workflows de sync |
| `airbyte-worker` | Consome tarefas, executa lógica de scheduling |
| `airbyte-workload-api-server` | Interface HTTP para submeter operações discretas (workloads) |
| `airbyte-workload-launcher` | Provisiona pods/containers de conector |
| `airbyte-cron` | Manutenção: limpeza de logs, atualização de definições de conector |
| `airbyte-bootloader` | Migrações de banco e validação de ambiente |

O fluxo: a Config API registra a configuração → o Temporal agenda o sync → o Worker dispara
um workload → o Launcher sobe o container do conector → o conector emite registros via
Airbyte Protocol → o destino grava os dados → logs e estado são persistidos.

---

## Stack

- **Orquestração:** Temporal (workflow engine durável).
- **Plataforma:** serviços JVM (Java/Kotlin) + APIs.
- **Conectores:** empacotados como imagens Docker; CDKs disponíveis em Python (principal),
  além de TypeScript/JavaScript e C#/.NET; low-code via YAML.
- **Deploy:** Docker Compose (dev) e Kubernetes (produção); `abctl` para instalação local.
- **PyAirbyte:** biblioteca Python que expõe conectores Airbyte fora da plataforma.

---

## Pontos fortes

- Catálogo de conectores enorme e protocolo de extensão maduro.
- Connector Builder no-code reduz drasticamente o tempo de criação de conectores REST.
- Isolamento real de execução: cada conector roda em container próprio.
- Orquestração durável (Temporal) com retries e estado persistente de jobs.
- Modelo de sync incremental sólido (cursor, CDC, append + dedup).
- Open-source com caminho claro para Enterprise (governança, RBAC, data planes).

---

## Pontos fracos

- **Peso operacional alto** no self-hosted: muitos serviços, Temporal, banco, workers — exige
  Kubernetes e equipe de plataforma para escalar com confiabilidade.
- Não é orquestrador completo de pipeline — precisa de Airflow/Dagster/Prefect para fluxos
  complexos com dependências.
- Confiabilidade de conectores da comunidade é desigual; manutenção de conectores quebra
  com mudanças de API a montante.
- Curva de aprendizado e custo de recursos elevados para casos simples.
- Foco em EL — transformação (T) fica fora; o "analytics-ready" depende do warehouse.

---

## O que vale estudar para o Delfos

- O **protocolo estável** entre plataforma e conectores como contrato versionado.
- O **modelo de execução isolada** (conector = unidade isolável, observável, agendável).
- O **Connector Builder no-code** como referência de UX para configuração de fontes.
- O **modelo de sync incremental** (cursor, estado por stream) — inspiração para
  `query-definitions` e futuros `execution requests`.
- A separação **control plane / data plane** para residência de credenciais.

---

## O que NÃO reproduzir no Delfos

- A complexidade operacional do stack completo (Temporal + múltiplos serviços) na fase
  foundation — o Delfos é declarativo e MongoDB-based por decisão (`adr-0005`, `adr-0007`).
- A noção de conectores como containers Docker auto-hospedados na fase atual — o Delfos
  trata conectores como contratos e skeleton seguro (`adr-0008`, `delfos-connectors`).
- O escopo de "mover dados em massa para warehouse" — o Delfos é BI multi-tenant, não ELT.
- Conectores mantidos pela comunidade sem curadoria — governança de credenciais e
  isolamento de tenant exigem catálogo controlado.

---

## Relacionado

- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0008-connectors-and-integration-execution.md](../../adr/adr-0008-connectors-and-integration-execution.md)
- [../../adr/adr-0001-phase-1-api-based-data-source.md](../../adr/adr-0001-phase-1-api-based-data-source.md)
