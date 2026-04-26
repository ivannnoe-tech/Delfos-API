import { OmitType, PartialType } from '@nestjs/swagger';

import { CreateDashboardDefinitionDto } from './create-dashboard-definition.dto';

export class UpdateDashboardDefinitionDto extends PartialType(
  OmitType(CreateDashboardDefinitionDto, ['tenantId']),
) {}
