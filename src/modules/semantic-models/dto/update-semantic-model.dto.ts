import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateSemanticModelDto } from './create-semantic-model.dto';

export class UpdateSemanticModelDto extends PartialType(
  OmitType(CreateSemanticModelDto, ['tenantId']),
) {}
