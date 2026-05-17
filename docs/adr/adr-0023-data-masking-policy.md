# ADR-0023 — Política de masking de dados

- **Status**: Accepted
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: ambas
- **Implementação**: implementado

---

## Contexto

O Delfos Analytics é uma plataforma BI/admin white-label que, no futuro, exibirá
dados de clientes em previews, amostras, dashboards e relatórios. Mesmo no
estado atual de foundation — onde o `execution-preview` gera apenas dados
fictícios em memória — é necessário definir, **desde já**, como dados sensíveis
serão tratados quando forem exibidos.

Existem dois eixos distintos de proteção de dados sensíveis, e eles não devem
ser confundidos:

- **Segredos** (credenciais, tokens, chaves privadas, connection strings):
  tratados pela ADR-0020, que define que segredos são **descartados** /
  redigidos integralmente — nunca trafegam para frontend, logs ou payloads.
- **Dados pessoais e valores sensíveis** (PII, identificadores, valores
  financeiros): aparecem legitimamente em previews, amostras e telas, mas não
  podem ser exibidos crus. Esse eixo é o objeto desta ADR.

A ADR-0020 já classifica os campos sensíveis em categorias; esta ADR trata
especificamente da **categoria de dados pessoais/identificadores/financeiros
(categoria b da ADR-0020)**, definindo a política de **masking** — exibição
parcial ou redação — em vez de descarte total.

Era preciso registrar essa política agora, antes de qualquer dado real fluir,
para que ela já esteja **definida e vinculante** quando a execução real começar.

## Decisão

Adotamos a política de **masking de dados** descrita abaixo como referência
canônica do Delfos Analytics.

**Onde o masking se aplica.** O masking deve ser aplicado sempre que dados
sensíveis forem expostos em:

- linhas de demo/preview e amostras seguras (safe samples);
- widgets e telas de exibição do `delfos-web`;
- respostas de API que retornem dados;
- logs;
- auditoria.

**Campos que exigem masking (lista canônica).** Alinhada à categoria b da
ADR-0020:

- `cpf`;
- `cnpj`;
- `email`;
- `phone` / `telefone`;
- `address` / `endereço`;
- `pixKey`;
- `cardNumber`;
- `cvv`;
- `bankAccount`;
- identificadores de clientes finais (customer identifiers).

**Regras de masking.**

- **Revelação parcial**, onde for útil para reconhecimento sem expor o dado
  completo. Exemplos:
  - `email` → primeiro caractere + domínio (`j***@empresa.com`);
  - `cardNumber` → apenas os 4 últimos dígitos (`**** **** **** 1234`);
  - `cpf` / `cnpj` / `phone` → exibir apenas um trecho parcial.
- **Redação integral** para campos de alta sensibilidade, onde nenhuma parte
  deve ser revelada:
  - `cvv`;
  - `bankAccount`;
  - `pixKey`.
- O masking é aplicado **na borda de exibição/saída** — preview, amostra,
  resposta, log, auditoria — e não substitui o controle de acesso por tenant e
  por role.

**Distinção em relação a segredos (ADR-0020).** Segredos **não são mascarados:
são descartados**. Masking aplica-se a dados pessoais/financeiros que precisam
aparecer de forma reconhecível, mas protegida. As duas políticas são
complementares e não se substituem.

**Estado foundation.** O `execution-preview` atual usa dados de demonstração
fictícios; portanto **nenhum masking real é exercido sobre dado real hoje**. A
política é definida agora para estar **pronta e vinculante antes** de qualquer
fluxo de dado real. A aplicação efetiva de masking sobre dados reais fica
**condicionada às ADRs futuras de execução real** (incluindo as decisões
bloqueantes ADR-0021 e ADR-0022).

## Alternativas consideradas

- **Não definir política de masking até a execução real existir** — rejeitada:
  deixar a política para depois arrisca que o primeiro fluxo de dado real seja
  implementado sem proteção, ou com regras improvisadas e inconsistentes.
- **Mascarar tudo da mesma forma (redação total em todos os campos)** —
  rejeitada: redação total prejudica o reconhecimento legítimo do dado (ex.:
  conferir os últimos dígitos de um cartão) sem ganho de segurança proporcional
  para campos de sensibilidade média.
- **Tratar dados pessoais como segredos e descartá-los** — rejeitada: PII e
  valores financeiros precisam aparecer em dashboards e relatórios para o
  produto cumprir sua função; descartá-los inviabiliza o BI. O descarte total é
  reservado a segredos (ADR-0020).
- **Delegar masking apenas ao `delfos-web`** — rejeitada: masking apenas no
  frontend deixaria dado cru trafegando em API, logs e auditoria. A política
  precisa valer em todas as bordas de saída.

## Consequências

### Positivas

- Política de masking definida e vinculante antes de qualquer dado real fluir.
- Lista canônica de campos elimina ambiguidade sobre o que mascarar.
- Separação clara entre masking (dados pessoais/financeiros) e descarte
  (segredos), evitando confusão com a ADR-0020.
- Reduz risco de vazamento de PII em previews, amostras, telas, logs e
  auditoria.
- Apoia conformidade com LGPD desde a foundation.

### Negativas / trade-offs aceitos

- A política precisa ser mantida em sincronia com a categoria b da ADR-0020; se
  a categorização mudar, esta ADR deve ser revisada.
- A implementação futura precisará aplicar masking de forma consistente em
  múltiplas bordas (API, web, logs, auditoria), o que exige disciplina e
  testes.
- Revelação parcial ainda expõe uma fração do dado; é um trade-off aceito para
  preservar reconhecimento legítimo.

### Neutras

- Esta ADR não altera contratos HTTP, schemas ou comportamento atual.
- Como o preview atual é fictício, esta ADR não muda nenhum fluxo em execução
  hoje.
- A escolha de biblioteca ou utilitário de masking fica para a implementação
  futura, sem impacto nesta decisão.

## Escopo atual

- Definir a política de masking, a lista canônica de campos e as regras de
  revelação parcial vs. redação integral.
- Registrar a distinção entre masking (esta ADR) e descarte de segredos
  (ADR-0020).
- Estabelecer a política como referência canônica e vinculante para fases
  futuras.

## Fora de escopo

Esta ADR não autoriza nem implementa:

- aplicação de masking sobre dados reais de cliente;
- execução real, conector real ou acesso a fonte de cliente;
- alteração de contratos, schemas, DTOs ou controllers existentes;
- alteração do comportamento do `execution-preview` (que permanece fictício);
- tratamento de segredos (coberto pela ADR-0020);
- escolha de biblioteca de masking ou anonimização.

## Impacto na Fase 1

- Documentar a política de masking como referência canônica.
- Garantir que exemplos, fixtures e demo continuem fictícios e não exijam
  masking real.
- Reforçar, em documentação de segurança, a distinção entre masking de PII e
  descarte de segredos.
- Não há código de masking a implementar enquanto não houver dado real.

## Impacto futuro / Fase 2

- A política torna-se vinculante e exigível assim que dados reais começarem a
  fluir, sob as ADRs futuras de execução real.
- A implementação futura de connectors e de previews reais deverá aplicar
  masking em previews, amostras, telas, respostas de API, logs e auditoria.
- Capabilities futuras como `preview_dataset`, `execute_query_preview` e
  `export_report` deverão respeitar esta política antes de retornar dados.

## Relação com outros documentos

- ADR-0018 — estratégia de auditoria segura; a auditoria registra eventos
  metadata-only e, quando exibir dados, deve aplicar esta política de masking.
- ADR-0020 — tratamento e redação de segredos; segredos são **descartados**,
  enquanto esta ADR define **masking** para dados pessoais/financeiros
  (categoria b). As políticas são complementares.
- ADR-0021 — fronteira de descriptografia de credenciais; bloqueante para
  execução real, da qual o masking real depende.
- ADR-0022 — transporte de dispatch; bloqueante para execução real, da qual o
  masking real depende.
- `docs/security-lgpd.md` — princípios de menor privilégio, logs seguros e
  conformidade LGPD que esta política operacionaliza.
