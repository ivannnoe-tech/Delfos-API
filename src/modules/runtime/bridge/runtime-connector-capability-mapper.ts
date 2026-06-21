import { ExecutionRequestKind, ExecutionRequestMode } from '../schemas/execution-request.constants';
import { RuntimeConnectorCapabilityMapperInput } from './bridge-types';
import { RuntimeConnectorCapabilityMappingResult } from './bridge-types';

const UNSUPPORTED_EXPORT_OPERATIONS = new Set(['export', 'export_report', 'real_export']);

export class RuntimeConnectorCapabilityMapper {
  map(input: RuntimeConnectorCapabilityMapperInput): RuntimeConnectorCapabilityMappingResult {
    if (isExportOperation(input.requestedOperation)) {
      return this.unsupported('connector_export_not_supported');
    }

    switch (`${input.kind}:${input.mode}`) {
      case `${ExecutionRequestKind.Query}:${ExecutionRequestMode.DryRun}`:
        return {
          supported: true,
          capability: 'validate_mapping',
          connectorMode: 'dry_run',
        };
      case `${ExecutionRequestKind.Query}:${ExecutionRequestMode.Demo}`:
        return {
          supported: true,
          capability: 'execute_query_preview',
          connectorMode: 'demo',
        };
      case `${ExecutionRequestKind.Query}:${ExecutionRequestMode.FutureRuntime}`:
        return {
          supported: true,
          capability: 'execute_query_preview',
          connectorMode: 'preview',
        };
      case `${ExecutionRequestKind.Dashboard}:${ExecutionRequestMode.DryRun}`:
        return {
          supported: true,
          capability: 'validate_mapping',
          connectorMode: 'dry_run',
        };
      case `${ExecutionRequestKind.Dashboard}:${ExecutionRequestMode.Demo}`:
        return {
          supported: true,
          capability: 'refresh_dashboard_data',
          connectorMode: 'demo',
        };
      case `${ExecutionRequestKind.Dashboard}:${ExecutionRequestMode.FutureRuntime}`:
        return {
          supported: true,
          capability: 'refresh_dashboard_data',
          connectorMode: 'preview',
        };
      case `${ExecutionRequestKind.Report}:${ExecutionRequestMode.DryRun}`:
        return {
          supported: true,
          capability: 'validate_mapping',
          connectorMode: 'dry_run',
        };
      case `${ExecutionRequestKind.Report}:${ExecutionRequestMode.Demo}`:
        return {
          supported: true,
          capability: 'generate_report_preview',
          connectorMode: 'demo',
        };
      case `${ExecutionRequestKind.Report}:${ExecutionRequestMode.FutureRuntime}`:
        return {
          supported: true,
          capability: 'generate_report_preview',
          connectorMode: 'preview',
        };
      default:
        return this.unsupported('connector_capability_mapping_not_supported');
    }
  }

  private unsupported(reason: string): RuntimeConnectorCapabilityMappingResult {
    return {
      supported: false,
      reason,
    };
  }
}

function isExportOperation(requestedOperation: string | undefined): boolean {
  return (
    requestedOperation !== undefined &&
    UNSUPPORTED_EXPORT_OPERATIONS.has(requestedOperation.trim().toLowerCase())
  );
}
