import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

interface RequestWithIds extends Request {
  requestId?: string;
  correlationId?: string;
}

interface ErrorDetails {
  error: string;
  message: string | string[];
}

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  requestId: string | null;
  correlationId: string | null;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithIds>();
    const statusCode = this.getStatusCode(exception);
    const details = this.getErrorDetails(exception);

    const body: ErrorResponseBody = {
      statusCode,
      error: details.error,
      message: details.message,
      requestId: request.requestId ?? null,
      correlationId: request.correlationId ?? null,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    };

    response.status(statusCode).json(body);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorDetails(exception: unknown): ErrorDetails {
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

  private readHttpExceptionBody(exceptionResponse: object, exception: HttpException): ErrorDetails {
    const body = exceptionResponse as Record<string, unknown>;
    const error = typeof body.error === 'string' ? body.error : exception.name;
    const message = this.readMessage(body.message, exception.message);

    return {
      error,
      message,
    };
  }

  private readMessage(value: unknown, fallback: string): string | string[] {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) {
      return value;
    }

    return fallback;
  }
}
