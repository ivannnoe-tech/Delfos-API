import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import { AdminRole } from '../../auth/types/admin-role';
import {
  ExecutionRequestEventRecord,
  ExecutionRequestEventsRepository,
} from '../repositories/execution-request-events.repository';
import { ExecutionRequestRecord } from '../repositories/execution-requests.repository';
import {
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';

export type AuditServiceMock = {
  record: jest.Mock<ReturnType<AuditService['record']>, Parameters<AuditService['record']>>;
};

/**
 * Opaque id generator for the neutral-record fixtures. The backend-agnostic
 * record exposes ids as plain strings; an ObjectId-hex value is accepted by
 * `@IsEntityId` validation, so it keeps the fixtures realistic without coupling
 * the tests to a specific backend (ADR-0035 / ADR-0036).
 */
export function newId(): string {
  return new Types.ObjectId().toString();
}

export function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn<ReturnType<AuditService['record']>, Parameters<AuditService['record']>>(
      async () => ({
        id: newId(),
        tenantId: newId(),
        action: 'execution_request.created',
        entity: 'execution_request',
        metadata: {},
        timestamp: new Date().toISOString(),
      }),
    ),
  };
}

export function createEventRepository(): Partial<ExecutionRequestEventsRepository> {
  return {
    create: jest.fn(),
    findByFilters: jest.fn(),
    countByFilters: jest.fn(),
  };
}

export function createRuntimeRequestFixture(
  overrides: Partial<ExecutionRequestRecord> = {},
): ExecutionRequestRecord {
  const id = overrides.id ?? newId();
  const tenantId = overrides.tenantId ?? newId();
  const createdAt = new Date('2026-05-02T12:00:00.000Z');

  return {
    id,
    tenantId,
    requestKey: `exec_req_${id}`,
    kind: ExecutionRequestKind.Query,
    status: ExecutionRequestStatus.Accepted,
    queryDefinitionId: newId(),
    mode: ExecutionRequestMode.FutureRuntime,
    metadata: {},
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

export function createRuntimeEventFixture(
  overrides: Partial<ExecutionRequestEventRecord> = {},
): ExecutionRequestEventRecord {
  const id = overrides.id ?? newId();
  const executionRequestId = overrides.executionRequestId ?? newId();
  const tenantId = overrides.tenantId ?? newId();

  return {
    id,
    tenantId,
    executionRequestId,
    requestKey: `exec_req_${executionRequestId}`,
    eventType: ExecutionRequestEventType.Accepted,
    nextStatus: ExecutionRequestStatus.Accepted,
    metadata: {},
    createdAt: new Date('2026-05-02T12:00:00.000Z'),
    ...overrides,
  };
}

export function createActorFixture() {
  return {
    actorId: '662d4f6e7a1c2b00124f0999',
    actorRole: AdminRole.Operator,
  };
}
