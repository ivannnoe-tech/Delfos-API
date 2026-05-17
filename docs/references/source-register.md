# Source Register — Biblioteca de Referências

> Tipo: registro de fontes e licenças · Status: documento de auditoria — não autoriza implementação

## Propósito

Este documento registra, para fins de auditoria futura e proteção jurídica, as
fontes oficiais (repositório no GitHub, site oficial e licença vigente) dos 10
produtos open-source estudados de forma **conceitual** na biblioteca de
referências do Delfos Analytics (`docs/references/`).

O Delfos **não copia código nem telas** desses produtos. O estudo é
estritamente conceitual — observa padrões de arquitetura, modelagem de dados,
fluxos de UX e taxonomia de domínio — conforme estabelecido na
[ADR-0026](../adr/adr-0026-strategic-reference-library.md) e na
[ADR-0002](../adr/adr-0002-no-paid-components.md). Ainda assim, manter o
registro formal das fontes e suas licenças documenta a devida diligência do
projeto e protege juridicamente a equipe.

## Critério de "Risco de licença"

A coluna **Risco de licença** classifica cada produto sob o cenário real do
Delfos: **uso apenas conceitual, sem cópia de código ou de telas**. Sob essa
regra, a licença do produto de referência **não cria obrigação jurídica** para
o Delfos — restrições de licenças open-source (incluindo copyleft e licenças
restritivas) só seriam acionadas se houvesse derivação ou redistribuição de
código, o que é **proibido** pela ADR-0026 independentemente da licença.

A classificação serve como sinalização preventiva, não como impedimento:

- **`Baixo`** — licença permissiva (Apache-2.0, MIT) ou irrelevante sob a regra
  de não-cópia. Nenhuma preocupação adicional.
- **`Atenção`** — copyleft forte (AGPL-3.0) ou licença restritiva/source-available
  (Elastic License 2.0, FSL/BSL e similares). Relevante **somente se** algum dia
  houvesse derivação de código — cenário hoje proibido. Mantido como alerta caso
  o escopo de estudo mude no futuro.
- **`Alto`** — não aplicável a nenhum produto desta lista no momento; reservado
  para o caso de uma fonte tornar-se proprietária/closed-source ou impor termos
  incompatíveis com mero estudo conceitual.

> Reforço jurídico: **a cópia de código ou de telas é proibida em qualquer
> hipótese**, qualquer que seja a licença. A coluna de risco não relaxa essa
> regra — apenas mede a exposição residual hipotética.

## Registro de fontes (10 produtos)

| Produto | Repositório / Site oficial | Data da verificação | Licença | Risco de licença | Observação |
|---|---|---|---|---|---|
| Metabase | <https://github.com/metabase/metabase> · <https://www.metabase.com> | 2026-05-17 | AGPL-3.0 (core) + Metabase Commercial License (enterprise) | Atenção | Open-core: código fora do diretório `enterprise/` é AGPL-3.0; o diretório `enterprise/` é source-available sob licença comercial e exige chave paga. |
| Apache Superset | <https://github.com/apache/superset> · <https://superset.apache.org> | 2026-05-17 | Apache-2.0 | Baixo | Projeto da Apache Software Foundation, 100% open-source sob licença permissiva única. |
| Chartbrew | <https://github.com/chartbrew/chartbrew> · <https://chartbrew.com> | 2026-05-17 | FSL-1.1-MIT (Functional Source License v1.1) | Atenção | Licença source-available com restrição comercial; cada versão converte automaticamente para MIT 2 anos após o lançamento. Existe oferta comercial/cloud paralela. |
| Cube | <https://github.com/cube-js/cube> · <https://cube.dev> | 2026-05-17 | Apache-2.0 (backend) + MIT (client) | Baixo | Licença mista permissiva: backend Apache-2.0, pacotes cliente MIT. Edições Cloud/Enterprise são comerciais e fora do repositório. |
| Airbyte | <https://github.com/airbytehq/airbyte> · <https://airbyte.com> | 2026-05-17 | Elastic License 2.0 (ELv2) — core e conectores; MIT — protocolo e CDK | Atenção | Licença mista: core e conectores sob ELv2 (source-available, restringe uso como serviço gerenciado); `airbyte-protocol` e o CDK são MIT. Airbyte Cloud/Enterprise são closed-source. |
| WrenAI | <https://github.com/Canner/WrenAI> · <https://getwren.ai> | 2026-05-17 | Apache-2.0 (core/SDK/skills/examples) + CC BY 4.0 (docs) | Baixo | Multi-licença por caminho do repositório; badge oficial indica Apache-2.0. O arquivo `LICENSE` reserva AGPL-3.0 para módulos futuros ainda não publicados — reverificar em estudos posteriores. |
| Vanna AI | <https://github.com/vanna-ai/vanna> · <https://vanna.ai> | 2026-05-17 | MIT | Baixo | Framework Python RAG sob licença permissiva única. Existe oferta Vanna Premium comercial, separada do repositório open-source. |
| Lightdash | <https://github.com/lightdash/lightdash> · <https://lightdash.com> | 2026-05-17 | MIT (core) + licença enterprise (diretório `packages/backend/src/ee`) | Baixo | Open-core: núcleo MIT; o diretório `ee/` tem licença própria de enterprise (chave `LIGHTDASH_LICENSE_KEY`). Núcleo permissivo, baixo risco. |
| Evidence | <https://github.com/evidence-dev/evidence> · <https://evidence.dev> | 2026-05-17 | MIT | Baixo | "Business intelligence as code" sob licença permissiva única. |
| NocoBase | <https://github.com/nocobase/nocobase> · <https://www.nocobase.com> | 2026-05-17 | AGPL-3.0 (core + plugins open-source) | Atenção | Modelo dual: core e plugins open-source sob AGPL-3.0; plugins comerciais e remoção de copyright/branding exigem licença comercial paga. |

## Como manter

- Ao adicionar uma nova referência à biblioteca (`docs/references/`), **registre
  também a nova linha nesta tabela** no mesmo PR — ver
  [ADR-0026](../adr/adr-0026-strategic-reference-library.md).
- Verifique sempre a licença na **fonte oficial** (arquivo `LICENSE` do
  repositório e/ou página de licenciamento do site), nunca por presunção.
- **Reverifique periodicamente** as licenças já registradas: mudanças de licença
  são comuns no ecossistema open-source (relicenciamento, adoção de modelo
  source-available, criação de diretórios enterprise). Atualize a "Data da
  verificação" e a "Observação" sempre que houver mudança.
- Qualquer reclassificação para `Alto` deve disparar revisão de escopo antes de
  manter o produto como referência.

## Relacionado

- [README da biblioteca de referências](./README.md)
- [ADR-0026 — Strategic Reference Library](../adr/adr-0026-strategic-reference-library.md)
- [ADR-0002 — No Paid Components](../adr/adr-0002-no-paid-components.md)
