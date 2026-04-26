---
name: delfos-api-testing-quality-review
description: "Revise qualidade final do delfos-api: testes, lint, build, CI, Definition of Done, contratos, segurança e critérios de aceite."
---

# Skill — Testes e Qualidade do delfos-api

Use esta skill quando a tarefa envolver testes, revisão final, lint, build, CI, qualidade, DoD ou validação antes de commit/PR.

## Quando não usar

Não use como substituta de uma skill específica. Para contrato, segurança ou MongoDB, use também a skill especializada correspondente.

## Leitura obrigatória antes de agir

- `AGENTS.md`
- `docs/testing-guide.md`
- `docs/quality-checklist.md`
- `docs/development-guide.md`
- `docs/security-checklist.md`

## Objetivo

Garantir que a entrega seja pequena, testável, segura, legível e alinhada à fase atual.

## Fluxo obrigatório

1. Identificar o tipo de mudança e o risco.
2. Conferir se há testes proporcionais ao risco.
3. Rodar ou indicar os comandos de validação existentes.
4. Conferir documentação/contratos quando aplicável.
5. Revisar tamanho de arquivos, duplicação, tipagem e tratamento de erros.
6. Validar se o DoD do `AGENTS.md` foi cumprido.

## Tipos de teste esperados

- unitários para services, helpers e regras puras
- testes de controllers para contratos HTTP
- testes de validação de DTO
- testes de permissão/autorização quando aplicável
- testes de erro externo em integrações
- testes de repositório quando houver lógica relevante de consulta

## Regras de qualidade

- Nada de arquivo monolítico.
- Nada de duplicação óbvia.
- Nada de `any` sem justificativa.
- Nada de erro engolido silenciosamente.
- Nada de biblioteca nova sem revisão.
- Nada de comportamento fora da Fase 1.
- Nada de secret ou dado real em fixture.
- Código deve ser claro antes de ser esperto.

## Comandos esperados

Quando existirem no projeto, validar:

```bash
npm run lint
npm run test
npm run build
```

Se algum comando ainda não existir, apontar claramente e propor a criação sem inventar resultado.

## Checklist final

- A mudança compila?
- A mudança tem testes proporcionais?
- O contrato foi atualizado?
- A documentação foi atualizada quando necessário?
- O código respeita tamanho máximo de arquivo?
- A segurança foi revisada?
- A LGPD foi considerada?
- O DoD do `AGENTS.md` foi cumprido?

## Saída esperada

```text
Validação final
- Comandos executados:
- Resultado:
- Testes adicionados/ausentes:
- Riscos restantes:
- Pendências antes de commit/PR:
```
