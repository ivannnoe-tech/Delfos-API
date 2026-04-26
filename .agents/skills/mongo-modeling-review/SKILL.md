---
name: delfos-api-mongo-modeling-review
description: Use para criar ou revisar schemas Mongoose, índices, modelos de configuração, multi-tenancy, De/Para, dashboards, widgets, auditoria e metadados no MongoDB.
---

# Skill — Modelagem MongoDB do Delfos

Use esta skill quando a tarefa envolver MongoDB, Mongoose, schemas, índices, collections, modelos de configuração, De/Para, auditoria, dashboards, widgets, relatórios ou white label.

## Leitura obrigatória antes de agir

- `AGENTS.md`
- `docs/database-model.md`
- `docs/data-access-policy.md`
- `docs/de-para.md`
- `docs/phase-1-scope.md`
- `docs/security-lgpd.md`

## Objetivo

Modelar apenas dados próprios do Delfos, mantendo isolamento por empresa e evitando armazenar dado operacional bruto de clientes na Fase 1.

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
