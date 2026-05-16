# Backup e Restore — delfos-api

Na fase atual, o backup cobre **apenas** a configuração do Delfos e os metadados administrativos. Payload operacional ou dados brutos de clientes **não são armazenados** pelo Delfos nesta fase e estão fora de escopo (futuro). Este documento define a política base para esses dados de configuração em MongoDB.

## Escopo

Backup cobre exclusivamente dados próprios de configuração e metadados administrativos do Delfos: tenants, usuários, permissões, conexões configuradas, De/Para, dashboards, widgets, relatórios, preferências, metadados e auditoria.

Na fase atual, não cobre payload operacional bruto de clientes, pois esse dado não é armazenado pelo Delfos. Backup/restore de payload operacional de clientes é tema futuro/fora de escopo.

## Frequência recomendada

| Ambiente   | Frequência                          | Retenção sugerida         |
| ---------- | ----------------------------------- | ------------------------- |
| Local      | sob demanda                         | não obrigatória           |
| Staging    | diária ou sob demanda               | curta                     |
| Production | diária e antes de mudanças críticas | conforme política interna |

## Regras

- Backups devem ser criptografados fora do ambiente original.
- Acesso deve seguir menor privilégio.
- Restore deve ser testado periodicamente.
- Dados pessoais devem respeitar retenção e finalidade.

## Antes de restaurar

1. Confirmar autorização explícita.
2. Identificar ambiente de destino.
3. Confirmar versão do backup.
4. Avaliar impacto em usuários/tenants.
5. Comunicar janela de manutenção, se necessário.

## Checklist pós-restore

- [ ] Healthcheck OK.
- [ ] Login OK.
- [ ] Tenants e permissões preservados.
- [ ] Dashboards/widgets preservados.
- [ ] Operação registrada.
