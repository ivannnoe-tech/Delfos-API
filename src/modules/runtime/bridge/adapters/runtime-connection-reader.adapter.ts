import {
  RuntimeConnectionLike,
  RuntimeConnectionReaderPort,
} from '../runtime-connector-reference-resolver';
import { RuntimeConnectorSafeMetadataBuilder } from '../runtime-connector-safe-metadata-builder';
import {
  buildRuntimeReaderSafeMetadata,
  getRuntimeReaderEntityId,
  hasRuntimeReaderTenant,
  RuntimeReaderAdapterMetadataSource,
  toRuntimeReaderBoolean,
  toRuntimeReaderString,
} from './runtime-reader-adapter-utils';

export interface RuntimeConnectionReaderAdapterSource extends RuntimeReaderAdapterMetadataSource {
  readonly id?: unknown;
  readonly _id?: unknown;
  readonly tenantId?: unknown;
  readonly type?: unknown;
  readonly sourceType?: unknown;
  readonly status?: unknown;
  readonly credentialRef?: unknown;
  readonly authType?: unknown;
  readonly requiresCredential?: unknown;
  readonly hasCredentialReference?: unknown;
}

export interface RuntimeConnectionReaderAdapterDependency {
  findOne(
    tenantId: string,
    connectionId: string,
  ): Promise<RuntimeConnectionReaderAdapterSource | null>;
}

export class RuntimeConnectionReaderAdapter implements RuntimeConnectionReaderPort {
  constructor(
    private readonly connections: RuntimeConnectionReaderAdapterDependency,
    private readonly safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder(),
  ) {}

  async findByTenantAndId(
    tenantId: string,
    connectionId: string,
  ): Promise<RuntimeConnectionLike | null> {
    try {
      const connection = await this.connections.findOne(tenantId, connectionId);

      if (!connection || !hasRuntimeReaderTenant(connection, tenantId)) {
        return null;
      }

      const id = getRuntimeReaderEntityId(connection);
      const status = toRuntimeReaderString(connection.status);

      if (!id || !status) {
        return null;
      }

      const authType = toRuntimeReaderString(connection.authType);
      const type = toRuntimeReaderString(connection.type);
      const sourceType = toRuntimeReaderString(connection.sourceType) ?? type;
      const hasCredentialReference = toRuntimeReaderBoolean(connection.hasCredentialReference);

      return {
        id,
        tenantId,
        type,
        sourceType,
        status,
        credentialRef: toRuntimeReaderString(connection.credentialRef),
        authType,
        requiresCredential: toRuntimeReaderBoolean(connection.requiresCredential),
        safeMetadata: buildRuntimeReaderSafeMetadata(
          this.safeMetadataBuilder,
          connection.metadata,
          connection.safeMetadata,
          {
            type,
            sourceType,
            authType,
            status,
            hasCredentialReference,
          },
        ),
      };
    } catch {
      return null;
    }
  }
}
