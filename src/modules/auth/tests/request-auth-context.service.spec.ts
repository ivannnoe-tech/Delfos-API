import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

import {
  DELFOS_ACTOR_ID_HEADER,
  DELFOS_ACTOR_ROLE_HEADER,
  DELFOS_TENANT_ID_HEADER,
} from '../constants/auth-headers';
import { RequestAuthContextService } from '../services/request-auth-context.service';
import { AdminRole } from '../types/admin-role';

describe('RequestAuthContextService', () => {
  it('extracts temporary foundation request context from headers', () => {
    const service = new RequestAuthContextService();
    const request = createRequest({
      [DELFOS_TENANT_ID_HEADER]: '662d4f6e7a1c2b00124f0001',
      [DELFOS_ACTOR_ID_HEADER]: 'dev-actor-001',
      [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
    });

    expect(service.extract(request)).toEqual({
      tenantId: '662d4f6e7a1c2b00124f0001',
      actorId: 'dev-actor-001',
      actorRole: AdminRole.Operator,
    });
  });

  it('accepts a PostgreSQL UUID tenant and actor id (ADR-0035 / P5)', () => {
    const service = new RequestAuthContextService();
    const request = createRequest({
      [DELFOS_TENANT_ID_HEADER]: '04dfcf68-3d27-4f24-a599-f3ef57edad36',
      [DELFOS_ACTOR_ID_HEADER]: '7b0dcbed-442f-4f6d-aa3d-cd46327cbbb6',
      [DELFOS_ACTOR_ROLE_HEADER]: AdminRole.Operator,
    });

    expect(service.extract(request)).toEqual({
      tenantId: '04dfcf68-3d27-4f24-a599-f3ef57edad36',
      actorId: '7b0dcbed-442f-4f6d-aa3d-cd46327cbbb6',
      actorRole: AdminRole.Operator,
    });
  });

  it('rejects invalid tenant context format', () => {
    const service = new RequestAuthContextService();
    const request = createRequest({
      [DELFOS_TENANT_ID_HEADER]: 'invalid-tenant',
    });

    expect(() => service.extract(request)).toThrow(BadRequestException);
  });

  it('rejects invalid actor role format', () => {
    const service = new RequestAuthContextService();
    const request = createRequest({
      [DELFOS_ACTOR_ROLE_HEADER]: 'editor',
    });

    expect(() => service.extract(request)).toThrow(BadRequestException);
  });
});

function createRequest(headers: Record<string, string>): Request {
  return {
    headers,
  } as Request;
}
