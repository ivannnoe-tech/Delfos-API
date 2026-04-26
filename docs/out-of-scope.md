# Fora de Escopo — Delfos Analytics

> Status: documento normativo  
> Escopo: limites claros da Fase 1.

Este documento evita que a Fase 1 cresça sem controle.

---

## 1. Fora de escopo técnico da Fase 1

Não implementar agora:

- ETL próprio
- data warehouse
- acesso direto ao banco de clientes
- armazenamento permanente de dados operacionais
- Redis obrigatório
- filas distribuídas
- workers complexos
- motor de alertas
- agendamento recorrente de relatórios
- app mobile nativo
- desktop app
- marketplace de conectores
- IA generativa embutida
- BI semântico completo
- editor visual avançado no nível Power BI

---

## 2. Fora de escopo de produto

Não prometer na Fase 1:

- substituir ERP/PDV do cliente
- corrigir dados na origem do cliente
- garantir disponibilidade da API do cliente
- criar API para o cliente do zero
- manter histórico que a API do cliente não entrega
- conciliação financeira completa
- fiscal/contábil avançado
- automações operacionais fora de analytics

---

## 3. Fora de escopo de suporte

O Delfos não assume:

- manutenção de rede do cliente
- manutenção de servidor do cliente
- correção em API de terceiro
- performance do banco do cliente
- treinamento amplo em sistemas externos

---

## 4. Como tratar pedido fora de escopo

Quando surgir demanda fora de escopo:

1. Registrar como ideia ou backlog futuro.
2. Avaliar se pertence à Fase 2.
3. Verificar impacto em arquitetura e LGPD.
4. Criar ADR se alterar decisão relevante.
5. Não implementar como gambiarra dentro da Fase 1.

---

## 5. Exceções

Exceções só são aceitas quando:

- há aprovação explícita
- há justificativa comercial forte
- há avaliação de segurança
- há atualização de documentação
- há ADR quando necessário
