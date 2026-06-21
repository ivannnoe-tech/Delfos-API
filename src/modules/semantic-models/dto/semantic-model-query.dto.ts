import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { SemanticModelStatus } from '../schemas/semantic-model.schema';

const stableKeyPattern = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

export class ListSemanticModelsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiPropertyOptional({ example: 'comercial_semantico' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(stableKeyPattern)
  modelKey?: string;

  @ApiPropertyOptional({ enum: SemanticModelStatus })
  @IsOptional()
  @IsEnum(SemanticModelStatus)
  status?: SemanticModelStatus;
}

export class SemanticModelTenantQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;
}
