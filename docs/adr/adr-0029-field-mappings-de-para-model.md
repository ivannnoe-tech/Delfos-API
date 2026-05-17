# ADR-0029 — Modelo declarativo de field-mappings (De/Para)

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1 e Fase 2
- **Implementação**: implementado

---

## Contexto

O Delfos precisa trabalhar com APIs e fontes de clientes que expõem contratos
diferentes entre si. Para isso, o produto adota um **De/Para** (field-mapping):
um mapeamento declarativo entre campos de origem e campos canônicos/semânticos do
Delfos.

O módulo `field-mappings` já está implementado como catálogo declarativo da
foundation. Faltava um ADR registrando formalmente o modelo e, principalmente,
deixando explícito o limite: o `delfos-api` **armazena** mappings, mas **não
aplica transformação real** sobre payloads de clientes.

## Decisão

O `delfos-api` mantém o módulo `field-mappings` como **catálogo declarativo de
De/Para**, tenant-scoped, seguindo a estrutura interna padrão dos módulos.

Um field-mapping descreve, de forma declarativa:

- `tenantId` (boundary obrigatório) e a associação ao dataset (`datasetKey`);
- o **source field** (caminho do campo na origem, incluindo paths aninhados);
- o **target field** (campo canônico usado pelo Delfos);
- o tipo esperado, a obrigatoriedade e uma `transform` simples **declarada**
  (não executada);
- `metadata`/`settings` seguros.

Regras invariantes:

- O field-mapping é **configuração**: o `delfos-api` não executa dataset, não
  consome API/banco de cliente, não aplica `transform`, não valida resposta real
  e não normaliza dados.
- Mappings não armazenam secrets, tokens, senhas, connection strings reais ou
  headers sensíveis; os campos livres são sanitizados.
- Toda consulta é tenant-scoped; um mapping de um tenant nunca vaza para outro.
- `DELETE` é soft delete quando aplicável ao recurso.

A transformação real de campos em runtime — aplicar `transform`, validar retorno,
tratar fallback — é **futura e não autorizada** nesta fase.

## Alternativas consideradas

- **Embutir o De/Para dentro do dataset** — rejeitada: o mapping evolui de forma
  independente do dataset (versionável, auditável) e merece um catálogo próprio.
- **Permitir transformações complexas/arbitrárias no mapping** — rejeitada:
  transformações complexas viram regra de negócio e devem ser service/teste
  próprios; o De/Para fica restrito a conversões simples declaradas.
- **Aplicar transformação real já na foundation** — rejeitada: violaria o escopo
  declarativo da Fase 1 (sem execução real, sem acesso a fonte de cliente).

## Consequências

### Positivas

- O Delfos pode trabalhar com contratos heterogêneos sem exigir o mesmo formato
  de todos os clientes.
- O De/Para fica versionável e auditável, desacoplado da execução real.

### Negativas / trade-offs aceitos

- Conversões complexas não cabem no De/Para e exigem solução dedicada futura.
- O mapping descreve a intenção; a aplicação real depende de runtime futuro.

### Neutras

- A aplicação real do mapping em runtime é de Fase 2 e dependerá de ADR próprio.

## Impacto na Fase 1

- Formaliza o modelo de um módulo já implementado como foundation declarativa.
- Não altera contratos, schemas ou comportamento atuais.

## Impacto futuro / Fase 2

- A transformação real de campos sobre respostas reais de fontes de cliente
  dependerá de runtime real aprovado e de ADR específico, alinhado a ADR-0024.

## Referências

- `AGENTS.md`
- `docs/de-para.md`
- `docs/foundation-data-catalog.md`
- `docs/architecture.md`
- `docs/phase-1-scope.md`
- ADR-0024 — definição de Fase 1 e Fase 2
- ADR-0027 — modelo do módulo report-definitions
