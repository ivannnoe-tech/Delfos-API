// Domain enums for the runtime module (execution request events). Mongoose schema removed in P5 (ADR-0035); file kept at this path so existing imports stay valid — rename to *.constants.ts is a tracked follow-up.

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
