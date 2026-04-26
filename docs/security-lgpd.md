# Segurança e LGPD — Delfos Analytics

> Status: documento normativo  
> Escopo: práticas de segurança, privacidade e proteção de dados.

O Delfos deve operar com coleta mínima, isolamento por tenant e exposição controlada de dados.

---

## 1. Princípios

- menor privilégio
- coleta mínima
- finalidade clara
- segregação por tenant
- criptografia de credenciais
- logs seguros
- auditoria de ações sensíveis
- retenção mínima necessária

---

## 2. Dados pessoais

Dados pessoais podem aparecer quando APIs dos clientes retornam informações de clientes finais, vendedores, usuários ou responsáveis.

Na Fase 1, o Delfos deve evitar persistir esses dados. Quando exibir, deve respeitar permissões e finalidade.

---

## 3. Dados sensíveis

Tratar com cuidado:

- CPF/CNPJ
- e-mail
- telefone
- endereço
- dados financeiros
- dados fiscais
- tokens
- credenciais

Não logar valores completos.

---

## 4. Credenciais de APIs externas

Obrigatório:

- criptografia em repouso
- redaction em logs
- mascaramento no frontend
- rotação possível
- escopo mínimo
- não retornar secret após cadastro

---

## 5. Logs

Logs devem evitar dados pessoais e operacionais.

Permitido:

- IDs técnicos
- status
- duração
- códigos de erro
- contexto mínimo

Evitar:

- payload bruto
- token
- senha
- chave privada
- documento pessoal completo
- cartão ou dados de pagamento

---

## 6. Auditoria

Auditar:

- login relevante
- alteração de usuários
- alteração de permissões
- alteração de conexão
- alteração de credenciais
- alteração de De/Para
- exportações sensíveis
- alterações de white label

Auditoria deve registrar ação e contexto sem expor segredo.

---

## 7. Exportações

Exportações são ponto de risco.

Regras:

- exigir permissão
- aplicar filtros atuais
- auditar quando contiver dado sensível
- mascarar campos quando política exigir
- não exportar campo oculto por permissão

---

## 8. Retenção

Na Fase 1:

- configurações ficam enquanto o tenant existir
- logs têm retenção definida por ambiente
- cache é transitório
- dados operacionais não são persistidos

Política formal de retenção deve ser revisada antes da Fase 2.

---

## 9. Direitos do titular

Quando o Delfos armazenar dados pessoais próprios, como usuários administrativos, deve permitir processos para:

- correção
- exclusão/inativação
- auditoria de acesso
- exportação quando aplicável

Dados de clientes finais, quando vierem da API do cliente, continuam sob responsabilidade primária do cliente/controlador.

---

## 10. Revisão obrigatória

Qualquer mudança que aumente coleta, retenção ou exposição de dados exige revisão de segurança e, se relevante, ADR.
