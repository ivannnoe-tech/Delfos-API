import { AdminRole } from './admin-role';

export interface RequestAuthContext {
  tenantId?: string;
  actorId?: string;
  actorRole?: AdminRole;
}
