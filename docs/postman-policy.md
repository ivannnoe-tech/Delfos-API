# Política de Uso do Postman — Delfos Analytics

> Status: documento normativo de governança.
> Escopo: uso do Postman (app, MCP ou plugin) por humanos e agentes de IA no
> desenvolvimento e validação do `delfos-api`.
> Fonte de regras de ferramentas: `docs/agent-tooling-policy.md`.

O Postman é uma ferramenta **permitida** para desenvolvimento e validação de
API no Delfos, **desde que** respeite as restrições deste documento. Ele é uma
ferramenta de **apoio** — nunca a fonte canônica de contrato de API.

---

## 1. Propósito

O Postman apoia o trabalho no `delfos-api` ao permitir:

- validar endpoints em ambiente local/dev;
- testar a comunicação com a API;
- manter collections de desenvolvimento;
- gerar exemplos de requests/responses;
- rodar smoke tests manuais;
- apoiar a documentação de API;
- validar headers administrativos e de tenant (`x-delfos-admin-key`,
  `x-delfos-tenant-id`, `x-delfos-actor-id`, `x-delfos-actor-role`) em dev.

---

## 2. Usos permitidos

- Chamadas a endpoints **locais/dev** (`http://localhost:3000` ou equivalente).
- Collections de desenvolvimento versionadas **sem segredos**.
- Exemplos de request/response para apoiar `docs/api-contracts.md` e o Swagger.
- Smoke tests manuais de healthcheck e de catálogos foundation declarativos.
- Conferência de envelopes de erro (`requestId`/`correlationId`).
- Validação de comportamento de roles/headers temporários em dev.

---

## 3. Usos proibidos

- Usar produção sem **aprovação humana explícita**.
- Salvar `x-delfos-admin-key` real, API key, bearer token, refresh token,
  `ENCRYPTION_KEY_BASE64` ou qualquer secret em arquivo versionado.
- Publicar collection/environment/workspace com dados sensíveis.
- Alterar contrato público de API sem ADR/tarefa explícita e validação humana.
- Usar dados reais de cliente em collections.
- Usar o Postman para **contornar gates** de runtime, dispatch ou conectores
  reais — execução real continua **proibida** (ADR-0021, ADR-0022 `Proposed`).
- Armazenar connection strings ou credenciais reais em qualquer artefato Postman.
- Tratar uma collection como contrato canônico — o contrato vive no código e no
  Swagger/OpenAPI (ver §8).

---

## 4. Placeholders obrigatórios

Valores sensíveis e específicos de ambiente **nunca** são literais. Usar
variáveis de environment com placeholder:

- `{{API_URL}}` — URL base da API (ex.: `http://localhost:3000`).
- `{{DELFOS_ADMIN_KEY}}` — admin-key temporária; **valor real só no environment
  local não versionado**.
- `{{DELFOS_TENANT_ID}}` — tenant de teste.
- `{{DELFOS_ACTOR_ID}}` — ator de teste.
- `{{DELFOS_ACTOR_ROLE}}` — papel de teste (`owner`/`admin`/`operator`/`viewer`).

Collections versionadas referenciam **apenas** os placeholders. O preenchimento
real fica em um environment local, fora do controle de versão.

---

## 5. Ambientes permitidos

- **local/dev** — padrão. Toda atividade Postman ocorre aqui por default.
- **homologação** — permitida com dados fictícios e sem secrets reais
  versionados.
- **produção** — **proibida sem aprovação humana explícita**. É stop condition
  (ver §10).

---

## 6. Regras para collections

- Versionar **somente** collections de desenvolvimento, sem segredos e sem dados
  reais de cliente.
- Toda request usa placeholders (§4); nenhum valor sensível literal.
- Organizar por módulo foundation (`health`, `tenants`, `users`, `connections`,
  `credentials`, `datasets`, `field-mappings`, `query-definitions`,
  `dashboard-definitions`, `report-definitions`, `runtime`, `execution-preview`).
- Exemplos de response **sanitizados**: sem secret, `secretValue`, token,
  connection string, payload bruto ou PII real.
- Não incluir requests que dependam de execução real de conector — ela é
  proibida na fase atual.

---

## 7. Regras para environments

- O environment com valores reais (admin-key local, IDs de teste) **não é
  versionado** — entra no `.gitignore` ou fica fora do repositório.
- Exportar environment só com placeholders vazios ou valores fictícios.
- Nunca exportar/compartilhar environment contendo `{{DELFOS_ADMIN_KEY}}`
  preenchida com valor real.
- Secrets de environment seguem `docs/agent-tooling-policy.md` §5 (dados que não
  entram em ferramentas externas).

---

## 8. Relação com Swagger/OpenAPI

- A **fonte canônica de contrato** é o código do `delfos-api` e o Swagger em
  `/docs` (`SWAGGER_ENABLED`), descrito em `docs/api-contracts.md`.
- O Postman **consome e valida** esse contrato; não o define.
- Se uma collection divergir do Swagger/docs/ADRs, a collection está
  desatualizada — corrigir a collection, **nunca** o contrato pela collection.
- Divergência entre API real, Swagger/docs e ADRs é stop condition (§10).

---

## 9. Relação com a camada agent-ready

Esta política integra a governança de ferramentas e complementa:

- `docs/agent-tooling-policy.md` — política geral de skills/MCPs/plugins;
- `docs/agent-safety-rules.md` — regras de segurança operacional;
- `docs/agent-stop-conditions.md` — quando parar e pedir validação humana;
- `docs/agent-validation-checklist.md` — validações por tipo de mudança.

Em caso de divergência, prevalecem as fontes canônicas conforme a ordem de
autoridade de `docs/agent-operating-model.md` §2.

---

## 10. Stop conditions

O agente **para e pede validação humana** se precisar:

- usar **produção**;
- usar um **secret real**;
- salvar ou exportar um **environment com segredo**;
- **publicar** collection/workspace;
- **alterar contrato público** de API;
- testar com **dados reais de cliente**;
- chamar endpoint de **execução real / conector real**;
- detectar **divergência** entre API real, Swagger/docs e ADRs.

Nesses casos, registrar o ponto como **"precisa validação humana"** no relatório
final e não contornar o bloqueio.

---

## 11. Checklist antes de exportar ou versionar uma collection

- [ ] Nenhuma `x-delfos-admin-key` real, token, API key ou secret no arquivo.
- [ ] Todos os valores sensíveis usam placeholders (`{{...}}`).
- [ ] Environment com valores reais **não** está sendo versionado.
- [ ] Nenhum dado real de cliente nas requests ou nos exemplos de response.
- [ ] Exemplos de response sanitizados (sem `secretValue`, connection string,
      payload bruto, PII).
- [ ] Apenas endpoints local/dev; nenhuma URL de produção embutida.
- [ ] Nenhuma request de execução real de conector/dispatch.
- [ ] Collection coerente com Swagger/OpenAPI e `docs/api-contracts.md`.
- [ ] Sem publicação de workspace/collection com dado sensível.
