# Checklist de Segurança — Delfos Analytics

> Status: checklist obrigatório  
> Uso: revisar antes de PRs que afetem API, auth, dados, permissões, conectores ou exportações.

---

## 1. Autenticação

- [ ] Login valida credenciais de forma segura.
- [ ] Senhas são armazenadas com hash forte.
- [ ] Access token tem expiração curta.
- [ ] Refresh token é rotacionável.
- [ ] Logout invalida refresh token quando aplicável.
- [ ] Erros de login não revelam se e-mail existe.

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
- [ ] Cache inclui tenant na chave.
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

- [ ] URL base é validada.
- [ ] Método HTTP vem de configuração permitida.
- [ ] Timeout configurado.
- [ ] Rate limit aplicado.
- [ ] Resposta tem limite de tamanho.
- [ ] Erro externo é sanitizado.
- [ ] Credenciais não aparecem em logs.

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

- [ ] Token é armazenado em storage adequado.
- [ ] Rotas protegidas têm guard.
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
