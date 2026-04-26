import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import {
  DashboardDefinitionStatus,
  DashboardDefinitionVisibility,
} from '../schemas/dashboard-definition.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ListDashboardDefinitionsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
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
  @IsMongoId()
  tenantId!: string;
}
