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
CORS_ORIGIN=http://localhost:5173,http://localhost:8080,http://localhost:3000
```

`DELFOS_ADMIN_KEY` protege temporariamente os endpoints administrativos da foundation.
Use um valor local forte, nao commite `.env` real e nunca reutilize esse mecanismo como
estrategia final de producao.

## Comandos

```powershell
npm install
npm run start:dev
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
