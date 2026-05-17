# Checklist de Segurança — Delfos Analytics

> Status: checklist obrigatório  
> Uso: revisar antes de PRs que afetem API, auth, dados, permissões, conectores ou exportações.

---

## 1. Autenticação

> Items abaixo são `[futuro]` enquanto auth real (login/JWT/refresh/MFA) não existir. Hoje a foundation usa apenas `x-delfos-admin-key` temporário. Ver ADR-0006 e roadmap.

- [ ] [futuro] Login valida credenciais de forma segura.
- [ ] [futuro] Senhas são armazenadas com hash forte.
- [ ] [futuro] Access token tem expiração curta.
- [ ] [futuro] Refresh token é rotacionável.
- [ ] [futuro] Logout invalida refresh token quando aplicável.
- [ ] [futuro] Erros de login não revelam se e-mail existe.

---

## 2. Autorização

- [ ] Endpoint sensível exige autenticação.
- [ ] Permissão é checada no backend.
- [ ] Tenant é validado em toda operação tenant-scoped.
- [ ] Usuário não consegue acessar recurso de outro tenant.
- [ ] Ações administrativas têm permissão específica.

---

## 3. Multi-tenant

- [ ] Queries incluem `tenantId` quando necessário.
- [ ] IDs globais não bastam para buscar recurso tenant-scoped.
- [ ] [futuro] Cache inclui tenant na chave (não há cache no estado atual).
- [ ] Logs não misturam contexto de tenants.
- [ ] Exportações respeitam tenant e permissões.

---

## 4. Inputs

- [ ] DTO valida todos os campos.
- [ ] Strings têm limites de tamanho.
- [ ] URLs são validadas.
- [ ] Headers livres são bloqueados.
- [ ] Campos desconhecidos são rejeitados quando possível.
- [ ] Uploads, quando existirem, validam tipo e tamanho.

---

## 5. Conectores externos

> Items abaixo são `[futuro]` enquanto conectores reais não existirem. Hoje não há conector, worker, fila, cache, scheduler, local agent ou execução externa. Ver ADR-0008, ADR-0012 e ADR-0013 (foundation documental em `delfos-connectors`).

- [ ] [futuro] URL base é validada.
- [ ] [futuro] Método HTTP vem de configuração permitida.
- [ ] [futuro] Timeout configurado.
- [ ] [futuro] Rate limit aplicado.
- [ ] [futuro] Resposta tem limite de tamanho.
- [ ] [futuro] Erro externo é sanitizado.
- [ ] [futuro] Credenciais não aparecem em logs.

---

## 6. Secrets e credenciais

- [ ] Nenhum secret hardcoded.
- [ ] `.env` não foi versionado.
- [ ] `.env.example` não contém valor real.
- [ ] Credenciais de conexão são criptografadas.
- [ ] Credenciais salvas não voltam completas para o frontend.
- [ ] Logs usam redaction.

---

## 7. LGPD

- [ ] Coleta mínima de dados pessoais.
- [ ] Dados sensíveis são mascarados em logs.
- [ ] Exportações são auditadas quando necessário.
- [ ] Retenção de logs é justificada.
- [ ] Payload operacional bruto não é persistido.

---

## 8. Frontend

- [ ] [futuro] Token é armazenado em storage adequado (não há JWT no estado atual).
- [ ] [futuro] Rotas protegidas têm guard de auth (depende de auth real futura).
- [ ] Estado sem permissão é tratado.
- [ ] Erro técnico não mostra stack ao usuário.
- [ ] Ações destrutivas têm confirmação.

---

## 9. Dependências

- [ ] Licença aprovada.
- [ ] Dependência é mantida.
- [ ] Não há vulnerabilidade crítica conhecida.
- [ ] Lockfile foi revisado.
- [ ] Biblioteca paga/restritiva não foi adicionada sem aprovação.

---

## 10. PR

- [ ] Testes passam.
- [ ] Documentação atualizada.
- [ ] ADR criado se necessário.
- [ ] Segurança revisada com `prompts/security-review-prompt.md`.
