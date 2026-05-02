import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestEventsRepository } from '../repositories/execution-request-events.repository';
import {
  ExecutionRequestDocument,
  ExecutionRequestKind,
  ExecutionRequestMode,
  ExecutionRequestStatus,
} from '../schemas/execution-request.schema';
import {
  ExecutionRequestEventDocument,
  ExecutionRequestEventType,
} from '../schemas/execution-request-event.schema';

export type AuditServiceMock = {
  record: jest.Mock<ReturnType<AuditService['record']>, Parameters<AuditService['record']>>;
};

export function createAuditService(): AuditServiceMock {
  return {
    record: jest.fn<ReturnType<AuditService['record']>, Parameters<AuditService['record']>>(
      async () => ({
        id: new Types.ObjectId().toString(),
        tenantId: new Types.ObjectId().toString(),
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

export function createExecutionRequestDocument(
  record: Partial<ExecutionRequestDocument>,
): ExecutionRequestDocument {
  return record as ExecutionRequestDocument;
}

export function createExecutionRequestEventDocument(
  record: Partial<ExecutionRequestEventDocument>,
): ExecutionRequestEventDocument {
  return record as ExecutionRequestEventDocument;
}

export function createRuntimeRequestFixture(
  overrides: Partial<ExecutionRequestDocument> = {},
): ExecutionRequestDocument {
  const executionRequestId = overrides._id ?? new Types.ObjectId();
  const tenantId = overrides.tenantId ?? new Types.ObjectId();
  const createdAt = new Date('2026-05-02T12:00:00.000Z');

  return createExecutionRequestDocument({
    _id: executionRequestId,
    tenantId,
    requestKey: `exec_req_${executionRequestId.toString()}`,
    kind: ExecutionRequestKind.Query,
    status: ExecutionRequestStatus.Accepted,
    queryDefinitionId: new Types.ObjectId(),
    mode: ExecutionRequestMode.FutureRuntime,
    metadata: {},
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  });
}

export function createRuntimeEventFixture(
  overrides: Partial<ExecutionRequestEventDocument> = {},
): ExecutionRequestEventDocument {
  const eventId = overrides._id ?? new Types.ObjectId();
  const executionRequestId = overrides.executionRequestId ?? new Types.ObjectId();
  const tenantId = overrides.tenantId ?? new Types.ObjectId();

  return createExecutionRequestEventDocument({
    _id: eventId,
    tenantId,
    executionRequestId,
    requestKey: `exec_req_${executionRequestId.toString()}`,
    eventType: ExecutionRequestEventType.Accepted,
    nextStatus: ExecutionRequestStatus.Accepted,
    metadata: {},
    createdAt: new Date('2026-05-02T12:00:00.000Z'),
    ...overrides,
  });
}

export function createActorFixture() {
  return {
    actorId: '662d4f6e7a1c2b00124f0999',
    actorRole: AdminRole.Operator,
  };
}
