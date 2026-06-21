# Dispatch mTLS test fixtures (DEV ONLY)

Self-signed CA + server + client certificates used **only** by
`node-https-connector-dispatch-transport.mtls.spec.ts` to exercise a real
mutual-TLS handshake against a local mock https server.

- Not real secrets, never used in any environment, safe to commit.
- The CA private key was discarded after generation (only `ca.crt` is kept as
  the trust anchor; `server.crt/key` and `client.crt/key` are the leaf pairs).
- `server.crt` carries `subjectAltName = DNS:localhost, IP:127.0.0.1`.

Regenerate with openssl if they ever expire (3650-day validity).
