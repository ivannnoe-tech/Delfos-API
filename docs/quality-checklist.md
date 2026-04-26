# Checklist de Qualidade — Delfos Analytics

> Status: checklist obrigatório antes de PR.

---

## 1. Escopo

- [ ] A mudança pertence à Fase atual.
- [ ] Não implementa item fora de escopo.
- [ ] Não antecipa complexidade da Fase 2.
- [ ] Documentação de escopo foi consultada.

---

## 2. Arquitetura

- [ ] Responsabilidades estão separadas.
- [ ] Arquivos não ficaram grandes demais.
- [ ] Não há duplicação desnecessária.
- [ ] Contratos públicos foram revisados.
- [ ] ADR criado se necessário.

---

## 3. Segurança

- [ ] Permissões validadas no backend.
- [ ] Tenant validado em recursos tenant-scoped.
- [ ] Secrets não aparecem em código/logs.
- [ ] Inputs são validados.
- [ ] Erros são sanitizados.

---

## 4. Dados

- [ ] Não persiste dado operacional do cliente na Fase 1.
- [ ] Cache, se usado, é transitório e isolado.
- [ ] De/Para foi validado.
- [ ] Exportação respeita permissões.

---

## 5. Frontend

- [ ] Usa Design System.
- [ ] Funciona em tema claro e escuro.
- [ ] Tem loading/empty/error/permission.
- [ ] É responsivo.
- [ ] Gráficos usam `ChartRenderer`.
- [ ] Não há cor hardcoded fora dos tokens.

---

## 6. Backend

- [ ] DTOs validam entrada.
- [ ] Services concentram regra de aplicação.
- [ ] Repositories encapsulam persistência.
- [ ] Logs são estruturados e seguros.
- [ ] Chamadas externas têm timeout/rate limit.

---

## 7. Testes

- [ ] Testes foram adicionados/atualizados.
- [ ] Casos de erro foram cobertos.
- [ ] Permissões foram testadas quando aplicável.
- [ ] Estados visuais foram testados quando aplicável.

---

## 8. Dependências

- [ ] Nenhuma biblioteca nova sem revisão.
- [ ] Licença compatível.
- [ ] Sem componente pago não aprovado.
- [ ] Lockfile revisado.

---

## 9. Documentação

- [ ] README/docs atualizados se necessário.
- [ ] Contratos atualizados.
- [ ] Prompts/guia atualizados se padrão mudou.
- [ ] ADR criado quando a decisão é arquitetural.

---

## 10. Build

Backend:

- [ ] `npm run format:check`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`

Frontend:

- [ ] `flutter analyze`
- [ ] `flutter test`
- [ ] `flutter build web --release`
