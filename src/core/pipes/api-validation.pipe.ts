import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

import { ApiErrorDetail } from '../errors/api-error-response';

export function createApiValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => createApiValidationException(errors),
  });
}

function createApiValidationException(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    message: 'Validation failed',
    details: flattenValidationErrors(errors),
  });
}

function flattenValidationErrors(errors: ValidationError[], parentPath?: string): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const ownDetails = Object.values(error.constraints ?? {}).map((message) => ({
      field,
      message,
    }));
    const childDetails = flattenValidationErrors(error.children ?? [], field);

    return [...ownDetails, ...childDetails];
  });
}
