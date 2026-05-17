import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

import type { NodeEnvironment } from './environment';

/**
 * Builds the CORS options applied in `main.ts`.
 *
 * The allowed origins come from the `CORS_ORIGIN` env var (CSV, parsed in
 * `environment.ts`). The whitelist is **exact**: every entry is matched as a
 * full origin string (protocol + host + port), so `localhost` and `127.0.0.1`
 * are deliberately distinct. There is no wildcard support — a request whose
 * `Origin` is not in the list never receives `Access-Control-Allow-Origin`.
 *
 * When no origin is configured, CORS is disabled (`origin: false`): the browser
 * receives no allow header and blocks cross-origin requests. This is the safe
 * default and the only behaviour permitted in production.
 */
export function resolveCorsOptions(
  corsOrigin: readonly string[],
  nodeEnv: NodeEnvironment,
): CorsOptions {
  // De-duplicate and drop blanks, but never widen the whitelist. A `*` entry is
  // rejected outright so a misconfigured env can never open CORS to everyone.
  const whitelist = Array.from(
    new Set(corsOrigin.map((origin) => origin.trim()).filter((origin) => origin.length > 0)),
  );

  if (whitelist.includes('*')) {
    throw new Error('CORS_ORIGIN must not contain a wildcard ("*"); list exact origins instead.');
  }

  if (whitelist.length === 0) {
    // No configured origin: CORS stays disabled (no allow header at all).
    return { origin: false };
  }

  const options: CorsOptions = {
    // An explicit array is an exact-match whitelist in the `cors` package:
    // a non-listed origin gets no `Access-Control-Allow-Origin` header.
    origin: whitelist,
  };

  assertNoWildcardInProduction(options.origin, nodeEnv);

  return options;
}

/**
 * Defence in depth: in production the resolved `origin` must always be an
 * exact-match list — never `true` (reflect any) and never a `*` entry. A
 * misconfiguration is a hard failure at bootstrap rather than a silent open
 * CORS policy.
 */
function assertNoWildcardInProduction(
  origin: CorsOptions['origin'],
  nodeEnv: NodeEnvironment,
): void {
  if (nodeEnv !== 'production') {
    return;
  }

  const isWildcard =
    origin === true ||
    origin === '*' ||
    (Array.isArray(origin) && origin.some((entry) => entry === '*'));

  if (isWildcard) {
    throw new Error('CORS must not use a wildcard origin in production.');
  }
}
