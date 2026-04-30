# Conectores de API — Delfos Analytics

> Status: documento conceitual/futuro.
> Escopo: ideias e restrições para conectores reais futuros.

## Aviso obrigatório

Este documento **não descreve implementação atual** e **não autoriza** criar motor real de conectores.

- Conectores reais não estão implementados.
- Teste real de conexão não está implementado.
- Consumo de API/banco de cliente não está implementado.
- Cache, fila, scheduler, sync, ingestão e execução real não estão implementados.
- As decisões atuais estão em ADR-0008 e ADR-0012.

Use este arquivo apenas como referência conceitual para planejamento futuro. Qualquer implementação real depende de autorização explícita, revisão de escopo e ADR quando necessário.

O estado atual do `delfos-api` é foundation administrativa/declarativa com `execution-preview` demo em memória.

---

## 1. Conceitos principais

### Connection

Representaria, em implementação futura, a configuração de acesso à API de um cliente:

- tenant
- nome
- URL base
- tipo de autenticação
- credenciais criptografadas
- headers permitidos
- timeout
- rate limit
- status

### Dataset

Representaria, em implementação futura, um recurso consultável dentro de uma conexão:

- vendas
- produtos
- pedidos
- estoque
- financeiro
- qualquer endpoint exposto pelo cliente

Em uma implementação futura, cada dataset poderia definir endpoint, método, parâmetros e forma esperada da resposta.

### FieldMapping

Define o De/Para entre campos declarativos e campos canônicos usados pelo Delfos. O uso com resposta real de API de cliente é futuro.

---

## 2. Tipos de autenticação futuros possíveis

Uma implementação futura pode suportar, de forma incremental:

- API Key via header
- Bearer token fixo
- Basic Auth
- OAuth2 client credentials, se necessário
- sem auth, apenas em ambiente controlado

Tokens e credenciais reais, quando existirem, devem ficar protegidos no backend e ser referenciados por `credentialRef`.

---

## 3. Regras de segurança

Em uma implementação futura, o motor de conectores deverá:

- validar URL base
- impedir chamadas para hosts internos quando configurado
- bloquear protocolos diferentes de HTTP/HTTPS
- controlar headers permitidos
- não permitir header livre vindo do usuário final
- aplicar timeout
- limitar tamanho da resposta
- aplicar rate limit por conexão
- nunca logar credenciais
- nunca retornar credenciais ao frontend

---

## 4. Montagem de request

Em uma implementação futura, a request deverá ser montada por um serviço dedicado, nunca por concatenação livre de string.

Entradas permitidas:

- parâmetros declarados no dataset
- filtros permitidos pelo dashboard/relatório
- paginação validada
- ordenação declarada
- headers permitidos na conexão

Entradas proibidas:

- URL arbitrária enviada pelo usuário final
- header arbitrário enviado pelo usuário final
- body livre sem schema
- método HTTP não cadastrado no dataset

---

## 5. Paginação

Em uma implementação futura, o dataset deverá declarar o tipo de paginação quando necessário:

- query params: `page` / `limit`
- offset / limit
- cursor
- next link
- sem paginação

O backend deverá impor limite máximo de páginas e itens por chamada agregada quando esse motor existir.

---

## 6. Normalização de resposta

Em uma implementação futura, o backend deverá transformar respostas externas para um formato previsível:

```json
{
  "items": [],
  "meta": {
    "total": 0,
    "page": 1,
    "pageSize": 50,
    "source": "customer_api",
    "cached": false
  }
}
```

O formato exato deverá ser documentado em `docs/api-contracts.md` quando houver contrato implementado.

---

## 7. De/Para

Em uma implementação futura, o FieldMapping poderá permitir:

- path simples: `total`
- path aninhado: `customer.name`
- nome amigável
- tipo esperado
- obrigatoriedade
- transformação simples
- fallback quando permitido

Transformações complexas devem ser evitadas até haver escopo aprovado. Quando necessárias, documentar e testar.

---

## 8. Erros de conector

Erros deverão ser classificados quando conectores reais existirem:

- conexão indisponível
- autenticação inválida
- permissão negada na API do cliente
- timeout
- rate limit externo
- schema incompatível
- resposta vazia
- erro desconhecido

O frontend deverá receber erro seguro, sem payload sensível.

---

## 9. Cache transitório

Um conector futuro poderá usar cache em memória por:

- tenant
- connection
- dataset
- parâmetros normalizados
- usuário/permissão quando o resultado depender de permissão

TTL deverá ser configurável por dataset quando cache existir. O cache não substitui segurança nem permissão.

---

## 10. Teste de conexão

Um teste de conexão futuro deverá validar:

- URL base acessível
- autenticação válida
- endpoint de health ou dataset de teste
- tempo de resposta
- mensagem segura de erro

O teste não deverá buscar volume grande de dados.

---

## 11. Evolução para adapters dedicados

Quando a fase de conectores for aprovada, a prioridade deve ser configuração genérica. Se um cliente ou sistema exigir comportamento recorrente e complexo, pode surgir um adapter dedicado, desde que:

- exista ganho claro
- não quebre o motor genérico
- seja isolado por módulo
- tenha ADR se virar padrão relevante
