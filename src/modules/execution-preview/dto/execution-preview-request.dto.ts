import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryPreviewRequestDto {
  @ApiPropertyOptional({
    example: 6,
    minimum: 1,
    maximum: 12,
    description:
      'Optional limit for generated demo rows. It does not execute real filters or queries.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  rowLimit?: number;
}

export class DashboardPreviewRequestDto {
  @ApiPropertyOptional({
    example: 6,
    minimum: 1,
    maximum: 12,
    description:
      'Optional limit for generated demo rows per widget. It does not execute real filters or queries.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  rowLimitPerWidget?: number;
}
