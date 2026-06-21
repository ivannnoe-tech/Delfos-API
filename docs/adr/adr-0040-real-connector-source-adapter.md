# ADR-0040 — Adapter real de fonte (1º incremento: REST read-only `test_connection`)

- **Status**: Accepted
- **Data**: 2026-06-21
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-connectors (impacto primário); delfos-api (broker/transporte já existentes)
- **Fase impactada**: Fase 2
- **Implementação**: não iniciada

---

> **Aceita por decisão humana explícita do owner em 2026-06-21** (escopo mínimo +
> threat model ratificados). Esta ADR é o **artefato exigido** (CLAUDE.md: real
> connectors/SQL/API do cliente exigem autorização explícita **e** ADR). A
> aceitação ratifica **somente** `rest_api` + `test_connection` read-only, atrás
> de flag. SQL, leitura de dados, export e outras fontes ficam para
> ADRs/incrementos posteriores. Cada incremento de código ainda exige go-ahead
> específico + TDD.

## Contexto

Todo o caminho de dispatch existe e está testado, sem execução real: broker de
segredo (ADR-0037), transporte HTTP+mTLS no `delfos-api` (ADR-0038, gated OFF) e
o **receiver** no `delfos-connectors` (ADR-0039) que delega ao
`FakeConnectorAdapter` (`not_supported`). Falta o último elo: um **adapter que
realmente toca a fonte do cliente**. Esse é o maior risco do roadmap
(egress de rede, uso real do segredo, dados do cliente) e está atrás do gate da
ADR-0024 + CLAUDE.md.

## Decisão

Introduzir, no `delfos-connectors`, um **adapter real de fonte** que substitui o
`FakeConnectorAdapter` **apenas** para um escopo mínimo e auditado, quando (e
somente quando) esta ADR for `Accepted` e o incremento for liberado:

1. **Escopo do 1º incremento:** UMA `sourceType` = **`rest_api`** (HTTP/HTTPS) +
   UMA capability = **`test_connection`** (read-only). O adapter, dado o segredo
   resolvido (ADR-0037) + a config da conexão (base URL, authType), faz **uma
   única** requisição HTTPS de verificação (HEAD/GET a um caminho de saúde
   configurado) e retorna **só** sucesso/falha como `ConnectorExecutionResult`.
   **Nenhum dado do cliente é lido, transformado, retornado ou persistido.**
2. **Fora deste incremento:** SQL/bancos (drivers + injeção), capabilities de
   leitura de dados (`preview_dataset`, `execute_query_preview`,
   `generate_report_preview`, `refresh_dashboard_data`), `export_report`,
   escrita, e outras `sourceType` — cada um exige ADR/incremento próprio.
3. **Gating:** o adapter real fica atrás de flag explícita (off por default),
   espelhando `CONNECTOR_DISPATCH_ENABLED`. Default = `FakeConnectorAdapter`.

## Threat model (controles obrigatórios)

| Ameaça | Controle |
|---|---|
| **SSRF** (base URL vem de config do cliente) | só `https`; **bloquear** IPs privados/loopback/link-local/metadata (RFC1918, 127/8, 169.254/16, ::1, fc00::/7); allowlist de porta; **sem seguir redirects** p/ hosts não permitidos |
| **Uso do segredo** | só em memória, just-in-time, só nesta requisição; nunca logado/persistido/retornado (ADR-0037/0019) |
| **Egress descontrolado** | timeout explícito curto; sem retry amplificador; cap de tamanho de resposta; sem armazenar corpo |
| **Exfiltração de dados** | `test_connection` retorna só status + `safeMetadata` seguro; **nenhum payload do cliente** sai do connectors |
| **Cross-tenant** | conexão/credencial resolvidas por `tenantId`; sem reuso cross-tenant |
| **Vazamento em erro** | erros sanitizados (`sanitizeError`): sem segredo, sem corpo cru, sem detalhe interno/stack |

## Alternativas consideradas

- **Começar por SQL/banco** — rejeitado p/ o 1º incremento: driver como dep +
  superfície de injeção; candidato de ADR posterior.
- **Começar por capability de leitura de dados** — rejeitado: egress de dados do
  cliente; `test_connection` é o menor blast radius (só conectividade).
- **Proxy de egress gerenciado / allowlist central** — recomendado como evolução
  quando houver mais fontes/volume.
- **Local agent on-premise** (ADR-0012) — fora de escopo agora.

## Consequências

### Positivas
- Fecha o e2e real com o **menor** passo possível (só conectividade), validando
  broker + transporte + receiver + adapter ponta a ponta sem ler dados.

### Negativas / trade-offs aceitos
- Introduz **egress de rede real** a partir do `delfos-connectors` e **uso real
  do segredo**. Mitigação: §Threat model + flag + escopo mínimo + ADRs por
  expansão.

### Neutras
- Não altera contratos atuais; o receiver (ADR-0039) já delega ao adapter.

## Escopo atual
- Registrar a escolha (adapter real `rest_api`/`test_connection`, gated, com
  threat model), como `Proposed`, para ratificação humana.

## Fora de escopo
- **Qualquer implementação** até aceitação.
- SQL/bancos, leitura de dados, export, escrita, outras `sourceType`.
- Fila/worker; cache; scheduler; local agent.

## Impacto futuro / Fase 2
- Quando `Accepted` por um humano, libera o **menor incremento** do adapter real:
  `rest_api` + `test_connection`, atrás de flag, com TDD e os controles acima.
  Expansão (SQL, leitura de dados, export) exige ADR/incremento posterior.

## Relação com outros documentos
- **ADR-0039** — receiver que delega a este adapter.
- **ADR-0038** — transporte do dispatch (mTLS).
- **ADR-0037** — broker do segredo usado aqui pela primeira vez de verdade.
- **ADR-0008** — execução de connectors e integração.
- **ADR-0012** — local agent / on-premise (fora de escopo).
- **ADR-0024** — modelo de fases e gate humano.
- **CLAUDE.md** — gate de real connectors/SQL/API: exige autorização explícita + ADR.
