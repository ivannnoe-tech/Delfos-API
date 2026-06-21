import { Injectable } from '@nestjs/common';

import {
  BridgeReadinessResult,
  ExecutionRequestLike,
  RuntimeReadinessEvaluatorPort,
} from '../bridge';
import { ExecutionRequestRecord } from '../repositories/execution-requests.repository';
import { ExecutionRequestReadinessService } from './execution-request-readiness.service';

/**
 * Bridges the declarative {@link ExecutionRequestReadinessService} into the
 * runtime connector bridge {@link RuntimeReadinessEvaluatorPort}. The readiness
 * service already produces the `{ checks, warnings, blockers }` shape; this
 * adapter only reconciles the port signature (the bridge resolver passes the
 * tenant-scoped execution request it just read). No runtime/dispatch behavior
 * (ADR-0037 / ADR-0038): readiness is fully declarative.
 */
@Injectable()
export class RuntimeReadinessEvaluatorAdapter implements RuntimeReadinessEvaluatorPort {
  constructor(private readonly readinessService: ExecutionRequestReadinessService) {}

  async evaluate(executionRequest: ExecutionRequestLike): Promise<BridgeReadinessResult> {
    const readiness = await this.readinessService.evaluate(
      executionRequest as ExecutionRequestRecord,
    );

    return {
      checks: readiness.checks,
      warnings: readiness.warnings,
      blockers: readiness.blockers,
    };
  }
}
