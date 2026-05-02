import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AuditService } from '../../audit/services/audit.service';
import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestEventsRepository } from '../repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from '../repositories/execution-requests.repository';
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
import { ExecutionRequestsService } from '../services/execution-requests.service';

type AuditServiceMock = {
  record: jest.Mock<ReturnType<AuditService['record']>, Parameters<AuditService['record']>>;
};

describe('ExecutionRequestsService', () => {
  it.each([
    {
      kind: ExecutionRequestKind.Query,
      referenceField: 'queryDefinitionId',
      referenceId: new Types.ObjectId(),
    },
    {
      kind: ExecutionRequestKind.Dashboard,
      referenceField: 'dashboardDefinitionId',
      referenceId: new Types.ObjectId(),
    },
    {
      kind: ExecutionRequestKind.Report,
      referenceField: 'reportDefinitionId',
      referenceId: new Types.ObjectId(),
    },
  ] as const)('creates a $kind execution request foundation record', async (caseData) => {
    const tenantId = new Types.ObjectId();
    const datasetId = new Types.ObjectId();
    const connectionId = new Types.ObjectId();
    const createdAt = new Date('2026-05-02T12:00:00.000Z');
    const repository: Pick<ExecutionRequestsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createExecutionRequestDocument({
          _id: record._id,
          tenantId: record.tenantId,
          requestKey: record.requestKey,
          kind: record.kind,
          status: record.status,
          queryDefinitionId: record.queryDefinitionId,
          dashboardDefinitionId: record.dashboardDefinitionId,
          reportDefinitionId: record.reportDefinitionId,
          connectionId: record.connectionId,
          datasetId: record.datasetId,
          requestedByActorId: record.requestedByActorId,
          requestedByRole: record.requestedByRole,
          mode: record.mode,
          reason: record.reason,
          message: record.message,
          metadata: record.metadata,
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createExecutionRequestEventDocument({
          _id: new Types.ObjectId(),
          tenantId: record.tenantId,
          executionRequestId: record.executionRequestId,
          requestKey: record.requestKey,
          eventType: record.eventType,
          previousStatus: record.previousStatus,
          nextStatus: record.nextStatus,
          reason: record.reason,
          message: record.message,
          actorId: record.actorId,
          actorRole: record.actorRole,
          metadata: record.metadata,
          createdAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = createService(repository, eventRepository, auditService);

    const result = await service.create(
      {
        tenantId: tenantId.toString(),
        kind: caseData.kind,
        [caseData.referenceField]: caseData.referenceId.toString(),
        connectionId: connectionId.toString(),
        datasetId: datasetId.toString(),
        mode: ExecutionRequestMode.FutureRuntime,
        metadata: {
          domain: 'sales',
          token: 'must-not-leak',
          authorization: 'Bearer must-not-leak-token',
        },
      },
      {
        actorId: '662d4f6e7a1c2b00124f0999',
        actorRole: AdminRole.Operator,
      },
    );

    const createRecord = jest.mocked(repository.create).mock.calls[0]?.[0];

    if (!createRecord) {
      throw new Error('Expected create repository call.');
    }

    expect(createRecord.tenantId).toEqual(tenantId);
    expect(createRecord.requestKey).toMatch(/^exec_req_[0-9a-f]{24}$/);
    expect(createRecord.kind).toBe(caseData.kind);
    expect(createRecord.status).toBe(ExecutionRequestStatus.Accepted);
    expect(createRecord[caseData.referenceField]).toEqual(caseData.referenceId);
    expect(createRecord.connectionId).toEqual(connectionId);
    expect(createRecord.datasetId).toEqual(datasetId);
    expect(createRecord.requestedByActorId).toBe('662d4f6e7a1c2b00124f0999');
    expect(createRecord.requestedByRole).toBe(AdminRole.Operator);
    expect(createRecord.mode).toBe(ExecutionRequestMode.FutureRuntime);
    expect(createRecord.reason).toBe('runtime_foundation_only');
    expect(createRecord.metadata).toEqual({ domain: 'sales' });
    expect(eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        executionRequestId: createRecord._id,
        requestKey: createRecord.requestKey,
        eventType: ExecutionRequestEventType.Accepted,
        nextStatus: ExecutionRequestStatus.Accepted,
        reason: 'runtime_foundation_only',
        metadata: {},
      }),
    );
    expect(result.requestKey).toMatch(/^exec_req_[0-9a-f]{24}$/);
    expect(result[caseData.referenceField]).toBe(caseData.referenceId.toString());
    expect(result).toMatchObject({
      tenantId: tenantId.toString(),
      kind: caseData.kind,
      status: ExecutionRequestStatus.Accepted,
      connectionId: connectionId.toString(),
      datasetId: datasetId.toString(),
      requestedByRole: AdminRole.Operator,
      mode: ExecutionRequestMode.FutureRuntime,
      reason: 'runtime_foundation_only',
      message: 'Runtime foundation request accepted. No real execution was started.',
      metadata: { domain: 'sales' },
    });
    const auditRecord = auditService.record.mock.calls[0]?.[0];
    const eventAuditRecord = auditService.record.mock.calls[1]?.[0];

    if (!auditRecord || !eventAuditRecord) {
      throw new Error('Expected audit record call.');
    }

    expect(auditRecord).toMatchObject({
      tenantId: tenantId.toString(),
      actorUserId: '662d4f6e7a1c2b00124f0999',
      action: 'execution_request.created',
      entity: 'execution_request',
      entityId: result.id,
    });
    expect(auditRecord.metadata).toMatchObject({
      tenantId: tenantId.toString(),
      kind: caseData.kind,
      status: ExecutionRequestStatus.Accepted,
      actorId: '662d4f6e7a1c2b00124f0999',
      actorRole: AdminRole.Operator,
    });
    expect(eventAuditRecord).toMatchObject({
      tenantId: tenantId.toString(),
      actorUserId: '662d4f6e7a1c2b00124f0999',
      action: 'execution_request.event.created',
      entity: 'execution_request_event',
    });
    expect(eventAuditRecord.metadata).toMatchObject({
      executionRequestId: result.id,
      eventType: ExecutionRequestEventType.Accepted,
      nextStatus: ExecutionRequestStatus.Accepted,
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('returns validation errors when kind does not have its required reference', async () => {
    const service = createService({ create: jest.fn() });

    await expect(
      service.create({
        tenantId: new Types.ObjectId().toString(),
        kind: ExecutionRequestKind.Query,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists execution requests by tenant scoped filters', async () => {
    const tenantId = new Types.ObjectId();
    const queryDefinitionId = new Types.ObjectId();
    const createdAt = new Date('2026-05-02T12:30:00.000Z');
    const repository: Pick<ExecutionRequestsRepository, 'findByFilters' | 'countByFilters'> = {
      findByFilters: jest.fn(async () => [
        createExecutionRequestDocument({
          _id: new Types.ObjectId(),
          tenantId,
          requestKey: 'exec_req_662d4f6e7a1c2b00124f0901',
          kind: ExecutionRequestKind.Query,
          status: ExecutionRequestStatus.Accepted,
          queryDefinitionId,
          mode: ExecutionRequestMode.FutureRuntime,
          metadata: {},
          createdAt,
          updatedAt: createdAt,
        }),
      ]),
      countByFilters: jest.fn(async () => 1),
    };
    const service = createService(repository);

    const result = await service.findByFilters({
      tenantId: tenantId.toString(),
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      queryDefinitionId: queryDefinitionId.toString(),
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        kind: ExecutionRequestKind.Query,
        status: ExecutionRequestStatus.Accepted,
        mode: undefined,
        queryDefinitionId,
        dashboardDefinitionId: undefined,
        reportDefinitionId: undefined,
        connectionId: undefined,
        datasetId: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('reads one execution request using tenant scoped lookup', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const repository: Pick<ExecutionRequestsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => null),
    };
    const service = createService(repository);

    await expect(
      service.findOne(tenantId.toString(), executionRequestId.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      executionRequestId.toString(),
    );
  });

  it('lists events by execution request and tenant scope', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const createdAt = new Date('2026-05-02T13:00:00.000Z');
    const repository: Pick<ExecutionRequestsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () =>
        createExecutionRequestDocument({
          _id: executionRequestId,
          tenantId,
          requestKey: `exec_req_${executionRequestId.toString()}`,
          kind: ExecutionRequestKind.Query,
          status: ExecutionRequestStatus.Accepted,
          mode: ExecutionRequestMode.FutureRuntime,
          metadata: {},
          createdAt,
          updatedAt: createdAt,
        }),
      ),
    };
    const eventRepository: Pick<
      ExecutionRequestEventsRepository,
      'findByFilters' | 'countByFilters'
    > = {
      findByFilters: jest.fn(async () => [
        createExecutionRequestEventDocument({
          _id: new Types.ObjectId(),
          tenantId,
          executionRequestId,
          requestKey: `exec_req_${executionRequestId.toString()}`,
          eventType: ExecutionRequestEventType.Accepted,
          nextStatus: ExecutionRequestStatus.Accepted,
          metadata: {},
          createdAt,
        }),
      ]),
      countByFilters: jest.fn(async () => 1),
    };
    const service = createService(repository, eventRepository);

    const result = await service.findEvents(executionRequestId.toString(), {
      tenantId: tenantId.toString(),
      page: 1,
      pageSize: 25,
    });

    expect(repository.findByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      executionRequestId.toString(),
    );
    expect(eventRepository.findByFilters).toHaveBeenCalledWith(
      {
        tenantId,
        executionRequestId,
        eventType: undefined,
      },
      1,
      25,
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      executionRequestId: executionRequestId.toString(),
      eventType: ExecutionRequestEventType.Accepted,
      nextStatus: ExecutionRequestStatus.Accepted,
    });
  });

  it('creates a safe status event and updates execution request status', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const createdAt = new Date('2026-05-02T13:30:00.000Z');
    const request = createExecutionRequestDocument({
      _id: executionRequestId,
      tenantId,
      requestKey: `exec_req_${executionRequestId.toString()}`,
      kind: ExecutionRequestKind.Query,
      status: ExecutionRequestStatus.Accepted,
      mode: ExecutionRequestMode.FutureRuntime,
      metadata: {},
      createdAt,
      updatedAt: createdAt,
    });
    const repository: Pick<
      ExecutionRequestsRepository,
      'findByTenantAndId' | 'updateStatusByTenantAndId'
    > = {
      findByTenantAndId: jest.fn(async () => request),
      updateStatusByTenantAndId: jest.fn(async () =>
        createExecutionRequestDocument({
          ...request,
          status: ExecutionRequestStatus.Blocked,
          updatedAt: new Date('2026-05-02T13:31:00.000Z'),
        }),
      ),
    };
    const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
      create: jest.fn(async (record) =>
        createExecutionRequestEventDocument({
          _id: new Types.ObjectId(),
          tenantId: record.tenantId,
          executionRequestId: record.executionRequestId,
          requestKey: record.requestKey,
          eventType: record.eventType,
          previousStatus: record.previousStatus,
          nextStatus: record.nextStatus,
          message: record.message,
          reason: record.reason,
          actorId: record.actorId,
          actorRole: record.actorRole,
          metadata: record.metadata,
          createdAt,
        }),
      ),
    };
    const auditService = createAuditService();
    const service = createService(repository, eventRepository, auditService);

    const result = await service.createEvent(
      executionRequestId.toString(),
      {
        tenantId: tenantId.toString(),
        eventType: ExecutionRequestEventType.Blocked,
        message: 'Blocked by foundation policy.',
        reason: 'runtime_foundation_only',
        metadata: {
          domain: 'sales',
          token: 'must-not-leak',
          authorization: 'Bearer must-not-leak-token',
        },
      },
      {
        actorId: '662d4f6e7a1c2b00124f0999',
        actorRole: AdminRole.Operator,
      },
    );

    expect(repository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      executionRequestId.toString(),
      ExecutionRequestStatus.Blocked,
    );
    expect(eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: ExecutionRequestEventType.Blocked,
        previousStatus: ExecutionRequestStatus.Accepted,
        nextStatus: ExecutionRequestStatus.Blocked,
        message: 'Blocked by foundation policy.',
        reason: 'runtime_foundation_only',
        metadata: { domain: 'sales' },
      }),
    );
    expect(result).toMatchObject({
      executionRequestId: executionRequestId.toString(),
      eventType: ExecutionRequestEventType.Blocked,
      previousStatus: ExecutionRequestStatus.Accepted,
      nextStatus: ExecutionRequestStatus.Blocked,
      metadata: { domain: 'sales' },
    });
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'execution_request.event.created',
        entity: 'execution_request_event',
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'execution_request.status_changed',
        entity: 'execution_request',
      }),
    );
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
    expect(JSON.stringify(auditService.record.mock.calls)).not.toContain('must-not-leak');
  });

  it('rejects invalid event transition payloads', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const service = createService({
      findByTenantAndId: jest.fn(async () =>
        createExecutionRequestDocument({
          _id: executionRequestId,
          tenantId,
          requestKey: `exec_req_${executionRequestId.toString()}`,
          kind: ExecutionRequestKind.Query,
          status: ExecutionRequestStatus.Accepted,
          mode: ExecutionRequestMode.FutureRuntime,
          metadata: {},
          createdAt: new Date('2026-05-02T14:00:00.000Z'),
          updatedAt: new Date('2026-05-02T14:00:00.000Z'),
        }),
      ),
    });

    await expect(
      service.createEvent(executionRequestId.toString(), {
        tenantId: tenantId.toString(),
        eventType: ExecutionRequestEventType.StatusChanged,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createService(
  repository: Partial<ExecutionRequestsRepository>,
  eventRepository: Partial<ExecutionRequestEventsRepository> = createEventRepository(),
  auditService: AuditServiceMock = createAuditService(),
): ExecutionRequestsService {
  return new ExecutionRequestsService(
    repository as ExecutionRequestsRepository,
    eventRepository as ExecutionRequestEventsRepository,
    auditService as unknown as AuditService,
  );
}

function createEventRepository(): Partial<ExecutionRequestEventsRepository> {
  return {
    create: jest.fn(),
    findByFilters: jest.fn(),
    countByFilters: jest.fn(),
  };
}

function createAuditService(): AuditServiceMock {
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

function createExecutionRequestDocument(
  record: Partial<ExecutionRequestDocument>,
): ExecutionRequestDocument {
  return record as ExecutionRequestDocument;
}

function createExecutionRequestEventDocument(
  record: Partial<ExecutionRequestEventDocument>,
): ExecutionRequestEventDocument {
  return record as ExecutionRequestEventDocument;
}
