import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { of } from 'rxjs';

import {
  CORRELATION_ID_HEADER,
  RequestContextInterceptor,
  REQUEST_ID_HEADER,
} from '../request-context.interceptor';

interface RequestWithIds extends Request {
  requestId?: string;
  correlationId?: string;
}

describe('RequestContextInterceptor', () => {
  it('uses trusted incoming IDs and mirrors them to response headers', (done) => {
    const request = createRequest({
      [REQUEST_ID_HEADER]: 'request-123',
      [CORRELATION_ID_HEADER]: 'correlation-123',
    });
    const response = createResponse();
    const context = createExecutionContext(request, response);
    const next: CallHandler = {
      handle: jest.fn(() => of('ok')),
    };

    const result = new RequestContextInterceptor().intercept(context, next);

    result.subscribe(() => {
      expect(request.requestId).toBe('request-123');
      expect(request.correlationId).toBe('correlation-123');
      expect(response.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'request-123');
      expect(response.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'correlation-123');
      done();
    });
  });

  it('generates IDs when incoming headers are missing or invalid', (done) => {
    const request = createRequest({
      [REQUEST_ID_HEADER]: 'invalid header with spaces',
    });
    const response = createResponse();
    const context = createExecutionContext(request, response);
    const next: CallHandler = {
      handle: jest.fn(() => of('ok')),
    };

    const result = new RequestContextInterceptor().intercept(context, next);

    result.subscribe(() => {
      expect(request.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(request.correlationId).toBe(request.requestId);
      done();
    });
  });

  it('rejects an oversized request id header and generates a safe id instead', (done) => {
    const request = createRequest({
      [REQUEST_ID_HEADER]: 'a'.repeat(129),
    });
    const response = createResponse();
    const context = createExecutionContext(request, response);
    const next: CallHandler = {
      handle: jest.fn(() => of('ok')),
    };

    const result = new RequestContextInterceptor().intercept(context, next);

    result.subscribe(() => {
      expect(request.requestId).not.toContain('a'.repeat(129));
      expect(request.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      done();
    });
  });

  it('uses only the first value when a request id header arrives as an array', (done) => {
    const request = createRequest({});
    request.headers[REQUEST_ID_HEADER] = ['request-array-1', 'request-array-2'];
    const response = createResponse();
    const context = createExecutionContext(request, response);
    const next: CallHandler = {
      handle: jest.fn(() => of('ok')),
    };

    const result = new RequestContextInterceptor().intercept(context, next);

    result.subscribe(() => {
      expect(request.requestId).toBe('request-array-1');
      done();
    });
  });
});

function createRequest(headers: Record<string, string>): RequestWithIds {
  return {
    headers,
  } as RequestWithIds;
}

function createResponse(): Pick<Response, 'setHeader'> {
  return {
    setHeader: jest.fn(),
  };
}

function createExecutionContext(
  request: RequestWithIds,
  response: Pick<Response, 'setHeader'>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: () => undefined,
    }),
  } as ExecutionContext;
}
