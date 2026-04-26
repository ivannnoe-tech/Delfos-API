---
name: delfos-api-mongo-modeling-review
description: Revise schemas Mongoose, collections MongoDB, índices, tenantId, metadados, De/Para, auditoria, dashboards e widgets.
---

# Skill — Modelagem MongoDB do Delfos

Use esta skill quando a tarefa envolver MongoDB, Mongoose, schemas, índices, collections, modelos de configuração, De/Para, auditoria, dashboards, widgets, relatórios ou white label.

## Quando não usar

Não use para payload bruto de API do cliente, cache analítico persistente ou ingestão operacional fora da Fase 1. Esses temas devem ser recusados ou remetidos à Fase 2.

## Leitura obrigatória antes de agir

- `AGENTS.md`
- `docs/database-model.md`
- `docs/data-access-policy.md`
- `docs/de-para.md`
- `docs/phase-1-scope.md`
- `docs/security-lgpd.md`

## Objetivo

Modelar apenas dados próprios do Delfos, mantendo isolamento por empresa e evitando armazenar dado operacional bruto de clientes na Fase 1.

## Fluxo obrigatório

1. Classificar o dado: configuração do Delfos, metadado, auditoria, credencial, dado pessoal ou dado operacional do cliente.
2. Confirmar se o dado pode existir na Fase 1.
3. Definir schema, índices, lifecycle, auditoria e soft delete quando aplicável.
4. Confirmar isolamento por `tenantId`.
5. Definir como dados sensíveis serão protegidos.
6. Evitar documento com crescimento ilimitado.

## O MongoDB pode armazenar na Fase 1

- empresas/tenants
- usuários e permissões
- conexões configuradas
- datasets declarativos
- De/Para de campos
- dashboards
- widgets
- relatórios
- layouts
- white label
- logs e auditoria
- preferências e metadados

## O MongoDB não deve armazenar na Fase 1

- venda bruta do cliente
- financeiro bruto do cliente
- estoque bruto do cliente
- payload operacional completo de API do cliente
- dados fiscais sensíveis sem necessidade
- cache analítico persistente fora do escopo aprovado

## Regras de modelagem

- Toda collection multi-tenant deve ter `tenantId`.
- Índices devem considerar `tenantId` + campos de consulta.
- Schemas devem ter timestamps quando útil.
- Nomes de campos internos em inglês.
- Documentos devem evitar crescimento ilimitado.
- Arrays grandes devem ser avaliados com cuidado.
- Soft delete deve ser considerado para configuração crítica.
- Auditoria deve existir para ações sensíveis.
- Criptografia/mascaramento deve ser considerado para credenciais e tokens.

## Checklist de schema

- O dado pertence ao Delfos ou ao cliente?
- Existe `tenantId` onde necessário?
- Há índice para as principais consultas?
- O schema evita documento gigante?
- Campos sensíveis estão protegidos?
- Há timestamps?
- Há auditoria para mudança crítica?
- O modelo respeita `docs/database-model.md`?

## Saída esperada

- collections alteradas/criadas;
- índices previstos;
- riscos de crescimento;
- campos sensíveis e estratégia de proteção;
- impacto em contratos ou frontend, se houver.
