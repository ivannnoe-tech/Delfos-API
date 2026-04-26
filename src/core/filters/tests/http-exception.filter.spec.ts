import { ArgumentsHost, BadRequestException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

import { HttpExceptionFilter } from '../http-exception.filter';

interface RequestWithIds extends Request {
  requestId?: string;
  correlationId?: string;
}

interface ResponseMock {
  status: jest.MockedFunction<(statusCode: number) => ResponseMock>;
  json: jest.MockedFunction<(body: unknown) => void>;
}

describe('HttpExceptionFilter', () => {
  it('normalizes Nest HTTP exceptions', () => {
    const response = createResponse();
    const host = createHost(
      {
        originalUrl: '/health',
        requestId: 'request-123',
        correlationId: 'correlation-123',
      } as RequestWithIds,
      response,
    );

    new HttpExceptionFilter().catch(new BadRequestException(['invalid field']), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: ['invalid field'],
        requestId: 'request-123',
        correlationId: 'correlation-123',
        path: '/health',
      }),
    );
  });

  it('sanitizes unexpected exceptions', () => {
    const response = createResponse();
    const host = createHost({ originalUrl: '/health' } as RequestWithIds, response);

    new HttpExceptionFilter().catch(new Error('database secret leaked'), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Unexpected error.',
        requestId: null,
        correlationId: null,
      }),
    );
  });
});

function createResponse(): ResponseMock {
  const response: Partial<ResponseMock> = {};
  response.status = jest.fn((statusCode: number) => {
    void statusCode;
    return response as ResponseMock;
  });
  response.json = jest.fn();
  return response as ResponseMock;
}

function createHost(request: RequestWithIds, response: ResponseMock): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: () => undefined,
    }),
  } as ArgumentsHost;
}
