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
Usuário/Navegador -> delfos-web -> delfos-api -> MongoDB do Delfos -> APIs dos clientes
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
