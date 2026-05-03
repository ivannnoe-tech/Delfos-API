import {
  RuntimeCredentialReferenceLike,
  RuntimeCredentialReferenceReaderPort,
} from '../runtime-connector-reference-resolver';
import { RuntimeConnectorSafeMetadataBuilder } from '../runtime-connector-safe-metadata-builder';
import {
  buildRuntimeReaderSafeMetadata,
  getRuntimeReaderEntityId,
  hasRuntimeReaderTenant,
  RuntimeReaderAdapterMetadataSource,
  toRuntimeReaderString,
} from './runtime-reader-adapter-utils';

export interface RuntimeCredentialReferenceReaderAdapterSource extends RuntimeReaderAdapterMetadataSource {
  readonly id?: unknown;
  readonly _id?: unknown;
  readonly tenantId?: unknown;
  readonly credentialRef?: unknown;
  readonly status?: unknown;
  readonly provider?: unknown;
  readonly type?: unknown;
}

export interface RuntimeCredentialReferenceReaderAdapterDependency {
  findByTenantAndCredentialRef?(
    tenantId: string,
    credentialRef: string,
  ): Promise<RuntimeCredentialReferenceReaderAdapterSource | null>;
  findOne?(
    tenantId: string,
    credentialId: string,
  ): Promise<RuntimeCredentialReferenceReaderAdapterSource | null>;
}

export class RuntimeCredentialReferenceReaderAdapter implements RuntimeCredentialReferenceReaderPort {
  constructor(
    private readonly credentials: RuntimeCredentialReferenceReaderAdapterDependency,
    private readonly safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder(),
  ) {}

  async findByTenantAndCredentialRef(
    tenantId: string,
    credentialRef: string,
  ): Promise<RuntimeCredentialReferenceLike | null> {
    try {
      const credential = await this.loadCredential(tenantId, credentialRef);

      if (!credential || !hasRuntimeReaderTenant(credential, tenantId)) {
        return null;
      }

      const resolvedRef =
        toRuntimeReaderString(credential.credentialRef) ?? this.toCredentialRef(credential);
      const status = toRuntimeReaderString(credential.status);

      if (!resolvedRef || resolvedRef !== credentialRef || !status) {
        return null;
      }

      const provider = toRuntimeReaderString(credential.provider);

      return {
        credentialRef: resolvedRef,
        tenantId,
        status,
        provider,
        safeMetadata: buildRuntimeReaderSafeMetadata(
          this.safeMetadataBuilder,
          credential.metadata,
          credential.safeMetadata,
          {
            provider,
            status,
            type: toRuntimeReaderString(credential.type),
          },
        ),
      };
    } catch {
      return null;
    }
  }

  private async loadCredential(
    tenantId: string,
    credentialRef: string,
  ): Promise<RuntimeCredentialReferenceReaderAdapterSource | null> {
    if (this.credentials.findByTenantAndCredentialRef) {
      return this.credentials.findByTenantAndCredentialRef(tenantId, credentialRef);
    }

    if (!this.credentials.findOne) {
      return null;
    }

    const credentialId = this.parseCredentialRef(credentialRef);
    if (!credentialId) {
      return null;
    }

    return this.credentials.findOne(tenantId, credentialId);
  }

  private parseCredentialRef(credentialRef: string): string | undefined {
    const match = /^cred_([0-9a-f]{24})$/i.exec(credentialRef);

    return match?.[1];
  }

  private toCredentialRef(
    source: RuntimeCredentialReferenceReaderAdapterSource,
  ): string | undefined {
    const id = getRuntimeReaderEntityId(source);

    return id ? `cred_${id}` : undefined;
  }
}
