import {
  DELFOS_ACTOR_ID_HEADER,
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_ADMIN_KEY_HEADER,
} from '../../../src/modules/auth/constants/auth-headers';
import { E2E_ADMIN_KEY } from './e2e-app';

/** A fixed, syntactically valid ObjectId used as the isolation tenant. */
export const E2E_TENANT_ID = '662d4f6e7a1c2b00124f0001';
export const E2E_ACTOR_ID = '662d4f6e7a1c2b00124f0999';

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
