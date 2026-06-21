import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import {
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
} from '../schemas/dashboard-definition.constants';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ListDashboardDefinitionsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiPropertyOptional({ example: 'sales_dashboard' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  dashboardKey?: string;

  @ApiPropertyOptional({ enum: DashboardDefinitionStatus })
  @IsOptional()
  @IsEnum(DashboardDefinitionStatus)
  status?: DashboardDefinitionStatus;

  @ApiPropertyOptional({ enum: DashboardDefinitionVisibility })
  @IsOptional()
  @IsEnum(DashboardDefinitionVisibility)
  visibility?: DashboardDefinitionVisibility;
}

export class DashboardDefinitionTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;
}
