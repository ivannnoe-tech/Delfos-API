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
CORS_ORIGIN=http://localhost:5173,http://localhost:8080,http://localhost:3000,http://127.0.0.1:4174,http://localhost:4174
```

`CORS_ORIGIN` e uma whitelist exata separada por virgula, sem coringa. Cada origem
e comparada por protocolo + host + porta, e `localhost` nao equivale a `127.0.0.1`.
As origens `http://127.0.0.1:4174` e `http://localhost:4174` permitem o E2E integrado
do `delfos-web` (servidor estatico do build em `127.0.0.1:4174`) consumir a API local.

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

## PostgreSQL local (opcional — migração ADR-0035, fase P1)

O banco operacional continua sendo o MongoDB. O PostgreSQL é **opcional** nesta
fase: serve para exercitar a conexão e o health-check introduzidos na P1. Suba o
serviço via Docker (recomendado) e aponte `DELFOS_POSTGRES_URL` para ele:

```powershell
docker compose up -d postgres
# no .env local:
# DELFOS_POSTGRES_URL=postgresql://delfos:delfos@localhost:5432/delfos
```

Com a URL configurada, `GET /health` passa a reportar `postgres: { status: "up", latencyMs }`.
Sem a URL, reporta `postgres: { status: "disabled" }` e a API roda 100% em MongoDB.
O schema/migrations e a troca de repositórios vêm nas fases P2/P3
(`docs/postgresql-migration-plan.md`). O ORM é Kysely (ADR-0036).

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

Ao final, o terminal imprime o `tenantId`, o `actorId` sugerido, o `connectionId`, o
`credentialRef` e os IDs reais dos datasets, query definitions e dashboard definitions
criados ou reutilizados. Esses IDs facilitam testes manuais dos previews sem criar
endpoints auxiliares.

O seed tambem imprime um comando para rodar o `delfos-web` com `--dart-define`. O comando
referencia `$env:DELFOS_ADMIN_KEY` em vez de imprimir a chave administrativa:

```powershell
flutter run -d edge --web-port=5173 --dart-define=API_URL=http://localhost:3000 --dart-define=DELFOS_ADMIN_KEY=$env:DELFOS_ADMIN_KEY --dart-define=DELFOS_TENANT_ID=<tenantId retornado> --dart-define=DELFOS_ACTOR_ID=<actorId retornado> --dart-define=DELFOS_ACTOR_ROLE=owner
```

## Validação

O output tambem inclui comandos PowerShell prontos para listar `query-definitions`,
executar preview demo de uma query definition, listar `dashboard-definitions` e executar
preview demo de um dashboard definition. Esses comandos usam o `tenantId`, o `actorId` e
os IDs retornados pelo proprio seed, mantendo `$env:DELFOS_ADMIN_KEY` literal e sem
imprimir valor de secret.

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
