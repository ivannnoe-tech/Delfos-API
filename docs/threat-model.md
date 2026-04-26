# Threat Model — delfos-api

Resumo de ameaças, fronteiras de confiança e controles esperados.

## Ativos protegidos

- Usuários e permissões.
- Dados de tenants.
- Configurações e metadados do Delfos.
- De/Para de campos de clientes.
- Credenciais e tokens de integrações.
- Logs e auditoria.

## Fronteiras de confiança

```text
Usuário/Navegador -> delfos-web -> delfos-api -> MongoDB do Delfos -> APIs dos clientes
```

Na Fase 1, o Delfos não acessa diretamente o banco do cliente.

## Ameaças e controles

| Ameaça | Controle esperado |
|---|---|
| Usuário se passar por outro | autenticação robusta e tokens seguros |
| Alteração indevida de tenant/payload | DTOs, autorização e tenant server-side |
| Ação sensível sem rastreio | auditoria |
| Vazamento de secret/dado pessoal | logs sanitizados e minimização |
| Abuso de endpoints | rate limit, paginação e limites de payload |
| Elevação de privilégio | menor privilégio e revisão de permissões |

## Controles obrigatórios

- `tenantId` nunca deve ser confiado livremente ao frontend.
- Todo endpoint protegido deve validar autenticação e permissão.
- Erros não podem expor stack trace ao usuário.
- Secrets nunca devem ser logados.
- Operações sensíveis devem gerar auditoria.
