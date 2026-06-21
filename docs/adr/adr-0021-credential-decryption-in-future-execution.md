# ADR-0021 — Descriptografia de credenciais no fluxo de execução futura

- **Status**: Superseded by ADR-0037
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 2
- **Implementação**: não iniciada

---

## Contexto

> **Esta ADR é uma decisão FUTURA / Proposed. Ela NÃO está implementada e NÃO
> autoriza implementação.** Nenhum dispatch real, adapter real ou descriptografia
> de credencial pode ser construído com base neste documento.
>
> **Decisão de governança (2026-05-15):** por decisão humana explícita, esta ADR
> **permanece `Proposed`**. Ela **deixa de ser pendência da Fase 1** e passa a
> ser um **gate formal de entrada da Fase 2**. Nenhum agente pode promovê-la
> para `Accepted`. A revisão e a aceitação/substituição desta ADR exigem decisão
> humana explícita no início da Fase 2 — ver ADR-0024.

O Delfos Analytics está em estado **foundation only**: não existem conectores
reais, execução real de query nem descriptografia de credenciais em nenhum
fluxo de runtime ou bridge. Hoje, conforme
[`docs/runtime-connectors-bridge-resolver-design.md`](../runtime-connectors-bridge-resolver-design.md),
o `RuntimeConnectorBridgeResolver` apenas prepara um `ConnectorExecutionCommandShape`
em memória, carregando `credentialRef` como referência — e **nada descriptografa
credenciais**.

Quando a execução real de conectores começar, em algum ponto um componente
precisará **resolver um `credentialRef` em um segredo real** para conectar à
fonte de dados do cliente. Esse momento introduz o maior risco de segurança do
projeto e, portanto, exige uma decisão formal antes de qualquer linha de código.

Por ADR-0019, o segredo é armazenado criptografado (AES-256-GCM,
`ENCRYPTION_KEY_BASE64`) e a separação `credentialRef` ≠ secret é invariante.
Por ADR-0013 e pelo documento `docs/security-boundaries.md` do repositório `delfos-connectors`,
o futuro `delfos-connectors` deve receber apenas `credentialRef` e metadados
seguros; qualquer descriptografia real está explicitamente fora de escopo da
foundation atual.

Esta ADR registra o **problema, os candidatos e as fronteiras**, sem escolher
nem autorizar a solução.

## Decisão

A descriptografia de credenciais no fluxo de execução **permanece FORA DE
ESCOPO** e **não é autorizada** por esta ADR.

Enquanto não existir uma ADR final aprovada que defina o fluxo de
descriptografia, ficam **bloqueados**:

- dispatch real de comandos para o `delfos-connectors`;
- adapters reais de fonte (SQL, REST, MongoDB, arquivos);
- qualquer componente que transforme `credentialRef` em segredo real em
  runtime.

A decisão final futura deverá definir, de forma explícita:

1. **quem** resolve o segredo (o broker/componente);
2. a escolha de **KMS/Vault** ou broker interno;
3. o **boundary de manuseio do segredo** — tempo de vida, transporte, quem
   pode vê-lo.

Esta ADR apenas enquadra o problema para essa decisão futura.

### Fronteira inegociável (hard boundary)

Independente da solução escolhida no futuro:

- o segredo real **NUNCA** pode ser exposto ao `delfos-web`;
- o segredo real **NUNCA** pode aparecer em respostas de API, logs, auditoria
  ou timeline;
- o `delfos-api` é o **dono** do armazenamento e da criptografia das
  credenciais (ADR-0019);
- o futuro `delfos-connectors` é o **executor** e deve receber **apenas o que
  precisa**, idealmente nunca segredo em texto plano de longa duração.

### Candidatos a quem resolve o segredo (não decididos)

Apresentados como opções para a ADR futura, sem escolha nesta fase:

1. **`delfos-api` como credential broker** — a API descriptografa sob demanda e
   entrega um segredo de **curtíssima duração** ao executor. Mantém a
   criptografia concentrada em quem já é dono dela; em contrapartida, coloca
   manuseio de segredo no caminho de orquestração.
2. **Worker seguro dedicado** — um componente isolado, de menor privilégio,
   responsável apenas pela resolução do segredo. Reduz a superfície, ao custo
   de mais um serviço para operar e proteger.
3. **KMS / HashiCorp Vault** — delega descriptografia/custódia a um serviço
   gerenciado especializado. Forte em rotação e auditoria; adiciona dependência
   e custo operacional.
4. **Local agent para fontes on-premise** — para fontes que não são
   alcançáveis a partir da nuvem, a resolução/uso do segredo ocorreria junto ao
   agente local. Depende inteiramente da política de local agent definida em
   ADR-0012 e não existe hoje.

## Alternativas consideradas

- **Decidir agora o broker e já implementar** — descartado. Não há execução
  real que justifique a decisão; decidir cedo arrisca escolher mal sem threat
  model concluído.
- **Enviar o segredo descriptografado dentro do command envelope** —
  descartado. Violaria a fronteira inegociável: o segredo trafegaria por logs,
  filas e eventuais caches. O command envelope carrega `credentialRef`, nunca o
  segredo (ADR-0013, ADR-0015).
- **Deixar o `delfos-connectors` ler e descriptografar direto do banco de
  credenciais** — descartado. Quebra o boundary de propriedade: a criptografia
  e o store pertencem ao `delfos-api` (ADR-0019); o executor não deve ter
  acesso à chave nem ao ciphertext.
- **Permitir que o `delfos-web` resolva credenciais para o usuário** —
  descartado de forma absoluta. O frontend nunca toca segredo real.

## Consequências

### Positivas

- Mantém o projeto coerente com o estado foundation-only: nenhum caminho de
  descriptografia nasce sem revisão.
- Registra explicitamente o maior risco de segurança do roadmap antes de
  qualquer código.
- Preserva a fronteira inegociável como restrição para qualquer solução futura.
- Mantém `execute`/`export` reais e adapters reais bloqueados, evitando que a
  execução real surja por acidente.

### Negativas / trade-offs aceitos

- A execução real de conectores continua bloqueada até a ADR final — adia
  funcionalidade de produto.
- A escolha entre broker interno e KMS/Vault permanece em aberto, mantendo
  incerteza de arquitetura.
- Exige que uma ADR futura, com threat model dedicado, seja produzida antes de
  qualquer avanço.

### Neutras

- Esta ADR não altera nenhum contrato, endpoint, schema ou DTO.
- Não muda o comportamento atual do `delfos-api`, do `delfos-web` nem do
  `delfos-connectors`.
- A foundation de bridge documentada em
  [`docs/runtime-connectors-bridge-resolver-design.md`](../runtime-connectors-bridge-resolver-design.md)
  permanece válida e inalterada — ela já não descriptografa nada.

## Escopo atual

- Registro do problema, dos candidatos e da fronteira inegociável.
- Confirmação de que **nada** descriptografa credenciais em runtime hoje.
- Bloqueio explícito de dispatch real e adapters reais até ADR final.

## Fora de escopo

- Implementação de qualquer fluxo de descriptografia.
- Escolha entre `delfos-api` broker, worker dedicado, KMS/Vault ou local agent.
- Transporte de dispatch (tratado em ADR-0022).
- Conectores reais, worker, fila, cache, scheduler e local agent.
- Execução real de SQL/API externa e export real.
- Rotação de chave de criptografia (tratada em ADR-0019 e ADR futura própria).

## Impacto na Fase 1

- Nenhum. Esta ADR não autoriza nem implementa nada na Fase 1.
- Serve apenas como guard-rail documental: reforça que a foundation atual não
  deve introduzir descriptografia de credenciais.

## Impacto futuro / Fase 2

- Uma **ADR final aprovada** deverá, antes de qualquer implementação, definir:
  - o componente que resolve o segredo (broker interno, worker, KMS/Vault ou
    local agent);
  - o tempo de vida e o transporte do segredo entregue ao executor;
  - o threat model do manuseio de segredo (replay, vazamento em memória, logs);
  - a interação com a rotação de chave (ADR-0019).
- Somente após essa ADR final é que dispatch real e adapters reais poderão ser
  desbloqueados.
- A escolha afetará diretamente o boundary entre `delfos-api` (dono da
  criptografia) e `delfos-connectors` (executor).

## Relação com outros documentos

- **ADR-0012** — política do local agent para fontes on-premise; um dos
  candidatos a resolver/usar o segredo depende inteiramente dessa política.
- **ADR-0013** — boundary e contrato runtime/connectors; estabelece que o
  executor recebe apenas `credentialRef` e que descriptografia real está fora
  de escopo da foundation.
- **ADR-0019** — criptografia e rotação de credenciais; define que o
  `delfos-api` é dono do store e da chave; esta ADR consome a separação
  `credentialRef` ≠ secret estabelecida lá.
- **ADR-0022** — transporte de dispatch; a decisão de descriptografia e a de
  transporte são complementares e ambas precisam estar aprovadas antes da
  execução real.
- [`docs/runtime-connectors-bridge-resolver-design.md`](../runtime-connectors-bridge-resolver-design.md)
  — design da bridge que prepara o command sem descriptografar.
- `delfos-connectors/docs/security-boundaries.md` (repositório `delfos-connectors`)
  — fronteiras de segurança do executor futuro.
