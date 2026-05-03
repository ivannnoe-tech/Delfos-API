import { ExecutionRequestStatus } from '../schemas/execution-request.schema';
import {
  BridgeReadinessBlockerShape,
  BridgeReadinessResult,
  ExecutionRequestLike,
  PrepareRuntimeConnectorCommandInput,
  PrepareRuntimeConnectorCommandResult,
  RuntimeClockPort,
  RuntimeConnectorBridgeEventShape,
  RuntimeConnectorBridgeSafeError,
  RuntimeConnectorCapabilityMapperInput,
  RuntimeConnectorLimits,
  RuntimeConnectorSafeMetadataContext,
  RuntimeExecutionRequestReaderPort,
  RuntimeReadinessEvaluatorPort,
  RuntimeReferenceResolverPort,
} from './bridge-types';
import { ConnectorExecutionCommandShape } from './connector-command-shape';
import { RuntimeConnectorCapabilityMapper } from './runtime-connector-capability-mapper';
import { RuntimeConnectorCommandValidationPort } from './runtime-connector-command-validation.port';
import { RuntimeConnectorLimitsPolicy } from './runtime-connector-limits-policy';
import { RuntimeConnectorReferenceBundle } from './runtime-connector-reference.types';
import { RuntimeConnectorSafeMetadataBuilder } from './runtime-connector-safe-metadata-builder';

export interface RuntimeConnectorBridgeResolverDependencies {
  readonly executionRequestReader: RuntimeExecutionRequestReaderPort;
  readonly readinessEvaluator: RuntimeReadinessEvaluatorPort;
  readonly referenceResolver: RuntimeReferenceResolverPort;
  readonly capabilityMapper: RuntimeConnectorCapabilityMapper;
  readonly limitsPolicy: RuntimeConnectorLimitsPolicy;
  readonly safeMetadataBuilder: RuntimeConnectorSafeMetadataBuilder;
  readonly commandValidator: RuntimeConnectorCommandValidationPort;
  readonly clock: RuntimeClockPort;
}

export class RuntimeSystemClock implements RuntimeClockPort {
  now(): Date {
    return new Date();
  }
}

export class RuntimeConnectorBridgeResolver {
  constructor(private readonly dependencies: RuntimeConnectorBridgeResolverDependencies) {}

  async prepareCommand(
    input: PrepareRuntimeConnectorCommandInput,
  ): Promise<PrepareRuntimeConnectorCommandResult> {
    const executionRequest = await this.dependencies.executionRequestReader.findByTenantAndId(
      input.tenantId,
      input.executionRequestId,
    );

    if (!executionRequest) {
      return this.blockedResult({
        code: 'execution_request_not_found',
        safeMessage: 'Execution request was not found for this tenant.',
        category: 'validation',
        eventType: 'command_blocked',
        status: ExecutionRequestStatus.Blocked,
        input,
        metadata: {
          executionRequestId: input.executionRequestId,
          tenantId: input.tenantId,
        },
      });
    }

    if (executionRequest.tenantId !== input.tenantId) {
      return this.blockedResult({
        code: 'execution_request_tenant_mismatch',
        safeMessage: 'Execution request does not belong to the requested tenant.',
        category: 'security',
        eventType: 'command_blocked',
        status: ExecutionRequestStatus.Blocked,
        input,
        executionRequest,
        metadata: {
          executionRequestId: executionRequest.id,
          tenantId: input.tenantId,
        },
      });
    }

    const readiness = await this.dependencies.readinessEvaluator.evaluate(executionRequest);

    if (readiness.blockers.length > 0) {
      return this.blockedResult({
        code: 'readiness_blocked',
        safeMessage: 'Execution request readiness blocked command preparation.',
        category: 'readiness',
        eventType: 'command_blocked',
        status: ExecutionRequestStatus.Blocked,
        input,
        executionRequest,
        blockers: readiness.blockers,
        metadata: this.readinessMetadata(readiness),
      });
    }

    const referenceResult = await this.dependencies.referenceResolver.resolveReferences({
      tenantId: input.tenantId,
      executionRequest,
    });

    if (!referenceResult.resolved || !referenceResult.references) {
      return this.blockedResult({
        code: 'references_blocked',
        safeMessage: 'Execution request references blocked command preparation.',
        category: 'validation',
        eventType: 'command_blocked',
        status: ExecutionRequestStatus.Blocked,
        input,
        executionRequest,
        blockers: referenceResult.blockers,
        metadata: {
          blockersCount: referenceResult.blockers.length,
        },
      });
    }

    const mapping = this.dependencies.capabilityMapper.map(
      this.toCapabilityMapperInput(executionRequest),
    );

    if (!mapping.supported) {
      return this.blockedResult({
        code: 'capability_not_supported',
        safeMessage: 'Connector capability is not supported for this execution request.',
        category: 'not_supported',
        eventType: 'command_not_supported',
        status: ExecutionRequestStatus.NotSupported,
        input,
        executionRequest,
        metadata: {
          reason: mapping.reason,
          kind: executionRequest.kind,
          mode: executionRequest.mode,
        },
      });
    }

    const limits = this.dependencies.limitsPolicy.resolve({
      capability: mapping.capability,
      connectorMode: mapping.connectorMode,
    });
    const metadata = this.dependencies.safeMetadataBuilder.build({
      metadata:
        referenceResult.references.safeMetadata ??
        referenceResult.references.sourceDescriptor?.safeMetadata ??
        referenceResult.references.source?.metadata,
      context: this.toSafeMetadataContext(
        executionRequest,
        referenceResult.references,
        readiness,
        limits,
        mapping.capability,
        mapping.connectorMode,
      ),
    });
    const command = this.buildCommand(
      input,
      executionRequest,
      referenceResult.references,
      limits,
      mapping.capability,
      mapping.connectorMode,
      metadata,
    );
    const validation = this.dependencies.commandValidator.validate(command);

    if (!validation.valid) {
      return this.blockedResult({
        code: 'command_validation_failed',
        safeMessage: 'Prepared connector command failed local validation.',
        category: validation.safeError.category,
        eventType: 'command_validation_failed',
        status: ExecutionRequestStatus.Failed,
        input,
        executionRequest,
        metadata: {
          validationCode: validation.safeError.code,
          validationCategory: validation.safeError.category,
        },
      });
    }

    const event = this.buildEvent({
      eventType: 'command_prepared',
      status: ExecutionRequestStatus.Accepted,
      safeMessage: 'Connector command prepared in memory. No dispatch was started.',
      metadata: {
        capability: command.capability,
        mode: command.mode,
        sourceType: command.sourceType,
        timeoutMs: command.timeoutMs,
        maxRows: command.maxRows,
        previewLimit: command.previewLimit,
      },
    });

    return {
      prepared: true,
      command: validation.command,
      blockers: [],
      events: [event],
    };
  }

  private buildCommand(
    input: PrepareRuntimeConnectorCommandInput,
    executionRequest: ExecutionRequestLike,
    references: RuntimeConnectorReferenceBundle,
    limits: RuntimeConnectorLimits,
    capability: ConnectorExecutionCommandShape['capability'],
    mode: ConnectorExecutionCommandShape['mode'],
    metadata: ConnectorExecutionCommandShape['metadata'],
  ): ConnectorExecutionCommandShape {
    return {
      executionRequestId: executionRequest.id,
      tenantId: input.tenantId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      connectionId: references.connectionId,
      credentialRef: references.credentialRef,
      datasetId: references.datasetId,
      fieldMappingId: references.fieldMappingIds[0],
      queryDefinitionId: references.queryDefinitionId ?? executionRequest.queryDefinitionId,
      dashboardDefinitionId:
        references.dashboardDefinitionId ?? executionRequest.dashboardDefinitionId,
      reportDefinitionId: references.reportDefinitionId ?? executionRequest.reportDefinitionId,
      sourceType:
        references.sourceType ??
        references.sourceDescriptor?.sourceType ??
        references.source?.sourceType,
      capability,
      mode,
      requestedAt: this.dependencies.clock.now().toISOString(),
      requestId: input.requestId,
      correlationId: input.correlationId,
      safeParameters: {},
      schemaMappingVersion:
        references.schemaMappingVersion ??
        references.sourceDescriptor?.schemaMappingVersion ??
        references.source?.schemaMappingVersion,
      maxRows: limits.maxRows,
      timeoutMs: limits.timeoutMs,
      previewLimit: limits.previewLimit,
      metadata,
    };
  }

  private blockedResult(input: {
    readonly code: RuntimeConnectorBridgeSafeError['code'];
    readonly safeMessage: string;
    readonly category: RuntimeConnectorBridgeSafeError['category'];
    readonly eventType: RuntimeConnectorBridgeEventShape['eventType'];
    readonly status: RuntimeConnectorBridgeEventShape['status'];
    readonly input: PrepareRuntimeConnectorCommandInput;
    readonly executionRequest?: ExecutionRequestLike;
    readonly blockers?: readonly BridgeReadinessBlockerShape[];
    readonly metadata?: Record<string, unknown>;
  }): PrepareRuntimeConnectorCommandResult {
    const safeMetadata = this.dependencies.safeMetadataBuilder.build({
      metadata: input.metadata,
      context: {
        kind: input.executionRequest?.kind,
        mode: input.executionRequest?.mode,
        status: input.status,
        readiness: {
          blockersCount: input.blockers?.length ?? 0,
        },
      },
    });
    const safeError: RuntimeConnectorBridgeSafeError = {
      code: input.code,
      safeMessage: input.safeMessage,
      category: input.category,
      retryable: false,
      safeMetadata,
    };
    const event = this.buildEvent({
      eventType: input.eventType,
      status: input.status,
      safeMessage: input.safeMessage,
      metadata: safeMetadata,
    });

    return {
      prepared: false,
      blockers: input.blockers ?? [],
      safeError,
      events: [event],
    };
  }

  private buildEvent(input: {
    readonly eventType: RuntimeConnectorBridgeEventShape['eventType'];
    readonly status: RuntimeConnectorBridgeEventShape['status'];
    readonly safeMessage: string;
    readonly metadata?: Record<string, unknown>;
  }): RuntimeConnectorBridgeEventShape {
    return {
      eventType: input.eventType,
      status: input.status,
      safeMessage: input.safeMessage,
      safeMetadata: this.dependencies.safeMetadataBuilder.build({
        metadata: input.metadata,
      }),
    };
  }

  private toCapabilityMapperInput(
    executionRequest: ExecutionRequestLike,
  ): RuntimeConnectorCapabilityMapperInput {
    return {
      kind: executionRequest.kind,
      mode: executionRequest.mode,
    };
  }

  private toSafeMetadataContext(
    executionRequest: ExecutionRequestLike,
    references: RuntimeConnectorReferenceBundle,
    readiness: BridgeReadinessResult,
    limits: RuntimeConnectorLimits,
    capability: string,
    mode: string,
  ): RuntimeConnectorSafeMetadataContext {
    return {
      kind: executionRequest.kind,
      mode,
      capability,
      sourceType:
        references.sourceType ??
        references.sourceDescriptor?.sourceType ??
        references.source?.sourceType,
      status: executionRequest.status,
      readiness: {
        ready: readiness.blockers.length === 0,
        checksCount: readiness.checks.length,
        warningsCount: readiness.warnings.length,
        blockersCount: readiness.blockers.length,
      },
      limits,
    };
  }

  private readinessMetadata(readiness: BridgeReadinessResult): Record<string, unknown> {
    return {
      checksCount: readiness.checks.length,
      warningsCount: readiness.warnings.length,
      blockersCount: readiness.blockers.length,
    };
  }
}
