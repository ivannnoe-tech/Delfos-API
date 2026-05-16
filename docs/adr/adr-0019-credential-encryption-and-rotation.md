# ADR-0019 — Criptografia e rotação de credenciais

- **Status**: Accepted
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: ambas

---

## Contexto

O Delfos Analytics é uma plataforma white-label premium de BI/admin que precisa
registrar credenciais das fontes de dados dos clientes (APIs custom, bancos,
serviços REST). O estado atual do projeto é **foundation only**: não existem
conectores reais, execução real de query nem descriptografia de credenciais em
nenhum fluxo de runtime/bridge.

Mesmo nessa fase, o módulo de `credentials` já persiste o segredo de cada
credencial de conexão. É necessário registrar de forma explícita como esse
segredo é protegido em repouso, o que é exposto nas respostas da API e quais
riscos da abordagem atual são aceitos conscientemente.

A foundation já estabeleceu, em [`docs/foundation-credentials-and-security.md`](../foundation-credentials-and-security.md):

- `secretValue` (texto plano) só é aceito em `POST /api/v1/credentials` e em
  `PATCH /api/v1/credentials/:id/rotate`;
- nenhuma resposta de `GET`/listagem retorna `secretValue`, valor protegido,
  token, senha ou connection string real;
- `credentialRef` segue o formato `cred_<ObjectId>` e é a única referência
  exposta;
- o valor é protegido com AES-256-GCM local usando a chave `ENCRYPTION_KEY_BASE64`;
- a proteção fica isolada em service próprio, para troca futura por Vault/KMS
  sem alterar o contrato público;
- auditoria registra apenas `tenantId`, `entityId`, `type`, `status`,
  `provider` e `connectionId`, nunca o segredo real.

Esta ADR consolida essa decisão e delimita o que fica para o futuro.

## Decisão

O Delfos mantém, na foundation, **envelope encryption AES-256-GCM** para o
segredo de credenciais de conexão, usando uma única chave fornecida por
ambiente via `ENCRYPTION_KEY_BASE64`.

São regras invariantes desta decisão:

- o `secretValue` em texto plano só trafega na entrada de `POST` e `rotate` e
  **nunca** é retornado em qualquer `GET`, listagem ou resposta de mutação;
- o `credentialRef` (formato `cred_<ObjectId>`) é o único identificador
  exposto — ele é uma **referência**, NUNCA o segredo;
- `connectionId` é uma referência de configuração e **NUNCA** é uma connection
  string ou segredo;
- a separação entre `credentialRef`/segredo é obrigatória e invariante em todos
  os fluxos (API, logs, auditoria, eventos, futura bridge);
- a lógica de proteção permanece isolada em service próprio, para permitir
  troca de mecanismo sem alterar o contrato público.

A escolha de **chave única por ambiente na Fase 1** é uma **decisão fechada**
(confirmada por decisão humana em 2026-05-15): chave por tenant, envelope
encryption por tenant e KMS/Vault permanecem **evolução futura** e dependem de
ADR própria aprovada. Nenhum agente pode alterar a estratégia de criptografia
nem implementar chave por tenant sem essa ADR futura.

Rotação real de chave de criptografia e integração com KMS/Vault **não** são
implementadas por esta ADR e ficam adiadas para uma ADR futura própria.

## Alternativas consideradas

- **KMS/Vault gerenciado já na foundation** — descartado nesta fase. Adiciona
  dependência operacional, custo e configuração de ambiente antes de existir
  qualquer execução real que justifique o segredo. A foundation só precisa
  proteger o valor em repouso; o service isolado mantém a porta aberta para
  essa migração futura.
- **Chave de criptografia por tenant** — descartado nesta fase. Reduz o escopo
  de comprometimento de uma chave, mas exige gestão de ciclo de vida de N
  chaves, derivação e migração — complexidade não justificada antes da
  execução real. Fica registrado como candidato para a ADR futura de rotação.
- **Não criptografar e proteger só por controle de acesso ao MongoDB** —
  descartado. Viola o princípio de defesa em profundidade; um dump de banco
  exporia todos os segredos em texto plano.
- **Hashing do segredo (one-way)** — inviável. O segredo precisa ser
  recuperável para, no futuro, conectar à fonte do cliente; hash impede o uso
  legítimo.

## Consequências

### Positivas

- Segredos de credenciais ficam protegidos em repouso na foundation.
- O contrato público nunca expõe segredo, reforçando a invariante
  `credentialRef` ≠ secret.
- A proteção isolada em service permite trocar AES local por KMS/Vault no
  futuro sem quebrar o contrato.
- AES-256-GCM é criptografia autenticada: detecta adulteração do ciphertext.

### Negativas / trade-offs aceitos

- **Chave única**: não há chave por tenant; o comprometimento de
  `ENCRYPTION_KEY_BASE64` expõe todos os segredos protegidos.
- **Sem rotação automática**: não existe rotação de chave nem versionamento de
  chave; trocar a chave hoje exigiria re-criptografia manual dos segredos
  armazenados.
- A chave depende da operação correta do ambiente (gestão de `.env`, secrets
  do deploy); má gestão da variável é um ponto de falha.

### Neutras

- O `maskedPreview` só exibe sufixo quando o valor tem tamanho suficiente;
  caso contrário retorna `null`. Não é segredo, apenas um indicador de UI.
- Os tipos de credencial (`api_key`, `bearer_token`, `basic_auth`,
  `oauth_client`, `database_connection_string`, `custom`) não mudam com esta
  decisão.

## Escopo atual

- Envelope encryption AES-256-GCM com chave única `ENCRYPTION_KEY_BASE64`.
- `secretValue` aceito apenas em `POST` e `rotate`.
- `credentialRef` (`cred_<ObjectId>`) como única referência exposta.
- Service de proteção isolado, com contrato público estável.
- Eventos de auditoria `credential.created`, `credential.rotated`,
  `credential.revoked` — metadata-only, sem segredo.

## Fora de escopo

- Rotação real de chave de criptografia (re-criptografia dos segredos
  armazenados, versionamento de chave).
- Chaves por tenant.
- Integração com KMS / HashiCorp Vault / Secrets Manager.
- Descriptografia de credenciais em qualquer fluxo de execução/bridge
  (tratada em ADR-0021).
- Mecanismo de entrega do segredo a um executor futuro.

## Impacto na Fase 1

- O módulo `credentials` mantém o comportamento já documentado em
  [`docs/foundation-credentials-and-security.md`](../foundation-credentials-and-security.md).
- A variável `ENCRYPTION_KEY_BASE64` permanece obrigatória no ambiente e
  documentada em `.env.example` e `docs/env-reference.md`. Ela é um **secret de
  ambiente**: **nunca** versionada, fornecida via secret manager ou pipeline
  seguro. Sua rotação operacional é um **procedimento controlado** documentado
  em `docs/operations-runbook.md`.
- A invariante `credentialRef` ≠ secret e `connectionId` ≠ connection string
  passa a ser explicitamente referenciável por outras ADRs.
- Nenhuma alteração de endpoint, schema ou DTO é necessária — esta ADR
  documenta e formaliza o estado existente.

## Impacto futuro / Fase 2

- Habilita uma ADR futura de **rotação de chave**, que precisará definir:
  versionamento de chave, processo de re-criptografia dos segredos
  armazenados, janela de coexistência de chaves e rollback.
- Habilita avaliar **chaves por tenant** como reforço de isolamento.
- Habilita migração para **KMS/Vault** sem alteração do contrato público,
  graças ao service de proteção isolado.
- A descriptografia do segredo para conectar a uma fonte real depende de
  decisão separada (ADR-0021) e não é autorizada aqui.

## Relação com outros documentos

- **ADR-0005** — define o config store em MongoDB onde as credenciais são
  persistidas; esta ADR cobre como o segredo é protegido nesse store.
- **ADR-0020** — sanitização de metadata e forbidden fields; classifica
  `credentialRef`/segredo entre os campos proibidos e reforça que segredo
  nunca vaza em metadata/log/auditoria.
- **ADR-0021** — descriptografia de credenciais no fluxo de execução futura;
  consome a separação `credentialRef`/segredo definida aqui e fica como
  Proposed/futura.
- [`docs/foundation-credentials-and-security.md`](../foundation-credentials-and-security.md)
  — contrato detalhado do módulo de credenciais.
- `docs/security-checklist.md`, `docs/security-lgpd.md`, `docs/env-reference.md`.
