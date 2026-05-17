# Agent Safety Rules — Delfos Analytics

> Status: documento agent-ready, normativo para agentes de IA, copilotos, CLIs e
> automações de desenvolvimento.
> Escopo: regras de segurança que um agente deve **sempre** seguir ao trabalhar
> no `delfos-api` e no `delfos-web`.

Este documento concentra, de forma operacional e agent-ready, as regras de
segurança do projeto. Ele **não duplica** o conteúdo das ADRs: cada tópico
aponta a ADR que é dona da regra. Em caso de divergência, vale a ADR citada.

O estado atual do projeto é **foundation only** (ADR-0024): foundation
administrativa/declarativa, sem conectores reais, sem execução real e sem
descriptografia de credenciais.

---

## 1. Secrets e credenciais

- Secrets (tokens, senhas, chaves privadas, connection strings) **nunca** podem
  ser hardcoded em código, fixtures, prompts ou documentação.
- Secrets **nunca** podem aparecer em logs, respostas de API ou registros de
  auditoria.
- O segredo de credenciais é protegido em repouso por AES-256-GCM, com **chave
  única por ambiente** (`ENCRYPTION_KEY_BASE64`) — ver **ADR-0019**. Essa chave
  é um secret de ambiente, **nunca** versionada. Chave por tenant, envelope
  encryption por tenant e KMS/Vault são evolução futura: o agente **não pode**
  alterar a estratégia de criptografia nem implementar chave por tenant sem ADR
  futura aprovada.
- A classificação canônica de campos sensíveis e o tratamento de cada categoria
  são definidos em **ADR-0020**.
- Regra prática: se há dúvida se um valor é segredo, trate-o como segredo.

## 2. credentialRef

- `credentialRef` segue o formato `cred_<ObjectId>` e é uma **referência**,
  **NUNCA** o segredo em si — ver **ADR-0019**.
- O agente nunca deve usar `credentialRef` como se fosse o valor sensível, nem
  tentar resolvê-lo em segredo.
- A separação `credentialRef` ≠ secret é invariante em todos os fluxos: API,
  logs, auditoria, eventos e futura bridge (ADR-0019).

## 3. connectionId

- `connectionId` é uma **referência de configuração** — **NUNCA** uma connection
  string nem um segredo (ADR-0019).
- Nenhum fluxo deve tratar `connectionId` como portador de credencial ou de host
  sensível.

## 4. safeMetadata

- `safeMetadata` é o **único** metadata seguro para logs, respostas de API e
  auditoria.
- Deve ser construído por **allowlist** (allowlist-over-blocklist): copiar
  apenas os campos explicitamente seguros, em vez de remover uma blocklist —
  ver **ADR-0020**.
- Campos seguros típicos: contadores, duração, `capability`, `mode`,
  `sourceType`, limites aplicados, flags booleanas e códigos de
  warning/blocker (ADR-0020).

## 5. Forbidden fields

A **ADR-0020** classifica os campos sensíveis em **3 categorias**. Resumo
operacional (a lista canônica completa está na ADR-0020):

- **(a) Secrets proibidos** — descartados na ingestão; nunca armazenados,
  logados ou retornados (ex.: `token`, `password`, `secret`, `apiKey`,
  `connectionString`).
- **(b) PII / identificadores** — não descartados, mas **mascarados** conforme
  a política de masking (ex.: `cpf`, `cnpj`, `email`, `cardNumber`).
- **(c) safeMetadata** — único conjunto permitido para persistir, retornar e
  logar livremente.

Para a lista canônica e exata de cada categoria, consultar **ADR-0020**.

## 6. Masking

- Dados pessoais e financeiros (categoria b da ADR-0020) devem ser **mascarados**
  em previews, amostras, telas, respostas de API, logs e auditoria — ver
  **ADR-0023**.
- Masking é aplicado na **borda de exibição/saída** e **não** substitui o
  controle de acesso por tenant e por role (ADR-0023).
- Masking (dados pessoais) é diferente de descarte (segredos): segredos são
  descartados (ADR-0020), PII é mascarada (ADR-0023). As políticas são
  complementares.

## 7. Tenant boundary

- `tenantId` é uma **fronteira obrigatória de isolamento multi-tenant**, nunca
  um filtro opcional.
- Toda leitura, mutação, evento de auditoria e futuro dispatch deve operar
  escopado por `tenantId`.
- Reaproveitamento cross-tenant de dados, conexão, fila ou canal é proibido.

## 8. Admin-key

- A autenticação atual é **temporária**, via header `x-delfos-admin-key`
  validado contra `DELFOS_ADMIN_KEY` — ver **ADR-0016**.
- A admin-key **não é auth de produção**: é segredo único compartilhado, sem
  identidade por usuário, sem sessão e sem expiração (ADR-0016).
- O agente nunca deve logar a chave nem tratá-la como auth final.
- Os headers `x-delfos-tenant-id`, `x-delfos-actor-id` e `x-delfos-actor-role`
  carregam **contexto**, são confiáveis por convenção e **não autorizam**.

## 9. Roles

- Quatro papéis canônicos: **owner**, **admin**, **operator**, **viewer** — ver
  **ADR-0017**. `acesso público` não é papel: é o nível de endpoints
  explicitamente públicos e documentados (ex.: `health`/`status`).
- O modelo segue **menor privilégio por padrão**: o que não está explicitamente
  liberado é negado.
- Toda operação de **mutação** exige *role gating* explícito; leitura é ampla a
  partir de `viewer` (ADR-0017).
- Operações sensíveis de credenciais permanecem restritas a `admin`/`owner`.
- A **matriz oficial de papel → operações** é canônica na **ADR-0017**. Resumo:
  `owner` = controle total do tenant; `admin` = administra recursos do tenant
  sem ownership/ações globais; `operator` = opera recursos e dry-run/demo, sem
  tocar usuários/papéis/chaves/secrets; `viewer` = leitura segura sanitizada.
- O agente **não inventa permissão**. Operação que não se encaixa claramente na
  matriz é **stop condition** (ver `docs/agent-stop-conditions.md`). Atualizar a
  matriz só é permitido para nova operação dentro da fase atual e sem segurança
  sensível; caso contrário, parar e pedir validação humana.

## 10. Ações destrutivas

- Ações destrutivas (remover arquivos, `git reset --hard`, `drop database`,
  `deleteMany({})`, etc.) exigem **autorização humana explícita**.
- O agente deve preferir comandos de leitura, explicar o impacto e listar antes
  de remover — ver `docs/destructive-commands-policy.md`.

## 11. Execução real bloqueada

- A execução real de conectores e de query é **proibida** na fase atual — ver
  **ADR-0024**.
- Apenas planejamento documentável é permitido. Documentos conceituais/futuros
  **não autorizam** implementação real.

## 12. Dispatch real bloqueado

- O dispatch real de comandos para o `delfos-connectors` é **proibido** até que
  a ADR de transporte seja aprovada — ver **ADR-0022**, ainda em status
  `Proposed`.
- O dispatch atual é apenas uma fronteira conceitual documentada, não um
  caminho de código.

## 13. Descriptografia de credencial bloqueada

- A descriptografia de credenciais em qualquer fluxo de execução/bridge é
  **proibida** até que uma ADR final seja aprovada — ver **ADR-0021**, ainda em
  status `Proposed`.
- Nenhum componente pode transformar `credentialRef` em segredo real em runtime.

## 14. Web nunca recebe secret

- O `delfos-web` **NUNCA** pode receber, exibir ou resolver um segredo real.
- Esta é uma fronteira **inegociável** (hard boundary) — ver **ADR-0021**.
- O segredo real nunca aparece em respostas de API, logs, auditoria ou timeline.

## 15. LLM / analytics_text_generation

A capability assistiva `analytics_text_generation` é **planejada e não implementada**; a
integração real com qualquer provider de LLM **não é autorizada** — ver **ADR-0025**.

- Um LLM externo só pode receber dados **agregados, sanitizados, mascarados e minimizados** — o
  mínimo necessário para a narrativa.
- O LLM **nunca** pode receber secrets, credenciais, connection strings, `credentialRef`,
  raw payloads de fontes de cliente, dados de outro tenant, nem PII/valores financeiros sem
  masking/anonimização prévia — classificação canônica em **ADR-0020**, masking em **ADR-0023**.
- O LLM **não** acessa banco, **não** executa SQL, **não** aciona conectores e **não** decide nem
  executa nada de forma automática; é estritamente assistivo.
- Toda saída gerada por IA deve ser **marcada como AI-assisted / gerada por IA** e exige revisão
  humana; nunca é usada como decisão automática.
- Provider e modelo são **configuráveis por ambiente** (modelo inicial `gpt-4o-mini`), nunca
  hardcoded; a capability fica **desligada por padrão** (`LLM_ANALYTICS_ENABLED=false`).
- A eventual chave de API do provider é um secret futuro tratado conforme **ADR-0020** (e
  ADR-0019); nunca hardcoded, nunca em log, nunca em doc.
- O agente pode **propor** uso da capability, mas **não pode** implementar integração real,
  adicionar SDK de LLM ou criar secrets — ver **ADR-0025**.

## 16. Retenção de logs e auditoria

- A **política de retenção inicial** (prazos por tipo de log) é canônica na
  **ADR-0018**. Os números exatos não são repetidos aqui — consulte a ADR-0018.
- Raw payloads, secrets, request/response bodies completos, connection strings
  e credenciais reais **nunca** são persistidos — em nenhum prazo.
- `safeMetadata` é o **padrão obrigatório** para logs, auditoria e eventos.
- O agente **não altera** os prazos de retenção nem define retenção divergente.
  Mudança de política de retenção é **stop condition** e exige validação humana
  (e validação jurídica antes de produção regulada) — ver
  `docs/agent-stop-conditions.md`.

## 17. Postman e ferramentas de teste de API

- O Postman (MCP/plugin) é **permitido** para validar e testar a API em
  **local/dev** — política canônica em `docs/postman-policy.md`.
- Produção exige **aprovação humana explícita**; é stop condition.
- **Nunca** versionar admin key real, API key, bearer/refresh token,
  `ENCRYPTION_KEY_BASE64` ou qualquer secret em collection ou environment.
  Usar placeholders (`{{DELFOS_ADMIN_KEY}}`, `{{DELFOS_TENANT_ID}}`,
  `{{DELFOS_ACTOR_ID}}`, `{{DELFOS_ACTOR_ROLE}}`, `{{API_URL}}`).
- Não publicar collection/environment/workspace com dados sensíveis; não usar
  dados reais de cliente.
- O contrato de API canônico vive no código e no Swagger/OpenAPI — uma
  collection **não** é fonte de contrato e não autoriza alterar contrato
  público.
- O Postman **não** pode ser usado para contornar gates de runtime, dispatch ou
  conectores reais — execução real continua proibida (ADR-0021/ADR-0022).

---

## Nota final

Documentos conceituais, de visão futura ou de planejamento (conectores, bridge,
dispatch, cache, JWT, execução real) descrevem **planejamento** e **NÃO
autorizam** implementação real. Qualquer avanço exige fase explícita e ADR
aprovada quando necessário. Em dúvida, escolher sempre o **caminho mais
restritivo em segurança** e parar para validação humana (ver
`docs/agent-stop-conditions.md`).
