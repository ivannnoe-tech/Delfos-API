import { Injectable } from '@nestjs/common';

import { isSensitiveMetadataValue } from '../../../core/utils/sanitize-metadata';
import { DatasetFieldDto } from '../dto/dataset-field.dto';
import { DatasetField } from '../schemas/dataset.schema';

@Injectable()
export class DatasetFieldSanitizerService {
  sanitize(fields?: DatasetFieldDto[]): DatasetField[] {
    return (fields ?? []).map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required ?? false,
      description: field.description,
      sampleMasked:
        field.sampleMasked && !isSensitiveMetadataValue(field.sampleMasked)
          ? field.sampleMasked
          : undefined,
      semanticRole: field.semanticRole,
    }));
  }
}
