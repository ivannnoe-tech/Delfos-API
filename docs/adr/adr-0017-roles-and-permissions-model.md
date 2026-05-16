# ADR-0017 — Modelo de roles e permissões

- **Status**: Accepted
- **Data**: 2026-05-15
- **Autores**: Equipe Delfos Analytics
- **Repositório**: delfos-api
- **Fase impactada**: ambas

---

## Contexto

O Delfos é uma plataforma de BI/admin white-label premium, multi-tenant, em que
diferentes pessoas de um mesmo tenant precisam de níveis distintos de acesso:
desde controle total da empresa até consulta somente leitura.

A foundation já recebe contexto de papel pelo header temporário
`x-delfos-actor-role`, que aceita `owner`, `admin`, `operator` ou `viewer`. As
regras atuais da foundation já distinguem leitura de mutação e tratam credenciais
como operação sensível. Faltava, porém, registrar formalmente:

- a definição canônica de cada papel;
- o modelo de permissão por tipo de operação (leitura vs. mutação);
- o papel mínimo exigido por classe de operação;
- como esse modelo orienta API e Web de forma consistente.

A auth real ainda não existe (ADR-0006) e o papel chega por header confiável por
convenção (ADR-0016). Mesmo assim, o **modelo de roles** precisa ser estável desde
já, porque API e Web tomam decisões de autorização com base nele.

## Decisão

Adotamos **quatro papéis canônicos** para o Delfos, válidos em ambas as fases:

- **owner** — controle total do tenant, incluindo operações destrutivas e
  administrativas (gestão da empresa, exclusões, rotação de credenciais, gestão de
  todos os usuários do tenant).
- **admin** — gerencia catálogos, configuração e usuários abaixo de owner; não
  exerce as operações reservadas exclusivamente ao owner.
- **operator** — cria e edita definições declarativas (datasets, query/dashboard
  definitions, field-mappings) e executa dry-run e demo-execute; **não** executa
  operações destrutivas em nível de tenant.
- **viewer** — somente leitura; visualiza catálogos, definições e resultados, sem
  qualquer mutação.

O modelo segue **menor privilégio por padrão**: toda operação de mutação exige
*role gating* explícito; o que não está explicitamente liberado é negado.

As operações são classificadas por tipo:

- **Operações de LEITURA** (listar, obter, visualizar) — liberadas de forma ampla,
  a partir de `viewer`.
- **Operações de MUTAÇÃO** (criar, atualizar, excluir, rotacionar) — restritas a
  `operator+`, `admin+` ou `owner`, conforme a severidade.

### Tabela de orientação — classe de operação → papel mínimo

| Classe de operação | Exemplos | Papel mínimo |
|---|---|---|
| Leitura / listagem | listar tenants, ver dataset, ver definição | viewer |
| Dry-run / demo-execute | readiness dry-run, demo-execute fictício | operator |
| Mutação declarativa | criar/editar dataset, query/dashboard definition, field-mapping | operator |
| Configuração e gestão de usuários (abaixo de owner) | gerenciar catálogos, configuração, usuários comuns | admin |
| Operações sensíveis de credenciais | criar/atualizar/rotacionar credential | admin (ou owner) |
| Operações destrutivas / administrativas de tenant | excluir tenant, operações irreversíveis, gestão total de usuários | owner |

> A tabela é orientação de governança. O mapeamento fino por endpoint é
> implementado nos guards/checagens da API e segue a matriz oficial abaixo.

### Matriz oficial de papel → operações (decisão inicial)

Esta matriz é a **referência oficial inicial** de papel → operações, aprovada
como decisão humana em 2026-05-15. Detalha a tabela de orientação acima por
papel:

- **owner** — acesso total dentro do tenant. Gerencia usuários, papéis,
  credenciais, conexões, datasets, field-mappings, query/dashboard/report
  definitions, runtime e configurações críticas. Pode executar as ações
  destrutivas permitidas pela fase atual.
- **admin** — administra os recursos do tenant: cria, edita e arquiva recursos
  administrativos e operacionais; gerencia credenciais e conexões conforme as
  regras de segurança. **Não** transfere ownership nem executa ações globais
  fora do tenant.
- **operator** — opera os recursos do tenant: cria e edita recursos
  operacionais quando permitido; executa ações explícitas de foundation e
  dry-run/demo-execute quando existirem. **Não** gerencia usuários, papéis,
  chaves, criptografia, secrets, políticas de segurança nem decisões de Fase 2.
- **viewer** — somente leitura segura e sanitizada. **Não** muta recursos,
  **não** visualiza secrets e **não** executa ações de runtime mutáveis.
- **acesso público** — **não é um quinto papel**: é o nível de acesso de
  endpoints **explicitamente públicos e documentados** (ex.: `health`/`status`).
  Nenhum recurso tenant-scoped é público.

Regras de governança da matriz:

- Qualquer endpoint ou operação que **não se encaixe claramente** nesta matriz
  é uma **stop condition** — ver `docs/agent-stop-conditions.md`.
- O agente **não pode inventar** permissão nem ampliar/reduzir o papel mínimo
  de uma operação por conta própria.
- Ao criar uma nova operação, o agente **deve atualizar esta matriz** somente
  se a mudança estiver dentro da fase atual e **não** envolver segurança
  sensível (papéis, chaves, criptografia, secrets, política de segurança);
  caso contrário, para e pede validação humana.

## Alternativas consideradas

- **Permissões totalmente granulares (capability-based) desde já** — rejeitada
  nesta fase: aumenta complexidade sem demanda concreta; quatro papéis cobrem o
  escopo atual. Permissões finas podem ser adicionadas em ADR futuro sobre a auth
  real.
- **Apenas dois papéis (admin/viewer)** — rejeitada: não distingue quem opera
  definições declarativas de quem tem controle destrutivo do tenant.
- **Papéis por recurso (um conjunto de papéis por módulo)** — rejeitada: fragmenta
  o modelo mental e dificulta a experiência white-label consistente.

## Consequências

### Positivas

- Modelo de autorização simples, previsível e fácil de comunicar a clientes.
- Separação clara entre leitura e mutação, e entre mutação declarativa e operação
  destrutiva.
- API e Web compartilham o mesmo vocabulário de papéis.
- Compatível com a evolução para a auth real sem mudar o conjunto de papéis.

### Negativas / trade-offs aceitos

- Quatro papéis fixos podem ser insuficientes para clientes que exijam permissões
  muito finas; isso exigirá ADR futuro.
- Na foundation, a aplicação do papel é **fundacional**: o papel chega por header
  confiável por convenção (ADR-0016) e ainda não é verificado por auth real.

### Neutras

- O conjunto de papéis já é o mesmo aceito pelo header `x-delfos-actor-role`, então
  esta ADR formaliza algo já presente na foundation, sem alterar contratos.

## Escopo atual

- Conjunto canônico de papéis: `owner`, `admin`, `operator`, `viewer`.
- Modelo de permissão por tipo de operação (leitura vs. mutação) e tabela de
  orientação por classe de operação.
- Aplicação fundacional na **API**: guards e checagens de papel por endpoint, com
  o papel obtido do header temporário `x-delfos-actor-role`.
- Orientação para a **Web**: ocultar ou desabilitar a UI de mutação quando o papel
  for insuficiente e exibir `DelfosPermissionState` para o usuário.

## Fora de escopo

- Permissões granulares por capability ou por campo.
- Verificação criptográfica do papel (depende da auth real, ADR-0006).
- Papéis adicionais ou customizáveis por tenant.
- Hierarquia de papéis fora do tenant (papéis globais da plataforma).

## Impacto na Fase 1

- A API aplica *role gating* nos endpoints de mutação usando o papel do header
  temporário; leitura permanece ampla a partir de `viewer`.
- A Web esconde/desabilita controles de mutação conforme o papel e usa
  `DelfosPermissionState` para comunicar a restrição.
- Operações sensíveis de credenciais permanecem restritas a `admin`/`owner`.
- A documentação reforça que a aplicação atual do papel é fundacional, não final.

## Impacto futuro / Fase 2

- Com a auth real (ADR-0006), o papel passa a vir de claims verificadas do JWT, e o
  modelo desta ADR continua válido sem mudança no conjunto de papéis.
- Permissões granulares, se necessárias, entram via ADR futuro sem invalidar a
  separação leitura/mutação.
- SSO/SAML em white-label pode mapear grupos externos para estes quatro papéis.

## Relação com outros documentos

- ADR-0006 — auth real que passará a fornecer o papel verificado.
- ADR-0016 — auth temporária e header `x-delfos-actor-role` que hoje carrega o papel.
- ADR-0018 — auditoria segura, que registra o ator e o papel envolvidos nas ações.
- `docs/foundation-auth-and-errors.md` — regras vigentes de papel por operação.
- `docs/security-lgpd.md` — princípio de menor privilégio.
