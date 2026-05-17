# ADR-0025 — LLM-assisted analytics text generation

- **Status**: Accepted
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: ambas
- **Implementação**: planejamento apenas

---

## Contexto

O Delfos Analytics é uma plataforma BI/admin white-label premium. Relatórios,
dashboards e KPIs ganham muito valor quando acompanhados de **narrativa textual**:
resumo executivo, explicação de variações, comparação entre períodos e leitura
guiada de gráficos. Hoje esse texto seria escrito manualmente.

Um modelo de linguagem (LLM) leve pode montar essas narrativas a partir de dados
**já agregados** pela plataforma. Isso é uma capacidade **assistiva** — apoia a
pessoa que monta o relatório — e não um motor de execução.

O estado atual do projeto é **foundation only**: não há execução real de query,
conector real, dispatch nem integração externa de runtime. Era necessário
registrar formalmente a decisão de **permitir essa capacidade no plano do
produto**, com limites de segurança e privacidade explícitos, **sem** autorizar
integração real agora.

## Decisão

O Delfos terá uma **capability assistiva** de geração textual analítica chamada
`analytics_text_generation`.

- Ela usa um **LLM** para montar texto analítico a partir de dados agregados,
  sanitizados e mascarados fornecidos pela própria plataforma.
- O **modelo inicial recomendado** é `gpt-4o-mini` (provider OpenAI) — modelo
  rápido e econômico para tarefas focadas de geração textual/estruturada.
- Provider e modelo são **configuráveis por ambiente**, nunca hardcoded.
- A capability é **assistiva**: produz texto para revisão humana; **não executa,
  não decide e não altera** nada sozinha.
- Esta ADR é `Accepted` **para documentação e planejamento da Fase 1**. A
  integração real **não está implementada** e **não é autorizada** por esta ADR.

### Modelo inicial

- **provider**: OpenAI
- **model**: `gpt-4o-mini`
- **motivo**: rápido e econômico para geração textual/estruturada de escopo
  limitado; adequado ao volume inicial sem custo desproporcional.
- O modelo pode ser trocado por ADR futura ou por configuração de ambiente, sem
  alterar o contrato da capability.

### Por que configurar por ambiente

- Permite trocar provider/modelo sem alterar código.
- Permite manter a capability **desligada por padrão** (`LLM_ANALYTICS_ENABLED=false`).
- Evita acoplamento a um provider específico e mantém a porta aberta para
  modelos alternativos.
- Mantém a chave de API do provider **fora do código e da documentação** —
  quando existir, é um secret tratado conforme ADR-0019 e ADR-0020.

### Variáveis de ambiente (futuras / conceituais)

Documentadas como **futuras/conceituais**; não existem no código atual e **não
devem** receber secrets reais agora:

- `LLM_ANALYTICS_ENABLED=false`
- `LLM_ANALYTICS_PROVIDER=openai`
- `LLM_ANALYTICS_MODEL=gpt-4o-mini`
- `LLM_ANALYTICS_MAX_INPUT_TOKENS`
- `LLM_ANALYTICS_MAX_OUTPUT_TOKENS`
- `LLM_ANALYTICS_TIMEOUT_MS`

A eventual chave de API do provider é um **secret** e segue ADR-0019/ADR-0020 —
nunca hardcoded, nunca em log, nunca em doc.

### Usos permitidos

A capability `analytics_text_generation` pode apoiar:

- geração de narrativas de relatórios;
- explicação textual de dashboards;
- comparação entre períodos;
- resumo executivo de KPIs;
- análise textual de variações;
- sugestões de leitura de gráficos;
- geração de comentários automáticos para widgets;
- apoio à criação de relatórios gerenciais.

### Usos proibidos

A capability **não pode**:

- acessar banco de dados diretamente;
- executar SQL;
- acionar conectores;
- alterar dashboards, relatórios ou configurações sozinha;
- tomar decisão operacional automática;
- disparar execução real de qualquer tipo.

### Dados permitidos

O LLM externo só pode receber dados **agregados, sanitizados, mascarados e
minimizados** — o mínimo necessário para a narrativa: totais, contadores,
variações percentuais, séries agregadas, rótulos de período, nomes de KPI.

### Dados proibidos

O LLM externo **nunca** pode receber:

- secrets, tokens, credenciais reais, connection strings;
- `credentialRef` ou `connectionId` como conteúdo sensível;
- raw payloads de fontes de cliente;
- dados de outro tenant;
- PII e valores financeiros detalhados **sem** masking/anonimização prévia.

### Segurança e masking

- PII e identificadores seguem a política de masking da **ADR-0023**; campos
  proibidos seguem a classificação da **ADR-0020**.
- Dados com PII precisam de **masking ou anonimização antes do envio** ao LLM.
- Apenas `safeMetadata` e dados agregados sanitizados podem compor o prompt.
- A fronteira de tenant (`tenantId`) é obrigatória: nenhum dado cruza tenants.
- O resultado gerado por IA deve ser **marcado como AI-assisted / gerado por
  IA**, para revisão humana.
- A saída deve preferir **formato estruturado** quando consumida pelo sistema.

### Auditoria

- Devem ser auditáveis de forma segura: prompt template usado, modelo, versão da
  política, `correlationId`/`requestId` e `tenantId`.
- A auditoria é **metadata-only** (ADR-0018): **não** grava payload sensível,
  dados de cliente nem o conteúdo bruto enviado/recebido.

### Limites de custo/token

- `LLM_ANALYTICS_MAX_INPUT_TOKENS`, `LLM_ANALYTICS_MAX_OUTPUT_TOKENS` e
  `LLM_ANALYTICS_TIMEOUT_MS` limitam custo e latência por chamada.
- A capability fica **desligada por padrão** (`LLM_ANALYTICS_ENABLED=false`).
- `gpt-4o-mini` é escolhido justamente por ser econômico para o escopo previsto.

### Relação com reports, dashboards, runtime e connectors

- **Reports / dashboards**: a capability apoia a montagem da narrativa de
  `report-definitions` e `dashboard-definitions`; não substitui a definição
  declarativa nem renderiza dados reais.
- **Runtime**: `analytics_text_generation` é assistiva e **não** é uma capability
  de execução de connector; não dispara `execution-requests` reais.
- **Connectors**: o LLM **nunca** aciona conectores nem recebe dado bruto de
  fonte de cliente; recebe apenas dados já agregados pela plataforma.

## Alternativas consideradas

- **Não usar LLM e manter narrativa 100% manual** — rejeitada: perde valor de
  produto; a narrativa assistida é um diferencial premium claro.
- **Modelo grande (ex.: topo de linha) desde o início** — rejeitada: custo e
  latência desproporcionais para geração textual de escopo limitado;
  `gpt-4o-mini` atende o caso inicial.
- **Modelo self-hosted / open-source local** — não escolhido agora: adiciona
  custo operacional de infraestrutura (GPU, serving) sem ganho no volume
  inicial. Continua candidato para ADR futura, graças à configuração por
  ambiente.
- **Provider hardcoded no código** — rejeitada: gera lock-in e impede desligar
  ou trocar o modelo sem deploy.
- **Permitir o LLM consultar banco/conectores** — rejeitada de forma absoluta:
  violaria as fronteiras de segurança (ADR-0020, ADR-0021) e transformaria uma
  capability assistiva em motor de execução não auditado.

## Consequências

### Positivas

- Habilita narrativa analítica como diferencial de produto premium.
- Mantém o LLM **fora** do caminho de execução: sem acesso a banco, SQL ou
  conectores.
- Configuração por ambiente permite desligar, trocar modelo e controlar custo.
- Limites de token/timeout e modelo econômico contêm o custo.
- Privacidade preservada: só dados agregados/sanitizados/mascarados saem.

### Negativas / trade-offs aceitos

- Dependência futura de um provider externo (OpenAI) para a capability ligada;
  mitigada pela configuração por ambiente e pela opção de modelo alternativo.
- Saída de LLM pode conter imprecisão; por isso é **AI-assisted** e exige
  revisão humana, nunca decisão automática.
- Enviar dados a um provider externo exige disciplina de masking/minimização e
  revisão de privacidade antes de qualquer integração real.

### Neutras

- Esta ADR não altera contratos, schemas, DTOs nem código.
- A capability nasce **desligada**; nenhum comportamento atual muda.

## Escopo atual

- Registrar a decisão de ter a capability `analytics_text_generation`.
- Documentar `gpt-4o-mini` como modelo inicial configurável por ambiente.
- Documentar usos permitidos/proibidos, dados permitidos/proibidos, segurança,
  masking, auditoria e limites de custo/token.
- Documentar as variáveis de ambiente como futuras/conceituais.

## Fora de escopo

Esta ADR **não autoriza nem implementa**:

- integração real com OpenAI ou qualquer provider de LLM;
- adição de SDK/biblioteca de LLM;
- criação de secrets reais ou chaves de API;
- execução automática, dispatch real ou acesso a dados reais de cliente;
- envio real de qualquer dado a um LLM externo;
- alteração de contratos de API, schemas ou código.

## Impacto na Fase 1

- Apenas documentação e planejamento. Nenhum código é criado ou alterado.
- A capability fica registrada como assistiva, **desligada por padrão**.
- As variáveis ficam documentadas como futuras/conceituais em
  `docs/env-reference.md`, sem valores reais.

## Impacto futuro / Fase 2

- A integração real exige **tarefa própria**, com testes, **revisão de
  segurança** e **validação de privacidade** (masking/anonimização, minimização
  de dados, fronteira de tenant).
- A implementação futura deverá definir: o cliente HTTP do provider, o
  tratamento da chave de API como secret, os prompt templates versionados, o
  formato estruturado de saída e a marcação AI-assisted.
- A troca de modelo (`gpt-4o-mini` → outro) será possível por configuração ou
  ADR futura, sem alterar o contrato da capability.

## Relação com outros documentos

- **ADR-0018** — auditoria segura; o uso da capability é auditado metadata-only.
- **ADR-0019** — criptografia de credenciais; a chave de API do provider é um
  secret tratado sob essa política.
- **ADR-0020** — sanitização e forbidden fields; define o que nunca entra no
  prompt.
- **ADR-0023** — política de masking; PII/financeiro são mascarados antes do
  envio ao LLM.
- **ADR-0011** — dashboard builder e widget model; a narrativa apoia, não
  substitui, as definições declarativas.
- **ADR-0024** — definição de fases; integração real pertence à Fase 2.
- `docs/security-lgpd.md` — base regulatória de privacidade.
- `docs/env-reference.md` — variáveis `LLM_ANALYTICS_*` documentadas como
  futuras/conceituais.
- `docs/agent-safety-rules.md`, `docs/agent-stop-conditions.md` — limites para
  agentes ao propor/usar esta capability.
