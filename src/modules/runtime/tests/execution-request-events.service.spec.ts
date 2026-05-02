import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

import { AdminRole } from '../../auth/types/admin-role';
import { ExecutionRequestEventsRepository } from '../repositories/execution-request-events.repository';
import { ExecutionRequestsRepository } from '../repositories/execution-requests.repository';
import { ExecutionRequestStatus } from '../schemas/execution-request.schema';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';
import { ExecutionRequestAuditService } from '../services/execution-request-audit.service';
import { ExecutionRequestEventsService } from '../services/execution-request-events.service';
import {
  createActorFixture,
  createRuntimeEventFixture,
  createRuntimeRequestFixture,
} from './execution-request-test-fixtures';

describe('ExecutionRequestEventsService', () => {
  it('creates the automatic initial accepted event', async () => {
    const request = createRuntimeRequestFixture();
    const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
      create: jest.fn(async (record) => createRuntimeEventFixture(record)),
    };
    const auditService = createAuditServiceMock();
    const service = createService({}, eventRepository, auditService);

    const result = await service.createInitialAcceptedEvent(request, createActorFixture());

    expect(eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: request.tenantId,
        executionRequestId: request._id,
        requestKey: request.requestKey,
        eventType: ExecutionRequestEventType.Accepted,
        nextStatus: ExecutionRequestStatus.Accepted,
        reason: request.reason,
        message: request.message,
        metadata: {},
      }),
    );
    expect(result).toMatchObject({ eventType: ExecutionRequestEventType.Accepted });
    expect(auditService.recordEvent).not.toHaveBeenCalled();
  });

  it('lists events by execution request and tenant scope', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const request = createRuntimeRequestFixture({ _id: executionRequestId, tenantId });
    const repository: Pick<ExecutionRequestsRepository, 'findByTenantAndId'> = {
      findByTenantAndId: jest.fn(async () => request),
    };
    const eventRepository: Pick<
      ExecutionRequestEventsRepository,
      'findByFilters' | 'countByFilters'
    > = {
      findByFilters: jest.fn(async () => [
        createRuntimeEventFixture({
          tenantId,
          executionRequestId,
          requestKey: request.requestKey,
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

  it.each([
    [ExecutionRequestEventType.Accepted, ExecutionRequestStatus.Accepted],
    [ExecutionRequestEventType.Blocked, ExecutionRequestStatus.Blocked],
    [ExecutionRequestEventType.Failed, ExecutionRequestStatus.Failed],
    [ExecutionRequestEventType.CompletedDemo, ExecutionRequestStatus.CompletedDemo],
    [ExecutionRequestEventType.NotSupported, ExecutionRequestStatus.NotSupported],
  ])('creates %s event and maps it to %s status', async (eventType, nextStatus) => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const request = createRuntimeRequestFixture({
      _id: executionRequestId,
      tenantId,
      status: ExecutionRequestStatus.Queued,
    });
    const repository: Pick<
      ExecutionRequestsRepository,
      'findByTenantAndId' | 'updateStatusByTenantAndId'
    > = {
      findByTenantAndId: jest.fn(async () => request),
      updateStatusByTenantAndId: jest.fn(async () =>
        createRuntimeRequestFixture({ ...request, status: nextStatus }),
      ),
    };
    const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
      create: jest.fn(async (record) => createRuntimeEventFixture(record)),
    };
    const service = createService(repository, eventRepository);

    const result = await service.createEvent(
      executionRequestId.toString(),
      {
        tenantId: tenantId.toString(),
        eventType,
        message: 'Safe message.',
        reason: 'runtime_foundation_only',
      },
      { actorId: '662d4f6e7a1c2b00124f0999', actorRole: AdminRole.Operator },
    );

    expect(repository.updateStatusByTenantAndId).toHaveBeenCalledWith(
      tenantId,
      executionRequestId.toString(),
      nextStatus,
    );
    expect(result).toMatchObject({
      eventType,
      previousStatus: ExecutionRequestStatus.Queued,
      nextStatus,
    });
  });

  it('creates note_added without updating status', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const request = createRuntimeRequestFixture({ _id: executionRequestId, tenantId });
    const repository: Pick<
      ExecutionRequestsRepository,
      'findByTenantAndId' | 'updateStatusByTenantAndId'
    > = {
      findByTenantAndId: jest.fn(async () => request),
      updateStatusByTenantAndId: jest.fn(),
    };
    const eventRepository: Pick<ExecutionRequestEventsRepository, 'create'> = {
      create: jest.fn(async (record) => createRuntimeEventFixture(record)),
    };
    const service = createService(repository, eventRepository);

    const result = await service.createEvent(executionRequestId.toString(), {
      tenantId: tenantId.toString(),
      eventType: ExecutionRequestEventType.NoteAdded,
      message: 'Safe note.',
      metadata: { domain: 'sales', token: 'must-not-leak' },
    });

    expect(repository.updateStatusByTenantAndId).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      eventType: ExecutionRequestEventType.NoteAdded,
      previousStatus: ExecutionRequestStatus.Accepted,
      nextStatus: ExecutionRequestStatus.Accepted,
      metadata: { domain: 'sales' },
    });
    expect(JSON.stringify(result)).not.toContain('must-not-leak');
  });

  it('rejects invalid event transition payloads', async () => {
    const tenantId = new Types.ObjectId();
    const executionRequestId = new Types.ObjectId();
    const service = createService({
      findByTenantAndId: jest.fn(async () =>
        createRuntimeRequestFixture({ _id: executionRequestId, tenantId }),
      ),
    });

    await expect(
      service.createEvent(executionRequestId.toString(), {
        tenantId: tenantId.toString(),
        eventType: ExecutionRequestEventType.StatusChanged,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createEvent(executionRequestId.toString(), {
        tenantId: tenantId.toString(),
        eventType: ExecutionRequestEventType.NoteAdded,
        nextStatus: ExecutionRequestStatus.Blocked,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function createService(
  repository: Partial<ExecutionRequestsRepository>,
  eventRepository: Partial<ExecutionRequestEventsRepository> = {},
  auditService: Partial<ExecutionRequestAuditService> = createAuditServiceMock(),
): ExecutionRequestEventsService {
  return new ExecutionRequestEventsService(
    repository as ExecutionRequestsRepository,
    eventRepository as ExecutionRequestEventsRepository,
    auditService as ExecutionRequestAuditService,
  );
}

function createAuditServiceMock(): Pick<
  ExecutionRequestAuditService,
  'recordEvent' | 'recordExecutionRequest'
> {
  return {
    recordEvent: jest.fn(async () => undefined),
    recordExecutionRequest: jest.fn(async () => undefined),
  };
}
