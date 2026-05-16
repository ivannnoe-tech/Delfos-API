# Prompt - Revisao de conector de API

> Aviso obrigatorio: prompt conceitual/futuro.
>
> Este prompt nao autoriza implementar conector real, servico/runtime `delfos-connectors`,
> local agent, cache, fila, scheduler ou execucao real. Conectores reais dependem de tarefa
> explicita, escopo aprovado e alinhamento com ADR-0008 e ADR-0012. No estado atual, a API
> principal nao deve conectar diretamente em fonte de cliente.

Use somente para revisar desenho futuro ou proposta explicitamente aprovada de conexoes, datasets
e consumo de APIs de clientes.

---

## Fontes obrigatorias

- `docs/api-connectors.md`
- `docs/data-access-policy.md`
- `docs/de-para.md`
- `docs/security-checklist.md`
- `docs/security-lgpd.md`
- ADR-0008
- ADR-0012

---

## Verificar em desenho futuro

- URL base validada.
- Metodo HTTP permitido.
- Headers controlados.
- Credenciais criptografadas e referenciadas por `credentialRef`.
- Nenhum secret em log/resposta.
- Timeout configurado.
- Rate limit configurado.
- Paginacao segura.
- Limite de resposta.
- Erros classificados e sanitizados.
- Tenant scope em toda execucao.
- Cache/staging apenas se aprovado por ADR futura.
- De/Para validado.
- Payload operacional nao persistido sem autorizacao e politica de retencao.
- Execucao externa preferencialmente delegada ao `delfos-connectors`.

---

## Saida esperada

- problemas bloqueantes;
- riscos de integracao;
- riscos de seguranca;
- ajustes recomendados;
- casos de teste futuros obrigatorios;
- confirmacao de que nada foi implementado sem autorizacao;
- veredito.
