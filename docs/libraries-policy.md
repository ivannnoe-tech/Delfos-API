# Política de Bibliotecas — Delfos Analytics

> Status: documento normativo  
> Escopo: escolha, aprovação e uso de dependências externas.

O Delfos deve evitar dependências desnecessárias, pagas ou restritivas. Toda biblioteca adicionada aumenta risco de segurança, manutenção, licença e bundle.

---

## 1. Regra principal

Não adicionar biblioteca nova sem justificar:

- problema resolvido
- alternativas consideradas
- licença
- manutenção ativa
- impacto no bundle/performance
- impacto em segurança
- necessidade real na Fase atual

Use `prompts/library-review-prompt.md` antes de propor uma nova dependência.

---

## 2. Licenças permitidas

Preferencialmente:

- MIT
- Apache-2.0
- BSD-2-Clause
- BSD-3-Clause
- ISC

Licenças com uso comercial permitido e baixo risco podem ser avaliadas caso a caso.

---

## 3. Licenças proibidas sem aprovação formal

Não usar sem aprovação explícita:

- GPL
- AGPL
- LGPL em pontos críticos
- SSPL
- licenças com copyleft forte
- licenças que restringem uso comercial
- componentes que exigem pagamento para produção
- trials disfarçados de grátis

---

## 4. Componentes pagos

A Fase 1 deve priorizar custo zero de componentes.

Biblioteca paga só pode entrar se:

- houver necessidade clara de negócio
- não existir alternativa viável
- custo estiver aprovado
- licença permitir white label/SaaS
- ADR for criado, quando relevante

---

## 5. Critérios técnicos

Avaliar:

- manutenção recente
- quantidade de issues críticas abertas
- compatibilidade com stack atual
- suporte a TypeScript/Dart forte
- tamanho do pacote
- tree-shaking
- API estável
- segurança conhecida
- facilidade de remoção futura

---

## 6. Backend

No `delfos-api`, novas libs devem evitar:

- wrappers obscuros para HTTP
- ORMs extras fora da decisão Mongo/Mongoose
- libs de criptografia sem maturidade
- libs que fazem magia com decorators sem necessidade
- SDKs que exigem credenciais amplas

---

## 7. Frontend

No `delfos-web`, novas libs devem evitar:

- componentes visuais prontos que quebrem o Design System
- bibliotecas pagas de gráfico sem aprovação
- libs que imponham estilo próprio difícil de customizar
- libs abandonadas
- dependências que aumentem muito o build web

---

## 8. Bibliotecas já aprovadas por direção atual

Backend:

- NestJS
- Mongoose
- axios via `@nestjs/axios`
- pino
- class-validator
- class-transformer
- Jest

Frontend:

- Flutter stable
- Riverpod
- go_router
- dio
- freezed
- json_serializable
- fl_chart
- graphic
- flutter_secure_storage
- intl

Qualquer substituição relevante exige ADR.

---

## 9. Remoção de dependências

Dependência não usada deve ser removida. Se uma biblioteca foi adicionada para experimento e não virou padrão, remover antes de merge.

---

## 10. Checklist antes de adicionar

- A funcionalidade não pode ser feita com a stack atual?
- A licença é segura?
- O pacote é mantido?
- O pacote é compatível com o produto?
- O custo é zero?
- Há testes cobrindo o uso?
- A documentação foi atualizada?
- O lockfile foi revisado?
