# WrenAI — Anti-padrões e Decisões a Evitar

> Tipo: referência estratégica · Produto estudado: WrenAI · Status: conceitual/futuro — não autoriza implementação

---

Esta seção registra o que **não** queremos reproduzir do WrenAI no Delfos. Não é
crítica ao produto — é triagem do que não se encaixa na realidade do Delfos
(multi-tenant, fase *foundation* declarativa, equipe enxuta).

---

## Problemas observados

| Problema | Evidência | Risco para o Delfos |
|---|---|---|
| Operação self-hosted frágil | *Issues* de falha de *startup* do `wren-ai-service`, "failed to create asking task" | Adotar arquitetura multi-serviço pesada cedo demais |
| Dependência de imagens externas | Falha de instalação por 401 do Docker Hub ao puxar `qdrant` | Acoplar deploy a registries de terceiros |
| Banco vetorial com limitações | Qdrant sem NFS/S3, *backup*/DR limitado em deploy distribuído | Introduzir infra de estado difícil de operar |
| Modelos locais instáveis | *Issues* de Ollama "not working" em self-host | Prometer flexibilidade de LLM sem validação |

## UX ruim

- **Caixa-preta quando a IA erra**: sem a camada semântica bem curada, o text-to-SQL
  gera queries inconsistentes — a UX conversacional pode mascarar respostas erradas
  com aparência de confiança. O Delfos deve sempre expor proveniência.
- **Dependência de prompt único**: a *prompt box* como entrada quase exclusiva pode
  frustrar usuários que querem controle estruturado. Delfos deve manter *builders*
  declarativos explícitos ao lado de qualquer assistência futura.
- **Estados de erro de tarefa expostos crus**: mensagens como "failed to create
  asking task" vazam vocabulário interno. Delfos exige `DelfosErrorState` com
  mensagem PT-BR clara.

## Complexidade excessiva

- **Três serviços + banco vetorial + provedor de LLM** para entregar BI. Para o
  Delfos em fase *foundation*, isso é complexidade prematura — `delfos-api`
  declarativo deve permanecer enxuto.
- **Camada de skills para agentes de codificação** acoplada ao produto: mistura
  *tooling* de desenvolvimento com runtime do produto. Manter separado.
- **Múltiplos SDKs e bindings** (Python, WASM, LangChain, Pydantic): superfície de
  manutenção grande. Delfos não deve multiplicar SDKs sem demanda real.

## Gargalos

- **Latência e custo do LLM** em cada pergunta — mitigado por *caching* de dashboard,
  mas o caminho quente depende do provedor externo.
- **Banco vetorial como ponto de estado** crítico para *retrieval*; sua indisponibilidade
  degrada a assistência.
- **Qualidade dependente da curadoria MDL**: sem investimento contínuo na camada
  semântica, a precisão cai — é um gargalo *humano*, não só técnico.

## Problemas arquiteturais

- **Multi-tenancy não nativa**: o isolamento no WrenAI tende a ocorrer por
  instância/deployment. Para o Delfos isso é **inaceitável** — `tenantId` é fronteira
  obrigatória em toda query (`adr-0009`). Nenhuma ideia importada pode enfraquecer
  esse invariante.
- **Acoplamento a um ecossistema de LLM**: o produto assume LLM no caminho crítico.
  O Delfos deve tratar IA como camada **opcional, isolável e auditável** (`adr-0025`),
  nunca como dependência obrigatória de funcionalidade básica.
- **Estado distribuído cedo demais**: introduzir banco vetorial, *retrieval* e cache
  antes de ter foundation sólida inverte a ordem de maturação. `adr-0007` veta
  cache/fila/worker na fase atual — manter assim.

## Decisões que NÃO queremos reproduzir

1. **Execução real acoplada ao produto agora.** Delfos é declarativo; conexões reais,
   reescrita e execução de SQL são futuras e *gated* (`adr-0008`, `adr-0024`). Não
   antecipar.
2. **Banco vetorial / fila / worker nesta fase.** Vetado por `adr-0007`. Ideias de
   *retrieval* (ver `ideas-for-delfos.md` #11) ficam explicitamente como futuro.
3. **IA no caminho crítico de funcionalidade básica.** Qualquer assistência de IA é
   complemento opcional, com proveniência e auditoria — nunca pré-requisito para
   criar uma definição.
4. **Entrada quase exclusiva por linguagem natural.** Manter *builders* declarativos
   explícitos; a assistência por linguagem natural, se vier, é adicional.
5. **Mensagens de erro com vocabulário interno.** Erros sempre PT-BR, claros, com
   *hint* acionável (ver `ideas-for-delfos.md` #12) — sem vazar nomes de *task*.
6. **Deploy dependente de registries/imagens de terceiros sem mitigação.** O Delfos
   deve controlar suas dependências de deploy.
7. **Camada semântica sem versionamento e governança.** Se o Delfos adotar uma
   camada semântica (`ideas-for-delfos.md` #1), ela nasce versionada, auditável e
   tenant-scoped — não como configuração solta.
8. **Multi-serviço pesado antes da hora.** Manter `delfos-api` como backend
   declarativo enxuto; só fragmentar quando houver justificativa real (`adr-0008`).

---

## Princípio-resumo

WrenAI é excelente referência **conceitual** de semantic layer, explainability e
IA aplicada a analytics. O Delfos deve **importar os conceitos** (camada semântica,
proveniência, validação, governança fina) e **rejeitar a antecipação de
infraestrutura** (multi-serviço, banco vetorial, execução real, IA obrigatória) até
que cada peça tenha ADR e autorização. Conceito sim; arquitetura prematura não.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [premium-features.md](./premium-features.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- ADRs: [adr-0007](../../adr/adr-0007-no-cache-redis-phase-1.md) ·
  [adr-0008](../../adr/adr-0008-connectors-and-integration-execution.md) ·
  [adr-0009](../../adr/adr-0009-deployment-isolation-and-tenant-model.md) ·
  [adr-0024](../../adr/adr-0024-phase-1-and-phase-2-definition.md) ·
  [adr-0025](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [Índice da biblioteca de referências](../README.md)
