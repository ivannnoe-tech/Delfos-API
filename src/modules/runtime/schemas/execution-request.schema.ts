// Domain enums for the runtime module (execution requests). Mongoose schema removed in P5 (ADR-0035); file kept at this path so existing imports stay valid — rename to *.constants.ts is a tracked follow-up.

export enum ExecutionRequestKind {
  Query = 'query',
  Dashboard = 'dashboard',
  Report = 'report',
}

export enum ExecutionRequestMode {
  Demo = 'demo',
  DryRun = 'dry_run',
  FutureRuntime = 'future_runtime',
}

export enum ExecutionRequestStatus {
  Queued = 'queued',
  Accepted = 'accepted',
  Blocked = 'blocked',
  Failed = 'failed',
  CompletedDemo = 'completed_demo',
  NotSupported = 'not_supported',
}
