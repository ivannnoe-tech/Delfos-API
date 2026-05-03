export interface RuntimeConnectorSourceDescriptor {
  readonly sourceType: string;
  readonly sourceObject?: string;
  readonly connectionId?: string;
  readonly credentialRef?: string;
  readonly schemaMappingVersion?: string;
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
  readonly logicalType?: string;
  readonly semanticRole?: string;
}

export interface RuntimeConnectorFieldMappingDescriptor {
  readonly fieldMappingId: string;
  readonly datasetId?: string;
  readonly datasetKey?: string;
  readonly source: RuntimeConnectorSourceFieldDescriptor;
  readonly logical: RuntimeConnectorLogicalFieldDescriptor;
  readonly transform?: string;
  readonly status?: string;
}

export interface RuntimeConnectorReferenceBundle {
  readonly tenantId: string;
  readonly connectionId?: string;
  readonly credentialRef?: string;
  readonly datasetId?: string;
  readonly fieldMappingIds: string[];
  readonly queryDefinitionId?: string;
  readonly dashboardDefinitionId?: string;
  readonly reportDefinitionId?: string;
  readonly sourceType?: string;
  readonly source?: RuntimeConnectorSourceDescriptor;
  readonly fieldMappings: RuntimeConnectorFieldMappingDescriptor[];
  readonly schemaMappingVersion?: string;
}
