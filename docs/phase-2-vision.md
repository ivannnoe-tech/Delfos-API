# Visão da Fase 2 — Delfos Analytics

> Status: visão futura, não escopo atual  
> Objetivo: registrar possibilidades futuras sem antecipar complexidade na Fase 1.

A Fase 2 só deve ser iniciada após validação comercial e técnica da Fase 1.

---

## 1. Princípio

A Fase 2 pode transformar o Delfos de consumidor de APIs em uma plataforma analítica com ingestão própria, histórico, cache persistente e automações. Isso não autoriza antecipar essas decisões na Fase 1.

---

## 2. Possíveis capacidades

- ingestão recorrente de dados
- banco analítico próprio
- snapshots históricos
- cache persistente
- Redis
- filas e workers
- alertas e notificações
- agendamento de relatórios
- conectores dedicados por sistema
- camada semântica
- pré-agregações
- auditoria analítica avançada
- APIs públicas do Delfos para terceiros

---

## 3. Motivos para evoluir

Sinais de que a Fase 2 pode ser necessária:

- APIs dos clientes são lentas demais
- dashboards precisam de histórico não oferecido pelo cliente
- muitos clientes pedem o mesmo conector
- exportações ficam pesadas
- rate limits externos impedem experiência fluida
- há demanda por alertas automáticos
- múltiplas instâncias exigem cache compartilhado

---

## 4. Decisões que exigirão ADR

Antes da Fase 2, criar ADR para:

- tipo de banco analítico
- estratégia de ingestão
- estratégia de fila
- uso de Redis
- retenção de dados operacionais
- modelo LGPD de armazenamento
- política de exclusão
- conectores dedicados
- custos de infraestrutura

---

## 5. O que não deve ser feito agora

Não antecipar na Fase 1:

- worker complexo
- data warehouse
- ETL genérico completo
- scheduler distribuído
- histórico persistente
- processamento assíncrono pesado
- Redis obrigatório
- contratos de ingestão definitivos

---

## 6. Arquitetura preparada

Mesmo sem implementar Fase 2, a Fase 1 deve deixar portas abertas:

- contratos claros
- `delfos-connectors` isolado
- um futuro serviço de cache: **não existe `CacheService` hoje** — é apenas uma
  interface a ser definida na Fase 2, com tecnologia agnóstica
- dashboards dependentes de contrato, não da origem concreta
- field mappings versionáveis
- auditoria básica desde o início

---

## 7. Critério para começar

A Fase 2 só começa quando houver:

- clientes reais usando a Fase 1
- dores mensuráveis
- orçamento para infraestrutura
- prioridades comerciais claras
- revisão de LGPD
- ADRs aprovados
