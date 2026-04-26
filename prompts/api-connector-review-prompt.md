# Prompt — Revisão de conector de API

Use para revisar conexões, datasets e consumo de APIs de clientes.

---

## Fontes obrigatórias

- `docs/api-connectors.md`
- `docs/data-access-policy.md`
- `docs/de-para.md`
- `docs/security-checklist.md`
- `docs/security-lgpd.md`

---

## Verificar

- URL base validada.
- Método HTTP permitido.
- Headers controlados.
- Credenciais criptografadas.
- Nenhum secret em log/resposta.
- Timeout configurado.
- Rate limit configurado.
- Paginação segura.
- Limite de resposta.
- Erros classificados e sanitizados.
- Cache isolado por tenant.
- De/Para validado.
- Payload operacional não persistido.

---

## Saída esperada

- problemas bloqueantes
- riscos de integração
- riscos de segurança
- ajustes recomendados
- casos de teste obrigatórios
- veredito
