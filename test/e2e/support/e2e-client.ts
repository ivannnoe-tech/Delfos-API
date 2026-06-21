import {
  DELFOS_ACTOR_ID_HEADER,
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_ADMIN_KEY_HEADER,
} from '../../../src/modules/auth/constants/auth-headers';
import { E2E_ADMIN_KEY, E2E_ON_POSTGRES } from './e2e-app';

/**
 * Fixed isolation tenant/actor ids. The id FORMAT must match the active backend:
 * a 24-hex ObjectId for MongoDB (`tenantId` is an ObjectId there) or a UUID for
 * PostgreSQL (`tenant_id` is a `uuid` column). The harness seeds a tenant row
 * with `E2E_TENANT_ID` as its primary key on the Postgres path so the FK holds.
 * The REST contract is identical either way — only the id encoding differs.
 */
export const E2E_TENANT_ID = E2E_ON_POSTGRES
  ? '662d4f6e-7a1c-4b00-8a4f-000000000001'
  : '662d4f6e7a1c2b00124f0001';
export const E2E_ACTOR_ID = E2E_ON_POSTGRES
  ? '662d4f6e-7a1c-4b00-8a4f-000000000999'
  : '662d4f6e7a1c2b00124f0999';

export interface E2EResponse {
  readonly status: number;
  readonly body: Record<string, unknown>;
  readonly raw: string;
}

export interface E2ERequestInit {
  readonly method?: string;
  /** Pass null to omit the admin key (auth-failure tests). */
  readonly adminKey?: string | null;
  readonly role?: string;
  readonly actorId?: string;
  readonly body?: unknown;
}

export async function e2eRequest(
  baseUrl: string,
  path: string,
  init: E2ERequestInit = {},
): Promise<E2EResponse> {
  const headers: Record<string, string> = { accept: 'application/json' };
  const adminKey = init.adminKey === undefined ? E2E_ADMIN_KEY : init.adminKey;

  if (adminKey !== null) {
    headers[DELFOS_ADMIN_KEY_HEADER] = adminKey;
  }
  if (init.role !== undefined) {
    headers[DELFOS_ACTOR_ROLE_HEADER] = init.role;
  }
  if (init.actorId !== undefined) {
    headers[DELFOS_ACTOR_ID_HEADER] = init.actorId;
  }
  if (init.body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const raw = await response.text();
  let body: Record<string, unknown> = {};

  if (raw.length > 0) {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object') {
      body = parsed as Record<string, unknown>;
    }
  }

  return { status: response.status, body, raw };
}
