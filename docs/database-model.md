# Modelo de Banco — Delfos Analytics

> Status: documento normativo inicial  
> Banco: MongoDB 8.0+  
> Escopo: dados de configuração do Delfos na Fase 1.

O MongoDB armazena configuração e metadados do Delfos, não dados operacionais permanentes dos clientes.

---

## 1. Princípios

- todo recurso tenant-scoped contém `tenantId`
- credenciais são criptografadas
- timestamps são obrigatórios
- exclusão lógica é preferível para dados administrativos
- índices devem refletir consultas reais
- payload operacional bruto não é persistido

---

## 2. Coleções iniciais

### tenants

Representa empresa/cliente.

Campos principais:

- `_id`
- `name`
- `slug`
- `status`
- `settings`
- `createdAt`
- `updatedAt`

### users

Representa usuário do Delfos.

Campos principais:

- `_id`
- `name`
- `email`
- `passwordHash`
- `status`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

### tenant_users

Vínculo entre usuário e tenant.

- `tenantId`
- `userId`
- `roleIds`
- `status`

### roles

Perfis de acesso por tenant ou globais.

- `tenantId`
- `name`
- `permissions`
- `system`

### connections

Configuração de API externa.

- `tenantId`
- `name`
- `baseUrl`
- `authType`
- `credentialRef`
- `allowedHeaders`
- `timeoutMs`
- `rateLimit`
- `status`

### credentials

Referencia protegida de credenciais usadas por conexoes.

- `tenantId`
- `connectionId`
- `type`
- `provider`
- `name`
- `status`
- `maskedPreview`
- `protectedSecretValue`
- `protectionProvider`
- `rotatedAt`
- `revokedAt`
- `createdBy`
- `updatedBy`
- `createdAt`
- `updatedAt`

### datasets

Endpoint configurado dentro de uma conexão.

- `tenantId`
- `connectionId`
- `name`
- `key`
- `method`
- `path`
- `queryParamsSchema`
- `pagination`
- `responsePath`
- `cacheTtlSeconds`
- `status`

### field_mappings

De/Para de campos.

- `tenantId`
- `datasetId`
- `sourcePath`
- `targetField`
- `targetType`
- `required`
- `transform`

### dashboards

Dashboards configurados.

- `tenantId`
- `name`
- `description`
- `layout`
- `filters`
- `status`

### widgets

Widgets de dashboard.

- `tenantId`
- `dashboardId`
- `type`
- `title`
- `datasetId`
- `config`
- `position`

### reports

Relatórios configurados.

- `tenantId`
- `name`
- `datasetId`
- `columns`
- `filters`
- `sorting`
- `exportOptions`

### white_label_settings

Configuração visual por tenant/domínio.

- `tenantId`
- `logoUrl`
- `primaryColor`
- `themeMode`
- `displayName`
- `domain`

### audit_logs

Auditoria de ações sensíveis.

- `tenantId`
- `userId`
- `action`
- `resourceType`
- `resourceId`
- `metadata`
- `ip`
- `userAgent`
- `createdAt`

---

## 3. Índices mínimos

- `tenants.slug` único
- `users.email` único
- `tenant_users.tenantId + userId` único
- `connections.tenantId + name`
- `credentials.tenantId + connectionId`
- `credentials.tenantId + status`
- `credentials.tenantId + type`
- `datasets.tenantId + connectionId + key` único
- `field_mappings.tenantId + datasetId + targetField`
- `dashboards.tenantId + name`
- `audit_logs.tenantId + createdAt`

---

## 4. Dados proibidos

Não persistir na Fase 1:

- payload completo de vendas
- payload completo de pedidos
- dados fiscais operacionais
- dados financeiros operacionais
- dados de clientes finais sem necessidade
- respostas brutas de APIs externas

---

## 5. Migrações

Toda alteração estrutural deve:

- ser versionada
- ter script ou estratégia de migração
- ser testada em ambiente local
- considerar rollback quando possível
- atualizar este documento se alterar modelo importante

---

## 6. Auditoria

Auditar no mínimo:

- login/logout sensível
- criação/alteração de usuário
- alteração de permissões
- criação/alteração de conexão
- alteração de credenciais
- alteração de De/Para
- exportações sensíveis
- alterações de white label
