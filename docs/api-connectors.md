# Conectores de API — Delfos Analytics

> Status: documento normativo  
> Escopo: motor de consumo de APIs custom dos clientes.

A Fase 1 do Delfos depende de um motor seguro e configurável para consumir APIs externas. Este documento define os conceitos e regras desse motor.

---

## 1. Conceitos principais

### Connection

Representa a configuração de acesso à API de um cliente:

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

Representa um recurso consultável dentro de uma conexão:

- vendas
- produtos
- pedidos
- estoque
- financeiro
- qualquer endpoint exposto pelo cliente

Cada dataset define endpoint, método, parâmetros e forma esperada da resposta.

### FieldMapping

Define o De/Para entre campos retornados pela API do cliente e campos canônicos usados pelo Delfos.

---

## 2. Tipos de autenticação suportados

A Fase 1 pode suportar, de forma incremental:

- API Key via header
- Bearer token fixo
- Basic Auth
- OAuth2 client credentials, se necessário
- sem auth, apenas em ambiente controlado

Tokens e credenciais sempre ficam criptografados no backend.

---

## 3. Regras de segurança

O motor de conectores deve:

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

A request deve ser montada por um serviço dedicado, nunca por concatenação livre de string.

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

O dataset deve declarar o tipo de paginação quando necessário:

- query params: `page` / `limit`
- offset / limit
- cursor
- next link
- sem paginação

O backend deve impor limite máximo de páginas e itens por chamada agregada.

---

## 6. Normalização de resposta

O backend deve transformar respostas externas para um formato previsível:

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

O formato exato deve ser documentado em `docs/api-contracts.md`.

---

## 7. De/Para

O FieldMapping deve permitir:

- path simples: `total`
- path aninhado: `customer.name`
- nome amigável
- tipo esperado
- obrigatoriedade
- transformação simples
- fallback quando permitido

Transformações complexas devem ser evitadas na Fase 1. Quando necessárias, documentar e testar.

---

## 8. Erros de conector

Erros devem ser classificados:

- conexão indisponível
- autenticação inválida
- permissão negada na API do cliente
- timeout
- rate limit externo
- schema incompatível
- resposta vazia
- erro desconhecido

O frontend deve receber erro seguro, sem payload sensível.

---

## 9. Cache transitório

O conector pode usar cache em memória por:

- tenant
- connection
- dataset
- parâmetros normalizados
- usuário/permissão quando o resultado depender de permissão

TTL deve ser configurável por dataset. O cache não substitui segurança nem permissão.

---

## 10. Teste de conexão

O teste de conexão deve validar:

- URL base acessível
- autenticação válida
- endpoint de health ou dataset de teste
- tempo de resposta
- mensagem segura de erro

O teste não deve buscar volume grande de dados.

---

## 11. Evolução para adapters dedicados

A Fase 1 prioriza configuração genérica. Se um cliente ou sistema exigir comportamento recorrente e complexo, pode surgir um adapter dedicado, desde que:

- exista ganho claro
- não quebre o motor genérico
- seja isolado por módulo
- tenha ADR se virar padrão relevante
