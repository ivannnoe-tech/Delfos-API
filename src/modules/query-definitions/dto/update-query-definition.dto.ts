import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateQueryDefinitionDto } from './create-query-definition.dto';

export class UpdateQueryDefinitionDto extends PartialType(
  OmitType(CreateQueryDefinitionDto, ['tenantId']),
) {}
