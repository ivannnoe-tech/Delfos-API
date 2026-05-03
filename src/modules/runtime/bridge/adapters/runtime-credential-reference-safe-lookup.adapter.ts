import { BridgeReadinessBlockerShape } from '../bridge-types';
import { RuntimeCredentialReferenceLike } from '../runtime-connector-reference-resolver';
import {
  isRuntimeConnectorForbiddenFieldName,
  isRuntimeConnectorSuspiciousCredentialRef,
  isRuntimeConnectorSuspiciousValue,
} from '../runtime-connector-security';
import { RuntimeConnectorSafeMetadataBuilder } from '../runtime-connector-safe-metadata-builder';
import {
  buildRuntimeReaderSafeMetadata,
  getRuntimeReaderEntityId,
  hasRuntimeReaderTenant,
  RuntimeReaderAdapterMetadataSource,
  toRuntimeReaderString,
} from './runtime-reader-adapter-utils';

const ACTIVE_STATUS = 'active';
const INACTIVE_STATUSES = new Set(['revoked', 'inactive', 'disabled', 'archived', 'draft']);
const SAFE_CREDENTIAL_REF_PATTERN = /^cred_[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;

export interface RuntimeCredentialReferenceLookupRecord extends RuntimeReaderAdapterMetadataSource {
  readonly id?: unknown;
  readonly _id?: unknown;
  readonly tenantId?: unknown;
  readonly connectionId?: unknown;
  readonly credentialRef?: unknown;
  readonly status?: unknown;
  readonly provider?: unknown;
  readonly type?: unknown;
  readonly protectedSecretValue?: unknown;
  readonly secretValue?: unknown;
  readonly maskedPreview?: unknown;
}

export interface RuntimeCredentialReferenceLookupDependency {
  findByTenantAndConnection(
    tenantId: string,
    connectionId: string,
  ): Promise<readonly RuntimeCredentialReferenceLookupRecord[]>;
  findByTenantAndCredentialRef(
    tenantId: string,
    credentialRef: string,
  ): Promise<RuntimeCredentialReferenceLookupRecord | null>;
}

export interface RuntimeCredentialReferenceLookupResult {
  readonly found: boolean;
  readonly credential?: RuntimeCredentialReferenceLike;
  readonly blocker?: BridgeReadinessBlockerShape;
}

export interface RuntimeCredentialReferenceSafeLookupPort {
  findActiveByTenantAndConnection(
    tenantId: string,
    connectionId: string,
  ): Promise<RuntimeCredentialReferenceLookupResult>;
  findByCredentialRef(
    tenantId: string,
    credentialRef: string,
  ): Promise<RuntimeCredentialReferenceLookupResult>;
}

export class RuntimeCredentialReferenceSafeLookupAdapter implements RuntimeCredentialReferenceSafeLookupPort {
  constructor(
    private readonly credentials: RuntimeCredentialReferenceLookupDependency,
    private readonly safeMetadataBuilder = new RuntimeConnectorSafeMetadataBuilder(),
  ) {}

  async findActiveByTenantAndConnection(
    tenantId: string,
    connectionId: string,
  ): Promise<RuntimeCredentialReferenceLookupResult> {
    if (!tenantId) {
      return this.blocked('tenant_mismatch', 'tenantId is required for credential lookup.');
    }

    if (!connectionId) {
      return this.blocked(
        'credential_ref_missing',
        'Connection reference is required for credential lookup.',
        'connectionId',
      );
    }

    try {
      const records = await this.credentials.findByTenantAndConnection(tenantId, connectionId);
      const scopedRecords = records.filter(
        (record) =>
          hasRuntimeReaderTenant(record, tenantId) &&
          toRuntimeReaderString(record.connectionId) === connectionId,
      );
      const activeRecords = scopedRecords.filter((record) =>
        this.isActiveStatus(toRuntimeReaderString(record.status)),
      );

      if (activeRecords.length === 0) {
        if (scopedRecords.some((record) => this.isInactiveStatus(record))) {
          return this.blocked(
            'credential_ref_inactive',
            'Credential reference is not active.',
            'credential.status',
          );
        }

        return this.blocked(
          'credential_ref_missing',
          'No active credential reference was found for this connection.',
          'connectionId',
        );
      }

      if (activeRecords.length > 1) {
        return this.blocked(
          'multiple_active_credentials_not_supported',
          'Multiple active credential references are not supported for one connection.',
          'connectionId',
        );
      }

      return this.toFoundCredential(activeRecords[0], tenantId, connectionId);
    } catch {
      return this.blocked(
        'credential_ref_missing',
        'Credential reference lookup failed safely.',
        'credentialRef',
      );
    }
  }

  async findByCredentialRef(
    tenantId: string,
    credentialRef: string,
  ): Promise<RuntimeCredentialReferenceLookupResult> {
    if (!tenantId) {
      return this.blocked('tenant_mismatch', 'tenantId is required for credential lookup.');
    }

    if (!this.isSafeCredentialRef(credentialRef)) {
      return this.blocked(
        'credential_ref_missing',
        'Credential reference is not safe for runtime lookup.',
        'credentialRef',
      );
    }

    try {
      const record = await this.credentials.findByTenantAndCredentialRef(tenantId, credentialRef);

      if (!record) {
        return this.blocked(
          'credential_ref_missing',
          'Credential reference was not found for this tenant.',
          'credentialRef',
        );
      }

      if (!hasRuntimeReaderTenant(record, tenantId)) {
        return this.blocked(
          'tenant_mismatch',
          'Credential reference does not belong to the requested tenant.',
          'credential.tenantId',
        );
      }

      const resolvedRef = this.resolveCredentialRef(record);
      if (resolvedRef !== credentialRef) {
        return this.blocked(
          'credential_ref_missing',
          'Credential reference was not found for this tenant.',
          'credentialRef',
        );
      }

      if (!this.isActiveStatus(toRuntimeReaderString(record.status))) {
        return this.blocked(
          'credential_ref_inactive',
          'Credential reference is not active.',
          'credential.status',
        );
      }

      return this.toFoundCredential(record, tenantId);
    } catch {
      return this.blocked(
        'credential_ref_missing',
        'Credential reference lookup failed safely.',
        'credentialRef',
      );
    }
  }

  private toFoundCredential(
    record: RuntimeCredentialReferenceLookupRecord | undefined,
    tenantId: string,
    connectionId?: string,
  ): RuntimeCredentialReferenceLookupResult {
    if (!record) {
      return this.blocked(
        'credential_ref_missing',
        'Credential reference was not found for this tenant.',
        'credentialRef',
      );
    }

    const credentialRef = this.resolveCredentialRef(record);
    const status = toRuntimeReaderString(record.status);

    if (!credentialRef || !status) {
      return this.blocked(
        'credential_ref_missing',
        'Credential reference is not safe for runtime lookup.',
        'credentialRef',
      );
    }

    const provider = toRuntimeReaderString(record.provider);
    const type = toRuntimeReaderString(record.type);
    const resolvedConnectionId = connectionId ?? toRuntimeReaderString(record.connectionId);

    return {
      found: true,
      credential: {
        credentialRef,
        tenantId,
        connectionId: resolvedConnectionId,
        status,
        provider,
        type,
        safeMetadata: buildRuntimeReaderSafeMetadata(
          this.safeMetadataBuilder,
          record.metadata,
          record.safeMetadata,
          {
            provider,
            status,
            type,
          },
        ),
      },
    };
  }

  private resolveCredentialRef(record: RuntimeCredentialReferenceLookupRecord): string | undefined {
    const directRef = toRuntimeReaderString(record.credentialRef);

    if (directRef) {
      return this.isSafeCredentialRef(directRef) ? directRef : undefined;
    }

    const id = getRuntimeReaderEntityId(record);
    if (!id || isRuntimeConnectorSuspiciousValue(id)) {
      return undefined;
    }

    const credentialRef = this.isSafeCredentialRef(id) ? id : `cred_${id}`;

    return this.isSafeCredentialRef(credentialRef) ? credentialRef : undefined;
  }

  private isSafeCredentialRef(credentialRef: string): boolean {
    return (
      SAFE_CREDENTIAL_REF_PATTERN.test(credentialRef) &&
      !isRuntimeConnectorForbiddenFieldName(credentialRef) &&
      !isRuntimeConnectorSuspiciousCredentialRef(credentialRef)
    );
  }

  private isActiveStatus(status: string | undefined): boolean {
    return status?.toLowerCase() === ACTIVE_STATUS;
  }

  private isInactiveStatus(record: RuntimeCredentialReferenceLookupRecord): boolean {
    const status = toRuntimeReaderString(record.status)?.toLowerCase();

    return Boolean(status && (INACTIVE_STATUSES.has(status) || status !== ACTIVE_STATUS));
  }

  private blocked(
    code: string,
    message: string,
    target?: string,
  ): RuntimeCredentialReferenceLookupResult {
    return {
      found: false,
      blocker: {
        code,
        message,
        target,
      },
    };
  }
}
