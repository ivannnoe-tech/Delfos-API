import { Request } from 'express';

import { RequestAuthContext } from './request-auth-context';

export interface AuthenticatedRequest extends Request {
  delfosAuthContext?: RequestAuthContext;
}
