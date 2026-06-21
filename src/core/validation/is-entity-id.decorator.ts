import {
  buildMessage,
  isMongoId,
  isUUID,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Validates a value as an opaque entity identifier accepted by the foundation
 * during the MongoDB → PostgreSQL migration (ADR-0035 / ADR-0036).
 *
 * Identifiers are opaque to clients, but their underlying format changes with
 * the backend: MongoDB exposes 24-hex `ObjectId`s, PostgreSQL exposes `UUID`s.
 * Accepting **either** keeps the REST contract stable across the migration and
 * after the Mongo removal (P5) — UUIDs validate, and legacy ObjectId-shaped
 * values still validate harmlessly. Replaces the previous `@IsMongoId()`.
 */
export function IsEntityId(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol): void => {
    registerDecorator({
      name: 'isEntityId',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && (isMongoId(value) || isUUID(value));
        },
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be a Mongo ObjectId or a UUID`,
          validationOptions,
        ),
      },
    });
  };
}
