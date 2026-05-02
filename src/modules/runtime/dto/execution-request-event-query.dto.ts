import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.schema';

export class ListExecutionRequestEventsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsMongoId()
  tenantId!: string;

  @ApiPropertyOptional({ enum: ExecutionRequestEventType })
  @IsOptional()
  @IsEnum(ExecutionRequestEventType)
  eventType?: ExecutionRequestEventType;
}
