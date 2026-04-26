# Security Policy — Delfos Analytics

Levamos segurança a sério. Este documento descreve como reportar vulnerabilidades e quais são as regras de divulgação responsável.

---

## 1. Reportar uma vulnerabilidade

**Não** abra issue pública para reportar vulnerabilidades. **Não** comente em PR. **Não** divulgue em redes sociais antes da correção.

Envie um e-mail para: **security@<dominio-da-empresa>**

Inclua, se possível:

- descrição da vulnerabilidade
- componente afetado (módulo, endpoint, repositório)
- passos para reproduzir
- impacto estimado
- versão/commit afetado
- evidência (logs, screenshots, payload)

PGP key disponível em `https://<site-da-empresa>/security.asc` (opcional).

---

## 2. O que esperar

| Etapa | Prazo |
|---|---|
| Confirmação de recebimento | até 2 dias úteis |
| Avaliação inicial | até 5 dias úteis |
| Plano de correção | até 10 dias úteis |
| Correção aplicada | depende da severidade |

Severidade segue a escala CVSS v3.1.

---

## 3. Escopo

Coberto por esta política:

- Repositórios `delfos-api` e `delfos-web`
- APIs em `*.delfos.<dominio>` (produção e homologação)
- Painel administrativo do Delfos

Fora de escopo:

- Engenharia social contra colaboradores
- Ataques de DoS/DDoS
- Vulnerabilidades em bibliotecas de terceiros já reportadas publicamente
- Issues sem prova de impacto real

---

## 4. Divulgação responsável

- Não acessar, modificar ou exfiltrar dados de outros usuários
- Não interromper serviços
- Não tentar engenharia social
- Aguardar nossa autorização antes de divulgar publicamente

Pesquisadores que seguirem essa política não serão objeto de ação legal por nossa parte, e poderão ser reconhecidos publicamente (a critério do reportante) após a correção.

---

## 5. Não fazemos bug bounty no momento

Mas reconhecemos publicamente quem ajudar (com permissão) na seção `Hall of Fame` (a ser publicada).

---

## 6. Boas práticas de segurança internas

Para colaboradores e agentes de IA, ver:

- `docs/security-checklist.md`
- `docs/security-lgpd.md`
- `docs/data-access-policy.md`
- `docs/destructive-commands-policy.md`
