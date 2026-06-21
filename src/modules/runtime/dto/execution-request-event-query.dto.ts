import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '../../../core/dto/pagination-query.dto';
import { IsEntityId } from '../../../core/validation/is-entity-id.decorator';
import { ExecutionRequestEventType } from '../schemas/execution-request-event.constants';

export class ListExecutionRequestEventsQueryDto extends PaginationQueryDto {
  @ApiProperty({ example: '662d4f6e7a1c2b00124f0001' })
  @IsEntityId()
  tenantId!: string;

  @ApiPropertyOptional({ enum: ExecutionRequestEventType })
  @IsOptional()
  @IsEnum(ExecutionRequestEventType)
  eventType?: ExecutionRequestEventType;
}
