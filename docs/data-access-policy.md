# Política de Acesso a Dados — Delfos Analytics

> Status: documento normativo  
> Escopo: acesso, uso, armazenamento e exposição de dados entre Delfos e clientes.

Esta política define como o Delfos acessa dados na Fase 1. Ela existe para reduzir risco técnico, jurídico e operacional.

---

## 1. Regra principal

Na Fase 1, o Delfos acessa dados operacionais **somente via APIs expostas pelos clientes**.

Não é permitido:

- acessar banco de dados do cliente diretamente
- armazenar cópia permanente dos dados operacionais do cliente
- criar réplica local de vendas, pedidos, estoque ou financeiro
- executar queries em bancos de produção dos clientes
- aceitar credenciais de banco de dados do cliente como caminho padrão

---

## 2. O que o Delfos pode armazenar

O banco do Delfos pode armazenar configurações necessárias para operar a plataforma:

- tenants
- usuários
- permissões
- conexões
- credenciais criptografadas
- datasets
- field mappings
- dashboards
- widgets
- relatórios
- preferências
- white label
- logs e auditoria

---

## 3. O que o Delfos não pode armazenar na Fase 1

Não armazenar permanentemente:

- vendas do cliente
- pedidos
- produtos operacionais
- estoque
- clientes finais
- dados financeiros operacionais
- dados fiscais
- transações de pagamento
- payload bruto retornado por API do cliente
- histórico analítico próprio

Exceção: logs técnicos mínimos e anonimizados/mascarados para diagnóstico, quando indispensáveis.

---

## 4. Cache permitido

Cache transitório em memória é permitido quando:

- há TTL curto
- chave inclui `tenantId` e `datasetId`
- não persiste em disco
- não expõe dados entre tenants
- respeita configuração do dataset
- pode ser invalidado manualmente

Ver ADR-0007.

---

## 5. Isolamento por tenant

Todo acesso deve validar:

- usuário autenticado
- tenant selecionado/autorizado
- permissão para a ação
- recurso pertencente ao tenant

Nenhuma consulta tenant-scoped deve buscar recurso apenas por ID global.

---

## 6. Credenciais

Credenciais de APIs de clientes devem:

- ser criptografadas em repouso
- nunca aparecer em logs
- nunca retornar ao frontend após salvas
- ser exibidas apenas mascaradas
- ter rotação possível
- ter escopo mínimo necessário

---

## 7. APIs externas

Toda chamada para API de cliente deve aplicar:

- validação de URL base
- bloqueio de hosts internos quando aplicável
- allowlist de métodos
- allowlist de headers
- timeout
- limite de tamanho de resposta
- tratamento de erro
- rate limit por conexão
- auditoria quando sensível

---

## 8. Dados sensíveis e LGPD

O Delfos deve reduzir coleta e exposição de dados pessoais.

Diretrizes:

- buscar somente campos necessários
- mascarar informações sensíveis em logs
- evitar payload bruto em erro
- permitir auditoria de acesso
- respeitar retenção mínima
- diferenciar dado operacional de dado de configuração

Ver `docs/security-lgpd.md`.

---

## 9. Exportações

Exportações devem respeitar:

- permissões do usuário
- filtros aplicados
- tenant atual
- campos permitidos
- mascaramento quando necessário
- auditoria de quem exportou, quando exportação contiver dado sensível

---

## 10. Mudanças de política

Qualquer proposta de armazenar dados operacionais, criar ingestão, conectar direto em banco de cliente ou usar cache persistente exige ADR antes da implementação.
