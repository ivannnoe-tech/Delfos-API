# ADR-0041 — Adapter real: `rest_api` + `preview_dataset` (amostra read-only mascarada)

- **Status**: Accepted
- **Data**: 2026-06-21
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-connectors (impacto primário); delfos-api (broker/transporte)
- **Fase impactada**: Fase 2
- **Implementação**: não iniciada

---

> **Aceita por decisão humana explícita do owner em 2026-06-21** (escopo + threat
> model de egress de dados ratificados). Estende a ADR-0040 (que liberou
> `rest_api` + `test_connection`, só conectividade) com a **primeira leitura de
> DADOS reais do cliente** — `preview_dataset` sobre `rest_api`, limitado +
> mascarado. Continua atrás de flag; cada incremento de código exige go-ahead
> específico + TDD. Query arbitrária, SQL e export ficam fora.

## Contexto

A [ADR-0040](adr-0040-real-connector-source-adapter.md) entregou o 1º adapter
real (`RestTestConnectionAdapter`), read-only e **sem ler dados** (só status de
conectividade), com guard de SSRF e segredo just-in-time. O próximo passo do
roadmap é **ler uma amostra real** de uma fonte REST para preview — capability
`preview_dataset`. O contrato já tem `ConnectorDataPreview` (colunas, linhas
como `ConnectorSafeMetadata`, `rowCount`, `previewLimit`, `masked`). Falta a
decisão + os controles para trafegar dados reais do cliente com segurança.

## Decisão

Estender o adapter REST para a capability **`preview_dataset`** sobre
`sourceType` **`rest_api`**, quando (e somente quando) esta ADR for `Accepted` e
o incremento for liberado:

1. **Escopo:** `rest_api` + `preview_dataset`, **read-only**. GET HTTPS
   SSRF-validado (herda ADR-0040) a um endpoint de preview configurado, lê uma
   **amostra limitada** e retorna um `ConnectorDataPreview` **mascarado**.
2. **Limites:** `previewLimit` aplicado como teto rígido (ex.: ≤ N linhas) +
   **cap de bytes** da resposta; truncar além disso. Sem paginação/varredura.
3. **Masking (ADR-0023):** `masked: true`; aplicar a política de masking aos
   valores antes de devolver; nunca retornar campo sensível em claro. Linhas
   restritas a `ConnectorSafeMetadata` (escalares seguros).
4. **Seleção de campos:** só colunas do schema/field-mappings declarados; **sem
   dump arbitrário** de colunas.
5. **Sem persistência:** o preview é transiente (só na resposta do dispatch),
   **nunca** armazenado, cacheado ou logado; valores de dados nunca em log.
6. **SSRF + segredo:** herdados da ADR-0040 (https-only, bloqueio de
   privado/reservado; segredo JIT, nunca logado).

## Threat model (específico de dados)

| Ameaça | Controle |
|---|---|
| **Exfiltração / volume** | `previewLimit` + cap de bytes; truncar; sem paginação |
| **PII / LGPD em claro** | masking (ADR-0023) por default; linhas só `ConnectorSafeMetadata` |
| **Dump de colunas arbitrárias** | só campos do schema/field-mappings declarados |
| **Vazamento em log/erro** | valores de dados nunca logados; erro sanitizado (sem corpo cru) |
| **Resposta maliciosa/enorme** | cap de bytes + parse seguro; rejeita malformado |
| **SSRF / segredo** | herdados da ADR-0040 |

## Alternativas consideradas

- **`execute_query_preview` (query arbitrária)** — rejeitado p/ agora: superfície
  de injeção/expressão muito maior; preview de dataset declarado é mais contido.
- **Sem masking (dados crus)** — rejeitado: viola ADR-0023/LGPD.
- **Começar por SQL** — rejeitado: driver + injeção; REST reusa a base existente.

## Consequências

### Positivas
- Primeiro valor real de leitura (preview) reusando o adapter/guard REST.

### Negativas / trade-offs aceitos
- Introduz **egress de dados reais do cliente**. Mitigação: §Threat model
  (limites + masking + sem persistência) + flag + escopo único.

### Neutras
- Reusa `ConnectorDataPreview` existente; sem novos contratos.

## Escopo atual
- Registrar a escolha (`rest_api` + `preview_dataset`, read-only, limitado +
  mascarado), como `Proposed`, para ratificação humana.

## Fora de escopo
- **Qualquer implementação** até aceitação.
- `execute_query_preview` (query arbitrária), SQL/bancos, export, escrita,
  paginação/varredura completa, outras `sourceType`.

## Impacto futuro / Fase 2
- Quando `Accepted`, libera o incremento: `rest_api` + `preview_dataset`
  limitado + mascarado, atrás de flag, com TDD e os controles acima. Query
  arbitrária, SQL e export ficam para ADRs posteriores.

## Relação com outros documentos
- **ADR-0040** — adapter real base (REST, SSRF, segredo JIT) que esta estende.
- **ADR-0023** — política de masking de dados aplicada ao preview.
- **ADR-0037/0038/0039** — broker, transporte e receiver do dispatch.
- **ADR-0008 / ADR-0024** — execução de connectors e modelo de fases.
- **CLAUDE.md** — gate de real connectors/execução: autorização explícita + ADR.
