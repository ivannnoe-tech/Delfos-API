# ADR-0001 — Phase 1 data source: client-exposed APIs

- **Status**: Accepted
- **Data**: 2026-04-25
- **Fase impactada**: Fase 1

> Substitui a versão anterior deste ADR, que previa **acesso direto ao banco de dados dos clientes**. A direção mudou após avaliação de risco, escopo e custo de manutenção.

---

## Contexto

Para entregar a experiência analítica completa na Fase 1 (dashboards, gráficos, KPIs, relatórios), o Delfos precisa de uma fonte de dados operacionais. Existem três grandes caminhos:

1. **Acessar diretamente o banco do cliente** com usuário read-only.
2. **Consumir APIs expostas pelos clientes** (cada cliente expõe seu próprio contrato).
3. **Ingerir e armazenar dados localmente** com pipeline próprio (ETL).

A versão original deste ADR escolhia (1). A reavaliação mostrou que (1) implica:

- diversidade de SGBDs (Postgres, MySQL, SQL Server, Oracle), cada um com driver, dialeto e quirks
- superfície de ataque grande (acesso direto a banco de produção do cliente)
- responsabilidade compartilhada por performance (queries do Delfos podem afetar o sistema do cliente)
- complexidade de auditoria por banco
- modelos de dados completamente heterogêneos entre clientes
- complexidade contratual (cliente compartilhar credenciais de banco é, na prática, raro e atrita)

A opção (3) foi descartada para a Fase 1 porque transforma o produto em uma plataforma de dados pesada antes da validação comercial. Fica como meta da Fase 2 (ver `docs/phase-2-vision.md`).

A opção (2) é o ponto-doce desta fase: alinha com o que a maioria dos softwares modernos já oferece, reduz superfície de ataque, padroniza o transporte (HTTP), e desacopla o Delfos das particularidades do banco de cada cliente.

---

## Decisão

Na Fase 1, o Delfos consumirá **APIs custom expostas pelos próprios clientes**. O Delfos atua como **consumidor genérico**: cada cliente cadastra uma `Connection` (URL base, tipo de auth, credenciais criptografadas) e um conjunto de `Datasets` (endpoints específicos: vendas, produtos, pedidos, etc), com `FieldMappings` (De/Para campo a campo).

O Delfos **não** acessa banco de dados do cliente. **Não** mantém cópia local dos dados operacionais (apenas cache transitório em memória, ver ADR-0007).

---

## Alternativas consideradas

- **(1) Acesso direto ao banco do cliente** — descartada. Ver "Contexto".
- **(3) Pipeline ETL com armazenamento próprio** — adiada. Vira escopo da Fase 2.
- **(4) Conectores específicos por software de mercado** (Bling, Tiny, Omie, etc.) — adiada. Pode ser construída sobre o motor genérico da Fase 1, na forma de "conectores prontos", sem invalidar esta decisão.

---

## Consequências

### Positivas

- Sem diversidade de drivers SQL — toda integração é HTTP
- Superfície de ataque reduzida — sem credencial de banco em trânsito
- Cliente mantém controle total sobre o que expõe
- Padronização via REST/JSON
- Multi-tenant naturalmente isolado (cada `Connection` é um conjunto de credenciais)
- Habilita conectores específicos no futuro sem rearquitetar

### Negativas / trade-offs aceitos

- Cada cliente precisa expor uma API (e mantê-la). Quem não expõe não usa o Delfos na Fase 1.
- Schemas variam de cliente para cliente — exige De/Para forte e validação de schema
- Disponibilidade do dado depende da disponibilidade da API do cliente
- Latência maior do que banco direto — mitigado por cache em memória
- Rate limiting da API do cliente é responsabilidade do consumidor — Delfos precisa respeitar

### Neutras

- O `query-engine` originalmente previsto vira `data-connectors` (motor de HTTP, paginação, normalização e cache)

---

## Impacto na Fase 1

- O módulo `connections` armazena credenciais (criptografadas) e metadados de cada API de cliente
- O módulo `datasets` cataloga endpoints expostos por cada conexão
- O módulo `field-mappings` traduz schemas heterogêneos para o modelo conceitual do Delfos
- O módulo `data-connectors` é o motor: monta requisições, autentica, pagina, normaliza, cacheia, retorna dado pronto pra widgets
- A política em `docs/data-access-policy.md` deixa de tratar SQL/views/timeout-de-query e passa a tratar HTTP/retry/rate-limit/payload
- O `.env.example` perde `CUSTOMER_QUERY_*` e ganha `HTTP_*`

## Impacto futuro / Fase 2

- O motor `data-connectors` continua sendo o ponto único de entrada de dado externo, mesmo quando houver ingestão e armazenamento local
- Conectores específicos de software de mercado (Bling, Tiny, Omie, etc.) podem ser construídos como **subclasses** ou **plugins** do connector genérico
- Cache em memória (Fase 1) eventualmente migra para Redis (Fase 2)

---

## Referências

- `docs/phase-1-scope.md`
- `docs/phase-2-vision.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md`
- `docs/de-para.md`
- ADR-0007 (cache em memória)
