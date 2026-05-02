import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import {
  ReportDefinitionStatus,
  ReportDefinitionVisibility,
} from '../schemas/report-definition.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ListReportDefinitionsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;

  @ApiPropertyOptional({ example: 'monthly_sales_report' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  reportKey?: string;

  @ApiPropertyOptional({ enum: ReportDefinitionStatus })
  @IsOptional()
  @IsEnum(ReportDefinitionStatus)
  status?: ReportDefinitionStatus;

  @ApiPropertyOptional({ enum: ReportDefinitionVisibility })
  @IsOptional()
  @IsEnum(ReportDefinitionVisibility)
  visibility?: ReportDefinitionVisibility;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0601' })
  @IsOptional()
  @IsMongoId()
  queryDefinitionId?: string;

  @ApiPropertyOptional({ example: '662d4f6e7a1c2b00124f0701' })
  @IsOptional()
  @IsMongoId()
  dashboardDefinitionId?: string;
}

export class ReportDefinitionTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;
}
