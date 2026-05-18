import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { SemanticQualityLevel } from '../schemas/semantic-model.schema';

export class SemanticModelQualityDto {
  @ApiPropertyOptional({ example: 72, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ enum: SemanticQualityLevel })
  @IsOptional()
  @IsEnum(SemanticQualityLevel)
  level?: SemanticQualityLevel;

  @ApiPropertyOptional({ example: ['Modelo sem steward definido.'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  warnings?: string[];
}
