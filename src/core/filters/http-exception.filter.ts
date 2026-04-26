import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

import {
  CORRELATION_ID_HEADER,
  REQUEST_ID_HEADER,
} from '../interceptors/request-context.interceptor';
import { ApiErrorDetail, ApiErrorResponse } from '../errors/api-error-response';

interface RequestWithIds extends Request {
  requestId?: string;
  correlationId?: string;
}

interface NormalizedErrorDetails {
  error: string;
  message: string;
  details?: ApiErrorDetail[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithIds>();
    const statusCode = this.getStatusCode(exception);
    const details = this.getErrorDetails(exception);
    const requestContext = this.ensureRequestContext(request, response);

    const body: ApiErrorResponse = {
      statusCode,
      error: details.error,
      message: details.message,
      ...(details.details ? { details: details.details } : {}),
      requestId: requestContext.requestId,
      correlationId: requestContext.correlationId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url,
      method: request.method,
    };

    response.status(statusCode).json(body);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorDetails(exception: unknown): NormalizedErrorDetails {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          error: exception.name,
          message: exceptionResponse,
        };
      }

      return this.readHttpExceptionBody(exceptionResponse, exception);
    }

    return {
      error: 'Internal Server Error',
      message: 'Unexpected error.',
    };
  }

  private readHttpExceptionBody(
    exceptionResponse: object,
    exception: HttpException,
  ): NormalizedErrorDetails {
    const body = exceptionResponse as Record<string, unknown>;
    const error =
      typeof body.error === 'string' ? body.error : this.getDefaultError(exception.getStatus());
    const details = this.readDetails(body.details) ?? this.readLegacyMessageDetails(body.message);
    const message = this.readMessage(body.message, exception.message, details);

    return {
      error,
      message,
      ...(details ? { details } : {}),
    };
  }

  private readMessage(
    value: unknown,
    fallback: string,
    details: ApiErrorDetail[] | undefined,
  ): string {
    if (typeof value === 'string') {
      return value;
    }

    if (details && details.length > 0) {
      return 'Validation failed';
    }

    return fallback;
  }

  private readDetails(value: unknown): ApiErrorDetail[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const details = value.flatMap((item): ApiErrorDetail[] => {
      if (!this.isRecord(item) || typeof item.message !== 'string') {
        return [];
      }

      const field = typeof item.field === 'string' ? item.field : undefined;

      return [
        {
          ...(field ? { field } : {}),
          message: item.message,
        },
      ];
    });

    return details.length > 0 ? details : undefined;
  }

  private readLegacyMessageDetails(value: unknown): ApiErrorDetail[] | undefined {
    if (!Array.isArray(value) || !value.every((item): item is string => typeof item === 'string')) {
      return undefined;
    }

    return value.map((message) => ({ message }));
  }

  private ensureRequestContext(
    request: RequestWithIds,
    response: Response,
  ): { requestId: string; correlationId: string } {
    const requestId =
      request.requestId ?? this.readHeader(request, REQUEST_ID_HEADER) ?? randomUUID();
    const correlationId =
      request.correlationId ?? this.readHeader(request, CORRELATION_ID_HEADER) ?? requestId;

    request.requestId = requestId;
    request.correlationId = correlationId;
    response.setHeader(REQUEST_ID_HEADER, requestId);
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    return { requestId, correlationId };
  }

  private readHeader(request: Request, headerName: string): string | undefined {
    const header = request.headers?.[headerName];
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

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getDefaultError(statusCode: number): string {
    const statusName = HttpStatus[statusCode];

    if (typeof statusName !== 'string') {
      return 'Error';
    }

    return statusName
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
