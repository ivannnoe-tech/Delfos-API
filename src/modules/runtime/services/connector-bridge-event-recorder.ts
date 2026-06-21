import { Injectable } from '@nestjs/common';

import { ADMIN_ROLES, AdminRole } from '../../auth/types/admin-role';
import { CreateExecutionRequestEventDto } from '../dto/create-execution-request-event.dto';
import { ExecutionRequestStatus } from '../schemas/execution-request.constants';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.constants';
import {
  ConnectorBridgeEventRecorderPort,
  RecordedBridgeEvent,
} from './connector-command-preparation.service';
import { ExecutionRequestActorContext } from './execution-request-actor-context';
import { ExecutionRequestEventsService } from './execution-request-events.service';

/**
 * Persists a safe connector bridge event on the execution-request timeline via
 * {@link ExecutionRequestEventsService}. Maps the bridge outcome status to the
 * matching execution-request event type (which drives the declarative status
 * transition + audit). Only safe, already-redacted data is forwarded — the raw
 * connector command never reaches this recorder (ADR-0037 hard boundary).
 */
@Injectable()
export class ConnectorBridgeEventRecorder implements ConnectorBridgeEventRecorderPort {
  constructor(private readonly eventsService: ExecutionRequestEventsService) {}

  async record(event: RecordedBridgeEvent): Promise<void> {
    const dto: CreateExecutionRequestEventDto = {
      tenantId: event.tenantId,
      eventType: this.toEventType(event.status),
      message: event.safeMessage,
      // The bridge event type doubles as a stable, safe audit reason code.
      reason: event.eventType,
      metadata: {
        ...event.safeMetadata,
        bridgeEventType: event.eventType,
      },
    };

    await this.eventsService.createEvent(event.executionRequestId, dto, this.toActor(event));
  }

  private toEventType(status: RecordedBridgeEvent['status']): ExecutionRequestEventType {
    switch (status) {
      case ExecutionRequestStatus.Accepted:
        return ExecutionRequestEventType.Accepted;
      case ExecutionRequestStatus.Blocked:
        return ExecutionRequestEventType.Blocked;
      case ExecutionRequestStatus.NotSupported:
        return ExecutionRequestEventType.NotSupported;
      case ExecutionRequestStatus.Failed:
        return ExecutionRequestEventType.Failed;
    }
  }

  private toActor(event: RecordedBridgeEvent): ExecutionRequestActorContext {
    return {
      actorId: event.actorId,
      actorRole: this.toAdminRole(event.actorRole),
    };
  }

  private toAdminRole(role: string | undefined): AdminRole | undefined {
    return role && (ADMIN_ROLES as readonly string[]).includes(role)
      ? (role as AdminRole)
      : undefined;
  }
}
