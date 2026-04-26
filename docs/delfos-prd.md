# PRD — Delfos Analytics

> Status: versão inicial  
> Produto: Delfos Analytics  
> Fase: 1

---

## 1. Problema

Empresas precisam acompanhar indicadores, vendas, operação, financeiro e relatórios, mas cada cliente possui sistemas e APIs diferentes. Soluções fixas exigem customizações repetidas e difíceis de manter.

O Delfos resolve isso com uma plataforma analítica configurável, capaz de consumir APIs custom dos clientes e montar dashboards/relatórios sem reescrever o produto para cada caso.

---

## 2. Objetivo

Permitir que clientes e parceiros tenham uma experiência de BI simples, customizável e white label, com baixo custo inicial e arquitetura preparada para evolução.

---

## 3. Público-alvo

- empresas que precisam de painéis administrativos
- grupos com múltiplas unidades
- parceiros white label
- clientes que já possuem APIs próprias
- equipes que precisam de dashboards e relatórios personalizados

---

## 4. Proposta de valor

- dashboards personalizados
- relatórios configuráveis
- consumo de APIs existentes do cliente
- De/Para flexível
- white label
- controle de usuários e permissões
- sem exigir acesso ao banco do cliente
- implantação mais segura e menos invasiva

---

## 5. Funcionalidades da Fase 1

- autenticação
- gestão de tenants
- gestão de usuários
- permissões
- conexões com APIs
- datasets
- De/Para
- dashboard builder
- report builder
- widgets de gráfico/KPI/tabela
- tema claro/escuro
- white label básico
- auditoria
- exportações iniciais

---

## 6. Não objetivos da Fase 1

- data warehouse próprio
- ETL recorrente
- app mobile nativo
- IA embarcada
- acesso direto ao banco do cliente
- substituir sistema operacional do cliente
- histórico analítico próprio

---

## 7. Métricas de sucesso

- tempo para configurar primeiro cliente
- tempo de carregamento de dashboards
- quantidade de widgets configurados sem código
- taxa de erros em conectores
- quantidade de relatórios exportados
- satisfação visual/usabilidade
- número de customizações evitadas por De/Para

---

## 8. Personas iniciais

### Administrador do cliente

Configura usuários, permissões, dashboards e relatórios.

### Gestor operacional

Consulta indicadores e relatórios para tomada de decisão.

### Parceiro white label

Oferece a solução com marca própria para sua carteira.

### Administrador Delfos

Gerencia tenants, suporte, configurações e auditoria.

---

## 9. Requisitos não funcionais

- segurança por tenant
- responsividade web
- tema claro e escuro
- componentes reutilizáveis
- baixo custo de infraestrutura
- logs seguros
- LGPD desde o início
- documentação viva
- sem bibliotecas pagas na Fase 1

---

## 10. Riscos

- APIs de clientes lentas ou instáveis
- contratos muito diferentes entre clientes
- excesso de customização sem padrão
- dashboards complexos demais na primeira versão
- expectativa de histórico sem ingestão própria

---

## 11. Mitigações

- motor genérico de conectores
- De/Para por dataset
- cache transitório
- limites claros de escopo
- componentes padronizados
- ADRs para decisões relevantes
