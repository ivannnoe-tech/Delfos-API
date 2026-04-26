import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiSecurity } from '@nestjs/swagger';

import {
  DELFOS_ACTOR_ID_HEADER,
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_ADMIN_KEY_HEADER,
  DELFOS_TENANT_ID_HEADER,
} from '../constants/auth-headers';

export const ApiFoundationAuthHeaders = (): MethodDecorator & ClassDecorator =>
  applyDecorators(
    ApiSecurity('delfos-admin-key'),
    ApiHeader({
      name: DELFOS_ADMIN_KEY_HEADER,
      required: true,
      description: 'Temporary foundation admin key. Value comes from DELFOS_ADMIN_KEY.',
    }),
    ApiHeader({
      name: DELFOS_TENANT_ID_HEADER,
      required: false,
      description: 'Temporary foundation tenant context header. MongoDB ObjectId when provided.',
    }),
    ApiHeader({
      name: DELFOS_ACTOR_ID_HEADER,
      required: false,
      description: 'Temporary foundation actor identifier for development context.',
    }),
    ApiHeader({
      name: DELFOS_ACTOR_ROLE_HEADER,
      required: false,
      description:
        'Temporary foundation actor role. Required only for role-restricted admin operations.',
    }),
  );
