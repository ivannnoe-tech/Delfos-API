# Agent Stop Conditions — Delfos Analytics

> Status: documento agent-ready, normativo para agentes de IA, copilotos, CLIs e
> automações de desenvolvimento.
> Escopo: lista formal das situações em que um agente deve **PARAR** e pedir
> validação humana explícita.

Este documento **formaliza e detalha** a seção 9 do `AGENTS.md` ("Stop
conditions — quando parar e pedir validação humana"). O `AGENTS.md` §9 é a
**origem canônica**; este documento é a versão agent-ready detalhada e
operacional. Em caso de divergência, vale o `AGENTS.md`.

---

## Regra geral

Ao encontrar qualquer condição abaixo, o agente **deve**:

1. **PARAR** a tarefa no ponto da condição;
2. **registrar** o ponto como **"precisa validação humana"** no relatório final;
3. **não decidir sozinho** e **não contornar** o bloqueio.

O agente não tem autoridade para resolver nenhuma das condições a seguir.

---

## Condições de parada

### 1. Ultrapassar 600 linhas em um arquivo
- **Por que**: 600 linhas é o limite máximo absoluto de tamanho de arquivo.
- **O agente deve**: parar e propor extração/refatoração; registrar "precisa
  validação humana". Ver `docs/quality-checklist.md` §0.1.

### 2. Alterar contrato público de API
- **Por que**: rotas, DTOs, payloads, status e headers impactam ambos os repos.
- **O agente deve**: parar antes de alterar; registrar "precisa validação
  humana" e descrever o impacto proposto.

### 3. Mexer em secrets, credenciais ou descriptografia
- **Por que**: é o maior risco de segurança do projeto.
- **O agente deve**: parar; não tocar em segredo, credencial ou fluxo de
  descriptografia; registrar "precisa validação humana".

### 4. Implementar dispatch real
- **Por que**: dispatch real para o `delfos-connectors` é proibido (ADR-0022).
- **O agente deve**: parar; manter o dispatch apenas como conceito documentado;
  registrar "precisa validação humana".

### 5. Promover uma ADR `Proposed` para `Accepted`
- **Por que**: promover ADR é decisão humana de governança — em especial
  **ADR-0021** e **ADR-0022**, que bloqueiam a execução real.
- **O agente deve**: parar; não alterar o status de nenhuma ADR; registrar
  "precisa validação humana".

### 6. Divergência entre ADR, `AGENTS.md` e código
- **Por que**: contradição factual exige reconciliação humana.
- **O agente deve**: parar; documentar a divergência encontrada; registrar
  "precisa validação humana".

### 7. Build, teste ou lint não validável
- **Por que**: não é possível garantir Definition of Done sem validação.
- **O agente deve**: parar; não declarar a entrega como pronta; registrar
  "precisa validação humana".

### 8. Ação destrutiva
- **Por que**: remover arquivo ou rodar comando destrutivo pode causar perda
  irreversível.
- **O agente deve**: parar; seguir `docs/destructive-commands-policy.md`;
  registrar "precisa validação humana" e aguardar autorização explícita.

### 9. Alterar a política de retenção LGPD / auditoria
- **Por que**: a política de retenção inicial já está **definida** na ADR-0018
  (prazos por tipo de log lá); alterá-la é decisão regulatória/jurídica.
- **O agente deve**: parar; não alterar prazos nem definir retenção divergente;
  registrar "precisa validação humana". Ver **ADR-0018**.

### 10. Operação que não se encaixa na matriz de papel→operações
- **Por que**: a **matriz oficial** papel→operações da ADR-0017 é a referência;
  endpoint/operação que não se encaixa claramente nela precisa de decisão
  humana.
- **O agente deve**: parar; não inventar permissão; registrar "precisa
  validação humana". Ver **ADR-0017**.

### 11. Criar tela sem seguir o Baseline Visual v0.1
- **Por que**: toda tela nova ou alterada deve seguir o Baseline Visual v0.1
  (layout base); tela freestyle é proibida sem validação humana.
- **O agente deve**: parar; não criar a tela fora do baseline descrito em
  `delfos-web/docs/layout-base-reference.md`; registrar "precisa validação
  humana".

### 12. Alterar profundamente o padrão visual premium
- **Por que**: mudança profunda no padrão visual premium / no Baseline Visual
  é decisão de produto/design.
- **O agente deve**: parar; não alterar o padrão visual de forma profunda;
  registrar "precisa validação humana". Ver `DESIGN.md` e
  `delfos-web/docs/layout-base-reference.md`.

### 13. Mexer em capacidade de Fase 2 sem gate aprovado
- **Por que**: capacidades de Fase 2 só podem ser implementadas após os
  critérios de transição serem atendidos (ADR-0024).
- **O agente deve**: parar; não implementar capacidade de Fase 2; registrar
  "precisa validação humana". Ver **ADR-0024**.

### 14. Enviar dados reais a um LLM externo
- **Por que**: a integração real da capability `analytics_text_generation` não
  é autorizada (ADR-0025); enviar dados reais a um LLM externo é decisão de
  segurança/privacidade.
- **O agente deve**: parar; não enviar dado real a nenhum LLM; registrar
  "precisa validação humana". Ver **ADR-0025**.

### 15. Processar PII, dado financeiro detalhado ou payload bruto via LLM
- **Por que**: o LLM só pode receber dados agregados/sanitizados/mascarados;
  PII e financeiro exigem masking/anonimização prévia (ADR-0023/ADR-0020).
- **O agente deve**: parar; exigir masking/anonimização aprovado antes de
  qualquer uso; registrar "precisa validação humana". Ver **ADR-0025**.

### 16. Criar secret, chave de API ou provider real de LLM
- **Por que**: criar a chave de API do provider ou ligar um provider real de
  LLM é decisão humana de segurança (ADR-0025; secret sob ADR-0019/ADR-0020).
- **O agente deve**: parar; não criar secret, chave ou provider real de LLM;
  registrar "precisa validação humana". Ver **ADR-0025**.

### 17. Uso do Postman além de local/dev sem segurança
- **Por que**: o Postman é permitido apenas para validação de API em local/dev,
  sem expor secrets nem alterar contratos (ver `docs/postman-policy.md`).
- **O agente deve**: parar e pedir validação humana se precisar usar produção,
  usar secret real, salvar/exportar environment com segredo, publicar
  collection/workspace, alterar contrato público de API, testar com dados reais
  de cliente, chamar endpoint de execução real/conector real, ou diante de
  divergência entre API real, Swagger/docs e ADRs. Registrar "precisa validação
  humana". Ver `docs/postman-policy.md` §10.

### 18. Estender a foundation tests-only do runtime bridge
- **Por que**: a foundation de bridge/resolver/adapters sob
  `src/modules/runtime/bridge/` existe apenas como código tests-only (classes
  puras, sem provider NestJS, sem `RuntimeModule`, sem endpoint, sem dispatch).
  Qualquer extensão além desse estado depende de **ADR-0015** estar `Accepted`.
- **O agente deve**: parar; não criar provider/wiring/endpoint/dispatch nem
  expandir a foundation do bridge além do estado tests-only enquanto a
  **ADR-0015** estiver `Proposed`; registrar "precisa validação humana". Ver
  **ADR-0015** e `docs/runtime-connectors-bridge-resolver-design.md`.

---

## Decisões humanas fechadas (2026-05-15) — o agente NÃO altera

As decisões abaixo foram **tomadas formalmente** e registradas na documentação.
O agente **não pode alterá-las**; deve apenas segui-las e referenciá-las:

1. **Retenção LGPD / auditoria** — política inicial (prazos por tipo de log)
   definida na **ADR-0018**. Pendência residual: validação jurídica antes de
   produção regulada e implementação automatizada de expurgo.
2. **Matriz papel→operações** — matriz oficial inicial definida na **ADR-0017**.
   Operação que não se encaixa nela é stop condition (§10).
3. **Template de ADR** — `adr-template.md` é o template canônico único; o
   duplicado `adr-0000-template.md` foi removido.
4. **Chave de criptografia** — Fase 1 mantém **chave única por ambiente**
   (`ENCRYPTION_KEY_BASE64`), conforme **ADR-0019**. Chave por tenant/KMS é
   futura e exige ADR própria.

## Pendências / gates ainda abertos (o agente NÃO decide sozinho)

1. **ADR-0021 e ADR-0022** — permanecem `Proposed` por decisão humana e são o
   **gate formal de entrada da Fase 2**. Não são pendência da Fase 1; o agente
   não pode promovê-las (§5; ADR-0024).
2. **Mudança profunda no Baseline Visual / layout base premium** — qualquer
   alteração estrutural é decisão de produto/design (§11, §12).
3. **Validação jurídica da política de retenção** — antes de produção regulada
   (ADR-0018).

---

## Nota final

Esta lista é vinculante e complementa o `AGENTS.md` §9 e
`docs/agent-safety-rules.md`. Documentos conceituais/futuros **não autorizam**
implementação real. Em dúvida, o agente para e pede validação humana.
