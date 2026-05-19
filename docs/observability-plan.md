# Plano de Observabilidade — Delfos Analytics

> **Status: planejamento / foundation. Sem stack de observabilidade
> implementada.**
> Este documento é um plano. Ele **não autoriza** instalar OpenTelemetry,
> Prometheus, Grafana, Loki, Alertmanager, Sentry ou qualquer agente. A
> implementação exige escopo explícito por fase.

---

## 1. Objetivo

Dar visibilidade operacional ao Delfos sem antecipar complexidade:

- **logs estruturados** com correlação;
- **métricas** de saúde e desempenho;
- **tracing** distribuído (quando houver runtime/connectors);
- **alertas** acionáveis;
- **dashboards operacionais**;
- **health / readiness / liveness**;
- **incident response** com runbooks e postmortem.

## 2. Estado atual

- `GET /health` existe e responde `status`, `timestamp`, `uptimeSeconds`.
- Request context com `x-request-id` e `x-correlation-id` já existe
  (`request-context.interceptor`); a API gera valores quando omitidos e os
  devolve nos headers.
- O envelope de erro já inclui `requestId` e `correlationId`
  (`docs/foundation-auth-and-errors.md`).
- CI roda lint/test/build; E2E em jobs separados/opcionais.
- **Não existe**: observabilidade dedicada — sem coletor de métricas, sem
  tracing distribuído, sem dashboards, sem alertas, sem readiness/liveness
  separados de `health`.

## 3. Áreas cobertas

- **delfos-api** — foco inicial; logs, métricas, health.
- **delfos-web** — erros de cliente, métricas de carregamento (sem PII).
- **delfos-connectors** — futuro; só quando o serviço executável existir
  (gated por ADR-0013/0021/0022).
- **jobs / workers** — futuro; só quando fila/worker existir (gated por
  ADR-0033 e ADR de promoção própria).

## 4. Ferramentas candidatas

Lista de candidatos para avaliação futura — **nenhuma escolhida ou instalada**:

- **OpenTelemetry** — instrumentação padrão de logs/métricas/traces.
- **Prometheus** — coleta e armazenamento de métricas.
- **Grafana** — dashboards operacionais.
- **Loki** — agregação de logs.
- **Alertmanager** — roteamento de alertas.
- **Sentry** (ou alternativa) — captura de erros/exceções.
- **Discord webhook / Sentinela interno** — canal leve de notificação para
  ambientes pequenos, alternativa de baixo custo ao Alertmanager.

A escolha da stack é decisão de fase futura; preferir o menor conjunto que
resolva a dor real (alinhado a ADR-0002 — sem componente pago/restritivo sem
aprovação — e ao princípio de simplicidade sustentável do `AGENTS.md`).

## 5. Fases

> Cada fase exige escopo explícito. Nenhuma fase é autorizada por este plano.

### Fase A — Logs estruturados e correlação
- Padronizar log estruturado (JSON), com `requestId`/`correlationId` em toda
  linha relevante.
- Garantir redaction (sem token/secret/payload sensível).
- Saída: logs consistentes e correlacionáveis.

### Fase B — Métricas básicas da API
- Expor métricas da API (ver §6).
- Endpoint de métricas e/ou readiness/liveness separados de `health`.
- Saída: métricas coletáveis.

### Fase C — Dashboards operacionais
- Dashboards de saúde, latência, erro e tráfego.
- Saída: visão operacional em um painel.

### Fase D — Alertas
- Alertas mínimos (ver §7) com canal de notificação definido.
- Saída: alertas acionáveis com runbook associado.

### Fase E — Tracing distribuído
- Tracing fim-a-fim — **só quando houver runtime/connectors reais** (gated por
  ADR-0021/0022). Antes disso, tracing é desnecessário.
- Saída: traces entre `delfos-api` e `delfos-connectors`.

### Fase F — Runbooks e postmortem
- Runbooks por alerta; processo de postmortem sem culpa.
- Saída: resposta a incidentes documentada.

## 6. Métricas mínimas

- **uptime / disponibilidade** da API;
- **latency** por rota (p50/p95/p99);
- **HTTP status** por faixa (2xx/4xx/5xx);
- **error rate**;
- **conectividade do banco** — MongoDB hoje; PostgreSQL e Valkey quando
  existirem (ADR-0035);
- **execution requests** foundation — contagem por status/kind;
- **runtime / connectors** — só quando existirem (futuro/gated).

## 7. Alertas mínimos

- **API down** / health falhando;
- **erro 5xx elevado** acima de limiar;
- **latência elevada** acima de limiar;
- **falha de seed/dev/E2E**, quando aplicável ao pipeline;
- **fila / worker** com atraso ou falha — futuro;
- **falha de connector** — futuro/gated.

## 8. Segurança

Observabilidade **nunca** deve registrar:

- token (de auth, de cliente, de provider);
- credencial ou material de credencial;
- connection string real;
- payload operacional sensível de cliente;
- secrets de qualquer natureza.

Logs, métricas e traces seguem ADR-0020 (sanitização) e a política de logs do
`docs/architecture.md` §12. Qualquer label/atributo de métrica/trace é revisado
para não carregar dado sensível ou identificador de PII.

## 9. Relação com LGPD

- Minimizar coleta: só o necessário para diagnóstico operacional.
- Sem PII em logs/métricas/traces; e-mail e identificadores pessoais mascarados
  ou ausentes.
- Retenção limitada de logs/traces; política de retenção alinhada a
  `docs/security-lgpd.md` e ADR-0018.
- Dado de observabilidade não é fonte de verdade nem substitui auditoria.

## 10. Runbook inicial

Mínimo para a Fase A/D (esboço, a detalhar quando implementado):

- **API down** — checar processo/deploy, logs recentes, conectividade de banco;
  escalar conforme severidade.
- **5xx elevado** — identificar rota/erro por `correlationId`, checar deploy
  recente, considerar rollback.
- **Latência elevada** — checar banco, payloads grandes, recurso do host.
- **Falha de pipeline (seed/E2E)** — usar `ci-fix-review`; não mascarar.

## 11. Fora de escopo

- Implementar qualquer fase deste plano.
- Instalar OpenTelemetry, Prometheus, Grafana, Loki, Alertmanager ou Sentry.
- Exigir uma stack de observabilidade completa agora.
- Tracing de runtime/connectors antes da Fase 2 (gated por ADR-0021/0022).

## 12. Definition of Done

Cada fase só é concluída quando:
- `lint`, `test`, `build` verdes;
- nenhum token/secret/PII em log, métrica, trace ou dashboard;
- redaction verificada;
- runbook associado a cada alerta entregue;
- documentação atualizada (este plano + `architecture.md` §12);
- DoD canônica de `docs/quality-checklist.md` respeitada.

## Relação com outros documentos

- `docs/architecture.md` §12 — observabilidade conceitual vigente.
- `docs/foundation-auth-and-errors.md` — `requestId`/`correlationId` e health.
- ADR-0018 (auditoria), ADR-0020 (sanitização), ADR-0002 (sem componente pago),
  ADR-0031 (CI/CD), ADR-0033 (sem fila/worker), ADR-0035 (PostgreSQL/Valkey).
- `docs/security-lgpd.md`, `docs/operations-runbook.md`, `docs/backup-restore.md`.
- `docs/team-work-split.md` — Dev 4 é dono da observabilidade.
- `docs/roadmap.md` — posição no roadmap.
