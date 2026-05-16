# Agent Validation Checklist — Delfos Analytics

> Visão operacional, pronta para agentes, das validações que um agente (IA, CLI ou automação)
> deve executar **antes de reportar uma tarefa como concluída**.
>
> A **fonte canônica da Definition of Done (DoD)** é [`docs/quality-checklist.md`](./quality-checklist.md).
> Este documento **não duplica** o checklist canônico: ele o reorganiza por **tipo de mudança**
> para uso direto pelo agente. Em caso de divergência, prevalece `docs/quality-checklist.md`.

## Como usar

1. Identifique os **tipos de mudança** da tarefa (uma tarefa pode cruzar vários).
2. Execute o checklist de cada tipo aplicável.
3. Execute os checklists transversais (Segurança, Testes, Build/lint, Links, Changelog).
4. Monte o **Relatório final** conforme a última seção.
5. Diante de stop conditions, **pare e peça validação humana** — ver
   [`AGENTS.md` §9](../AGENTS.md) e [`docs/agent-stop-conditions.md`](./agent-stop-conditions.md).

---

## Documentação

- [ ] Links relativos válidos (sem link quebrado, sem âncora inexistente).
- [ ] Sem contradição factual com ADRs, `AGENTS.md` e demais docs canônicos.
- [ ] Índice / `AGENTS.md` / README atualizados quando um doc foi criado, movido ou renomeado.
- [ ] Regra de tamanho de arquivo respeitada — `quality-checklist.md` §0.1
      (alvo ≤300; 301–450 avaliar split; 451–600 com justificativa; >600 validação humana).
- [ ] Sem secret, token, credencial, connection string ou payload real de cliente no texto.

## API (delfos-api)

- [ ] `npm run format:check` passa.
- [ ] `npm run lint` passa.
- [ ] `npm test` passa.
- [ ] `npm run build` passa.
- [ ] DTOs validam toda entrada (tipos, obrigatoriedade, limites).
- [ ] `tenantId` validado em todo recurso tenant-scoped (boundary, não filtro opcional).
- [ ] Permissões validadas no backend.
- [ ] Secrets fora de logs; logs estruturados e sanitizados.
- [ ] Sem execução real de conector (proibida na fase atual).
- [ ] Contratos públicos (rotas, DTOs, payloads, status, headers) revisados; alteração ⇒ §9.

## Web (delfos-web)

- [ ] `flutter analyze` passa.
- [ ] `flutter test` passa.
- [ ] `flutter build web --release` passa.
- [ ] Usa o Design System (componentes e tokens).
- [ ] Trata os **5 estados de UI**: loading, empty, error, permission, success.
- [ ] Funciona em tema claro e escuro.
- [ ] Sem cor hardcoded fora dos tokens.
- [ ] Baseline Visual v0.1 seguido — shell, grid e Design System conforme
      `delfos-web/docs/layout-base-reference.md`; sem tela freestyle.
- [ ] Gráficos usam `ChartRenderer`.

## Connectors (delfos-connectors)

- [ ] `npm run format:check` passa.
- [ ] `npm run lint` passa.
- [ ] `npm test` (Vitest) passa.
- [ ] `npm run build` passa.
- [ ] **Nenhum conector, worker, fila, scheduler, dispatch ou cache real** introduzido.
- [ ] Apenas skeleton/foundation: contratos, sanitização, validação, fake adapter determinístico.
- [ ] Nenhum secret, token ou credencial em log; nenhuma descriptografia real de credenciais.
- [ ] Ver [`delfos-connectors/AGENTS.md`](../../delfos-connectors/AGENTS.md) para limites do repo.

---

## Segurança (transversal)

> Detalhes canônicos: [`docs/agent-safety-rules.md`](./agent-safety-rules.md) e
> [ADR-0013](../../delfos-connectors/docs/adr/ADR-0013-connectors-boundary-and-multitenant-runtime-contract.md).

- [ ] Secrets não aparecem em código, logs, timeline, erros ou resultados.
- [ ] `credentialRef` tratado como referência segura — nunca o segredo.
- [ ] `connectionId` tratado como referência de configuração — nunca connection string.
- [ ] `safeMetadata` usado em logs/eventos; logs preferencialmente metadata-only.
- [ ] Forbidden fields ausentes de payloads, logs e erros (`password`, `token`, `accessToken`,
      `refreshToken`, `secret`, `clientSecret`, `privateKey`, apiKey bruta, headers sensíveis,
      cookies, stack trace bruto, dados de outro tenant — ver ADR-0013).
- [ ] Masking aplicado a dados sensíveis quando exibidos.
- [ ] Tenant boundary respeitado: sem fallback sem `tenantId`, sem cross-tenant implícito.

## LLM / analytics_text_generation (transversal)

> Aplicável a tarefas que mencionem a capability assistiva `analytics_text_generation` — ver
> ADR-0025 e `docs/agent-safety-rules.md` §15.

- [ ] Nenhuma integração real com LLM/OpenAI foi implementada.
- [ ] Nenhum secret, chave de API ou SDK de LLM foi adicionado.
- [ ] Dados destinados a um LLM são apenas agregados/sanitizados/mascarados/minimizados.
- [ ] Saída gerada por IA está marcada como AI-assisted / gerada por IA.
- [ ] Variáveis `LLM_ANALYTICS_*` tratadas como futuras/conceituais, sem valores reais.

## Postman / validação de API (transversal)

> Aplicável a tarefas que usem o Postman (MCP/plugin) — ver `docs/postman-policy.md`.

- [ ] Atividade Postman restrita a local/dev (produção exige aprovação humana).
- [ ] Nenhum secret real (admin key, API key, bearer/refresh token) em collection
      ou environment versionado; placeholders `{{...}}` usados.
- [ ] Environment com valores reais **não** versionado.
- [ ] Nenhum dado real de cliente em requests ou exemplos de response.
- [ ] Exemplos de response sanitizados (sem `secretValue`, connection string, PII).
- [ ] Nenhuma collection/environment/workspace sensível publicado.
- [ ] Collection coerente com Swagger/OpenAPI e `docs/api-contracts.md`; contrato
      público não alterado a partir de collection.
- [ ] Nenhuma request de execução real de conector/dispatch.

## Testes (transversal)

- [ ] Testes adicionados/atualizados para a mudança.
- [ ] Casos de erro cobertos.
- [ ] Permissões testadas quando aplicável.
- [ ] Estados visuais testados quando aplicável (web).

## UI (transversal)

- [ ] 5 estados de UI tratados (loading, empty, error, permission, success).
- [ ] Responsividade verificada.
- [ ] Acessibilidade básica (foco, contraste, rótulos).
- [ ] Feedback visual em ações (carregando, sucesso, erro).

## Build / lint / analyze (transversal)

- [ ] **delfos-api**: `npm run format:check`, `npm run lint`, `npm test`, `npm run build`.
- [ ] **delfos-web**: `flutter analyze`, `flutter test`, `flutter build web --release`.
- [ ] **delfos-connectors**: `npm run format:check`, `npm run lint`, `npm test`, `npm run build`.

## Links / referências (transversal)

- [ ] Nenhum link relativo quebrado.
- [ ] Nenhuma referência a arquivo, ADR ou seção inexistente.
- [ ] Caminhos cross-repo conferidos (`delfos-api/...`, `delfos-web/...`, `delfos-connectors/...`).

> Validação de links é **manual** hoje. CI de lint de Markdown / verificação
> automática de links é uma **melhoria de qualidade futura, não bloqueante** —
> ver `docs/roadmap.md`.

## Changelog / roadmap / ADR (transversal)

- [ ] `CHANGELOG` atualizado quando a entrega é relevante.
- [ ] Roadmap atualizado se o status de uma fase mudou.
- [ ] ADR criado quando a decisão é arquitetural.
- [ ] Promover ADR `Proposed → Accepted` ⇒ **parar e pedir validação humana** (§9; ADR-0021/0022).

---

## Relatório final

Toda tarefa deve terminar com um relatório contendo, no mínimo:

- **Arquivos alterados/criados** — lista completa com caminhos.
- **Validações executadas** — comandos rodados por repositório e resultado.
- **Arquivos >450 linhas** — listados e justificados (regra §0.1); >600 só com validação humana.
- **Pendências** — itens marcados como **"precisa validação humana"**, sem decisão autônoma.
- **Escopo** — confirmação de que nenhuma implementação real fora de escopo foi introduzida.

> Lembrete: este documento é a visão agent-ready; a DoD canônica e a regra de tamanho de
> arquivo vivem em [`docs/quality-checklist.md`](./quality-checklist.md).
