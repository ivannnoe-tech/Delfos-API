import { RuntimeConnectorCapabilityMapper } from '../bridge';
import { ExecutionRequestKind, ExecutionRequestMode } from '../schemas/execution-request.constants';

describe('RuntimeConnectorCapabilityMapper', () => {
  const mapper = new RuntimeConnectorCapabilityMapper();

  it('maps query dry_run to validate_mapping dry_run', () => {
    expect(
      mapper.map({
        kind: ExecutionRequestKind.Query,
        mode: ExecutionRequestMode.DryRun,
      }),
    ).toEqual({
      supported: true,
      capability: 'validate_mapping',
      connectorMode: 'dry_run',
    });
  });

  it('maps query demo to execute_query_preview demo', () => {
    expect(
      mapper.map({
        kind: ExecutionRequestKind.Query,
        mode: ExecutionRequestMode.Demo,
      }),
    ).toEqual({
      supported: true,
      capability: 'execute_query_preview',
      connectorMode: 'demo',
    });
  });

  it('maps query future_runtime to execute_query_preview preview', () => {
    expect(
      mapper.map({
        kind: ExecutionRequestKind.Query,
        mode: ExecutionRequestMode.FutureRuntime,
      }),
    ).toEqual({
      supported: true,
      capability: 'execute_query_preview',
      connectorMode: 'preview',
    });
  });

  it('maps dashboard demo to refresh_dashboard_data demo', () => {
    expect(
      mapper.map({
        kind: ExecutionRequestKind.Dashboard,
        mode: ExecutionRequestMode.Demo,
      }),
    ).toEqual({
      supported: true,
      capability: 'refresh_dashboard_data',
      connectorMode: 'demo',
    });
  });

  it('maps report demo to generate_report_preview demo', () => {
    expect(
      mapper.map({
        kind: ExecutionRequestKind.Report,
        mode: ExecutionRequestMode.Demo,
      }),
    ).toEqual({
      supported: true,
      capability: 'generate_report_preview',
      connectorMode: 'demo',
    });
  });

  it('keeps export real unsupported', () => {
    expect(
      mapper.map({
        kind: ExecutionRequestKind.Report,
        mode: ExecutionRequestMode.FutureRuntime,
        requestedOperation: 'export',
      }),
    ).toEqual({
      supported: false,
      reason: 'connector_export_not_supported',
    });
  });

  it('returns safe unsupported reason for unknown kind or mode', () => {
    expect(
      mapper.map({
        kind: 'unknown_kind',
        mode: 'unknown_mode',
      }),
    ).toEqual({
      supported: false,
      reason: 'connector_capability_mapping_not_supported',
    });
  });
});
