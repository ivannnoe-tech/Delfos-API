// Domain enums for the runtime module (execution request events). Mongoose schema removed in P5 (ADR-0035).

export enum ExecutionRequestEventType {
  Requested = 'requested',
  Accepted = 'accepted',
  StatusChanged = 'status_changed',
  Blocked = 'blocked',
  Failed = 'failed',
  CompletedDemo = 'completed_demo',
  NotSupported = 'not_supported',
  NoteAdded = 'note_added',
}
