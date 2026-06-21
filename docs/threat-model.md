# Threat Model — delfos-api

Resumo de ameaças, fronteiras de confiança e controles esperados.

## Ativos protegidos

- Usuários e permissões.
- Dados de tenants.
- Configurações e metadados do Delfos.
- De/Para de campos de clientes.
- Credenciais e tokens de integrações.
- Logs e auditoria.

## Fronteiras de confiança

```text
Usuário/Navegador -> delfos-web -> delfos-api -> PostgreSQL do Delfos -> APIs dos clientes
```

Na Fase 1, o Delfos não acessa diretamente o banco do cliente.

## Ameaças e controles

| Ameaça | Controle esperado |
|---|---|
| Usuário se passar por outro | autenticação robusta — **no estado atual** é o header temporário `x-delfos-admin-key` (ADR-0016); autenticação real com tokens seguros (JWT) é de Fase 2 (ADR-0006) |
| Alteração indevida de tenant/payload | DTOs, autorização e tenant server-side |
| Ação sensível sem rastreio | auditoria |
| Vazamento de secret/dado pessoal | logs sanitizados e minimização |
| Abuso de endpoints | rate limit, paginação e limites de payload |
| Elevação de privilégio | menor privilégio e revisão de permissões |

## Controles obrigatórios

- `tenantId` nunca deve ser confiado livremente ao frontend.
- Todo endpoint protegido deve validar autenticação e permissão.
- Erros não podem expor stack trace ao usuário.
- Secrets nunca devem ser logados.
- Operações sensíveis devem gerar auditoria.

## Runtime / connectors futuros

Esta seção registra ameaças e controles adicionais aplicáveis quando o `delfos-connectors` evoluir para serviço/runtime real. No estado atual, esses riscos não se materializam porque não existe execução real, conector real, worker, fila, cache, scheduler ou local agent. A foundation documental e os contratos conceituais já vivem no repositório `delfos-connectors` (ver ADR-0013).

### Ameaças futuras

| Ameaça | Risco |
|---|---|
| Vazamento de secret em payload, log, timeline ou resultado | exposição de credencial real |
| Stack trace bruto, `error.toString()` ou erro original cru retornado | exposição de SQL/host/header sensível |
| Execução cross-tenant (comando, consulta, cache, fila ou evento) | mistura de dados entre tenants |
| Cache/fila sem `tenantId` na chave/envelope | reaproveitamento indevido entre tenants |
| Conexão externa compartilhada sem isolamento por tenant/source | vazamento entre tenants |
| SQL/header/URL/body livre vindo do usuário final | injection, SSRF, exfiltração |
| Retorno de `rawPayload`/`rawResponse` ao web/API | exposição de dado operacional bruto |
| Falta de `timeoutMs`, `maxRows`, `previewLimit` | DoS, varredura indevida, custo descontrolado |

### Controles esperados

- `tenantId` obrigatório como boundary em todo comando, resultado, evento, log, cache e fila.
- `credentialRef` é referência opaca, nunca o segredo.
- `connectionId` é referência de configuração, nunca connection string.
- Logs metadata-only; sem rows, segredo, payload externo completo, header sensível ou stack trace.
- Erro sanitizado com `code`, `safeMessage`, `category`, `retryable`, `tenantId`, `executionRequestId`, `correlationId` e `safeMetadata`.
- Runtime envelope seguro (`ConnectorExecutionCommand`/`Result`/`Error`) — modelos conceituais em `delfos-connectors/docs/runtime-contracts.md`.
- Limites obrigatórios: `timeoutMs`, `maxRows`, `previewLimit`, masking, paginação.
- Isolamento mínimo de fonte: `tenantId + connectionId + sourceType + capability` (+ `schemaMappingVersion` quando aplicável).
- Contratos detalhados e proibições em `delfos-connectors/docs/security-boundaries.md` e ADR-0013.

Nenhum desses controles existe como código nesta fase. São contratos para a fase futura de skeleton e implementação.

---

## Fase 2 — execução real (threat model — revisado/concluído 2026-06-21)

> **Revisado e concluído por decisão humana do owner em 2026-06-21** — critério de
> gate da ADR-0024 atendido. Concreto à arquitetura aceita:
> [ADR-0037](adr/adr-0037-credential-decryption-via-delfos-api-broker.md)
> (`delfos-api` credential broker, `Accepted`) e
> [ADR-0038](adr/adr-0038-connector-dispatch-transport-sync-http.md) (HTTP
> síncrono + mTLS, `Accepted`). Os itens residuais abaixo viram **tarefas de
> implementação** — cada incremento de código exige TDD e go-ahead específico; o
> 1º incremento liberado é command-prep + validation, sem descriptografia,
> dispatch ou chamada externa real.

### Nova fronteira de confiança (Fase 2)

```text
Usuário/Navegador -> delfos-web -> delfos-api (broker: descriptografa just-in-time)
        -- mTLS/HTTP, segredo só neste dispatch -->  delfos-connectors -> fonte do cliente
```

Diferença-chave vs. Fase 1: o `delfos-api` passa a **resolver segredo real** (em
memória, transiente) e a **acessar a fonte do cliente indiretamente** via
`delfos-connectors`. Surge um novo canal de confiança `delfos-api ⇄ delfos-connectors`.

### Novos ativos

- **Segredo descriptografado** (transiente, em memória, curtíssima duração).
- **Canal de dispatch** `delfos-api ⇄ delfos-connectors` (mTLS).
- **Material de autenticação mútua** (certificados/tokens de curta duração).

### Ameaças (STRIDE) e controles — concretos à decisão

| Categoria | Ameaça | Controle (ADR) |
|---|---|---|
| **Spoofing** | connector/API falso no canal de dispatch | autenticação mútua + TLS (ADR-0038) |
| **Tampering** | adulteração do comando em trânsito | TLS + auth no canal; idempotência (ADR-0038) |
| **Repudiation** | dispatch sem rastreio | `correlationId`/`requestId` propagados + auditoria (ADR-0038) |
| **Info disclosure** | segredo em log/auditoria/resposta/web | nunca serializado/logado; invariante de redação (ADR-0037/0019) |
| **Info disclosure** | segredo no envelope persistido | segredo só trafega no dispatch mTLS; envelope carrega `credentialRef` (ADR-0037/0038) |
| **Info disclosure** | vazamento do segredo em memória | lifetime mínimo, zeragem pós-uso, sem cache (ADR-0037) |
| **DoS** | jobs longos em HTTP síncrono (conexões presas) | timeout por dispatch; jobs longos **fora** deste transporte → ADR de fila futura (ADR-0038) |
| **DoS** | tempestade de retries | backoff limitado + jitter; circuit breaking (ADR-0038) |
| **Replay** | re-execução de dispatch | idempotência `tenantId + executionRequestId` + TTL curto do segredo (ADR-0037/0038) |
| **Elevation / cross-tenant** | reuso de segredo/conexão entre tenants | isolamento por `tenantId`; sem reuso cross-tenant de canal/conexão (ADR-0038) |
| **Key compromise** | chave de criptografia comprometida | rotação no store; broker sem cache de chave (ADR-0019/0037) |

### Riscos residuais / itens abertos (a fechar na revisão humana)

- **Gestão de certificados mTLS** (emissão, rotação, revogação) — não definida.
- **Hardening do segredo em memória** (swap, dumps, GC) — exige padrão de
  manuseio explícito no 1º incremento.
- **Gatilho de migração a worker/KMS-Vault** — quando volume/risco justificarem
  (ADR-0037 §Alternativas).
- **Observabilidade sem vazamento** — métricas/traces do dispatch sem expor
  segredo ou payload do cliente.

### Pré-condições para declarar o threat model "concluído" (gate)

1. Revisão humana desta seção + dos itens residuais acima.
2. ADR-0037 e ADR-0038 `Accepted` (decisão humana, ADR-0024).
3. Definição da gestão de mTLS e do padrão de manuseio de segredo em memória.

Enquanto isso não ocorrer, **nenhum** código de broker, dispatch ou adapter real
é autorizado.
