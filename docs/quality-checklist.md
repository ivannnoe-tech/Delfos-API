# Checklist de Qualidade — Delfos Analytics

> Status: checklist obrigatório antes de PR.
> Este documento é a **fonte canônica da Definition of Done (DoD)** do projeto, referenciado pelos
> dois arquivos `AGENTS.md` (`delfos-api` e `delfos-web`). Em caso de divergência com resumos de
> DoD em outros documentos, prevalece este checklist.

---

## 0. Regras canônicas

### 0.1 Tamanho de arquivo (regra oficial)

> **600 linhas é o limite máximo absoluto, não uma meta.** O ideal é manter arquivos pequenos e
> coesos. Sempre preferir criar módulos, componentes, serviços, helpers ou documentos menores em
> vez de crescer um arquivo existente.

| Faixa | Regra |
|---|---|
| **Até 300 linhas** | Alvo. Manter o arquivo pequeno e coeso. |
| **301–450 linhas** | Permitido. O agent **deve avaliar** se há divisão natural por responsabilidade. |
| **451–600 linhas** | Permitido **somente com justificativa objetiva no relatório final** da tarefa. |
| **Acima de 600 linhas** | **Proibido** criar arquivo novo ou aumentar arquivo existente sem **validação humana explícita**. O agent deve **parar e pedir validação humana**. |

- Se um arquivo existente já tiver mais de 600 linhas, o agent **não deve adicionar mais lógica
  nele**; deve propor extração, divisão ou refatoração incremental.
- O **relatório final de qualquer tarefa** deve listar e justificar todos os arquivos acima de
  **450 linhas** que a tarefa criou ou aumentou.
- **Exceções** (permitidas apenas quando justificadas): arquivos gerados automaticamente,
  lockfiles, fixtures grandes de teste, snapshots, changelog histórico, documentação de
  referência longa e arquivos de configuração onde dividir prejudica a clareza.

### 0.2 Demais regras canônicas

- **Estados de UI obrigatórios**: toda tela com dados deve tratar os 5 estados — **loading**,
  **vazio (empty)**, **erro (error)**, **sem permissão (permission)** e **sucesso (success)**.
  Esses estados são exigidos e validados no `delfos-web`.
- **Execução de conector**: execução real de conector é **proibida** na fase atual; apenas
  planejamento documentável é permitido.
- **Stop conditions**: antes de prosseguir, o agente deve **parar e pedir validação humana** nas
  situações listadas em `AGENTS.md` seção 9 (ultrapassar 600 linhas, alterar contratos públicos,
  mexer em secrets/credenciais/descriptografia, dispatch real, promover ADR `Proposed`,
  divergência ADR×AGENTS×código, falha de build/test/lint, ação destrutiva, alterar a
  política de retenção LGPD/auditoria, operação fora da matriz papel→operações).

---

## 1. Escopo

- [ ] A mudança pertence à Fase atual.
- [ ] Não implementa item fora de escopo.
- [ ] Não antecipa complexidade da Fase 2.
- [ ] Documentação de escopo foi consultada.

---

## 2. Arquitetura

- [ ] Responsabilidades estão separadas.
- [ ] Arquivos respeitam a regra canônica de tamanho (§0.1): alvo ≤300; 301–450 avaliar split; 451–600 com justificativa no relatório final; >600 exige validação humana.
- [ ] Relatório final lista e justifica arquivos acima de 450 linhas criados/aumentados pela tarefa.
- [ ] Não há duplicação desnecessária.
- [ ] Contratos públicos foram revisados.
- [ ] ADR criado se necessário.

---

## 3. Segurança

- [ ] Permissões validadas no backend, conforme a matriz papel→operações (ADR-0017).
- [ ] Tenant validado em recursos tenant-scoped.
- [ ] Secrets não aparecem em código/logs.
- [ ] Inputs são validados.
- [ ] Erros são sanitizados.
- [ ] Logs/auditoria usam `safeMetadata` e respeitam a política de retenção (ADR-0018).

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
- [ ] Trata os 5 estados de UI obrigatórios: loading, empty, error, permission e success (validados no `delfos-web`).
- [ ] É responsivo.
- [ ] Gráficos usam `ChartRenderer`.
- [ ] Não há cor hardcoded fora dos tokens.

---

## 6. Backend

- [ ] DTOs validam entrada.
- [ ] Services concentram regra de aplicação.
- [ ] Repositories encapsulam persistência.
- [ ] Logs são estruturados e seguros.
- [ ] Não há execução real de conector (proibida na fase atual; apenas planejamento documentável).
- [ ] Chamadas externas têm timeout/rate limit (quando aplicável a fases futuras autorizadas).

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
- [ ] Collections/environments Postman seguem `docs/postman-policy.md` — sem secrets, sem dados reais, com placeholders.

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
