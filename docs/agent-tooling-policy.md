# Política de Agentes, Skills, Plugins e MCPs — Delfos Analytics

> Status: documento normativo  
> Escopo: uso seguro de ferramentas externas por humanos e agentes de IA.

Ferramentas externas podem acelerar desenvolvimento, mas também podem expor código, dados, secrets e decisões sensíveis.

---

## 1. Regra principal

Usar apenas ferramentas necessárias, com menor privilégio possível e sem expor dados sensíveis.

---

## 2. Permitido com cuidado

- copilotos de código
- CLIs de IA
- MCPs de leitura de repositório
- ferramentas de documentação
- formatadores/lints
- geradores locais

Desde que respeitem:

- segredo fora do prompt
- dados reais fora do prompt
- permissão mínima
- revisão humana

---

## 3. Proibido sem aprovação

- ferramenta com acesso amplo a produção
- plugin que envia repositório inteiro sem controle
- MCP com permissão de escrita destrutiva sem necessidade
- ferramenta que exige token pessoal amplo
- copiar secrets para prompt
- enviar payload real de cliente para IA externa
- habilitar auto-merge sem revisão

---

## 4. Regras para prompts

Prompts devem:

- mencionar documentos obrigatórios
- delimitar escopo
- pedir arquivos pequenos
- proibir gambiarras
- proibir dependência paga sem revisão
- pedir testes
- pedir atualização de docs quando necessário

Usar templates em `prompts/`.

---

## 5. Dados que não devem entrar em ferramentas externas

- tokens
- senhas
- chaves privadas
- `.env` real
- dados reais de cliente
- CPF/CNPJ completos
- payload fiscal/financeiro real
- URLs internas sensíveis sem necessidade

---

## 6. Permissões de MCP/plugin

Preferir:

- leitura antes de escrita
- escopo por repositório, não organização inteira
- branch específica, não produção
- tokens temporários
- logs auditáveis

---

## 7. Revisão humana

Nenhuma alteração gerada por IA entra sem revisão humana.

O revisor verifica:

- arquitetura
- segurança
- testes
- legibilidade
- dependências
- contratos
- documentação

---

## 8. Comandos destrutivos

Agentes devem seguir `docs/destructive-commands-policy.md`.

---

## 9. Checklist rápido

- [ ] A ferramenta precisa mesmo desse acesso?
- [ ] Há secret no contexto?
- [ ] Há dado real de cliente?
- [ ] A saída será revisada?
- [ ] A mudança respeita `AGENTS.md`?
- [ ] A ferramenta pode executar algo destrutivo?
