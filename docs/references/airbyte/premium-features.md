# Airbyte — Features Premium e Enterprise

> Tipo: referência estratégica · Produto estudado: Airbyte · Status: conceitual/futuro — não autoriza implementação

---

## Resumo

Airbyte segue modelo **open-core**: o núcleo é open-source; a edição **Enterprise**
(self-managed) e a oferta **Cloud** adicionam governança, segurança, escala e suporte.
Esta seção mapeia os recursos premium e o que eles ensinam ao Delfos.

---

## Features premium / enterprise

| Feature | Descrição | Leitura para o Delfos |
|---|---|---|
| RBAC granular | Permissões por papel e, em data planes, por geografia | Converge com `adr-0017` |
| Data planes regionais | Execução isolada por região; credenciais e logs ficam locais | Inspira isolamento físico de tenant |
| Data residency / compliance | Conformidade GDPR/HIPAA via processamento local | Converge com LGPD do Delfos |
| Logging imutável | Streams append-only de logs auditáveis | Converge com `adr-0018` |
| Lineage de transformações | Rastreio de cada transformação aplicada ao dado | Inspira lineage de definições no Delfos |
| Suporte e SLAs | Suporte gerenciado e garantias | Comercial, não técnico |
| Enterprise Flex / sovereign cloud | Deploy flexível com soberania de dados | Inspira modelo de deployment isolado (`adr-0009`) |

---

## Recursos que geram percepção de valor

- **Connector Builder no-code:** o usuário cria sua própria fonte sem depender de roadmap
  do fornecedor — autonomia percebida como valor.
- **Catálogo de 600+ conectores:** valor de "já está pronto".
- **Connection timeline:** histórico completo e auditável dá confiança operacional.
- **Sync incremental + CDC:** mover só o que mudou é percebido como eficiência e economia.
- **Terraform provider / API-first:** "infraestrutura como código" é valor para times
  maduros.

---

## Recursos de IA

- **Destinos vetoriais** (Pinecone, Milvus, Weaviate) com chunking, embeddings e
  indexação integrados ao pipeline.
- **Suporte a múltiplos modelos de embedding** (OpenAI, Cohere e outros).
- **PyAirbyte** para consumir conectores em aplicações Python de IA/LLM.
- Posicionamento "AI-ready data": entregar dados prontos para RAG.

Para o Delfos, o paralelo é a direção de **texto analítico assistido por LLM** (`adr-0025`)
— mas note: o Airbyte *prepara dados para IA*; não é um copilot analítico.

---

## Colaboração

- Workspaces e organizations agrupam recursos e pessoas.
- RBAC define quem pode ver/editar/operar.
- Configuração como código (Terraform/API) permite revisão e versionamento em git —
  uma forma de colaboração assíncrona via PR.

Airbyte **não tem** colaboração analítica (comentários, anotações em dashboards) — porque
não é BI. Esse é um espaço onde o Delfos deve buscar outras referências.

---

## Observability

- **Métricas Prometheus embutidas**, exportáveis para o stack de observabilidade.
- Alertas para falhas de sync e latência crescente.
- Logs imutáveis por job, armazenados na região que executou.
- Connection status agregando saúde de pipeline.

Este é um dos blocos mais aproveitáveis: o `runtime` futuro do Delfos se beneficia de
métricas e alertas de execução desde o desenho.

---

## Analytics copilots

Airbyte **não possui** copilot analítico. Não há geração de insight, narrativa ou
recomendação de visualização. O que existe de "assistência" é a geração de conectores
(builder) e a preparação de dados para sistemas de IA externos.

---

## Explainability

Não há explainability analítica. O análogo operacional é o **lineage** (de onde o dado
veio, que transformações sofreu) e os **logs estruturados** de cada job — explicabilidade
de *pipeline*, não de *métrica*.

---

## Smart alerts

Alertas centralizados disparam retries ou escalam incidentes; alertas de falha de sync e
de latência. São alertas **operacionais e baseados em regra**, não anomalias detectadas
por ML. Úteis como base para alertas de execução no Delfos.

---

## Template systems

O **YAML low-code** funciona como sistema de templates de conector: boilerplate
declarativo reutilizável e parametrizável. O `spec` do conector é um template de formulário.
Lição: definições declarativas reaproveitáveis reduzem custo marginal de cada nova fonte.

---

## Sharing systems

Compartilhamento via RBAC dentro de workspaces/organizations e via configuração como
código (Terraform/API exportável). Não há "share de dashboard por link público" — não é BI.

---

## Realtime

Airbyte é **batch / agendado**, não realtime. CDC reduz a latência (captura mudanças do
log do banco), mas o modelo é micro-batch agendado, não streaming contínuo. Importante:
para o Delfos não criar expectativa de realtime onde o Airbyte não entrega.

---

## Síntese para o Delfos

O valor premium do Airbyte concentra-se em **governança, isolamento, observabilidade e
autonomia de extensão** — não em recursos analíticos. As features diretamente inspiradoras
são: RBAC granular, logging imutável, lineage, métricas/alertas de execução e o modelo
declarativo de templates de conector.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- [./anti-patterns.md](./anti-patterns.md)
- [../../adr/adr-0017-roles-and-permissions-model.md](../../adr/adr-0017-roles-and-permissions-model.md)
- [../../adr/adr-0018-secure-audit-strategy.md](../../adr/adr-0018-secure-audit-strategy.md)
- [../../adr/adr-0025-llm-assisted-analytics-text-generation.md](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
