# Política de Comandos Destrutivos — Delfos Analytics

> Status: documento obrigatório para humanos, agentes de IA e automações.

Comandos destrutivos podem apagar dados, histórico, branches, ambientes ou configurações. Eles exigem cuidado explícito.

---

## 1. Regra principal

Nenhum agente, script ou pessoa deve executar comando destrutivo sem entender impacto e, quando aplicável, obter autorização explícita.

---

## 2. Exemplos de comandos destrutivos

- `rm -rf`
- `git reset --hard`
- `git clean -fdx`
- `git push --force`
- `docker compose down -v`
- `drop database`
- `deleteMany({})`
- migração irreversível
- remoção de secrets/variáveis de produção
- exclusão de bucket/storage
- apagar branches remotas

---

## 3. Antes de executar

Verificar:

- ambiente alvo
- branch atual
- backup disponível
- impacto em dados reais
- alternativa reversível
- necessidade de aprovação
- comando exato

---

## 4. Regras para agentes de IA

Agentes devem:

- preferir comandos de leitura antes de escrita
- explicar impacto de comandos destrutivos
- nunca executar destrutivo em produção sem autorização explícita
- sugerir backup antes de remover dados
- evitar `--force` quando não indispensável
- não apagar arquivos desconhecidos só para “limpar”

---

## 5. Git

Evitar:

- reescrever histórico compartilhado
- `push --force` em `main` ou `develop`
- remover arquivos não rastreados sem listar antes

Antes de limpeza:

```bash
git status
git clean -nd
```

Só depois avaliar `git clean -fd`, nunca `-fdx` sem motivo claro.

---

## 6. Banco de dados

Em desenvolvimento, comandos de reset podem existir, mas devem ser explícitos.

Em produção/homologação:

- exigir backup
- exigir janela combinada
- exigir revisão humana
- registrar execução
- nunca rodar query ampla sem filtro validado

---

## 7. Docker

`docker compose down -v` apaga volumes. Usar somente quando a perda de dados local for aceitável.

Preferir:

```bash
docker compose down
```

---

## 8. Checklist rápido

- [ ] Estou no ambiente certo?
- [ ] Sei o que será apagado?
- [ ] Tenho backup ou reversão?
- [ ] Listei antes de remover?
- [ ] A pessoa responsável autorizou, se necessário?
- [ ] O comando não afeta produção por engano?
