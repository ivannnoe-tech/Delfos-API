# Desenvolvimento local

Fluxo curto para executar o `delfos-api` em Windows com MongoDB local.

## Pré-requisitos

- Node.js 24 LTS.
- npm.
- MongoDB local instalado e rodando no Windows.

## Arquivo `.env` local

Crie um arquivo chamado `.env` na raiz do `delfos-api`. Esse arquivo é local, pode conter configuração sensível e não deve ser commitado.

Exemplo:

```env
NODE_ENV=development
PORT=3000
DELFOS_DATABASE_URL=mongodb://127.0.0.1:27017/delfos_analytics
DELFOS_ADMIN_KEY=change-me-local-admin-key-at-least-32-chars
ENCRYPTION_KEY_BASE64=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=
CORS_ORIGIN=http://localhost:5173,http://localhost:8080,http://localhost:3000
```

`DELFOS_ADMIN_KEY` protege temporariamente os endpoints administrativos da foundation.
Use um valor local forte, nao commite `.env` real e nunca reutilize esse mecanismo como
estrategia final de producao.
`ENCRYPTION_KEY_BASE64` deve ser trocado por uma chave local propria de 32 bytes em base64;
o valor acima e apenas exemplo inseguro para desenvolvimento.

## Comandos

```powershell
npm install
npm run start:dev
```

## Seed local da foundation

Para popular o MongoDB local com configuracoes ficticias da foundation, rode:

```powershell
$env:DELFOS_ADMIN_KEY="change-me-local-admin-key-at-least-32-chars"
npm run seed:dev
```

O seed cria ou atualiza dados demo seguros e idempotentes:

- tenant `Delfos Demo Local` (`slug: delfos-demo-local`);
- usuario owner `owner.demo@example.local`;
- connection `Fonte Demo Local` apontando para host reservado `.invalid`;
- credential com placeholder protegido localmente, sem imprimir o valor;
- datasets `sales_orders_demo`, `customers_demo` e `payments_demo`;
- query definitions `sales_overview_demo`, `sales_by_day_demo` e `customers_summary_demo`;
- dashboard definition `commercial_dashboard_demo`.

O script nao executa query, nao chama API externa, nao conecta em banco de cliente e nao
armazena payload operacional. A idempotencia usa chaves estaveis como `slug`, e-mail,
`datasetKey`, `queryKey`, `dashboardKey` e `tenantId + datasetKey + targetField`.
O script usa models Mongoose diretamente porque os services/repositories atuais nao expõem
upsert por todas essas chaves estaveis; isso mantem o seed local explicito e evita criar
contrato publico ou endpoint administrativo para desenvolvimento.

Ao final, o terminal imprime o `tenantId`, o `actorId` sugerido e um comando para rodar o
`delfos-web` com `--dart-define`. O comando referencia `$env:DELFOS_ADMIN_KEY` em vez de
imprimir a chave administrativa:

```powershell
flutter run -d edge --web-port=5173 --dart-define=API_URL=http://localhost:3000 --dart-define=DELFOS_ADMIN_KEY=$env:DELFOS_ADMIN_KEY --dart-define=DELFOS_TENANT_ID=<tenantId retornado> --dart-define=DELFOS_ACTOR_ID=<actorId retornado> --dart-define=DELFOS_ACTOR_ROLE=owner
```

## Validação

Verifique se o MongoDB está acessível:

```powershell
Test-NetConnection localhost -Port 27017
```

Verifique o healthcheck da API:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Exemplo de chamada administrativa protegida:

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/tenants -Headers @{
  "x-delfos-admin-key" = $env:DELFOS_ADMIN_KEY
}
```

## Observações

- Use `127.0.0.1` na URL do MongoDB para evitar problemas de resolução IPv6 no Windows.
- Docker é opcional. Ele não é obrigatório para quem já tem MongoDB local instalado e rodando.
