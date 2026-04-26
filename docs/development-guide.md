# Guia de Desenvolvimento — Delfos Analytics

> Status: documento normativo  
> Escopo: boas práticas de implementação, organização e revisão.

Este guia transforma as regras do `AGENTS.md` em prática diária.

---

## 1. Antes de implementar

Sempre:

1. Leia `AGENTS.md`.
2. Leia o documento específico em `docs/`.
3. Verifique se já existe padrão parecido.
4. Confirme se a mudança pertence à Fase 1.
5. Identifique contratos afetados.
6. Planeje arquivos pequenos.
7. Escreva ou atualize testes.
8. Atualize documentação se necessário.

---

## 2. Tamanho de arquivos

Regra geral:

- até 300 linhas: aceitável
- 300–500 linhas: avaliar extração
- acima de 500 linhas: refatorar ou justificar documentalmente

Arquivos grandes costumam indicar mistura de responsabilidades.

---

## 3. Separação de responsabilidade

Evitar misturar:

- controller com regra de negócio
- service com acesso HTTP externo direto sem client dedicado
- componente visual com chamada HTTP
- DTO com model de banco
- regra de permissão com regra de layout
- transformação de dados com renderização

---

## 4. Padrão backend

Estrutura recomendada por módulo:

```text
modules/<module>/
  controllers/
  dto/
  services/
  repositories/
  schemas/
  guards/
  tests/
```

Nem todo módulo precisa de todas as pastas no início, mas a separação deve ser preservada quando crescer.

---

## 5. Padrão frontend

Seguir `delfos-web/docs/frontend-architecture.md`:

```text
features/<feature>/
  data/
  domain/
  application/
  presentation/
```

---

## 6. Naming

- Código: inglês
- Documentação: português brasileiro
- Commits: inglês convencional
- Mensagens de usuário: português brasileiro
- Tipos/classes: PascalCase
- Funções/variáveis: camelCase
- Arquivos TypeScript: kebab-case
- Arquivos Dart: snake_case

---

## 7. Tratamento de erro

Toda integração deve diferenciar:

- erro de validação
- erro de autenticação
- erro de permissão
- erro de conexão externa
- timeout
- rate limit
- erro inesperado

Nunca retornar stack trace ou payload sensível para o usuário final.

---

## 8. Logs

Logs devem ser estruturados e seguros.

Não logar:

- senha
- token
- chave privada
- credencial de API
- payload bruto sensível
- dados pessoais completos sem necessidade

Logar com contexto mínimo:

- tenantId
- userId, quando permitido
- connectionId/datasetId
- ação
- status
- duração
- correlação/requestId

---

## 9. Gambiarras

Solução temporária só é aceita quando:

- há motivo real
- existe comentário `TODO:` com contexto
- existe ticket ou plano de remoção
- não compromete segurança
- não vira contrato público

Nunca usar gambiarra para burlar arquitetura, permissão ou validação.

---

## 10. Testes mínimos

Para backend:

- unitários de service/use-case
- validação de DTO
- guards/permissões sensíveis
- integração de contratos principais

Para frontend:

- unitários de providers/helpers
- widget tests dos estados visuais
- testes de navegação crítica

---

## 11. Revisão antes de PR

Executar:

Backend:

```bash
npm run format:check
npm run lint
npm test
npm run build
```

Frontend:

```bash
flutter analyze
flutter test
flutter build web --release
```

---

## 12. Quando atualizar documentação

Atualizar docs quando mudar:

- arquitetura
- contrato público
- segurança
- permissões
- fluxo de dados
- biblioteca relevante
- padrão visual
- estrutura de projeto
- fase/escopo

---

## 13. Quando criar ADR

Criar ADR quando a decisão for difícil de reverter, afetar arquitetura ou criar padrão duradouro.

Exemplos:

- nova dependência estrutural
- mudança de banco
- mudança de autenticação
- adição de Redis/fila
- mudança no motor de gráficos
- mudança de estratégia de dados
