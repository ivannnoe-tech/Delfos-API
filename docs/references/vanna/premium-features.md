# Vanna AI — Features Premium e Enterprise

> Tipo: referência estratégica · Produto estudado: Vanna AI · Status: conceitual/futuro — não autoriza implementação

---

## Contexto

Como projeto open-source, Vanna não tem um tier "premium" pago no sentido SaaS clássico — mas a versão 2.0 concentra um conjunto de capacidades **enterprise-grade** que, num produto comercial, seriam exatamente o que diferencia o plano avançado. Esta seção lê essas capacidades como referência de **percepção de valor**.

---

## Features enterprise

| Feature | Descrição | Valor percebido |
|---|---|---|
| Row-Level Security | Queries filtradas automaticamente por permissão de usuário | Confiança / compliance |
| Group-based access control | Acesso a tools por grupo de usuários | Governança de capacidades |
| Audit logs | Toda query registrada por usuário | Auditoria / rastreabilidade |
| Quota / rate limiting | Limites via lifecycle hooks | Controle de custo de LLM |
| Conversation Storage | Histórico de conversas persistido | Continuidade / contexto |
| Observability | Tracing e métricas embutidos | Operação em produção |
| Workspace context | Isolamento lógico por workspace | Multiusuário seguro |

---

## Recursos que geram percepção de valor

O maior gerador de valor do Vanna é a **precisão que melhora com o uso**: cada par pergunta→SQL validado torna o sistema mais confiável, o que cria a sensação de uma ferramenta que "aprende o negócio do cliente". Outros vetores de valor:

- **Resposta multimodal** — tabela + gráfico + resumo em texto, sem esforço extra.
- **SQL transparente e editável** — o usuário técnico mantém controle.
- **Setup rápido** — funciona com poucas linhas, valor demonstrável cedo.
- **Independência de fornecedor** — trocar LLM/banco/vector store é configuração.

---

## Recursos IA

A IA aplicada é o núcleo do valor. Destaques que merecem ênfase:

- **Agentic retrieval** — o agente decide *quando* e *o que* recuperar, em vez de despejar o schema inteiro no prompt. Reduz custo e alucinação.
- **LLM Middlewares** — caching de respostas LLM, prompt engineering centralizado, cost tracking.
- **Context Enrichers** — injeção dinâmica de contexto adicional no prompt (ex.: glossário de negócio relevante à pergunta).
- **Lifecycle Hooks** — content filtering e quota no ciclo do request.
- **LLM-agnóstico** — suporte explícito a modelos agênticos modernos (Claude 4.5, GPT-5).
- **Auto-training** — perguntas bem respondidas realimentam o vector store.

---

## Analytics copilots

Vanna 2.0 é, na prática, um **framework para construir copilots de analytics**. O padrão de copilot que ele materializa:

1. Usuário descreve a intenção em linguagem natural.
2. O copilot recupera contexto relevante (schema + docs + exemplos).
3. Gera o artefato (SQL), executa e apresenta resultado interpretado.
4. Aceita correção e aprende com ela.

Esse loop "intenção → artefato → execução → interpretação → aprendizado" é o desenho de copilot mais transferível para o Delfos — onde o artefato seria uma `query-definition` sugerida, **não** SQL executado diretamente.

---

## Explainability

Explainability é um ponto naturalmente forte do RAG e merece destaque:

- **Proveniência do contexto** — como a resposta é montada a partir de fragmentos recuperados, é possível mostrar **quais** DDLs, documentos e exemplos sustentaram a sugestão.
- **SQL exposto** — o artefato gerado é sempre visível, nunca caixa-preta; o usuário audita a lógica.
- **Resumo em linguagem natural** — o 2.0 explica o resultado em prosa, tornando-o legível para não técnicos.
- **Audit logs** — registram a cadeia pergunta → SQL → execução por usuário.

Para o Delfos, explainability é um diferencial premium claro: qualquer sugestão de IA deve vir acompanhada de "por que isto foi sugerido" — alinhado ao espírito do ADR-0025.

---

## Smart alerts

Vanna **não tem** sistema de alertas inteligentes nativo — não há scheduler nem detecção de anomalia embutida. É uma lacuna. Num produto BI, smart alerts (ex.: "receita caiu 20% vs. semana anterior") são percepção de valor alta. O Delfos pode tratar isso como oportunidade futura, não como algo a copiar do Vanna.

---

## Template systems

Os **pares pergunta→SQL treinados** funcionam como um sistema de templates implícito: perguntas recorrentes recuperam caminhos conhecidos e validados. Não há, porém, uma galeria de templates curada e versionada — é um repositório plano no vector store. O conceito de "consulta validada reutilizável" é aproveitável; a falta de curadoria estruturada é a limitação.

---

## Sharing systems

O compartilhamento no Vanna é leve: o web component embutido na app do host herda a autenticação e o escopo do host. Não há links compartilháveis, snapshots ou publicação de resultados nativos. Conversation Storage permite continuidade, mas não colaboração rica.

---

## Colaboração

A colaboração é **assíncrona e indireta**: quando um usuário valida um par pergunta→SQL, todos se beneficiam da recuperação melhorada. É um modelo de "conhecimento coletivo acumulado", não de coautoria em tempo real. Não há comentários, menções ou edição simultânea.

---

## Observability

Vanna 2.0 traz observability de primeira classe: tracing de requests, métricas, audit logs. Combinado com LLM middlewares de cost tracking, dá visibilidade operacional sobre **latência, custo de LLM e uso por usuário** — essencial para operar IA em produção sem surpresas de fatura.

---

## Realtime

O "realtime" do Vanna é o **streaming da resposta** (tabela/gráfico/resumo aparecendo progressivamente), não dados em tempo real. Não há subscriptions nem push de dados atualizados. É realtime de *experiência*, não de *dado*.

---

## Síntese — o que inspira o Delfos

- **Explainability como feature premium**: toda sugestão de IA com proveniência visível.
- **Cost tracking / observability de LLM** antes de qualquer uso de IA em produção.
- **Loop de copilot** gerando `query-definitions` sugeridas e auditáveis.
- **Conhecimento coletivo**: validações de usuários melhoram o sistema para todos.

---

## Relacionado

- [overview.md](./overview.md)
- [architecture.md](./architecture.md)
- [ux-patterns.md](./ux-patterns.md)
- [ideas-for-delfos.md](./ideas-for-delfos.md)
- [anti-patterns.md](./anti-patterns.md)
- [ADR-0025 — LLM-assisted analytics text generation](../../adr/adr-0025-llm-assisted-analytics-text-generation.md)
- [ADR-0017 — Roles and permissions model](../../adr/adr-0017-roles-and-permissions-model.md)
- [ADR-0018 — Secure audit strategy](../../adr/adr-0018-secure-audit-strategy.md)
- [Índice da biblioteca de referências](../README.md)
