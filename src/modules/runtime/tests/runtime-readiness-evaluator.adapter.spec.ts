import { ExecutionRequestLike } from '../bridge';
import { ExecutionRequestReadinessService } from '../services/execution-request-readiness.service';
import { RuntimeReadinessEvaluatorAdapter } from '../services/runtime-readiness-evaluator.adapter';

const EXECUTION_REQUEST = {
  id: 'er-1',
  tenantId: 't-1',
  kind: 'query',
  mode: 'future_runtime',
  status: 'accepted',
  requestKey: 'rk-1',
  queryDefinitionId: 'q-1',
} as ExecutionRequestLike;

describe('RuntimeReadinessEvaluatorAdapter', () => {
  it('forwards the execution request and returns the readiness shape unchanged', async () => {
    const evaluate = jest.fn(async () => ({
      checks: [{ code: 'c1', message: 'check' }],
      warnings: [{ code: 'w1', message: 'warning' }],
      blockers: [{ code: 'b1', message: 'blocker', target: 'field' }],
    }));
    const adapter = new RuntimeReadinessEvaluatorAdapter({
      evaluate,
    } as unknown as ExecutionRequestReadinessService);

    const result = await adapter.evaluate(EXECUTION_REQUEST);

    expect(evaluate).toHaveBeenCalledWith(EXECUTION_REQUEST);
    expect(result).toEqual({
      checks: [{ code: 'c1', message: 'check' }],
      warnings: [{ code: 'w1', message: 'warning' }],
      blockers: [{ code: 'b1', message: 'blocker', target: 'field' }],
    });
  });
});
