# Cube — Anti-padrões e o que evitar

> Tipo: referência estratégica · Produto estudado: Cube · Status: conceitual/futuro — não autoriza implementação

---

## Nota de contexto

Esta seção lista problemas observados no Cube e em seu ecossistema. Não é crítica ao produto — Cube é uma referência sólida de semantic layer. É um filtro: o que o Delfos **não deve reproduzir** ao se inspirar. Cada item traz a lição aplicável.

---

## Problemas observados

### Fragmentação Core vs. Cloud

O Cube divide funcionalidade entre **Cube Core** (open-source) e **Cube Cloud** (pago). Features importantes — Cube Store gerenciado, D3, observability avançada — ficam atrás do produto pago, criando zonas cinzentas sobre "o que realmente é open-source".

**Lição para o Delfos:** manter escopo único e claro. Evitar uma divisão prematura de produto que confunda o que está incluído. (Reforça `adr-0002-no-paid-components`.)

### Curva de aprendizado do data modeling

Modelar corretamente joins, refresh keys, particionamento de pre-aggregations e `COMPILE_CONTEXT` exige experiência real. Erros de modelagem geram resultados sutilmente errados — o pior tipo de bug em analytics.

**Lição:** a camada semântica do Delfos deve ter padrões seguros por default e validação forte; não transferir complexidade para o usuário sem trilho.

---

## UX ruim

### Headless empurra UX para o consumidor

Sendo headless, o Cube não entrega experiência de uso pronta — loading, empty, error, responsividade são problema de quem consome. Cada integrador resolve de um jeito, gerando inconsistência.

**Lição:** o Delfos **não** deve ser headless. `delfos-web` é a camada de apresentação definida, com estados obrigatórios padronizados (`DelfosLoadingState`, `DelfosEmptyState`, `DelfosErrorState`, `DelfosPermissionState`). Manter assim.

### Playground não é ferramenta de produto

O Playground é ótimo para modelar/explorar, mas não é uma experiência de BI para usuário final. Confundir os dois leva a expor um ambiente técnico a quem só quer consumir um número.

**Lição:** separar claramente a experiência de **modelagem** (técnica) da experiência de **consumo** (negócio).

---

## Complexidade excessiva

### Pre-aggregations como fonte de complexidade

Pre-aggregations são poderosas, mas exigem decidir granularidade, particionamento, refresh keys e roteamento de rollup. Mal configuradas, geram dados obsoletos ou refresh caro.

**Lição:** o Delfos **não** deve implementar materialização na fase foundation (`adr-0007`). Se um dia adotar, deve ser via contrato declarativo explícito, nunca como mágica implícita.

### Múltiplas APIs = múltiplas superfícies de manutenção

REST, GraphQL, SQL, MDX, Python — cada API é uma superfície a manter, testar, versionar e proteger.

**Lição:** o Delfos deve manter uma superfície de API enxuta e coerente. Não adicionar protocolos por completude; cada API precisa de demanda real.

---

## Gargalos

### Refresh worker no caminho crítico

Se o refresh de pre-aggregations não roda como processo separado, a materialização compete com queries de usuário e degrada latência.

**Lição:** qualquer processamento pesado futuro do Delfos deve ser isolado do caminho de requisição síncrona — alinhado com a separação entre `runtime` declarativo e execução futura.

### Cube Store como ponto único

Quando pre-aggregations centralizam o serviço, a saúde do Cube Store determina a saúde de toda a plataforma.

**Lição:** evitar criar um componente central de cuja saúde tudo dependa sem estratégia de degradação graciosa.

---

## Problemas arquiteturais

### Acoplamento ao schema do warehouse

O data model referencia tabelas/colunas das fontes. Quando o schema do warehouse muda, o modelo quebra silenciosamente até alguém perceber.

**Lição:** o Delfos já isola isso com `field-mappings` e `connectionId` como referência de config. Manter esse desacoplamento e adicionar validação de drift entre `field-mappings` e fonte.

### `COMPILE_CONTEXT` por tenant pode explodir

Gerar um modelo de dados distinto por tenant via `COMPILE_CONTEXT` resolve casos complexos, mas multiplica o custo de compilação e teste. Difícil de raciocinar em escala.

**Lição:** preferir isolamento por filtro (`tenantId` obrigatório derivado do contexto) ao invés de um modelo distinto por tenant. Modelo único, dados isolados.

### Segredos no JWT / security context

Carregar dados sensíveis demais no security context (que viaja no token) é um risco; tokens vazam, são logados, expiram mal.

**Lição:** o Delfos já trata isso — `credentialRef` nunca é o segredo, `connectionId` nunca é a connection string. Nunca colocar segredo em contexto que trafega. (Ver `adr-0019`, `adr-0020`.)

---

## Decisões que NÃO queremos reproduzir

| Decisão do ecossistema Cube | Por que evitar no Delfos |
|---|---|
| Fragmentar features entre open-source e pago | Confunde escopo; conflita com `adr-0002` |
| Ser headless sem camada de apresentação própria | Delfos tem `delfos-web` com UX padronizada |
| Materialização/cache na fase foundation | Viola `adr-0007`; complexidade prematura |
| Modelo de dados distinto por tenant | Multiplica custo; preferir isolamento por filtro |
| Expor ambiente técnico (Playground) como produto final | Mistura modelagem e consumo |
| Acumular protocolos de API sem demanda | Cada API é custo de manutenção e segurança |
| Dados sensíveis no token/security context | Risco de vazamento; conflita com invariantes de segredo |
| SQL livre do consumidor | Viola a invariante anti-concatenação do Delfos |

---

## Síntese

O Cube acerta na **camada semântica** e na **governança de métricas** — é dali que o Delfos deve se inspirar. O Cube tropeça na **complexidade operacional** (pre-aggregations, refresh, Cube Store) e na **fragmentação de produto**. O Delfos deve absorver os conceitos declarativos e de governança, e deliberadamente recusar a camada de execução/materialização até que haja ADR, autorização e maturidade — mantendo a fase foundation enxuta e coerente.

---

## Relacionado

- [./overview.md](./overview.md)
- [./architecture.md](./architecture.md)
- [./ux-patterns.md](./ux-patterns.md)
- [./premium-features.md](./premium-features.md)
- [./ideas-for-delfos.md](./ideas-for-delfos.md)
- ADRs: [../../adr/adr-0002-no-paid-components.md](../../adr/adr-0002-no-paid-components.md), [../../adr/adr-0007-no-cache-redis-phase-1.md](../../adr/adr-0007-no-cache-redis-phase-1.md), [../../adr/adr-0019-credential-encryption-and-rotation.md](../../adr/adr-0019-credential-encryption-and-rotation.md), [../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md](../../adr/adr-0020-metadata-sanitization-and-forbidden-fields.md)
