# ADR-0001 — Phase 1 data source: client-exposed APIs

- **Status**: Accepted
- **Data**: 2026-04-25
- **Fase impactada**: Fase 1

> Substitui a versão anterior deste ADR, que previa **acesso direto ao banco de dados dos clientes**. A direção mudou após avaliação de risco, escopo e custo de manutenção.
>
> Nota de status atual: esta ADR e uma decisao historica/conceitual. ADR-0008 e ADR-0012 deferiram a execucao real de integracoes para componentes futuros, como `delfos-connectors` e local agent. No estado atual nao ha `data-connectors`, conector real, cache, fila, scheduler, teste real de conexao, chamada externa ou execucao real de query. O `delfos-api` implementa apenas foundation administrativa/declarativa e `execution-preview` demo em memoria.

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

Como direcao conceitual, o Delfos podera consumir **APIs custom expostas pelos próprios clientes** em etapa futura aprovada. O Delfos atuaria como consumidor generico: cada cliente cadastraria uma `Connection` (URL base, tipo de auth, credenciais protegidas) e um conjunto de `Datasets` (endpoints especificos: vendas, produtos, pedidos, etc), com `FieldMappings` (De/Para campo a campo).

No estado atual, o Delfos **nao** acessa banco de dados do cliente, **nao** consome APIs de cliente, **nao** mantem copia local dos dados operacionais e **nao** possui cache real. Connections, datasets e field-mappings sao declarativos.

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
- Latencia maior do que banco direto — mitigacao futura dependera de ADR especifica para cache/snapshots/staging.
- Rate limiting da API do cliente sera responsabilidade do executor futuro.

### Neutras

- O `query-engine` originalmente previsto foi reavaliado. ADR-0008 define `delfos-connectors` como servico futuro para execucao de integracoes.

---

## Impacto na Fase 1 atual

- O modulo `connections` armazena configuracao declarativa e referencia segura de credencial.
- O modulo `credentials` protege secrets locais e retorna apenas `credentialRef`.
- O modulo `datasets` cataloga origem logica declarativa.
- O modulo `field-mappings` guarda De/Para declarativo.
- Nao existe modulo `data-connectors`.
- Nao existe execucao HTTP externa, cache, fila, scheduler ou teste real de conexao.
- `execution-preview` gera somente dados demo em memoria.

## Impacto futuro / Fase 2

- servico/runtime `delfos-connectors` ou mecanismo equivalente aprovado devera ser o ponto
  controlado de execucao externa; a foundation documental existe via ADR-0013.
- Conectores especificos de software de mercado (Bling, Tiny, Omie, etc.) podem ser planejados no futuro.
- Cache, snapshots, staging ou Redis exigem nova decisao antes de implementacao.

---

## Referências

- `docs/phase-1-scope.md`
- `docs/phase-2-vision.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md`
- `docs/de-para.md`
- ADR-0007 (cache/Redis fora do escopo atual)
- ADR-0008
- ADR-0012
