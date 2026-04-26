# Guia de Testes — Delfos Analytics

> Status: documento normativo  
> Escopo: testes mínimos para backend e frontend.

Testes existem para proteger contratos, segurança e evolução do produto.

---

## 1. Pirâmide de testes

Priorizar:

1. testes unitários de regra pura
2. testes de service/use-case
3. testes de contrato/API
4. testes de widget/estado visual
5. testes end-to-end das jornadas críticas

---

## 2. Backend

### Unitários

Cobrir:

- services
- guards
- validações
- mapeamentos
- normalizadores
- conectores
- cache service

### Integração

Cobrir:

- auth
- permissões
- CRUDs principais
- execução de dataset
- erro de API externa
- isolamento por tenant

### E2E

Cobrir jornadas:

- login
- criar tenant/usuário
- configurar conexão
- testar dataset
- consultar dashboard/relatório

---

## 3. Frontend

### Unitários

Cobrir:

- formatadores
- providers
- controllers
- mappers
- regras de filtro

### Widget tests

Toda tela com dados deve testar:

- loading
- vazio
- erro
- sem permissão
- configuração incompleta
- sucesso básico

### Integração

Cobrir:

- login
- navegação principal
- visualização de dashboard
- relatório com filtro

---

## 4. Testes de segurança

Obrigatórios em mudanças sensíveis:

- usuário sem permissão não acessa recurso
- usuário de outro tenant não acessa recurso
- token inválido é rejeitado
- input inválido é rejeitado
- credencial não aparece em resposta
- logs não contêm secret em cenários testáveis

---

## 5. Mocks

Mocks devem ser claros e pequenos.

Evitar:

- payload gigante sem necessidade
- mock que não representa contrato real
- duplicar fixtures em vários testes

Preferir fixtures compartilhadas por domínio.

---

## 6. APIs externas

Testes de conectores devem simular:

- sucesso
- timeout
- 401/403
- 429
- payload inválido
- paginação
- resposta vazia

Não depender de API real em teste automatizado.

---

## 7. Comandos

Backend:

```bash
npm test
npm run test:e2e
npm run test:cov
```

Frontend:

```bash
flutter test
flutter test integration_test
```

---

## 8. Cobertura

Cobertura é métrica auxiliar, não garantia de qualidade.

Prioridade é cobrir:

- segurança
- contratos
- regra de negócio
- mapeamento de dados
- estados visuais críticos

---

## 9. Antes do PR

- [ ] Testes novos para comportamento novo
- [ ] Testes antigos continuam passando
- [ ] Fixtures atualizadas
- [ ] Casos de erro cobertos
- [ ] Contratos atualizados quando necessário
