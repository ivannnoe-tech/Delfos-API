# Filosofia de Analytics Embarcado do Delfos

> Tipo: filosofia de produto · Status: princípios orientadores — não autoriza implementação

Este documento declara **como o Delfos pensa analytics embarcado** (embedded analytics):
a entrega de dashboards, queries e relatórios do Delfos *dentro* do produto de um
cliente, sob a marca desse cliente. Ele deriva dos [12 princípios](./principles.md) e não
pode contradizê-los.

Embedding **real ainda não existe** no Delfos. A fase atual é *foundation* declarativa:
não há renderização embarcada, não há emissão de token de embed, não há SDK de
incorporação. Este documento descreve a **postura** que governará o embedding quando ele
for construído — e o que o Delfos recusa desde já. Capacidade de embed exige escopo
aprovado e ADR (Princípio 6 — Disciplina de fases).

---

## A tese

White-label sem embedding é meia promessa. Um produto multi-tenant white-label existe
para que o cliente entregue analytics como se fosse *seu* — não para que ele mande o
usuário final a um portal de terceiros. Por isso, no Delfos, **embedding é cidadão de
primeira classe**, não um plugin de borda nem um `<iframe>` improvisado depois.

Cidadão de primeira classe significa três compromissos:

1. O modelo de isolamento multi-tenant (Princípio 3) **vale dentro do embed exatamente
   como vale na API** — não há um "modo embed" com menos governança.
2. A identidade visual do tenant é parte do contrato de embed, não um tema aplicado por
   cima depois.
3. O contrato de consumo do embed é **estável e versionado** (Princípio 9 — contratos
   versionados), porque ele atravessa a fronteira para o código de um terceiro.

Embedding é, antes de tudo, uma **decisão de segurança**. Ele expõe analytics governado
a um host que o Delfos não controla. Tudo abaixo decorre disso.

---

## Isolamento multi-tenant é a primeira regra do embed

O Princípio 3 — *multi-tenancy é fronteira, não filtro* — é o ponto mais sensível do
embedding, porque o embed roda no navegador do usuário final, em página servida pelo
cliente. O navegador é território hostil: nada que venha dele é confiável.

Regras inegociáveis do embedding do Delfos:

- **`tenantId` mora no token, nunca no cliente.** O escopo de tenant é assinado pelo
  servidor que emite o embed e verificado pelo Delfos. O host **nunca** informa "para
  qual tenant" — ele apenas apresenta um token que já carrega essa resposta.
- **Parâmetro de cliente nunca amplia escopo.** Filtros, IDs de recurso e seletores
  enviados pelo host só podem *restringir* dentro do tenant do token; jamais atravessar
  para outro tenant. Escopo é teto, não sugestão.
- **A fronteira é verificada no servidor, a cada request.** Não há atalho de
  "já validei no embed". Cada chamada de dados originada do embed reaplica o
  escopo do token (Princípio 4 — segurança por construção).
- **Falha de escopo nega, não degrada.** Token sem `tenantId`, com tenant inválido ou
  com tenant divergente do recurso pedido resulta em recusa — nunca em "mostrar o que
  der".

A pergunta de projeto não é "como filtrar por tenant no embed", e sim "como tornar
**impossível** um embed servir dados de outro tenant". Isolamento por desenho, não por
lembrança.

---

## Tokens de embed: escopados, curtos, auditáveis

Um embed é tão seguro quanto o token que o autoriza. O Delfos trata o token de embed
como **credencial de exposição**, com três propriedades obrigatórias:

| Propriedade | Postura do Delfos |
|---|---|
| **Escopado** | O token carrega `tenantId` e o conjunto mínimo de recursos (dashboard/query/report) que pode renderizar. Nada além disso. |
| **Vida curta** | Token de embed expira rápido. Sessão longa se renova por troca controlada, não por token eterno. Token vazado tem janela mínima. |
| **Auditável** | Emissão e uso de token de embed deixam rastro (Princípio 7), associados a tenant e ator. Embed não é um canal cego. |

O token de embed **não é** uma credencial de usuário do Delfos nem um segredo de
conexão. Ele autoriza *uma exposição específica*, não acesso administrativo. O segredo
de emissão (a chave que assina o token) vive no backend do cliente ou no Delfos —
**nunca no navegador, nunca no bundle JS do host**. Isso é o Princípio 4 aplicado ao
embed: `credentialRef` e segredo de assinatura são referências e segredos de servidor,
jamais material entregue ao frontend.

A relação com autenticação é deliberada: o embed do Delfos **não reutiliza** a sessão de
login do produto do cliente nem confia em cookies do host. Ele opera por token próprio,
escopado e curto. Quando o Delfos tiver auth self-managed (adr-0006, futuro), o embed
continuará sendo um plano de credencial **distinto** do plano de login administrativo —
um não vaza no outro.

---

## White-label: a marca é do tenant

Embedding existe para o analytics parecer parte do produto do cliente. Logo, a
identidade visual do tenant é **contrato**, não enfeite:

- Cores, tipografia, logotipo e densidade visual do embed vêm da configuração do tenant
  — derivados de tokens de tema, nunca hardcoded (consistente com a disciplina de design
  do `delfos-web`).
- O embed não carrega marca "Delfos" imposta. A presença do Delfos é uma decisão do
  tenant, não um selo forçado.
- Tema claro e escuro são ambos suportados; o embed respeita o contexto visual do host.
- O white-label é **configuração declarativa** (Princípio 2): a identidade do embed é
  uma definição versionável e inspecionável, não código por cliente.

White-label, porém, **não dilui governança**. O cliente controla a *aparência*; o Delfos
controla o *isolamento*. Personalizar a marca jamais é caminho para alterar escopo de
tenant, permissões ou regras de masking.

---

## Contrato de consumo estável

O embed atravessa a fronteira para o código de um terceiro. Mudança quebrada nesse
contrato quebra o produto do cliente — algo que o Delfos não pode tratar como detalhe.
Por isso o contrato de embed é tratado como **interface pública versionada**
(Princípio 9):

- A superfície de integração (como inicializar, autenticar, passar filtros, receber
  eventos) é mínima, explícita e documentada.
- Evolução é aditiva e versionada; remoção ou quebra exige migração anunciada e ADR.
- O contrato é estável independentemente da implementação interna de renderização e
  runtime — o cliente integra contra o *contrato*, não contra detalhes internos.
- O embed expõe estados honestos (loading, vazio, erro, sem permissão), espelhando a
  disciplina de estados de tela do `delfos-web`. Embed que falha silenciosamente mente
  para o usuário final — e o Delfos preza honestidade de estado (Princípio 8).

---

## O que o Delfos recusa no embedding

Dizer o que se persegue não basta; o Princípio enuncia também o que se recusa:

- **Embed sem escopo de tenant.** Nenhum embed renderiza sem `tenantId` assinado e
  verificado. "Depois a gente escopa" não é uma fase válida.
- **Confiar no cliente para definir tenant.** O host nunca declara o tenant. Parâmetro
  de host que pretenda trocar de tenant é tratado como tentativa de violação de
  fronteira, não como funcionalidade.
- **Vazamento entre tenants.** Cache compartilhado, ID adivinhável, resposta de erro que
  revela dados de outro tenant — qualquer caminho de cross-tenant leak é defeito
  bloqueante, nunca trade-off aceitável.
- **Segredo de assinatura no navegador.** A chave que emite tokens de embed jamais vai
  para o frontend, bundle ou variável pública.
- **Token de embed eterno ou de escopo amplo.** Sem token "que serve para tudo"; sem
  token sem expiração.
- **Embedding que burla governança.** O embed não é uma porta dos fundos para pular
  permissões, masking de dados ou auditoria. O que é proibido na API é proibido no
  embed.
- **Embed antes da foundation.** Construir renderização embarcada antes de runtime,
  contrato e isolamento estarem prontos e testados viola o Princípio 1 — e não será
  feito.

---

## Estado atual e o que vem depois

Hoje o Delfos tem **foundation declarativa** que sustentará o embedding no futuro:
`tenants` e o modelo de isolamento (adr-0009), `dashboard-definitions`,
`report-definitions` e `query-definitions` como definições versionáveis, `audit` como
trilha, e `runtime`/`execution-preview` modelando execução sem executar.

O que **ainda não existe** e é gated por escopo aprovado e ADR: emissão de token de
embed, SDK/contrato de incorporação, renderização embarcada, sessão de embed. O caminho
de evolução está descrito no
[`embedded-analytics-roadmap.md`](../references/consolidated/embedded-analytics-roadmap.md);
o roadmap **descreve**, não autoriza.

Quando o embedding for construído, ele herdará — sem exceção — o modelo de isolamento de
tenant (adr-0009), o plano de auth como credencial de servidor (adr-0006, futuro) e a
disciplina de governança da fase atual.

---

## Relacionado

- [`./principles.md`](./principles.md) — keystone: os 12 princípios do Delfos
- [`./README.md`](./README.md) — índice da camada de filosofia de produto
- [`./runtime-philosophy.md`](./runtime-philosophy.md) — como o Delfos pensa execução e runtime
- [`./enterprise-governance-vision.md`](./enterprise-governance-vision.md) — governança enterprise
- [`./ux-philosophy.md`](./ux-philosophy.md) — experiência do usuário
- [`../references/consolidated/embedded-analytics-roadmap.md`](../references/consolidated/embedded-analytics-roadmap.md) — roadmap de analytics embarcado
- [`../references/consolidated/strategic-product-vision.md`](../references/consolidated/strategic-product-vision.md) — visão estratégica de produto
- [`../adr/adr-0009-deployment-isolation-and-tenant-model.md`](../adr/adr-0009-deployment-isolation-and-tenant-model.md) — isolamento e modelo de tenant
- [`../adr/adr-0006-jwt-self-managed-auth.md`](../adr/adr-0006-jwt-self-managed-auth.md) — auth self-managed (futuro)
- [`../adr/adr-0016-temporary-admin-key-auth.md`](../adr/adr-0016-temporary-admin-key-auth.md) — auth temporária por admin key
