export interface RuntimeConnectorSourceDescriptor {
  readonly sourceType: string;
  readonly sourceObject?: string;
  readonly connectionId: string;
  readonly credentialRef?: string;
  readonly sourceFieldPath?: string;
  readonly schemaMappingVersion?: string;
  readonly safeMetadata: Record<string, string | number | boolean | null>;
  readonly metadata?: Record<string, unknown>;
}

export interface RuntimeConnectorSourceFieldDescriptor {
  readonly sourceObject?: string;
  readonly sourceFieldPath: string;
  readonly sourceFieldType?: string;
  readonly required?: boolean;
}

export interface RuntimeConnectorLogicalFieldDescriptor {
  readonly logicalField: string;
  readonly dataType?: string;
  readonly logicalType?: string;
  readonly required?: boolean;
  readonly sourceFieldPath?: string;
  readonly semanticRole?: string;
  readonly safeMetadata?: Record<string, string | number | boolean | null>;
}

export interface RuntimeConnectorFieldMappingDescriptor {
  readonly fieldMappingId: string;
  readonly datasetId?: string;
  readonly datasetKey?: string;
  readonly targetField: string;
  readonly sourceObject?: string;
  readonly sourceFieldPath: string;
  readonly logicalField: string;
  readonly dataType?: string;
  readonly required?: boolean;
  readonly safeMetadata?: Record<string, string | number | boolean | null>;
  readonly source: RuntimeConnectorSourceFieldDescriptor;
  readonly logical: RuntimeConnectorLogicalFieldDescriptor;
  readonly transform?: string;
  readonly status?: string;
}

export interface RuntimeConnectorReferenceBundle {
  readonly executionRequestId: string;
  readonly tenantId: string;
  readonly kind: string;
  readonly mode: string;
  readonly rootReference: {
    readonly kind: string;
    readonly id: string;
  };
  readonly connectionId?: string;
  readonly credentialRef?: string;
  readonly datasetId?: string;
  readonly fieldMappingIds: string[];
  readonly queryDefinitionId?: string;
  readonly dashboardDefinitionId?: string;
  readonly reportDefinitionId?: string;
  readonly sourceType?: string;
  readonly sourceDescriptor?: RuntimeConnectorSourceDescriptor;
  readonly source?: RuntimeConnectorSourceDescriptor;
  readonly fieldMappings: RuntimeConnectorFieldMappingDescriptor[];
  readonly logicalFields: RuntimeConnectorLogicalFieldDescriptor[];
  readonly schemaMappingVersion?: string;
  readonly safeMetadata: Record<string, string | number | boolean | null>;
}
