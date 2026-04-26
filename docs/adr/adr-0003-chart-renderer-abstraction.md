# ADR-0003 — ChartRenderer abstraction over fl_chart + graphic

- **Status**: Accepted
- **Data**: 2026-04-25
- **Fase impactada**: Fase 1 e Fase 2

---

## Contexto

Gráficos são parte central do produto (dashboards, KPIs, comparativos, rankings). Existem boas opções gratuitas no ecossistema Flutter:

- **`fl_chart`** (MIT) — fácil, popular, cobre bem barras, linhas, área, pizza, rosca. Limitado em gráficos complexos e customizações.
- **`graphic`** (Apache-2.0) — declarativo no estilo Vega/ggplot, muito flexível, melhor para gráficos não-triviais. Curva de aprendizado maior.
- **`charts_flutter`** (Google) — descontinuado.
- **Soluções pagas** (Syncfusion etc.) — descartadas por ADR-0002.

Acoplar telas diretamente a uma lib específica cria duas dores:

1. Trocar a lib no futuro vira refatoração massiva.
2. Quando uma lib não cobre um gráfico, a tela acaba importando uma segunda lib direto, e a base do código fica heterogênea.

---

## Decisão

Adotamos `fl_chart` para gráficos básicos (barras, linhas, área, pizza, rosca, KPI mini-charts) e `graphic` para gráficos complexos (composições, sobreposições, comparativos avançados).

**Nenhum código em `features/` importa `fl_chart` ou `graphic` diretamente.** Toda visualização passa por um único contrato:

```dart
// lib/shared/charts/chart_renderer.dart
class ChartRenderer extends StatelessWidget {
  final ChartSpec spec;
  const ChartRenderer({required this.spec, super.key});
  // ...
}
```

`ChartSpec` é um sealed type (`BarSpec`, `LineSpec`, `AreaSpec`, `PieSpec`, `DonutSpec`, `RankingSpec`, `ComparisonSpec`, `KpiSpec`...). Internamente, o `ChartRenderer` dispatcha para o adapter correto:

- `lib/shared/charts/adapters/fl_chart_adapter.dart` — implementa specs simples
- `lib/shared/charts/adapters/graphic_adapter.dart` — implementa specs complexos

Adapters são detalhe interno e podem ser substituídos sem alterar `features/`.

---

## Alternativas consideradas

- **Apenas `fl_chart`** — insuficiente para gráficos complexos planejados na roadmap
- **Apenas `graphic`** — overkill para barras/linhas simples; curva mais alta para a equipe
- **Sem abstração, escolher caso a caso por tela** — leva à heterogeneidade já discutida
- **Construir lib própria do zero** — não justifica o custo na Fase 1

---

## Consequências

### Positivas

- Telas dependem de **1 contrato**, não de **2 libs**
- Trocar `fl_chart` ou `graphic` no futuro = trocar 1 adapter
- Permite mock de `ChartRenderer` em testes sem mockar lib externa
- Facilita white label visual (cores, fontes, espaçamento) — tudo concentrado na camada do `ChartRenderer`

### Negativas / trade-offs aceitos

- Camada extra de código de tradução (spec → API da lib)
- Necessidade de definir e manter `ChartSpec` à medida que novos tipos de gráfico aparecem
- Risco de "lowest common denominator" — para evitar, o spec é tipado e específico por tipo de gráfico

### Neutras

- Lint customizado pode bloquear `import 'package:fl_chart/...'` e `import 'package:graphic/...'` fora de `lib/shared/charts/adapters/`

---

## Impacto na Fase 1

- Criar `lib/shared/charts/` com `chart_renderer.dart`, `chart_spec.dart`, `adapters/fl_chart_adapter.dart`, `adapters/graphic_adapter.dart`
- Implementar specs mínimos da Fase 1: `BarSpec`, `LineSpec`, `AreaSpec`, `PieSpec`, `DonutSpec`, `RankingSpec`, `ComparisonSpec`, `KpiSpec`
- Documentar contrato em `docs/chart-renderer.md` (no `delfos-web`)
- Adicionar lint que bloqueia import direto fora de `adapters/` (ex.: `custom_lint` rule)

## Impacto futuro / Fase 2

- Migração para outra lib (ex: `syncfusion_flutter_charts` se algum dia for liberada como FOSS, ou WebGL-based) é local: trocar/adicionar adapter
- Se aparecer gráfico que nenhuma das duas libs cobre, criar adapter próprio sem afetar `features/`

---

## Referências

- `delfos-web/docs/chart-renderer.md`
- ADR-0002 (sem componentes pagos)
- `delfos-web/lib/shared/charts/`
