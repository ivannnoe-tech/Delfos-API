import { AdminRole } from '../../auth/types/admin-role';

export interface ExecutionRequestActorContext {
  actorId?: string;
  actorRole?: AdminRole;
}
