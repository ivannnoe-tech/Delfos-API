---
name: delfos-api-ci-fix-review
description: Corrija falhas de CI/build/test/lint no delfos-api com análise da causa raiz, mudanças mínimas e validação por comandos.
---

# Skill — Correção de CI, build e testes do delfos-api

Use esta skill quando houver falha em `npm run lint`, `npm run test`, `npm run build`, GitHub Actions, typecheck, dependências ou validação pré-commit.

## Quando não usar

Não use para refatoração grande ou implementação nova disfarçada de correção. Se a falha revelar problema estrutural, use também `delfos-api-execution-plan`.

## Leitura obrigatória

- `AGENTS.md`
- `docs/development-guide.md`
- `docs/testing-guide.md`
- `docs/quality-checklist.md`
- `docs/libraries-policy.md`

## Fluxo obrigatório

1. Ler a mensagem de erro completa antes de editar.
2. Identificar causa raiz, não apenas silenciar o erro.
3. Fazer a menor alteração segura possível.
4. Não desativar testes, lint, strict mode ou regras de qualidade para “passar”.
5. Rodar novamente o comando que falhou.
6. Se a correção exigir biblioteca nova, aplicar `docs/libraries-policy.md` antes.
7. Se não for possível validar, informar claramente o motivo.

## Proibido

- Comentar teste que falha sem justificar.
- Reduzir cobertura ou remover validação para passar no CI.
- Usar `any`, `// @ts-ignore` ou bypass sem justificativa documentada.
- Alterar contrato público só para corrigir teste local.
- Rodar comando destrutivo sem autorização explícita.

## Saída esperada

```text
Correção de CI/build/test
- Erro original:
- Causa raiz:
- Arquivos alterados:
- Correção aplicada:
- Comandos executados:
- Resultado:
- Riscos/pendências:
```
