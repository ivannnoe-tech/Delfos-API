# ADR-0020 — Sanitização de metadata e forbidden fields

- **Status**: Accepted
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: ambas
- **Implementação**: implementado

---

## Contexto

O Delfos Analytics é uma plataforma white-label premium de BI/admin. Vários
recursos da foundation aceitam campos livres de `metadata`/`settings` e
estruturas relacionadas (`filters.defaultValue`, `widgets.options`,
`exportOptions`, `parameters.allowedValues`, etc.). Esses campos são
sanitizados hoje em `tenants`, `connections`, `datasets`, `query-definitions`,
`dashboard-definitions` e `report-definitions`, conforme
[`docs/foundation-credentials-and-security.md`](../foundation-credentials-and-security.md).

A sanitização já existe, mas a **classificação dos campos** estava espalhada
por documentos e código. Sem uma classificação canônica única, há risco de
divergência entre o que a API descarta, o que os logs redijem, o que a
auditoria grava e o que a futura bridge de connectors carrega no command
envelope.

ADR-0013 e o documento `docs/security-boundaries.md` do repositório `delfos-connectors`
já listam campos proibidos para payloads, logs,
timeline e erros. Esta ADR consolida e estende essa classificação como
referência canônica do `delfos-api`, cobrindo também PII e o conjunto seguro
permitido.

O estado do projeto continua **foundation only**: não há conectores reais nem
descriptografia de credenciais. A sanitização aqui descrita é preventiva e
deve permanecer válida quando a execução real existir.

## Decisão

O Delfos adota uma **classificação canônica de campos em 3 categorias** para
sanitizar metadata, logs, entradas de auditoria e respostas de API. A
sanitização **descarta** a categoria (a), **mascara** a categoria (b) e
**permite apenas** a categoria (c).

### (a) Secrets proibidos

Nunca armazenados em metadata, nunca logados, nunca retornados em respostas e
**descartados na ingestão**. Variações de casing e aliases recebem o mesmo
tratamento.

- `token`
- `accessToken`
- `refreshToken`
- `secret`
- `password`
- `senha`
- `credential`
- `credentialRef` quando usado indevidamente como valor sensível
- `apiKey`
- `key`
- `privateKey`
- `clientSecret`
- `authorization`
- `bearer`
- `jwt`
- `cookie`
- `session`
- `connectionString`
- URIs contendo credenciais
- hosts internos sensíveis
- `user` / `username` quando vinculado a uma credencial

### (b) PII / identificadores que exigem masking

Não são descartados, mas exigem mascaramento conforme a política de masking
(ADR-0023):

- `cpf`
- `cnpj`
- `email`
- `phone`
- `telefone`
- `address`
- `endereço`
- `pixKey`
- `cardNumber`
- `cvv`
- `bankAccount`

### (c) safeMetadata permitido

Único conjunto que pode ser persistido/retornado/logado livremente:

- contadores
- duração
- `capability`
- `mode`
- `sourceType`
- `schemaMappingVersion`
- limites aplicados
- flags booleanas
- códigos de warning/blocker

### Princípio allowlist-over-blocklist

A sanitização deve **construir o `safeMetadata` a partir de uma allowlist** —
ou seja, copiar apenas os campos da categoria (c) que são explicitamente
seguros — em vez de tentar remover uma blocklist de campos perigosos. A lista
de secrets proibidos da categoria (a) funciona como **defense-in-depth
backstop**: uma segunda barreira para o caso de um campo perigoso escapar da
allowlist, não como o mecanismo primário.

Essa decisão se aplica a:

- **respostas de API** — apenas campos da allowlist são serializados;
- **logs seguros** — redaction de qualquer ocorrência da categoria (a) e
  masking da categoria (b); logs priorizam metadata da categoria (c);
- **entradas de auditoria** — gravam apenas categoria (c) mais identificadores
  estruturais (`tenantId`, `entityId`, `type`, `status`, `provider`,
  `connectionId`), nunca segredo;
- **metadata/settings** ingeridos em recursos administrativos.

## Alternativas consideradas

- **Apenas blocklist** — descartado como mecanismo primário. Uma blocklist é
  frágil: campos novos, aliases ou nomes inesperados passam despercebidos.
  Mantida apenas como backstop de defesa em profundidade.
- **Sanitização ad-hoc por módulo** — descartado. Cada módulo definindo sua
  própria lista gera divergência e regressões silenciosas. A classificação
  precisa ser única e canônica.
- **Não sanitizar e confiar no input** — descartado. Viola as fronteiras de
  segurança do projeto e expõe a plataforma a vazamento de segredo e PII.
- **Mascarar tudo, inclusive metadata segura** — descartado. Degradaria
  observabilidade e a utilidade de logs/auditoria sem ganho de segurança real.

## Consequências

### Positivas

- Classificação única e canônica reutilizável por API, logs, auditoria e
  futura bridge.
- Allowlist-first reduz drasticamente o risco de vazamento de campos novos ou
  inesperados.
- Reforça as invariantes de segurança já existentes (`credentialRef` ≠ secret).
- Facilita revisão e testes: a categoria de cada campo é decidível.

### Negativas / trade-offs aceitos

- Campos legítimos não previstos na allowlist (c) são descartados até a
  allowlist ser atualizada — exige manutenção deliberada da lista.
- A categorização de `user`/`username` é contextual (proibido quando vinculado
  a credencial), o que exige julgamento na implementação.
- Manter a classificação alinhada entre `delfos-api` e `delfos-connectors`
  exige disciplina de documentação.

### Neutras

- A classificação não altera endpoints, schemas ou DTOs existentes; formaliza
  e estende o comportamento de sanitização já documentado.
- A política de masking concreta da categoria (b) é definida em ADR-0023; esta
  ADR apenas declara que esses campos pertencem à categoria de masking.

## Escopo atual

- Classificação canônica em 3 categorias para `delfos-api`.
- Sanitização de `metadata`/`settings` e estruturas correlatas nos recursos
  administrativos já existentes.
- Redaction de logs e construção de respostas de API por allowlist.
- Auditoria metadata-only.

## Fora de escopo

- Implementação concreta do algoritmo de masking de PII (ADR-0023).
- Sanitização dentro do `delfos-connectors` — coberta pelos documentos do
  próprio repositório, alinhada a esta classificação.
- Descriptografia ou manuseio de segredo real (ADR-0019, ADR-0021).
- Qualquer execução real de conector.

## Impacto na Fase 1

- A sanitização existente passa a referenciar esta classificação canônica como
  fonte única de verdade.
- Implementações de log e de auditoria devem aplicar redaction da categoria
  (a) e masking da categoria (b).
- A construção de `safeMetadata` deve seguir allowlist-first; a blocklist da
  categoria (a) permanece como backstop.
- Nenhuma mudança de contrato público é necessária.

## Impacto futuro / Fase 2

- A futura bridge runtime/connectors deve montar o `safeMetadata` do command
  envelope a partir desta mesma classificação, garantindo que nenhum secret ou
  PII não mascarada atravesse o boundary.
- Caches, filas e eventos futuros herdam a mesma classificação para conteúdo
  sanitizado.
- Novas categorias de campo (ex.: dados regulatórios específicos) podem ser
  adicionadas estendendo esta ADR ou via ADR sucessora.

## Relação com outros documentos

- **ADR-0018** — auditoria; esta ADR define o que a auditoria pode e não pode
  gravar (apenas categoria (c) mais identificadores estruturais).
- **ADR-0019** — criptografia e rotação de credenciais; o segredo protegido por
  ADR-0019 é exatamente o tipo de valor que a categoria (a) proíbe em metadata.
- **ADR-0023** — masking; define o algoritmo concreto de mascaramento da
  categoria (b).
- **ADR-0013** (delfos-connectors) — lista de campos proibidos no boundary de
  connectors, alinhada a esta classificação.
- `docs/security-lgpd.md` — base regulatória para o tratamento de PII.
- `delfos-connectors/docs/security-boundaries.md` (repositório `delfos-connectors`)
  — fronteiras de segurança da foundation de connectors.
