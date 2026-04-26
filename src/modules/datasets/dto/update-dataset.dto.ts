import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateDatasetDto } from './create-dataset.dto';

export class UpdateDatasetDto extends PartialType(OmitType(CreateDatasetDto, ['tenantId'])) {}
