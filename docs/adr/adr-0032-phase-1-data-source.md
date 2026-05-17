# ADR-0032 — Fonte de dados da Fase 1: APIs expostas pelos clientes

- **Status**: Accepted
- **Data**: 2026-05-17
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: Fase 1 e Fase 2
- **Implementação**: parcial — connections/datasets/field-mappings declarativos implementados; consumo real de API de cliente não iniciado

---

> **Supersede:** esta ADR substitui a **ADR-0001 — Phase 1 data source:
> client-exposed APIs**. A decisão arquitetural permanece a mesma; este ADR é
> criado para registrar a decisão vigente em um documento próprio, conforme a
> regra do projeto de que decisões revistas ou reafirmadas geram um **novo** ADR
> em vez de edição in-place. A ADR-0001 fica `Superseded by ADR-0032`.

## Contexto

Para entregar a experiência analítica completa (dashboards, gráficos, KPIs,
relatórios), o Delfos precisa de uma fonte de dados operacionais. Existem três
caminhos principais:

1. acessar diretamente o banco do cliente com usuário read-only;
2. consumir APIs expostas pelos próprios clientes (cada cliente expõe seu
   contrato);
3. ingerir e armazenar os dados localmente com pipeline próprio (ETL).

O acesso direto ao banco (1) implica diversidade de SGBDs e drivers, superfície
de ataque grande, responsabilidade compartilhada por performance, auditoria
complexa por banco, modelos de dados heterogêneos e atrito contratual para
compartilhar credenciais de banco.

O pipeline ETL com armazenamento próprio (3) transforma o produto em plataforma
de dados pesada antes da validação comercial — fica como meta de Fase 2.

A ADR-0001 já havia escolhido a opção (2). Esta ADR-0032 reafirma essa decisão
como documento vigente e a alinha ao modelo de fases canônico da ADR-0024.

## Decisão

A fonte de dados pretendida para o consumo real futuro do Delfos são as **APIs
custom expostas pelos próprios clientes**. O Delfos atua como consumidor
genérico: cada cliente cadastra uma `Connection` (URL base, tipo de auth,
credenciais protegidas por `credentialRef`) e um conjunto de `Datasets`
(endpoints lógicos), com `FieldMappings` (De/Para campo a campo).

No **estado atual (foundation)**, o `delfos-api` **não** acessa banco de cliente,
**não** consome APIs de cliente, **não** mantém cópia local de dados
operacionais e **não** possui cache real. `connections`, `datasets` e
`field-mappings` existem apenas como configuração declarativa. O consumo real é
de Fase 2 e será executado pelo futuro `delfos-connectors`, sob ADRs próprios.

## Alternativas consideradas

- **Acesso direto ao banco do cliente** — descartada: diversidade de drivers,
  superfície de ataque grande e atrito contratual.
- **Pipeline ETL com armazenamento próprio** — adiada para a Fase 2: pesada
  demais antes da validação comercial.
- **Conectores específicos por software de mercado (Bling, Tiny, Omie, etc.)** —
  adiada: podem ser construídos sobre o motor genérico futuro sem invalidar esta
  decisão.

## Consequências

### Positivas

- Toda integração é HTTP — sem diversidade de drivers SQL.
- Superfície de ataque reduzida — sem credencial de banco em trânsito.
- O cliente mantém controle do que expõe; isolamento multi-tenant natural por
  `Connection`.
- Habilita conectores específicos futuros sem rearquitetar.

### Negativas / trade-offs aceitos

- Cada cliente precisa expor e manter uma API.
- Schemas variam entre clientes — exige De/Para forte.
- Disponibilidade e latência dependem da API do cliente; mitigação por
  cache/snapshots depende de ADR específico.

### Neutras

- A execução real será orquestrada pelo `delfos-api` e executada pelo
  `delfos-connectors` (ADR-0008).

## Impacto na Fase 1

- Confirma o caráter declarativo de `connections`, `credentials`, `datasets` e
  `field-mappings`.
- Não autoriza consumo real, conector real, cache, fila, scheduler ou teste real
  de conexão.

## Impacto futuro / Fase 2

- O consumo real das APIs de cliente dependerá do `delfos-connectors` e das ADRs
  bloqueantes de Fase 2 (ADR-0021, ADR-0022), conforme ADR-0024.

## Referências

- ADR-0001 — Phase 1 data source (superseded por este ADR)
- ADR-0008 — delfos-connectors e execução de integrações
- ADR-0012 — local connectors agent e fontes on-premise
- ADR-0024 — definição de Fase 1 e Fase 2
- `docs/phase-1-scope.md`
- `docs/phase-2-vision.md`
- `docs/data-access-policy.md`
- `docs/api-connectors.md`
- `docs/de-para.md`
