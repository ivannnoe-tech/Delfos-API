import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

interface RequestWithContext extends Request {
  requestId?: string;
  correlationId?: string;
}

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<RequestWithContext>();
    const response = httpContext.getResponse<Response>();

    const requestId = this.readHeader(request, REQUEST_ID_HEADER) ?? randomUUID();
    const correlationId = this.readHeader(request, CORRELATION_ID_HEADER) ?? requestId;

    request.requestId = requestId;
    request.correlationId = correlationId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    return next.handle();
  }

  private readHeader(request: Request, headerName: string): string | undefined {
    const header = request.headers[headerName];
    const value = Array.isArray(header) ? header[0] : header;

    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length === 0 || trimmedValue.length > 128) {
      return undefined;
    }

    return /^[A-Za-z0-9._:-]+$/.test(trimmedValue) ? trimmedValue : undefined;
  }
}
