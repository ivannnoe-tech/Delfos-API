# De/Para de Dados — Delfos Analytics

> Status: documento normativo  
> Escopo: mapeamento de campos das APIs dos clientes para o modelo canônico do Delfos.

## Aviso obrigatório

Este documento descreve a **foundation declarativa** de field-mapping (De/Para). No
estado atual, o `delfos-api` apenas **armazena** mappings como configuração. **A
transformação real de campos em runtime não existe e não está autorizada**: não há
execução real de dataset, consumo de API de cliente, aplicação de `transform`,
validação de resposta real ou normalização. Tudo que este documento descreve sobre
"executar dataset", "transformar", "fallback" e "validar retorno" é conceitual/futuro
e depende de autorização explícita e ADR.

O De/Para permite que o Delfos trabalhe com APIs diferentes sem exigir que todos os clientes tenham o mesmo contrato.

---

## 1. Objetivo

Mapear campos retornados pela API do cliente para nomes e tipos compreendidos pelo Delfos.

Exemplo:

| Campo do cliente | Campo canônico | Tipo |
|---|---|---|
| `vl_total` | `totalAmount` | number |
| `dt_venda` | `saleDate` | date |
| `cliente.nome` | `customerName` | string |

---

## 2. Conceitos

### Source field

Caminho do campo na resposta da API do cliente.

### Target field

Campo canônico usado pelo Delfos em widgets, relatórios e filtros.

### Transform

Conversão simples aplicada ao valor.

### Required

Indica se o campo é obrigatório para aquele dataset.

---

## 3. Tipos suportados inicialmente

- string
- number
- integer
- boolean
- date
- datetime
- money
- percentage
- enum

---

## 4. Transformações simples

Permitidas na Fase 1:

- string para number
- string para date/datetime
- number para money
- trim
- uppercase/lowercase quando necessário
- enum mapping simples
- fallback default quando configurado

Evitar transformações complexas no De/Para. Se virar regra de negócio, deve ser service/teste próprio.

---

## 5. Campos obrigatórios

Cada dataset pode definir campos mínimos.

Exemplo para vendas:

- `saleDate`
- `totalAmount`
- `status`

Quando campo obrigatório faltar, o backend deve retornar erro de configuração ou item inválido conforme política do dataset.

---

## 6. Nested paths

O De/Para deve suportar caminhos aninhados:

```text
cliente.nome
pagamento.forma.descricao
itens[0].produto.codigo
```

Uso de arrays deve ser limitado e bem documentado.

---

## 7. Validação

Ao salvar mapping:

- validar campos obrigatórios
- validar tipo declarado
- validar target field conhecido
- impedir duplicidade inválida
- impedir target sensível sem permissão

Ao executar dataset:

- validar se o retorno contém os campos esperados
- classificar inconsistências
- não quebrar dashboard inteiro por item isolado quando houver estratégia de tolerância

---

## 8. Campos canônicos

Campos canônicos devem ser documentados por domínio conforme a evolução:

- sales
- products
- customers
- inventory
- finance
- operations

Na Fase 1, começar com campos necessários aos primeiros dashboards e relatórios.

---

## 9. Versionamento

Mudanças de De/Para podem afetar dashboards e relatórios existentes.

Regras:

- manter histórico mínimo de alteração
- auditar quem alterou
- validar widgets impactados
- impedir remoção de campo em uso sem aviso

---

## 10. Segurança

Não usar De/Para para expor campos proibidos.

Campos sensíveis devem exigir permissão explícita e, quando necessário, mascaramento.
