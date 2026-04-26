# Guia de Deploy — delfos-api

Define o fluxo base de deploy do `delfos-api`.

## Pré-requisitos

- Node.js 24 LTS.
- MongoDB 8.0+ acessível.
- Variáveis configuradas conforme `docs/env-reference.md`.
- Build, lint e testes aprovados.

## Fluxo recomendado

1. Atualizar branch principal via PR revisado.
2. Validar documentação e ADRs impactadas.
3. Executar validações:

```bash
npm run lint
npm run test
npm run build
```

4. Gerar artefato de build.
5. Aplicar variáveis no provedor/pipeline.
6. Publicar aplicação.
7. Validar healthcheck.
8. Monitorar logs após deploy.

## Healthcheck

O healthcheck não deve expor string de conexão, secrets, tenants, stack trace ou detalhes internos sensíveis.

## Rollback

Use rollback se houver aumento de 5xx, quebra de autenticação, falha em MongoDB, contrato incompatível com frontend ou risco LGPD.

## Checklist de produção

- [ ] Secrets protegidos.
- [ ] `NODE_ENV=production`.
- [ ] CORS restrito.
- [ ] Logs estruturados e sanitizados.
- [ ] Backup do MongoDB configurado.
- [ ] Healthcheck validado.
